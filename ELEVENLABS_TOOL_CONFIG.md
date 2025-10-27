# ElevenLabs Agent Tool Configuration

## Client Tool: add_course_recommendation

To enable your ElevenLabs agent to add courses directly to the Recommendations tab, configure this custom tool in your ElevenLabs Agent settings:

### Tool Configuration (in ElevenLabs UI)

**Tool Name:** `add_course_recommendation`

**Description:**
```
Add a course recommendation to the student's Recommendations tab. Use this when the student confirms they want to book or add a course to their plan.
```

**Parameters:**

1. **name** (required, string)
   - Description: Full course name (e.g., "Machine Learning - Basic Methods")
   
2. **code** (optional, string)
   - Description: Course module code (e.g., "M-INFO-105252" or "T-WIWI-106340")
   
3. **credits** (optional, string)
   - Description: Number of ECTS credits (e.g., "5" or "6")
   
4. **semester** (optional, string)
   - Description: Semester when course is offered (e.g., "WS" for Winter Semester, "SS" for Summer Semester)
   
5. **page** (optional, number)
   - Description: Page number in the course handbook where details can be found

### Example Tool Call

When the AI says "I've added Machine Learning – Basic Methods to your Recommendations", it should call:

```json
{
  "name": "Machine Learning - Basic Methods",
  "code": "M-INFO-105252",
  "credits": "5",
  "semester": "WS",
  "page": 42
}
```

### Agent Instructions (add to your agent prompt)

```
When a student confirms they want to add a course to their plan, immediately call the add_course_recommendation tool with all available course details:
- name: The full course name
- code: The module code (if you mentioned it)
- credits: ECTS credits (if known)
- semester: WS or SS (if known)
- page: Page number in handbook (if known)

Always confirm verbally that you've added the course, then call the tool.
```

### Tool Settings
- **Blocking:** Set to "No" (non-blocking) - the agent can continue speaking after calling the tool
- **Client-side:** Yes - this tool runs in the user's browser

---

## Implementation Details

The client tool is already implemented in your React app (`src/components/ChatInterface.tsx`):

```typescript
clientTools: {
  add_course_recommendation: (parameters: {
    name: string;
    code?: string;
    credits?: string;
    semester?: string;
    page?: number;
  }) => {
    console.log('📚 Client tool called: add_course_recommendation', parameters);
    addRecommendation(parameters);
    toast.success(`Added ${parameters.name} to recommendations!`);
    return `Successfully added ${parameters.name} to the Recommendations tab`;
  }
}
```

When the tool is called:
1. The course is added to the Recommendations tab
2. A success toast notification appears
3. The agent receives confirmation that the course was added
4. The course becomes clickable to navigate to the handbook page (if page number provided)

## Testing

1. Start a conversation with your agent
2. Ask it to add a specific course (e.g., "Add Machine Learning - Basic Methods to my plan")
3. The agent should call the tool and you'll see:
   - Console log: `📚 Client tool called: add_course_recommendation`
   - Toast notification confirming the course was added
   - The course appearing in the Recommendations tab
   - A clickable "View" button if page number was provided
