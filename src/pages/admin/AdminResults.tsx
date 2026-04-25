import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, Search } from "lucide-react";

interface Row {
  id: string;
  final_score: number;
  passed: boolean;
  created_at: string;
  interview_id: string;
  student: { full_name: string | null; email: string | null } | null;
  interview: { character: { name: string; avatar_emoji: string } | null } | null;
}

const AdminResults = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("results")
        .select(
          "id, final_score, passed, created_at, interview_id, student:profiles!results_student_id_fkey(full_name, email), interview:interviews(character:ai_characters(name, avatar_emoji))"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      setRows((data as unknown as Row[]) ?? []);
    })();
  }, []);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const t = q.toLowerCase();
    return (
      (r.student?.full_name ?? "").toLowerCase().includes(t) ||
      (r.student?.email ?? "").toLowerCase().includes(t) ||
      (r.interview?.character?.name ?? "").toLowerCase().includes(t)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">All student results</h2>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student or interviewer..." className="pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-muted-foreground text-sm">No results yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Link key={r.id} to={`/result/${r.interview_id}`}>
              <Card className="p-4 border-border/60 flex items-center gap-4 hover:border-primary/50 hover:shadow-glow transition-all">
                <div className="text-2xl">{r.interview?.character?.avatar_emoji ?? "🤖"}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.student?.full_name || r.student?.email || "Student"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.interview?.character?.name} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="font-mono text-xl font-bold">{r.final_score}</div>
                <Badge
                  className={
                    r.passed
                      ? "bg-success/15 text-success border-success/30"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }
                >
                  {r.passed ? "PASS" : "FAIL"}
                </Badge>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminResults;
