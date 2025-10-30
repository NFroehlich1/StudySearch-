import { CourseRecommendation } from "@/components/CourseRecommendations";
import { findCoursePage, getAllCourseNames, getModuleByName } from "./moduleLookup";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface BookedCourse {
  courseName: string;
  semester?: string;
  ects?: number;
  confidence: number;
}

// Pydantic-style validator for robust, typed normalization
class CourseValidator {
  static normalizeName(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const v = value.trim();
    return v.length >= 2 ? v : null;
  }

  static normalizeECTS(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0 && num <= 30) return num;
    return undefined;
  }

  static normalizeSemester(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value !== 'string') return undefined;
    const s = value.trim();
    if (!s) return undefined;
    // Normalize common forms
    if (/winter/i.test(s) && /20\d{2}/.test(s)) return `WS ${s.match(/20\d{2}/)![0]}`;
    if (/summer/i.test(s) && /20\d{2}/.test(s)) return `SS ${s.match(/20\d{2}/)![0]}`;
    if (/^(WS|SS)\s*20\d{2}$/i.test(s)) return s.toUpperCase().replace(/\s+/, ' ');
    // Accept custom names but trimmed
    return s;
  }

  static toCourseRecommendation(input: any): { name: string; ects?: number; semester?: string } | null {
    const name = CourseValidator.normalizeName(input?.name ?? input?.courseName ?? input?.title);
    const ects = CourseValidator.normalizeECTS(input?.ects ?? input?.credits);
    const semester = CourseValidator.normalizeSemester(input?.semester);
    if (!name) return null;
    return { name, ects, semester };
  }
}

// ✅ Course Name Normalization - Transform spoken names to official module names
function cleanCourseName(raw: string): string {
  let cleaned = raw
    .replace(/E\s*C\s*T\s*S/gi, "ECTS")
    .replace(/\s+core[s]?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  
  // Transform spoken variations to official names
  const transformations: Record<string, string> = {
    // Machine Learning variations
    "Machine Learning Basic Methods": "Machine Learning - Basic Methods",
    "Machine Learning one Basic Methods": "Machine Learning - Basic Methods", 
    "Machine Learning 1 Basic Methods": "Machine Learning - Basic Methods",
    "Machine Learning Fundamentals": "Machine Learning - Basic Methods",
    
    // Machine Learning numbered courses
    "Machine Learning one": "Machine Learning 1",
    "Machine Learning two": "Machine Learning 2",
    "Machine Learning 1": "Machine Learning 1",
    "Machine Learning 2": "Machine Learning 2",
    
    // Robotic Systems
    "Machine Learning for Robotic Systems one": "Machine Learning for Robotic Systems 1",
    "Machine Learning for Robotic Systems 1": "Machine Learning for Robotic Systems 1",
    "Machine Learning for Robotic Systems two": "Machine Learning for Robotic Systems 2",
    "Machine Learning for Robotic Systems 2": "Machine Learning for Robotic Systems 2",
  };
  
  // Check for exact matches first
  for (const [spoken, official] of Object.entries(transformations)) {
    if (cleaned.toLowerCase() === spoken.toLowerCase()) {
      console.log(`🔄 Transformed "${cleaned}" → "${official}"`);
      return official;
    }
  }
  
  // Number word replacements (after transformation check)
  cleaned = cleaned
    .replace(/\bone\b/gi, "1")
    .replace(/\btwo\b/gi, "2")
    .replace(/\bthree\b/gi, "3")
    .replace(/\bfour\b/gi, "4")
    .replace(/\bfive\b/gi, "5")
    .replace(/\bsix\b/gi, "6")
    .replace(/\bseven\b/gi, "7")
    .replace(/\beight\b/gi, "8")
    .replace(/\bnine\b/gi, "9")
    .replace(/\bten\b/gi, "10")
    .replace(/dash/gi, "-")
    .replace(/–/g, "-");
  
  return cleaned.trim();
}

// Map a spoken/cleaned name to the closest official module name
async function mapToOfficialCourseName(name: string): Promise<string> {
  const all = await getAllCourseNames();
  if (!name) return name;
  const target = name.toLowerCase().trim();

  // 1. Exact match
  const exact = all.find(n => n.toLowerCase().trim() === target);
  if (exact) {
    console.log(`✅ Exact match: "${name}" → "${exact}"`);
    return exact;
  }

  // 2. Contains match (both directions)
  const contains = all.find(n => {
    const nLower = n.toLowerCase();
    return nLower.includes(target) || target.includes(nLower);
  });
  if (contains) {
    console.log(`✅ Contains match: "${name}" → "${contains}"`);
    return contains;
  }

  // 3. Fuzzy match: check significant words (at least 3 chars)
  const targetWords = target.split(/\s+/).filter(w => w.length >= 3);
  if (targetWords.length > 0) {
    for (const candidate of all) {
      const candLower = candidate.toLowerCase();
      const matches = targetWords.filter(word => candLower.includes(word));
      if (matches.length >= Math.min(2, targetWords.length)) {
        console.log(`✅ Fuzzy match: "${name}" → "${candidate}" (${matches.join(', ')})`);
        return candidate;
      }
    }
  }

  // 4. Token overlap with improved scoring
  const targetTokens = target.split(/\s+/).filter(w => w.length >= 2);
  let best = name;
  let bestScore = 0;
  for (const candidate of all) {
    const candTokens = candidate.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    const overlap = targetTokens.filter(t => candTokens.some(c => 
      c.startsWith(t) || t.startsWith(c) || c.includes(t) || t.includes(c)
    ));
    const score = overlap.length / Math.max(1, targetTokens.length);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (bestScore >= 0.3) {
    console.log(`✅ Token match (${bestScore.toFixed(2)}): "${name}" → "${best}"`);
    return best;
  }

  console.warn(`⚠️ No match found for: "${name}"`);
  return name;
}

// Gemini fallback: structured extraction to JSON
async function geminiExtractCourses(summary: string): Promise<Array<{ name: string; ects?: number; semester?: string }>> {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;
    const prompt = `You are extracting booked university modules from a conversation summary.
Return ONLY JSON (no markdown), an array of objects with fields: name (string), ects (number, optional), semester (string, optional).
Do not invent modules. If unsure, omit the item.

Text:\n${summary}\n`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 800,
        responseMimeType: "application/json"
      }
    } as any;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.warn('Gemini extraction failed with status', res.status);
      return [];
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';
    const json = typeof text === 'string' ? text.trim().replace(/^```json\n?|```$/g, '') : '[]';
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr
      .map(CourseValidator.toCourseRecommendation)
      .filter(Boolean) as Array<{ name: string; ects?: number; semester?: string }>;
  } catch (e) {
    console.warn('Gemini extraction error', e);
    return [];
  }
}

// Extract course name from booking confirmation
function extractCourseName(text: string): string | null {
  // Pattern: "booking: COURSE_NAME with..."
  const pattern = /booking:\s*(.+?)\s+with\s+/i;
  const match = text.match(pattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: extract until comma
  const fallbackPattern = /booking:\s*([^,]+)/i;
  const fallbackMatch = text.match(fallbackPattern);
  
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1].trim();
  }

  return null;
}

// Extract ECTS (handles both numeric and word forms)
function extractECTS(text: string): number | undefined {
  // Convert word numbers to digits first
  const normalized = text
    .replace(/\bone\b/gi, "1")
    .replace(/\btwo\b/gi, "2")
    .replace(/\bthree\b/gi, "3")
    .replace(/\bfour\b/gi, "4")
    .replace(/\bfive\b/gi, "5")
    .replace(/\bsix\b/gi, "6")
    .replace(/\bseven\b/gi, "7")
    .replace(/\beight\b/gi, "8")
    .replace(/\bnine\b/gi, "9")
    .replace(/\bten\b/gi, "10");

  // Match patterns like "5 ECTS", "5 E C T S", "five ECTS"
  const patterns = [
    /(\d+)\s*E\s*C\s*T\s*S/i,
    /(\d+)\s*credits?/i,
    /(\d+)\s*ECTS/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const ects = parseInt(match[1]);
      if (!isNaN(ects) && ects > 0 && ects <= 30) {
        return ects;
      }
    }
  }

  return undefined;
}

// Extract semester (handles both standard and custom semester names)
function extractSemester(text: string): string | undefined {
  // Try standard patterns first
  const standardPatterns = [
    /(WS|SS)\s*20\d{2}/i,
    /(winter|summer)\s*(?:semester|term)?\s*20\d{2}/i,
    /(winter|summer)\s*(?:semester|term)/i,
  ];

  for (const pattern of standardPatterns) {
    const match = text.match(pattern);
    if (match) {
      let semester = match[0];
      
      // Normalize to WS/SS format
      if (/winter/i.test(semester)) {
        const year = semester.match(/20\d{2}/);
        semester = year ? `WS ${year[0]}` : "WS 2024";
      } else if (/summer/i.test(semester)) {
        const year = semester.match(/20\d{2}/);
        semester = year ? `SS ${year[0]}` : "SS 2025";
      }
      
      return semester.toUpperCase();
    }
  }

  // Try to extract custom semester names (e.g., "Semester 1", "Fall 2024", etc.)
  const customPattern = /(?:to|for|in)\s+([A-Z][A-Za-z0-9\s]+(?:20\d{2})?)/;
  const customMatch = text.match(customPattern);
  if (customMatch && customMatch[1]) {
    const semesterName = customMatch[1].trim();
    // Only return if it looks like a semester name (contains year or semester-related words)
    if (/20\d{2}|semester|term|fall|spring|winter|summer|WS|SS/i.test(semesterName)) {
      return semesterName;
    }
  }

  return undefined;
}

// Extract multiple courses from a summary text
function extractMultipleCourses(text: string): Array<{
  name: string;
  ects?: number;
  semester?: string;
}> {
  console.log("🔍 Extracting multiple courses from text...");
  console.log("📝 Text to analyze:", text.substring(0, 500));
  
  const courses: Array<{ name: string; ects?: number; semester?: string }> = [];
  
  // Pattern 1: Match "CourseNAME with X E C T S" format (spaces in ECTS)
  // Example: "Machine Learning Basic Methods with five E C T S"
  const withPattern = /([A-Z][A-Za-z\s\-]+?)\s+with\s+([a-z]+|\d+)\s+E\s*C\s*T\s*S/gi;
  let match;
  
  while ((match = withPattern.exec(text)) !== null) {
    const rawName = match[1].trim();
    const ectsText = match[0]; // Full match for ECTS extraction
    const ects = extractECTS(ectsText);
    
    console.log("✅ Found course (with pattern):", rawName, "ECTS:", ects);
    
    courses.push({
      name: rawName,
      ects,
      semester: undefined, // Will be inferred from context
    });
  }
  
  // Pattern 2: Match "CourseName, X credits" format
  // Example: "Machine Learning Basic Methods, five credits"
  const commaPattern = /([A-Z][A-Za-z\s\-]+?),\s*([a-z]+|\d+)\s*(?:credits?|ECTS)/gi;
  
  while ((match = commaPattern.exec(text)) !== null) {
    const rawName = match[1].trim();
    const ects = extractECTS(match[0]);
    
    // Check if already added
    if (!courses.some(c => c.name.toLowerCase() === rawName.toLowerCase())) {
      console.log("✅ Found course (comma pattern):", rawName, "ECTS:", ects);
      courses.push({
        name: rawName,
        ects,
        semester: undefined,
      });
    }
  }
  
  // Pattern 2b: "I'll add <Course>" confirmations - must have course name > 10 chars
  const addPattern = /(?:I(?:'|')ll|I will|I'm going to)\s+(?:add|register|book|enroll(?: in)?|put|place)\s+([A-Z][A-Za-z\s\-]{10,}?)(?:[\.,\n]|\s+to|\s+for|$)/gi;
  while ((match = addPattern.exec(text)) !== null) {
    const rawName = match[1].trim();
    if (!courses.some(c => c.name.toLowerCase() === rawName.toLowerCase()) && rawName.length > 10) {
      const contextStart = Math.max(0, match.index - 80);
      const contextEnd = Math.min(text.length, match.index + 120);
      const context = text.substring(contextStart, contextEnd);
      const ects = extractECTS(context);
      const semester = extractSemester(context);
      console.log("✅ Found course (add pattern):", rawName, ects, semester);
      courses.push({ name: rawName, ects, semester });
    }
  }

  // Pattern 2c: "semester plan: <Course>" recap - REMOVED (too broad)

  // Pattern 3: Look for course mentions ONLY with clear booking context
  // Example: "I will book Machine Learning for 6 ECTS"
  const bookingContextPattern = /(?:will|want to|decided to|going to)\s+(?:book|register|enroll|add|take)\s+([A-Z][A-Za-z\s\-]+?)(?:\s+for|\s+with|\.|$)/gi;
  
  while ((match = bookingContextPattern.exec(text)) !== null) {
    const rawName = match[1].trim();
    
    // Only add if we haven't found it yet and it looks like a course name (at least 3 words or 10 chars)
    if (!courses.some(c => c.name.toLowerCase() === rawName.toLowerCase()) && 
        (rawName.split(' ').length >= 3 || rawName.length >= 10)) {
      console.log("✅ Found course (booking context pattern):", rawName);
      
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(text.length, match.index + 100);
      const context = text.substring(contextStart, contextEnd);
      const ects = extractECTS(context);
      const semester = extractSemester(context);
      
      courses.push({
        name: rawName,
        ects,
        semester,
      });
    }
  }
  
  console.log(`✅ Extracted ${courses.length} courses before cleaning`);
  
  // Clean all course names
  const cleanedCourses = courses.map(c => ({
    ...c,
    name: cleanCourseName(c.name)
  }));
  
  console.log("🎯 Final courses:", cleanedCourses);
  
  return cleanedCourses;
}

export async function analyzeChatForBookedCourses(
  messages: Message[]
): Promise<{
  bookedCourses: CourseRecommendation[];
  assignedCourses: Map<string, CourseRecommendation[]>;
}> {
  console.log("🧠 Extracting final booked courses...");
  console.log("📋 Total messages:", messages.length);

  // ✅ Analyze ALL assistant messages, especially the last one with the full summary
  const allAssistantMessages = messages.filter(m => m.role === "assistant");
  console.log("📝 Assistant messages:", allAssistantMessages.length);

  // Get the final summary message (usually the longest one)
  const summaryMessages = allAssistantMessages.slice(-3); // Last 3 assistant messages
  const summaryText = summaryMessages.map(m => m.content).join('\n\n');
  
  console.log("📌 Analyzing summary text of", summaryText.length, "characters");

  // Try to extract multiple courses first
  const extractedCourses = extractMultipleCourses(summaryText);

  // Booking-verb proximity filter per course (not global)
  const bookingVerbPattern = /(add(?:ed)?|i(?:'|’)ll\s+add|i\s+will\s+take|i\s+decided\s+to\s+book|including\s+in\s+plan|already\s+in\s+my\s+semester\s+plan|confirming\s+enrollment|register|book|enroll)/i;
  const isBookedContext = (name: string, text: string): boolean => {
    const nameRegex = new RegExp(name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
    let match: RegExpExecArray | null;
    const regex = new RegExp(nameRegex.source, "gi");
    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 100);
      const end = Math.min(text.length, match.index + name.length + 100);
      const window = text.substring(start, end);
      if (bookingVerbPattern.test(window)) return true;
    }
    return bookingVerbPattern.test(text); // final fallback
  };

  const filteredCourses = extractedCourses.filter(c => isBookedContext(c.name, summaryText));
  
  console.log("🎯 Found", filteredCourses.length, "courses in summary (after verb filter)");

  if (filteredCourses.length === 0) {
    // Fallback: single-course extraction from last message ONLY if there's a clear booking pattern
    console.log("⚠️ No courses after verb filter, trying single course extraction...");
    const finalMessage = summaryMessages[summaryMessages.length - 1]?.content || "";
    const courseName = extractCourseName(finalMessage);
    if (!courseName) {
      console.log("⚠️ No course name found in confirmation, trying Gemini extraction...");
      // Final fallback: use Gemini to extract courses from summary
      try {
        const geminiCourses = await geminiExtractCourses(summaryText);
        console.log("✅ Gemini extracted courses:", geminiCourses);
        if (geminiCourses.length > 0) {
          filteredCourses.push(...geminiCourses);
        } else {
          console.log("❌ No courses found even with Gemini extraction");
          return {
            bookedCourses: [],
            assignedCourses: new Map(),
          };
        }
      } catch (error) {
        console.error("❌ Gemini fallback error:", error);
        return {
          bookedCourses: [],
          assignedCourses: new Map(),
        };
      }
    } else {
      // Only add if course name looks reasonable (at least 10 chars)
      if (courseName.length >= 10) {
        filteredCourses.push({
          name: courseName,
          ects: extractECTS(finalMessage),
          semester: extractSemester(finalMessage),
        });
      }
    }
  }

  console.log("📊 Courses to process:", filteredCourses);

  // Process all extracted courses

  // Global context fallbacks
  const globalSemester = extractSemester(summaryText);
  const globalEcts = extractECTS(summaryText);

  // Load official list for validation and confidence
  const officialList = await getAllCourseNames();

  // Helper: score token overlap between cleaned name and official candidate
  const scoreName = (name: string, candidate: string): number => {
    const a = name.toLowerCase().split(/\s+/).filter(Boolean);
    const b = candidate.toLowerCase().split(/\s+/).filter(Boolean);
    const overlap = a.filter(t => b.some(c => c.startsWith(t) || t.startsWith(c)));
    return overlap.length / Math.max(1, a.length);
  };

  // Deduped map by official name
  const byOfficial = new Map<string, CourseRecommendation>();

  for (const extracted of filteredCourses) {
    const cleaned = cleanCourseName(extracted.name);
    const official = await mapToOfficialCourseName(cleaned);
    console.log("✨ Processing course:", cleaned, "→", official);

    // Confidence threshold >= 0.2 (lowered to allow more matches)
    const confidence = scoreName(cleaned, official);
    if (confidence < 0.2) {
      console.log("⛔ Low confidence match (", confidence.toFixed(2), ") for", cleaned, "→", official);
      continue;
    }

    // Reject generic/incomplete mentions
    if (/^module\b|^course\b|^subject\b/i.test(cleaned) || cleaned.split(' ').length < 2) {
      console.log("⛔ Rejected generic/incomplete mention:", cleaned);
      continue;
    }

    // ✅ Lookup course page number
    const moduleInfo = await getModuleByName(official);
    const page = moduleInfo?.page ?? await findCoursePage(official);
    const ectsFromModule = moduleInfo?.ects ?? undefined;
    console.log(`📄 Course "${official}" found on page ${page || 'unknown'}`);

    const course: CourseRecommendation = {
      id: Date.now().toString() + Math.random(),
      name: official,
      ects: extracted.ects ?? globalEcts ?? ectsFromModule,
      credits: (extracted.ects ?? globalEcts ?? ectsFromModule)
        ? `${extracted.ects ?? globalEcts ?? ectsFromModule} ECTS`
        : undefined,
      semester: extracted.semester || globalSemester,
      page: page || undefined,
    };

    // Dedupe by official name (keep first or update to most confident)
    if (!byOfficial.has(official)) {
      byOfficial.set(official, course);
    }
  }

  const bookedCourses: CourseRecommendation[] = Array.from(byOfficial.values());

  // Build semester assignment map
  const assignedCourses: Map<string, CourseRecommendation[]> = new Map();
  for (const course of bookedCourses) {
    if (course.semester) {
      if (!assignedCourses.has(course.semester)) assignedCourses.set(course.semester, []);
      assignedCourses.get(course.semester)!.push(course);
    }
  }

  console.log("✅ Final extracted courses:", bookedCourses.length);
  console.log("📋 Course details:", bookedCourses);

  return {
    bookedCourses,
    assignedCourses,
  };
}
