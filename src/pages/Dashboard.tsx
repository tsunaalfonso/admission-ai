import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Mic, History as HistoryIcon, Save } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  school: string | null;
  program: string | null;
}

interface ResultRow {
  id: string;
  final_score: number;
  passed: boolean;
  created_at: string;
  interview_id: string;
}

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (p) {
        setProfile(p);
        setSchool(p.school ?? "");
        setProgram(p.program ?? "");
        setFullName(p.full_name ?? "");
      }

      const { data: r } = await supabase
        .from("results")
        .select("id, final_score, passed, created_at, interview_id")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (r) setResults(r);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, school, program })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container py-10 max-w-6xl">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
            Welcome back
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            {profile?.full_name || profile?.email?.split("@")[0] || "Student"}
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Start interview card */}
          <Card className="lg:col-span-2 bg-gradient-card border-border/60 p-8 relative overflow-hidden shadow-elegant">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-primary opacity-10 blur-3xl rounded-full" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Ready when you are
              </div>
              <h2 className="text-3xl font-bold mb-3">Start a voice interview</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Pick an AI interviewer, speak your answers, and get an instant score with detailed feedback.
              </p>
              <Link to="/interview/select">
                <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 px-7">
                  <Mic className="w-4 h-4 mr-2" />
                  Begin interview <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="ml-3">
                  <Button size="lg" variant="outline" className="h-12">
                    Admin panel
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Profile card */}
          <Card className="p-6 border-border/60">
            <h3 className="font-semibold mb-4">Your profile</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="fn" className="text-xs">Full name</Label>
                <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label htmlFor="sc" className="text-xs">School</Label>
                <Input id="sc" value={school} onChange={(e) => setSchool(e.target.value)} maxLength={120} />
              </div>
              <div>
                <Label htmlFor="pr" className="text-xs">Program</Label>
                <Input id="pr" value={program} onChange={(e) => setProgram(e.target.value)} maxLength={120} />
              </div>
              <Button onClick={saveProfile} disabled={saving} variant="outline" className="w-full">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent results */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" /> Recent results
            </h3>
            <Link to="/history">
              <Button variant="ghost" size="sm">View all →</Button>
            </Link>
          </div>
          {results.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-border/60">
              <p className="text-muted-foreground text-sm">
                No interviews yet. Your results will appear here once you complete one.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {results.map((r) => (
                <Link key={r.id} to={`/result/${r.interview_id}`}>
                  <Card className="p-5 hover:border-primary/50 transition-all hover:shadow-glow cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl font-bold font-mono">{r.final_score}</div>
                      <Badge
                        className={
                          r.passed
                            ? "bg-success/15 text-success border-success/30"
                            : "bg-destructive/15 text-destructive border-destructive/30"
                        }
                      >
                        {r.passed ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
