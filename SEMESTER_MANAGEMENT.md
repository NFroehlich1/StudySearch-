# Semester Management Features

## Overview
Complete semester management system with custom semester creation, editing, and automated course assignment.

## Features Added

### 1. Add Custom Semesters
- **Location**: Semester Planner tab → "Add Semester" button (top right)
- **Functionality**:
  - Create custom semester names (e.g., "WS 2025", "Fall 2024", "Semester 1")
  - Set custom ECTS goals per semester
  - Choose from 8 color options
  - Semesters are created instantly

### 2. Edit Existing Semesters
- **Location**: Each semester card → Edit button (pencil icon)
- **Functionality**:
  - Change semester name
  - Update ECTS goal
  - Change semester color
  - Changes apply immediately

### 3. Delete Semesters
- **Location**: Each semester card → Delete button (trash icon)
- **Functionality**:
  - Remove unwanted semesters
  - Confirmation dialog prevents accidental deletion
  - All courses in the semester are removed

### 4. Dynamic ECTS Goals
- Each semester can have its own ECTS goal (not fixed at 30)
- Progress bar adapts to the custom goal
- Badge shows: `Current ECTS / Goal ECTS`

### 5. Auto-Assignment of Courses
- **How it works**:
  1. User books a course via voice/chat
  2. AI confirms booking with semester (e.g., "WS 2024")
  3. On "End Session", course is extracted
  4. System finds matching semester by name
  5. Course is automatically added to that semester
  6. If semester doesn't exist, it's created automatically

### 6. Custom Semester Name Support
- **Chat Analyzer Enhancement**:
  - Recognizes standard formats: WS 2024, SS 2025
  - Recognizes natural language: "winter term", "summer semester"
  - Recognizes custom names: "Semester 1", "Fall 2024"
  - Flexible matching (case-insensitive)

## Usage Examples

### Example 1: Planning Future Semesters
```
1. Click "Add Semester"
2. Name: "WS 2026"
3. ECTS Goal: 30
4. Color: Blue
5. Click "Add Semester"
```

### Example 2: Recording Past Courses
```
1. Click "Add Semester"
2. Name: "SS 2023"
3. ECTS Goal: 27 (actual achieved)
4. Color: Green
5. Manually add courses from recommendations
```

### Example 3: Custom Naming
```
1. Click "Add Semester"
2. Name: "Semester 1"
3. ECTS Goal: 30
4. Color: Purple
5. System will match "Semester 1" when booking courses
```

### Example 4: Automated Booking
```
User: "I want to take Machine Learning 1 for WS 2025"
AI: "Confirmed booking: Machine Learning 1 – Basic Methods with Professor Zöllner, five ECTS, winter term."
[User clicks "End Session"]
→ Course automatically added to WS 2025 semester
→ If WS 2025 doesn't exist, it's created automatically
```

## Technical Details

### Semester Interface
```typescript
interface Semester {
  id: string;
  name: string;
  color: string;
  ectsGoal: number;
  courses: CourseRecommendation[];
}
```

### Chat Analyzer Enhancements
- **Course Name Extraction**: Extracts full course name from booking confirmation
- **ECTS Extraction**: Handles both numeric (5) and word forms (five, with spaces)
- **Semester Extraction**: 
  - Standard: WS 2024, SS 2025
  - Natural: winter term, summer semester
  - Custom: Semester 1, Fall 2024
- **Page Lookup**: Automatically finds course page in handbook

### Auto-Assignment Logic
```typescript
useEffect(() => {
  courses.forEach(course => {
    if (course.semester) {
      const matchingSemester = semesters.find(
        sem => sem.name.toLowerCase() === course.semester?.toLowerCase()
      );
      
      if (matchingSemester) {
        // Add to existing semester
        handleAddCourseToSemester(matchingSemester.id, course);
      } else {
        // Create new semester
        const newSemester = {
          id: Date.now().toString(),
          name: course.semester,
          color: '#8b5cf6',
          ectsGoal: 30,
          courses: [course],
        };
        setSemesters(prev => [...prev, newSemester]);
      }
    }
  });
}, [courses]);
```

## Testing

### Test 1: Add Custom Semester
1. Go to Semester Planner tab
2. Click "Add Semester"
3. Enter "Fall 2024", ECTS goal 30
4. Choose a color
5. Click "Add Semester"
✅ New semester appears

### Test 2: Edit Semester
1. Click Edit button on any semester
2. Change name to "Spring 2025"
3. Change ECTS goal to 28
4. Choose different color
5. Click "Save Changes"
✅ Semester updated

### Test 3: Delete Semester
1. Click Delete button on any semester
2. Confirm deletion
✅ Semester removed

### Test 4: Auto-Assignment
1. Start a session
2. Say: "I want to take Machine Learning 1 for WS 2024"
3. End session
✅ Course appears in WS 2024 with:
   - Full name: "Machine Learning 1 - Basic Methods"
   - ECTS: 5
   - Semester: WS 2024
   - Page number: auto-detected

## Benefits

1. **Flexibility**: Create semesters with any name
2. **Automation**: Courses auto-assigned to correct semester
3. **Accuracy**: Better extraction of course details
4. **Planning**: Plan multiple semesters ahead
5. **History**: Record past semesters with actual ECTS
6. **Customization**: Each semester has its own goal and color

## Files Modified

- `src/components/SemesterPlanner.tsx`: Added semester CRUD operations
- `src/utils/chatAnalyzer.ts`: Improved extraction logic
- `src/utils/moduleLookup.ts`: Added page number lookup
- `src/assets/modules_pages.txt`: Course-to-page mapping

## Next Steps

- Persist semesters to localStorage
- Export/import semester plans
- Semester statistics and analytics
- Drag-and-drop course reordering



