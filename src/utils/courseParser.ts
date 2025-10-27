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
    console.log('🔍 Analyzing message for courses:', message.substring(0, 200) + '...');
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this conversation message from a course advisor AI and extract ALL courses being recommended, suggested, or booked.

Message: "${message}"

Look for phrases like:
- "I'll add [course]"
- "I recommend [course]"
- "You should take [course]"
- "I'm booking [course]"
- "Consider [course]"

Extract the course details and call the extract_courses function with the data.`
            }]
          }],
          tools: [{
            function_declarations: [{
              name: "extract_courses",
              description: "Extract course recommendations with structured data",
              parameters: {
                type: "object",
                properties: {
                  courses: {
                    type: "array",
                    description: "List of course recommendations found in the message",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description: "Full course name"
                        },
                        code: {
                          type: "string",
                          description: "Course code (7-digit number if available)"
                        },
                        credits: {
                          type: "string",
                          description: "Number of ECTS credits"
                        },
                        semester: {
                          type: "string",
                          description: "Semester offered (WS or SS)"
                        },
                        page: {
                          type: "number",
                          description: "Page number in handbook if mentioned"
                        }
                      },
                      required: ["name"]
                    }
                  }
                },
                required: ["courses"]
              }
            }]
          }],
          tool_config: {
            function_calling_config: {
              mode: "ANY"
            }
          }
        }),
      }
    );

    if (!response.ok) {
      console.error('❌ Gemini API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    console.log('📥 Gemini response:', JSON.stringify(data, null, 2));
    
    // Extract function call result
    const functionCall = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.functionCall
    );
    
    if (functionCall?.functionCall?.args?.courses) {
      const courses = functionCall.functionCall.args.courses;
      console.log('✅ Extracted courses:', courses);
      return Array.isArray(courses) ? courses : [];
    }
    
    console.log('⚠️ No courses found in function call');
    return [];
  } catch (error) {
    console.error('❌ Error parsing courses:', error);
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
