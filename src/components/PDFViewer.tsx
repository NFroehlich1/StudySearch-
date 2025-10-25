import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  targetPage?: number;
}

const PDFViewer = ({ targetPage }: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(targetPage || 1);
  const [scale, setScale] = useState<number>(1.0);

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
      </Card>

      <div className="flex-1 overflow-auto bg-muted/30 rounded-lg p-4">
        <div className="flex justify-center">
          <Document
            file="/course-handbook.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-lg"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
