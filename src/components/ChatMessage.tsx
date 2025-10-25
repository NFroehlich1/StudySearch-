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
      "flex gap-3 mb-4 animate-fade-in",
      role === 'user' ? "justify-end" : "justify-start"
    )}>
      <Card className={cn(
        "max-w-[80%] p-5 relative group transition-all duration-200 hover:shadow-elevated",
        role === 'user' 
          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/20" 
          : "bg-card/80 backdrop-blur-sm border-border/50"
      )}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className={cn(
              "text-xs font-semibold mb-2 uppercase tracking-wide",
              role === 'user' ? "text-primary-foreground/80" : "text-accent"
            )}>
              {role === 'user' ? '👤 You' : '🎓 Course Guide'}
            </div>
            <div className={cn(
              "whitespace-pre-wrap leading-relaxed text-[15px]",
              role === 'user' ? "text-primary-foreground" : "text-foreground"
            )}>
              {content}
            </div>
            {timestamp && (
              <div className={cn(
                "text-xs mt-3 pt-2 border-t",
                role === 'user' 
                  ? "opacity-60 border-primary-foreground/20" 
                  : "opacity-50 border-border/30"
              )}>
                {timestamp}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              "h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-all",
              role === 'user' 
                ? "hover:bg-primary-foreground/10 text-primary-foreground" 
                : "hover:bg-muted"
            )}
            title="Copy message"
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
