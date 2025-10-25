import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const ChatMessage = ({ role, content, timestamp }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      role === 'user' ? "justify-end" : "justify-start"
    )}>
      <Card className={cn(
        "max-w-[80%] p-4 relative group shadow-sm",
        role === 'user' 
          ? "bg-primary text-primary-foreground" 
          : "bg-card border-border"
      )}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="text-sm opacity-70 mb-1">
              {role === 'user' ? 'You' : 'Course Guide'}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">
              {content}
            </div>
            {timestamp && (
              <div className="text-xs opacity-50 mt-2">
                {timestamp}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              "h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
              role === 'user' ? "hover:bg-primary-foreground/10" : ""
            )}
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ChatMessage;
