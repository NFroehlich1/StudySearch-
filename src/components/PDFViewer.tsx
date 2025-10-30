import { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Bookmark, Trash2, Highlighter, ArrowRight } from 'lucide-react';
import { CourseRecommendation } from './CourseRecommendations';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface Bookmark {
  id: string;
  page: number;
  x: number;
  y: number;
  name: string;
  timestamp: Date;
}

interface PDFViewerProps {
  targetPage?: number;
  onBookmarkClick?: (bookmark: CourseRecommendation) => void;
  bookmarks?: Bookmark[];
  onAddBookmark?: (bookmark: Bookmark) => void;
  onDeleteBookmark?: (id: string) => void;
}

const PDFViewer = ({ 
  targetPage, 
  onBookmarkClick,
  bookmarks = [],
  onAddBookmark,
  onDeleteBookmark 
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(targetPage || 1);
  const [scale, setScale] = useState<number>(1.0);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);
  const [bookmarkName, setBookmarkName] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [gotoPageInput, setGotoPageInput] = useState('');
  const pageRef = useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (targetPage && targetPage <= numPages) {
      setPageNumber(targetPage);
    }
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));

  const handleGoToPage = () => {
    const targetPageNum = parseInt(gotoPageInput, 10);
    if (!isNaN(targetPageNum) && targetPageNum >= 1 && targetPageNum <= numPages) {
      setPageNumber(targetPageNum);
      setGotoPageInput('');
    }
  };

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isBookmarking) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setSelectedPosition({ x, y });
  };

  const handleSaveBookmark = () => {
    if (!selectedPosition || !bookmarkName.trim()) return;
    
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      page: pageNumber,
      x: selectedPosition.x,
      y: selectedPosition.y,
      name: bookmarkName.trim(),
      timestamp: new Date()
    };
    
    onAddBookmark?.(bookmark);
    setBookmarkName('');
    setSelectedPosition(null);
    setIsBookmarking(false);
    
    // Add to recommendations as a bookmarked course/module
    onBookmarkClick?.({
      name: bookmark.name,
      page: bookmark.page,
      credits: 'Bookmarked',
      semester: 'Manual'
    });
  };

  const handleBookmarkClick = (bookmark: Bookmark) => {
    setPageNumber(bookmark.page);
    onBookmarkClick?.({
      name: bookmark.name,
      page: bookmark.page,
      credits: 'Bookmarked',
      semester: 'Manual'
    });
  };

  const pageBookmarks = bookmarks.filter(b => b.page === pageNumber);

  return (
    <div className="flex flex-col h-full">
      <Card className="p-3 mb-3 border-border/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={gotoPageInput}
                onChange={(e) => setGotoPageInput(e.target.value)}
                placeholder="Go to page..."
                className="w-32 h-9 text-sm"
                min="1"
                max={numPages}
                onKeyPress={(e) => e.key === 'Enter' && handleGoToPage()}
              />
              <Button
                onClick={handleGoToPage}
                variant="outline"
                size="sm"
                disabled={!gotoPageInput}
                title="Go to page"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={() => setIsBookmarking(!isBookmarking)}
              variant={isBookmarking ? "default" : "outline"}
              size="sm"
              className={isBookmarking ? "bg-primary" : ""}
            >
              <Bookmark className="h-4 w-4 mr-1" />
              {isBookmarking ? 'Cancel' : 'Add Bookmark'}
            </Button>
            {bookmarks.length > 0 && (
              <Button 
                onClick={() => setShowBookmarks(!showBookmarks)}
                variant="outline"
                size="sm"
              >
                <Highlighter className="h-4 w-4 mr-1" />
                {showBookmarks ? 'Hide' : 'Show'} Bookmarks ({bookmarks.length})
              </Button>
            )}
            <Button onClick={zoomOut} variant="outline" size="sm">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button onClick={zoomIn} variant="outline" size="sm">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {isBookmarking && (
          <div className="mt-3 p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground mb-2">Click on the PDF to place a bookmark</p>
            {selectedPosition && (
              <div className="flex items-center gap-2">
                <Input
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                  placeholder="Enter bookmark name (e.g., 'Machine Learning')"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBookmark()}
                />
                <Button onClick={handleSaveBookmark} size="sm" disabled={!bookmarkName.trim()}>
                  Save
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4 relative" ref={pageRef}>
        <div 
          className="flex justify-center"
          onClick={handlePageClick}
          style={{ cursor: isBookmarking ? 'crosshair' : 'default' }}
        >
          <Document
            file="/course-handbook.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-lg relative"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
            
            {/* Display bookmarks on this page */}
            {showBookmarks && pageBookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="absolute cursor-pointer group"
                style={{
                  left: `${bookmark.x}px`,
                  top: `${bookmark.y}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBookmarkClick(bookmark);
                }}
              >
                <Badge 
                  variant="secondary" 
                  className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 group-hover:scale-105 transition-transform"
                >
                  <Bookmark className="h-3 w-3 mr-1" />
                  {bookmark.name}
                </Badge>
                {onDeleteBookmark && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -right-1 -top-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBookmark(bookmark.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            
            {/* Show crosshair cursor area */}
            {isBookmarking && !selectedPosition && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="text-sm text-muted-foreground bg-background/80 px-3 py-2 rounded-lg shadow-lg m-4 inline-block">
                  Click anywhere on the page to place a bookmark
                </div>
              </div>
            )}
            
            {/* Selected position marker */}
            {selectedPosition && isBookmarking && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${selectedPosition.x}px`,
                  top: `${selectedPosition.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <Badge variant="secondary" className="bg-accent text-accent-foreground animate-pulse">
                  <Bookmark className="h-3 w-3 mr-1" />
                  New bookmark
                </Badge>
              </div>
            )}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
