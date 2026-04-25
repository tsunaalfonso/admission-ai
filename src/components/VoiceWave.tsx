import { cn } from "@/lib/utils";

interface VoiceWaveProps {
  active: boolean;
  className?: string;
  bars?: number;
}

export const VoiceWave = ({ active, className, bars = 5 }: VoiceWaveProps) => {
  return (
    <div className={cn("flex items-center gap-1 h-8", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-gradient-to-t from-primary to-accent transition-all",
            active ? "voice-bar h-full" : "h-1 opacity-30"
          )}
          style={{ animationDelay: active ? `${i * 0.12}s` : undefined }}
        />
      ))}
    </div>
  );
};
