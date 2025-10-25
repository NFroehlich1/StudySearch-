import { cn } from '@/lib/utils';

interface VoiceIndicatorProps {
  isActive: boolean;
  isSpeaking?: boolean;
}

const VoiceIndicator = ({ isActive, isSpeaking }: VoiceIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full transition-all",
            isActive && isSpeaking
              ? "bg-accent animate-pulse h-8"
              : isActive
              ? "bg-primary h-4"
              : "bg-muted h-3"
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
};

export default VoiceIndicator;
