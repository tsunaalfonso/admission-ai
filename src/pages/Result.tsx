import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw, Sparkles, AlertTriangle, TrendingUp } from "lucide-react";

interface ResultData {
  final_score: number;
  passed: boolean;
  threshold: number;
  strengths: string;
  weaknesses: string;
  improvements: string;
  overall_feedback: string;
  created_at: string;
}
interface ResponseData {
  question_text: string;
  transcript: string;
  score: number | null;
  feedback: string | null;
  question_order: number;
}
interface InterviewMeta {
  character: { name: string; avatar_emoji: string; title: string } | null;
}

const Result = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const [result, setResult] = useState<ResultData | null>(null);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [meta, setMeta] = useState<InterviewMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!interviewId) return;
    void (async () => {
      const [{ data: r }, { data: rs }, { data: iv }] = await Promise.all([
        supabase.from("results").select("*").eq("interview_id", interviewId).maybeSingle(),
        supabase
          .from("responses")
          .select("question_text, transcript, score, feedback, question_order")
          .eq("interview_id", interviewId)
          .order("question_order"),
        supabase
          .from("interviews")
          .select("character:ai_characters(name, avatar_emoji, title)")
          .eq("id", interviewId)
          .maybeSingle(),
      ]);
      setResult(r ?? null);
      setResponses(rs ?? []);
      setMeta(iv as InterviewMeta);
      setLoading(false);
    })();
  }, [interviewId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container py-20 text-center text-muted-foreground">Loading result...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="container py-20 max-w-xl text-center">
          <h1 className="text-2xl font-bold mb-2">Result not found</h1>
          <Link to="/dashboard"><Button>Back to dashboard</Button></Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <TopBar />
      <main className="container py-10 max-w-4xl relative">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to dashboard
        </Link>

        {/* Verdict hero */}
        <Card className="bg-gradient-card border-border/60 p-8 md:p-12 mb-6 text-center shadow-elegant relative overflow-hidden">
          <div className={`absolute inset-x-0 top-0 h-1 ${result.passed ? "bg-success" : "bg-destructive"}`} />
          <div className="text-6xl mb-4 float">{meta?.character?.avatar_emoji ?? "🤖"}</div>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-2">
            Evaluated by {meta?.character?.name ?? "AI"}
          </div>

          <div className="flex flex-col items-center gap-4">
            {result.passed ? (
              <Badge className="bg-success/15 text-success border-success/30 text-sm px-4 py-1.5 uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 mr-2" /> Passed
              </Badge>
            ) : (
              <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-sm px-4 py-1.5 uppercase tracking-widest">
                <XCircle className="w-4 h-4 mr-2" /> Did not pass
              </Badge>
            )}

            <div className="font-mono text-7xl md:text-8xl font-bold text-gradient leading-none">
              {result.final_score}
              <span className="text-2xl text-muted-foreground font-sans font-normal">/100</span>
            </div>
            <div className="text-xs text-muted-foreground">Pass threshold: {result.threshold}</div>
          </div>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
            {result.overall_feedback}
          </p>

          <div className="flex justify-center gap-3 mt-8">
            <Link to="/interview/select">
              <Button className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
                <RotateCcw className="w-4 h-4 mr-2" /> Try again
              </Button>
            </Link>
            <Link to="/history">
              <Button variant="outline">View history</Button>
            </Link>
          </div>
        </Card>

        {/* Feedback */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <FeedbackCard icon={Sparkles} title="Strengths" tone="success" body={result.strengths} />
          <FeedbackCard icon={AlertTriangle} title="Weaknesses" tone="warning" body={result.weaknesses} />
          <FeedbackCard icon={TrendingUp} title="How to improve" tone="primary" body={result.improvements} />
        </div>

        {/* Per-question transcript */}
        <Card className="border-border/60 p-6">
          <h3 className="font-semibold text-lg mb-4">Question-by-question review</h3>
          <div className="space-y-5">
            {responses.map((r, i) => (
              <div key={i} className="border-l-2 border-border pl-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    Question {i + 1}
                  </div>
                  {r.score != null && (
                    <Badge variant="outline" className="font-mono">{r.score}/100</Badge>
                  )}
                </div>
                <div className="font-medium mb-2">{r.question_text}</div>
                <div className="text-sm text-muted-foreground italic mb-2">"{r.transcript}"</div>
                {r.feedback && (
                  <div className="text-xs glass rounded-lg p-3 mt-2">
                    <span className="font-semibold text-primary">Feedback: </span>
                    {r.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};

const FeedbackCard = ({
  icon: Icon,
  title,
  tone,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tone: "success" | "warning" | "primary";
  body: string;
}) => {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
      ? "text-warning"
      : "text-primary";
  return (
    <Card className="border-border/60 p-5">
      <div className={`flex items-center gap-2 mb-3 ${toneClass}`}>
        <Icon className="w-4 h-4" />
        <h4 className="font-semibold text-sm uppercase tracking-wider">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </Card>
  );
};

export default Result;
