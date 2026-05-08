import type { LanguageShare } from '@/types/analytics';

export function LanguageDistribution({ languages }: { languages: LanguageShare[] }) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      {languages.map((l) => (
        <div key={l.language} className="flex justify-between text-xs">
          <span className="text-muted-foreground">{l.language}</span>
          <span className="font-bold text-foreground">{l.pct}%</span>
        </div>
      ))}
    </div>
  );
}
