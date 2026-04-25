import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { Mic, Brain, ShieldCheck, Sparkles, ArrowRight, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] [background-size:48px_48px] pointer-events-none" />

        <div className="container relative py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 glass mb-6">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium tracking-wide">AI-powered admissions interviews</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Real interviews,
              <br />
              <span className="text-gradient">evaluated by AI.</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Speak naturally with lifelike AI interviewers. Get a real-time transcript, an evidence-based score, and detailed feedback — instantly.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 px-7">
                    Go to dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 h-12 px-7">
                      Start your interview <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button size="lg" variant="outline" className="h-12 px-7">
                      Create student account
                    </Button>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button size="lg" variant="ghost" className="h-12">
                    Admin panel →
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-20 max-w-5xl mx-auto">
            {[
              { icon: Mic, title: "Voice-first", desc: "Just speak. Live transcription captures every word in real time." },
              { icon: Brain, title: "AI evaluation", desc: "Each answer is scored on relevance, clarity, and reasoning." },
              { icon: ShieldCheck, title: "Pass / Fail verdict", desc: "Configurable threshold with detailed feedback and improvement tips." },
            ].map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 shadow-card">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                  <f.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Characters teaser */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            <Sparkles className="w-3 h-3" /> Meet the interviewers
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Four personalities. One verdict.</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { e: "🎓", n: "Dr. Santos", t: "Academic" },
            { e: "💼", n: "Ms. Reyes", t: "Behavioral" },
            { e: "🤖", n: "Nova", t: "Adaptive AI" },
            { e: "🧠", n: "Prof. Cruz", t: "Technical" },
          ].map((c) => (
            <div key={c.n} className="glass rounded-2xl p-6 text-center hover:shadow-glow transition-all hover:-translate-y-1 duration-300">
              <div className="text-5xl mb-3 float">{c.e}</div>
              <div className="font-semibold">{c.n}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">{c.t}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/50 py-8">
        <div className="container flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Interviewly
          </div>
          <div>Built for student admissions.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
