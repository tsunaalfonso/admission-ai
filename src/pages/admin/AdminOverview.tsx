import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Recent {
  id: string;
  final_score: number;
  passed: boolean;
  created_at: string;
  student: { full_name: string | null; email: string | null } | null;
  interview: { character: { name: string; avatar_emoji: string } | null } | null;
}

const AdminOverview = () => {
  const [recent, setRecent] = useState<Recent[]>([]);
  const [byCharacter, setByCharacter] = useState<Array<{ name: string; emoji: string; count: number; avg: number }>>([]);

  useEffect(() => {
    void (async () => {
      const { data: r } = await supabase
        .from("results")
        .select(
          "id, final_score, passed, created_at, student:profiles!results_student_id_fkey(full_name, email), interview:interviews(character:ai_characters(name, avatar_emoji))"
        )
        .order("created_at", { ascending: false })
        .limit(10);
      setRecent((r as unknown as Recent[]) ?? []);

      const { data: rows } = await supabase
        .from("results")
        .select("final_score, interview:interviews(character:ai_characters(name, avatar_emoji))");
      const map = new Map<string, { name: string; emoji: string; total: number; count: number }>();
      (rows ?? []).forEach((row) => {
        const c = (row as any).interview?.character;
        if (!c) return;
        const key = c.name as string;
        const cur = map.get(key) ?? { name: c.name, emoji: c.avatar_emoji, total: 0, count: 0 };
        cur.total += row.final_score;
        cur.count += 1;
        map.set(key, cur);
      });
      setByCharacter(
        Array.from(map.values()).map((v) => ({
          name: v.name,
          emoji: v.emoji,
          count: v.count,
          avg: Math.round((v.total / v.count) * 10) / 10,
        }))
      );
    })();
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 p-6 border-border/60">
        <h3 className="font-semibold mb-4">Recent results</h3>
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">No interviews yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-3">
                <div className="text-2xl">{r.interview?.character?.avatar_emoji ?? "🤖"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {r.student?.full_name || r.student?.email || "Student"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.interview?.character?.name} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="font-mono font-bold">{r.final_score}</div>
                <Badge
                  className={
                    r.passed
                      ? "bg-success/15 text-success border-success/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }
                >
                  {r.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-6 border-border/60">
        <h3 className="font-semibold mb-4">By interviewer</h3>
        {byCharacter.length === 0 ? (
          <p className="text-muted-foreground text-sm">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {byCharacter.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <div className="text-2xl">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.count} interview{c.count !== 1 ? "s" : ""}</div>
                </div>
                <div className="font-mono font-bold text-sm">{c.avg}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminOverview;
