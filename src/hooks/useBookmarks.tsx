import { useState } from 'react';
import { Bookmark } from '@/components/PDFViewer';

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const addBookmark = (bookmark: Bookmark) => {
    setBookmarks(prev => [...prev, bookmark]);
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  const clearBookmarks = () => {
    setBookmarks([]);
  };

  return {
    bookmarks,
    addBookmark,
    deleteBookmark,
    clearBookmarks,
  };
};
