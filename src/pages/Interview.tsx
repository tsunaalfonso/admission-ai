import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VoiceWave } from "@/components/VoiceWave";
import { toast } from "sonner";
import { Mic, MicOff, ChevronRight, Volume2, Loader2, AlertCircle } from "lucide-react";

interface Character {
  id: string;
  name: string;
  title: string;
  greeting: string;
  avatar_emoji: string;
  personality: string;
  voice_style: string;
}
interface Question {
  id: string;
  question_text: string;
  category: string;
  expected_keywords: string[] | null;
}
type Phase = "loading" | "intro" | "question" | "submitting" | "error";

const QUESTIONS_PER_INTERVIEW = 5;

const Interview = () => {
  const { characterId } = useParams<{ characterId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<Phase>("loading");
  const [character, setCharacter] = useState<Character | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [speaking, setSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const startedRef = useRef(false);

  const speech = useSpeechRecognition("en-US");

  // Load character + questions + create interview
  useEffect(() => {
    if (!characterId || !user || startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        const { data: c, error: ce } = await supabase
          .from("ai_characters")
          .select("id, name, title, greeting, avatar_emoji, personality, voice_style")
          .eq("id", characterId)
          .eq("is_active", true)
          .maybeSingle();
        if (ce || !c) throw new Error("Interviewer not found");
        setCharacter(c);

        const { data: qs, error: qe } = await supabase
          .from("questions")
          .select("id, question_text, category, expected_keywords")
          .eq("character_id", characterId)
          .eq("is_active", true);
        if (qe) throw qe;
        if (!qs || qs.length === 0) throw new Error("No questions configured for this interviewer");

        // Shuffle and take N
        const shuffled = [...qs].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_INTERVIEW);
        setQuestions(shuffled);

        const { data: iv, error: ie } = await supabase
          .from("interviews")
          .insert({ student_id: user.id, character_id: characterId })
          .select()
          .single();
        if (ie) throw ie;
        setInterviewId(iv.id);

        setPhase("intro");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to start interview";
        setErrorMsg(msg);
        setPhase("error");
      }
    })();
  }, [characterId, user]);

  // Speak a piece of text using browser TTS
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      u.pitch = 1;
      u.lang = "en-US";
      // Attempt voice variation per character
      const voices = window.speechSynthesis.getVoices();
      if (voices.length && character) {
        const style = character.voice_style;
        const preferred = voices.find((v) => {
          if (style === "warm") return /female|samantha|victoria|jenny/i.test(v.name);
          if (style === "formal") return /male|daniel|alex|david/i.test(v.name);
          if (style === "futuristic") return /google|en-GB/i.test(v.name);
          if (style === "technical") return /english.*us/i.test(v.name);
          return false;
        });
        if (preferred) u.voice = preferred;
      }
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch {
      // ignore
    }
  }, [character]);

  // Speak the greeting on intro phase
  useEffect(() => {
    if (phase === "intro" && character) {
      const t = setTimeout(() => speak(character.greeting), 400);
      return () => clearTimeout(t);
    }
  }, [phase, character, speak]);

  // Speak each question
  useEffect(() => {
    if (phase === "question" && questions[currentIdx]) {
      const t = setTimeout(() => speak(questions[currentIdx].question_text), 200);
      return () => clearTimeout(t);
    }
  }, [phase, currentIdx, questions, speak]);

  const beginQuestions = () => {
    window.speechSynthesis?.cancel();
    setPhase("question");
    speech.reset();
  };

  const handleNext = async () => {
    if (!interviewId || !questions[currentIdx]) return;
    const q = questions[currentIdx];
    const transcript = (speech.transcript + " " + speech.interim).trim();

    if (!transcript) {
      toast.warning("Please speak your answer before continuing.");
      return;
    }

    speech.stop();
    window.speechSynthesis?.cancel();

    // Save response
    const { error } = await supabase.from("responses").insert({
      interview_id: interviewId,
      question_id: q.id,
      question_text: q.question_text,
      transcript,
      question_order: currentIdx,
    });
    if (error) {
      toast.error(error.message);
      return;
    }

    setAnswers((a) => ({ ...a, [q.id]: transcript }));
    speech.reset();

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      await finalize();
    }
  };

  const finalize = async () => {
    if (!interviewId || !character || !user) return;
    setPhase("submitting");

    try {
      // Build final response payload from DB to ensure consistency
      const { data: rs, error: re } = await supabase
        .from("responses")
        .select("question_text, transcript, question_id")
        .eq("interview_id", interviewId)
        .order("question_order");
      if (re) throw re;

      const responsesPayload = (rs ?? []).map((r) => {
        const q = questions.find((x) => x.id === r.question_id);
        return {
          question: r.question_text,
          transcript: r.transcript,
          expected_keywords: q?.expected_keywords ?? [],
        };
      });

      const { data: evalData, error: ee } = await supabase.functions.invoke(
        "evaluate-interview",
        {
          body: {
            character: {
              name: character.name,
              title: character.title,
              personality: character.personality,
            },
            responses: responsesPayload,
            threshold: 75,
          },
        }
      );

      if (ee) throw ee;
      if (evalData?.error) throw new Error(evalData.error);

      // Save per-question scores
      if (Array.isArray(evalData.per_question)) {
        for (let i = 0; i < (rs ?? []).length; i++) {
          const r = rs![i];
          const pq = evalData.per_question[i];
          if (pq) {
            await supabase
              .from("responses")
              .update({ score: pq.score, feedback: pq.feedback })
              .eq("interview_id", interviewId)
              .eq("question_id", r.question_id);
          }
        }
      }

      // Save final result
      const { error: rerr } = await supabase.from("results").insert({
        interview_id: interviewId,
        student_id: user.id,
        final_score: evalData.overall_score,
        passed: evalData.passed,
        threshold: evalData.threshold ?? 75,
        strengths: evalData.strengths,
        weaknesses: evalData.weaknesses,
        improvements: evalData.improvements,
        overall_feedback: evalData.overall_feedback,
      });
      if (rerr) throw rerr;

      await supabase
        .from("interviews")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", interviewId);

      navigate(`/result/${interviewId}`, { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Evaluation failed";
      toast.error(msg);
      setErrorMsg(msg);
      setPhase("error");
    }
  };

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="container py-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="container py-20 max-w-xl text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground mb-6">{errorMsg}</p>
          <Button onClick={() => navigate("/dashboard")}>Back to dashboard</Button>
        </main>
      </div>
    );
  }

  if (!character) return null;

  if (phase === "submitting") {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <main className="container py-20 max-w-xl text-center">
          <div className="text-7xl float mb-6">{character.avatar_emoji}</div>
          <h1 className="text-3xl font-bold mb-3">Evaluating your interview...</h1>
          <p className="text-muted-foreground mb-6">
            {character.name} is reviewing your answers and scoring your performance.
          </p>
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </main>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <TopBar />
        <main className="container py-12 max-w-2xl relative">
          <Card className="bg-gradient-card border-border/60 p-10 text-center shadow-elegant">
            <div className="text-8xl mb-6 float">{character.avatar_emoji}</div>
            <Badge variant="outline" className="mb-3 uppercase tracking-wider text-[10px]">
              {character.voice_style}
            </Badge>
            <h1 className="text-3xl font-bold mb-1">{character.name}</h1>
            <div className="text-primary font-medium mb-6">{character.title}</div>

            <div className="glass rounded-xl p-5 mb-6 text-left">
              <div className="flex items-start gap-3">
                <Volume2 className={`w-5 h-5 mt-0.5 ${speaking ? "text-accent animate-pulse" : "text-muted-foreground"}`} />
                <p className="text-sm leading-relaxed">{character.greeting}</p>
              </div>
              {speaking && <VoiceWave active className="mt-3 ml-8" />}
            </div>

            {!speech.supported && (
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-left mb-4">
                Your browser does not support voice recognition. Please use Chrome or Edge.
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-6">
              You will be asked {questions.length} questions. Speak your answer naturally — the system transcribes in real time.
            </p>
            <Button
              size="lg"
              onClick={beginQuestions}
              disabled={!speech.supported}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 px-7"
            >
              I'm ready, begin <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Question phase
  const q = questions[currentIdx];
  const liveTranscript = (speech.transcript + " " + speech.interim).trim();
  const progress = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <TopBar />
      <main className="container py-8 max-w-3xl relative">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Question {currentIdx + 1} of {questions.length}
          </div>
          <Badge variant="outline" className="capitalize">{q.category}</Badge>
        </div>
        <Progress value={progress} className="h-1 mb-6" />

        {/* Interviewer */}
        <Card className="bg-gradient-card border-border/60 p-6 mb-5 shadow-card">
          <div className="flex items-start gap-4">
            <div className="text-5xl float shrink-0">{character.avatar_emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{character.name}</span>
                {speaking && (
                  <Badge className="bg-accent/15 text-accent border-accent/30">
                    <Volume2 className="w-3 h-3 mr-1" /> speaking
                  </Badge>
                )}
              </div>
              <p className="text-lg leading-relaxed">{q.question_text}</p>
              {speaking && <VoiceWave active className="mt-3" />}
            </div>
          </div>
        </Card>

        {/* Mic + transcript */}
        <Card className="border-border/60 p-6 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Your answer</span>
              {speech.listening && (
                <Badge className="bg-destructive/15 text-destructive border-destructive/30">
                  <span className="w-2 h-2 rounded-full bg-destructive mr-1.5 animate-pulse" />
                  recording
                </Badge>
              )}
            </div>
            <VoiceWave active={speech.listening} />
          </div>

          <div className="min-h-[140px] glass rounded-xl p-4 mb-4 font-mono text-sm leading-relaxed">
            {liveTranscript ? (
              <>
                <span>{speech.transcript}</span>
                <span className="text-muted-foreground">{speech.interim}</span>
              </>
            ) : (
              <span className="text-muted-foreground">
                {speech.listening ? "Listening... start speaking." : "Press the microphone to begin recording your answer."}
              </span>
            )}
          </div>

          {speech.error && (
            <div className="text-xs text-destructive mb-3">Mic error: {speech.error}. Please allow microphone access.</div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {speech.listening ? (
                <Button onClick={speech.stop} variant="outline" size="lg" className="h-12">
                  <MicOff className="w-4 h-4 mr-2" /> Stop
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    window.speechSynthesis?.cancel();
                    setSpeaking(false);
                    speech.start();
                  }}
                  size="lg"
                  className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 pulse-glow"
                  disabled={!speech.supported}
                >
                  <Mic className="w-4 h-4 mr-2" /> {speech.transcript ? "Continue" : "Record answer"}
                </Button>
              )}
              {speech.transcript && !speech.listening && (
                <Button onClick={speech.reset} variant="ghost" size="sm">
                  Clear
                </Button>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!liveTranscript}
              variant="default"
              size="lg"
              className="h-12"
            >
              {currentIdx + 1 < questions.length ? (
                <>Next question <ChevronRight className="w-4 h-4 ml-1" /></>
              ) : (
                <>Finish & evaluate</>
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Interview;
