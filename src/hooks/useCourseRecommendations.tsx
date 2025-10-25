import { useState } from 'react';
import { CourseRecommendation } from '@/components/CourseRecommendations';

export const useCourseRecommendations = () => {
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);

  const addRecommendation = (course: CourseRecommendation) => {
    setRecommendations(prev => {
      // Avoid duplicates based on course name
      const exists = prev.some(c => c.name === course.name);
      if (exists) return prev;
      return [...prev, course];
    });
  };

  const clearRecommendations = () => {
    setRecommendations([]);
  };

  return {
    recommendations,
    addRecommendation,
    clearRecommendations,
  };
};
