import { useState } from 'react';
import { CourseRecommendation } from '@/components/CourseRecommendations';

export const useCourseRecommendations = () => {
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);

  const addRecommendation = (course: CourseRecommendation) => {
    setRecommendations(prev => {
      // Avoid duplicates based on course name
      const exists = prev.some(c => c.name === course.name);
      if (exists) return prev;
      // Ensure course has an ID
      const courseWithId = { ...course, id: course.id || Date.now().toString() };
      return [...prev, courseWithId];
    });
  };

  const updateRecommendation = (course: CourseRecommendation) => {
    setRecommendations(prev =>
      prev.map(c => c.id === course.id ? course : c)
    );
  };

  const removeRecommendation = (courseId: string) => {
    setRecommendations(prev => prev.filter(c => c.id !== courseId));
  };

  const clearRecommendations = () => {
    setRecommendations([]);
  };

  return {
    recommendations,
    addRecommendation,
    updateRecommendation,
    removeRecommendation,
    clearRecommendations,
  };
};
