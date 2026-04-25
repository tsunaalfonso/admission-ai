import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Row {
  id: string;
  final_score: number;
  passed: boolean;
  created_at: string;
  interview_id: string;
  interview: { character: { name: string; avatar_emoji: string } | null } | null;
}

const History = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("results")
        .select(
          "id, final_score, passed, created_at, interview_id, interview:interviews(character:ai_characters(name, avatar_emoji))"
        )
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container py-10 max-w-4xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Link>
        <h1 className="text-3xl font-bold mb-6">Interview history</h1>

        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : rows.length === 0 ? (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground mb-4">No interviews yet.</p>
            <Link to="/interview/select"><Button>Take your first interview</Button></Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Link key={r.id} to={`/result/${r.interview_id}`}>
                <Card className="p-5 hover:border-primary/50 hover:shadow-glow transition-all flex items-center gap-4">
                  <div className="text-3xl">{r.interview?.character?.avatar_emoji ?? "🤖"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{r.interview?.character?.name ?? "Interview"}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-mono text-2xl font-bold">{r.final_score}</div>
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
      </main>
    </div>
  );
};

export default History;
