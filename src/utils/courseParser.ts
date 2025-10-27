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
              text: `You are analyzing a conversation where an AI course advisor recommends or books courses for a student.
Extract ALL courses that are being recommended, suggested, or booked from this message.

Look for phrases like:
- "I'll add [course name]"
- "I recommend [course name]"
- "You should take [course name]"
- "I'm booking [course name]"
- "Consider [course name]"

For each course found, extract:
- Course name (full name, e.g., "Machine Learning")
- Course code (if mentioned, e.g., "2511234" - usually 7 digits)
- Credits (if mentioned, e.g., "6" for 6 ECTS)
- Semester (if mentioned, e.g., "WS" or "SS")
- Page number in handbook (if mentioned, otherwise try to infer from context or leave empty)

Message to analyze:
"${message}"

IMPORTANT: Return ONLY a valid JSON array with this exact structure:
[{"name": "Course Name", "code": "1234567", "credits": "6", "semester": "WS", "page": 42}]

If no courses are found, return: []
Do not include markdown formatting, explanations, or any other text - just the JSON array.`
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
