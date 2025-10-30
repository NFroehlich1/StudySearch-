# Automated Course Booking from Chat

## 🎯 Overview

The system now automatically analyzes the entire conversation history when you end a session and extracts all courses you've decided to book/enroll in, then assigns them to the appropriate semesters in your planner.

## 🚀 How It Works

### 1. **End Session Analysis**
When you click "End Session", the system:
- Collects the complete chat history
- Sends it to Gemini AI for intelligent analysis
- Extracts booked courses with their semester assignments
- Automatically adds them to your planner

### 2. **Smart Course Detection**

The system looks for phrases like:
- "I'll take Machine Learning"
- "Let's book Control Systems"
- "I want to enroll in Digital Signal Processing"
- "Add Robotics to WS 2024"
- "Put Computer Vision in SS 2025"

### 3. **Automatic Semester Assignment**

When courses are mentioned with semesters:
- **WS 2024 + Machine Learning** → Assigns ML to WS 2024
- **SS 2025 + Control Systems** → Assigns CS to SS 2025
- Creates new semesters if they don't exist

### 4. **Intelligent Extraction**

Using Gemini AI to understand context:
- Extracts exact course names
- Detects semester assignments (WS, SS, Winter, Summer)
- Parses ECTS credits if mentioned
- Handles complex conversation flow

## 📋 What Gets Extracted

### Example Conversation:
```
User: "I want to take Machine Learning and Control Systems"
Assistant: "Great! Which semester?"
User: "Machine Learning in WS 2024, and Control Systems in SS 2025"
```

### Result:
- ✅ Machine Learning → WS 2024
- ✅ Control Systems → SS 2025
- ✅ Both added to recommendations
- ✅ Automatically assigned to correct semesters

## 🎨 Features

### Automatic Course Addition
- All booked courses added to recommendations
- No manual copying needed
- Preserves all course details

### Smart Semester Matching
- Matches by semester name (WS 2024, SS 2025, etc.)
- Creates new semesters if needed
- Prevents duplicates

### ECTS Detection
- Extracts ECTS credits if mentioned in conversation
- Automatically fills in course information
- Updates semester totals

### Notification System
- Shows how many courses were found
- Displays semester assignments
- Prompts you to check the Semester Plan tab

## 🔍 Detection Patterns

The system recognizes various booking patterns:

### Direct Bookings
- "I'll take..."
- "Book me for..."
- "Enroll in..."
- "Register for..."

### Semester Assignments
- "Add X to WS 2024"
- "Put Y in SS 2025"
- "X for Winter Semester"
- "Y in Summer 2024"

### Implied Bookings
- "That sounds good, let's do it"
- "Yes, I'll take that course"
- "Add it to my plan"

## 💡 Usage Tips

1. **Be Specific**: Mention semester names clearly
   - ✅ "Machine Learning in WS 2024"
   - ❌ "Machine Learning next semester"

2. **Mention ECTS**: Include credit information
   - ✅ "6 ECTS Machine Learning course"
   - ❌ "Machine Learning course"

3. **Confirm Bookings**: Make your intent clear
   - ✅ "Yes, I'll take that"
   - ✅ "Book me for it"
   - ❌ "Maybe I'll consider it"

4. **Use Semester Codes**: Be specific about semesters
   - ✅ WS 2024, SS 2025
   - ✅ Winter 2024, Summer 2025

## 🎯 Example Workflow

1. **Start Conversation**: Ask about courses
2. **Get Recommendations**: AI suggests courses
3. **Decide on Courses**: Tell AI which ones to book
4. **End Session**: Click "End Session"
5. **Automatic Processing**: System analyzes conversation
6. **Courses Appear**: All booked courses in Semester Plan
7. **Edit if Needed**: Adjust assignments manually

## 🔧 Technical Details

- Uses Gemini AI for natural language understanding
- Pattern matching for booking phrases
- Context-aware semester detection
- Automatic course-to-semester mapping
- Creates semesters on-the-fly if needed

## ✨ Benefits

- **No Manual Entry**: Saves time by auto-populating
- **Accuracy**: AI understands context and intent
- **Flexibility**: Handles various booking expressions
- **Intelligence**: Extracts hidden information
- **Completeness**: Captures everything in one pass
