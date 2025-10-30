# How the Automated Course Booking Works

## 🎯 Overview

The system uses **Gemini AI** to analyze your entire conversation when you end a session and automatically extracts booked courses, then adds them to your planner.

## 📋 Step-by-Step Process

### 1. **User Ends Conversation**
- You click "End Session" button
- System collects ALL messages from the conversation

### 2. **Chat Analysis**
```
Conversation Text → Gemini AI → Extracted Courses
```

### 3. **Gemini AI Processing**
The AI analyzes your conversation looking for:
- Course names mentioned
- Semester assignments (WS 2024, SS 2025, etc.)
- ECTS credits mentioned
- Booking confirmations like "I'll take", "add to semester", etc.

### 4. **Course Extraction**
From your conversation example:
```
"Machine Learning Basic Methods, 5 ECTS, WS 2024"
"Machine Learning for Robotic Systems, 5 ECTS"
```
→ Gemini extracts:
- Course: "Machine Learning Basic Methods"
- ECTS: 5
- Semester: "WS 2024"

### 5. **Automatic Addition**
- Courses added to Recommendations
- Automatically assigned to correct semester (if mentioned)
- Toast notification confirms success

## 🔍 What Triggers It

The system detects phrases like:
- "I'll take Machine Learning"
- "Add to WS 2024"
- "Book this course"
- "I want to enroll in..."
- Assistant saying "I've added..." or "added to your plan"

## ⚡ The Technical Flow

```javascript
endConversation() {
  // 1. Collect all messages
  const messages = [...allChatMessages];
  
  // 2. Send to Gemini AI
  analyzeChatForBookedCourses(messages);
  
  // 3. Gemini analyzes text
  Gemini API → Returns: [{ courseName, semester, ects }]
  
  // 4. Create course objects
  bookedCourses = transform to CourseRecommendation[]
  
  // 5. Add to recommendations
  for each course: addRecommendation(course)
  
  // 6. Auto-assign to semester (if course.semester exists)
  SemesterPlanner useEffect() detects and assigns
}
```

## 🎨 Current Status

✅ **Working**: End session triggers analysis
✅ **Working**: Gemini AI extracts courses
✅ **Working**: Courses added to Recommendations
❌ **Missing**: Semester Planner tab was removed in rejection

## 🛠️ To Complete the Integration

You need to add back:
1. Semester Planner component import
2. Semester Planner tab in ChatInterface
3. The auto-assignment logic in SemesterPlanner

## 🧪 Test It Now

1. Start a new conversation
2. Talk about booking courses with semesters
3. Click "End Session"
4. Watch for the "✅ Added X booked courses" toast
5. Check the Recommendations tab

The courses WILL be added, but you won't see them auto-assigned to semesters until the Semester Planner tab is restored.
