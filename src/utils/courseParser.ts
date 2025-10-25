const GEMINI_API_KEY = 'AIzaSyAxEZg9Aa3qvJDrfDbAAm3_bPwkFsJLo1I';

export interface ParsedCourse {
  name: string;
  code?: string;
  credits?: string;
  semester?: string;
  page?: number;
}

export async function extractCoursesFromMessage(message: string): Promise<ParsedCourse[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
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
    return Array.isArray(courses) ? courses : [];
  } catch (error) {
    console.error('Error parsing courses:', error);
    return [];
  }
}

// Fallback regex-based parser for quick detection
export function quickDetectCourses(message: string): boolean {
  const patterns = [
    /\brecommend\b/i,
    /\bsuggest\b/i,
    /\badd\b.*\bcourse\b/i,
    /\btake\b.*\bcourse\b/i,
    /\benroll\b/i,
    /\bconsider\b.*\bcourse\b/i,
    /\d{7}/,  // 7-digit course codes
  ];
  
  return patterns.some(pattern => pattern.test(message));
}
