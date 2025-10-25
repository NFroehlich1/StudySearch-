import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ExternalLink } from 'lucide-react';

export interface CourseRecommendation {
  name: string;
  code?: string;
  credits?: string;
  semester?: string;
  page?: number;
}

interface CourseRecommendationsProps {
  courses: CourseRecommendation[];
  onCourseClick: (page: number) => void;
}

const CourseRecommendations = ({ courses, onCourseClick }: CourseRecommendationsProps) => {
  if (courses.length === 0) {
    return (
      <Card className="p-8 text-center border-dashed">
        <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Course Recommendations Yet</h3>
        <p className="text-muted-foreground">
          Ask the Course Guide for recommendations, and they'll appear here!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📚 Recommended Courses</h3>
        <Badge variant="secondary">{courses.length} courses</Badge>
      </div>
      
      {courses.map((course, idx) => (
        <Card 
          key={idx} 
          className="p-4 hover:shadow-md transition-all duration-200 border-border/50 hover:border-primary/30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">{course.name}</h4>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {course.code && <span className="font-mono">{course.code}</span>}
                {course.credits && <span>• {course.credits} credits</span>}
                {course.semester && <span>• {course.semester}</span>}
              </div>
            </div>
            {course.page && (
              <Button
                onClick={() => onCourseClick(course.page!)}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default CourseRecommendations;
