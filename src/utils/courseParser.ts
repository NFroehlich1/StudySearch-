import { getModuleByName } from './moduleLookup';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export interface ParsedCourse {
  name: string;
  code?: string;
  credits?: string;
  semester?: string;
  page?: number;
  ects?: number;
}

export async function extractCoursesFromMessage(message: string): Promise<ParsedCourse[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Extract all course recommendations from this text. For each course mentioned, provide:
- Course name (full name)
- Course code (if mentioned, format: numbers and letters like "2511234")
- Credits (if mentioned, e.g., "6 ECTS" or "3 credits")
- Semester (if mentioned, e.g., "WS" for Winter Semester, "SS" for Summer Semester)
- Page number in handbook (if mentioned or can be inferred)

Text: "${message}"

Return ONLY a valid JSON array of objects with structure: [{"name": "...", "code": "...", "credits": "...", "semester": "...", "page": number}]
If no courses found, return empty array: []
Do not include any markdown formatting or explanation, just the raw JSON array.`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return [];
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
    
    // Clean up the response - remove markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const courses = JSON.parse(cleanedText);
    if (!Array.isArray(courses)) {
      return [];
    }

    const normalized = await Promise.all(
      courses.map(async (rawCourse: any) => {
        if (!rawCourse || typeof rawCourse.name !== 'string') return null;

        const rawName = rawCourse.name.trim();
        const moduleInfo = await getModuleByName(rawName);
        const ectsValue = typeof rawCourse.ects === 'number'
          ? rawCourse.ects
          : moduleInfo?.ects ?? undefined;
        const page = rawCourse.page ?? moduleInfo?.page ?? undefined;

        const normalizedCourse: ParsedCourse = {
          name: moduleInfo?.name ?? rawName,
          code: rawCourse.code ?? undefined,
          credits: rawCourse.credits ?? (ectsValue !== undefined ? `${ectsValue} ECTS` : undefined),
          semester: rawCourse.semester ?? undefined,
          page,
          ects: ectsValue,
        };

        return normalizedCourse;
      })
    );

    return normalized.filter((course): course is ParsedCourse => course !== null);
  } catch (error) {
    console.error('Error parsing courses:', error);
    return [];
  }
}

// Fallback regex-based parser for quick detection
export function quickDetectCourses(message: string): boolean {
  const patterns = [
    /\b(recommend|suggesting|suggest)\b/i,
    /\b(I'll add|I'm adding|adding|add)\b.*\bcourse\b/i,
    /\b(take|taking|enroll|enrolling|book|booking)\b/i,
    /\bconsider\b/i,
    /\b(here are|here's)\b.*\bcourse/i,
    /\bECTS\b/i,  // Credit system
    /\d{7}/,  // 7-digit course codes
    /\b(WS|SS)\b/,  // Semester codes
  ];
  
  return patterns.some(pattern => pattern.test(message));
}
