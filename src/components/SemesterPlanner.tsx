import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Edit, Plus, ExternalLink, Bookmark, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CourseRecommendation } from './CourseRecommendations';

interface Semester {
  id: string;
  name: string;
  color: string;
  ectsGoal: number;
  courses: CourseRecommendation[];
}

interface SemesterPlannerProps {
  courses: CourseRecommendation[];
  onCourseClick: (page: number) => void;
  onUpdateCourse: (course: CourseRecommendation) => void;
}

const AVAILABLE_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Teal', value: '#14b8a6' },
];

const SemesterPlanner = ({ courses, onCourseClick, onUpdateCourse }: SemesterPlannerProps) => {
  const [semesters, setSemesters] = useState<Semester[]>([
    { id: '1', name: 'WS 2024', color: '#3b82f6', ectsGoal: 30, courses: [] },
    { id: '2', name: 'SS 2025', color: '#10b981', ectsGoal: 30, courses: [] },
  ]);
  const [editingCourse, setEditingCourse] = useState<CourseRecommendation | null>(null);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseEcts, setCourseEcts] = useState('');
  const [courseNotes, setCourseNotes] = useState('');
  const [editMode, setEditMode] = useState(false);
  
  // Add Semester state
  const [showAddSemester, setShowAddSemester] = useState(false);
  const [newSemesterName, setNewSemesterName] = useState('');
  const [newSemesterColor, setNewSemesterColor] = useState('#3b82f6');
  const [newSemesterEcts, setNewSemesterEcts] = useState('30');
  
  // Edit Semester state
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [semesterEditName, setSemesterEditName] = useState('');
  const [semesterEditColor, setSemesterEditColor] = useState('#3b82f6');
  const [semesterEditEcts, setSemesterEditEcts] = useState('30');

  const handleAddCourseToSemester = (semesterId: string, course: CourseRecommendation) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        if (!sem.courses.some(c => c.id === course.id)) {
          return { ...sem, courses: [...sem.courses, course] };
        }
      }
      return sem;
    }));
  };

  const handleRemoveCourseFromSemester = (semesterId: string, courseId: string) => {
    setSemesters(prev => prev.map(sem => {
      if (sem.id === semesterId) {
        return { ...sem, courses: sem.courses.filter(c => c.id !== courseId) };
      }
      return sem;
    }));
  };

  const handleOpenEditDialog = (course: CourseRecommendation) => {
    setEditingCourse(course);
    setCourseName(course.name);
    setCourseCode(course.code || '');
    setCourseEcts(course.ects?.toString() || '');
    setCourseNotes(course.notes || '');
    setSelectedColor(course.color || '#3b82f6');
    setEditMode(true);
  };

  const handleSaveCourse = () => {
    if (!editingCourse) return;

    const updatedCourse: CourseRecommendation = {
      ...editingCourse,
      name: courseName,
      code: courseCode,
      ects: courseEcts ? parseFloat(courseEcts) : undefined,
      notes: courseNotes,
      color: selectedColor,
    };

    onUpdateCourse(updatedCourse);
    setEditMode(false);
    setEditingCourse(null);
  };

  const handleAddSemester = () => {
    if (!newSemesterName.trim()) return;

    const newSemester: Semester = {
      id: Date.now().toString(),
      name: newSemesterName.trim(),
      color: newSemesterColor,
      ectsGoal: parseFloat(newSemesterEcts) || 30,
      courses: [],
    };

    setSemesters(prev => [...prev, newSemester]);
    setShowAddSemester(false);
    setNewSemesterName('');
    setNewSemesterColor('#3b82f6');
    setNewSemesterEcts('30');
  };

  const handleOpenEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setSemesterEditName(semester.name);
    setSemesterEditColor(semester.color);
    setSemesterEditEcts(semester.ectsGoal.toString());
  };

  const handleSaveSemester = () => {
    if (!editingSemester) return;

    setSemesters(prev => prev.map(sem => 
      sem.id === editingSemester.id
        ? {
            ...sem,
            name: semesterEditName.trim(),
            color: semesterEditColor,
            ectsGoal: parseFloat(semesterEditEcts) || 30,
          }
        : sem
    ));

    setEditingSemester(null);
  };

  const handleDeleteSemester = (semesterId: string) => {
    if (confirm('Are you sure you want to delete this semester? All courses will be removed from it.')) {
      setSemesters(prev => prev.filter(sem => sem.id !== semesterId));
    }
  };

  const calculateSemesterEcts = (courses: CourseRecommendation[]) => {
    return courses.reduce((sum, course) => sum + (course.ects || 0), 0);
  };

  // Auto-assign courses that specify a semester, without disturbing existing assignments
  useEffect(() => {
    setSemesters(prevSemesters => {
      // Create a mutable clone of semesters to apply updates
      let updatedSemesters = prevSemesters.map(sem => ({
        ...sem,
        courses: [...sem.courses],
      }));
      let hasChanges = false;

      // Track all course IDs already assigned in the planner
      const assignedCourseIds = new Set<string>();
      updatedSemesters.forEach(sem => {
        sem.courses.forEach(course => {
          if (course.id) assignedCourseIds.add(course.id);
        });
      });

      courses.forEach(course => {
        if (!course.id || !course.semester) return;

        // Skip courses already assigned
        if (assignedCourseIds.has(course.id)) return;

        const targetSemesterIndex = updatedSemesters.findIndex(
          sem => sem.name.toLowerCase() === course.semester!.toLowerCase()
        );

        if (targetSemesterIndex >= 0) {
          const semester = updatedSemesters[targetSemesterIndex];
          if (!semester.courses.some(c => c.id === course.id)) {
            updatedSemesters[targetSemesterIndex] = {
              ...semester,
              courses: [...semester.courses, course],
            };
            assignedCourseIds.add(course.id);
            hasChanges = true;
          }
        } else {
          const newSemester: Semester = {
            id: Date.now().toString() + Math.random(),
            name: course.semester,
            color: '#8b5cf6',
            ectsGoal: 30,
            courses: [course],
          };
          updatedSemesters = [...updatedSemesters, newSemester];
          assignedCourseIds.add(course.id);
          hasChanges = true;
        }
      });

      return hasChanges ? updatedSemesters : prevSemesters;
    });
  }, [courses]);

  return (
    <div className="space-y-6">
      {/* Header with Add Semester Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Semester Planner</h2>
        <Dialog open={showAddSemester} onOpenChange={setShowAddSemester}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Semester
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Semester</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-semester-name">Semester Name</Label>
                <Input
                  id="new-semester-name"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  placeholder="e.g., WS 2025, SS 2026"
                />
              </div>
              <div>
                <Label htmlFor="new-semester-ects">ECTS Goal</Label>
                <Input
                  id="new-semester-ects"
                  type="number"
                  value={newSemesterEcts}
                  onChange={(e) => setNewSemesterEcts(e.target.value)}
                  placeholder="30"
                  min="0"
                  step="0.5"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap mt-2">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewSemesterColor(color.value)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        newSemesterColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddSemester(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddSemester}>
                  Add Semester
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Semester Dialog */}
      <Dialog open={!!editingSemester} onOpenChange={(open) => !open && setEditingSemester(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Semester</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-semester-name">Semester Name</Label>
              <Input
                id="edit-semester-name"
                value={semesterEditName}
                onChange={(e) => setSemesterEditName(e.target.value)}
                placeholder="e.g., WS 2025"
              />
            </div>
            <div>
              <Label htmlFor="edit-semester-ects">ECTS Goal</Label>
              <Input
                id="edit-semester-ects"
                type="number"
                value={semesterEditEcts}
                onChange={(e) => setSemesterEditEcts(e.target.value)}
                placeholder="30"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSemesterEditColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      semesterEditColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSemester(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSemester}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="course-name">Course Name</Label>
              <Input
                id="course-name"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Machine Learning"
              />
            </div>

            <div>
              <Label htmlFor="course-code">Course Code</Label>
              <Input
                id="course-code"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g., 2511234"
              />
            </div>

            <div>
              <Label htmlFor="course-ects">ECTS</Label>
              <Input
                id="course-ects"
                type="number"
                value={courseEcts}
                onChange={(e) => setCourseEcts(e.target.value)}
                placeholder="e.g., 6"
              />
            </div>

            <div>
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap mt-2">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="course-notes">Notes (Markdown supported)</Label>
              <Textarea
                id="course-notes"
                value={courseNotes}
                onChange={(e) => setCourseNotes(e.target.value)}
                placeholder="Add your notes here... (Markdown supported)"
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown: **bold**, *italic*, links, lists, etc.
              </p>
            </div>

            {courseNotes && (
              <div>
                <Label>Preview</Label>
                <Card className="p-4 prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {courseNotes}
                  </ReactMarkdown>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCourse}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Semester Tables */}
      {semesters.map((semester) => {
        const totalEcts = calculateSemesterEcts(semester.courses);
        const progress = Math.min((totalEcts / semester.ectsGoal) * 100, 100);

        return (
          <Card key={semester.id} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: semester.color }}
                />
                <h3 className="text-lg font-semibold">{semester.name}</h3>
                <Badge variant="secondary">
                  {totalEcts} / {semester.ectsGoal} ECTS
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenEditSemester(semester)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSemester(semester.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              <Select
                onValueChange={(courseId) => {
                  const course = courses.find(c => c.id === courseId);
                  if (course) {
                    handleAddCourseToSemester(semester.id, course);
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Add course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter(c => !semester.courses.some(sc => sc.id === c.id))
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  {courses.filter(c => !semester.courses.some(sc => sc.id === c.id)).length === 0 && (
                    <SelectItem value="none" disabled>
                      No courses available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full transition-all"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: semester.color,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(0)}% complete
              </p>
            </div>

            {/* Courses List */}
            <div className="space-y-2">
              {semester.courses.map((course) => (
                <Card
                  key={course.id}
                  className="p-4 hover:shadow-md transition-all border-l-4"
                  style={{ borderLeftColor: course.color || semester.color }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{course.name}</h4>
                        {course.code && (
                          <Badge variant="outline" className="text-xs">
                            {course.code}
                          </Badge>
                        )}
                        {course.ects && (
                          <Badge variant="secondary" className="text-xs">
                            {course.ects} ECTS
                          </Badge>
                        )}
                      </div>
                      {course.notes && (
                        <div className="mt-2 p-3 bg-muted/50 rounded-md prose prose-sm max-w-none text-xs">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {course.notes}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditDialog(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {course.page && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onCourseClick(course.page!)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveCourseFromSemester(semester.id, course.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {semester.courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Bookmark className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No courses added yet. Select a course from the dropdown above.</p>
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {/* Available Courses */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Courses</h3>
        <div className="space-y-2">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="p-3 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: course.color || '#3b82f6' }}
                />
                <span className="font-medium">{course.name}</span>
                {course.code && (
                  <Badge variant="outline" className="text-xs">
                    {course.code}
                  </Badge>
                )}
                {course.ects && (
                  <Badge variant="secondary" className="text-xs">
                    {course.ects} ECTS
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleOpenEditDialog(course)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {course.page && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCourseClick(course.page!)}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}

          {courses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No courses available. Add recommendations from the chatbot.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SemesterPlanner;
