import { Link } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Brain,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
        <div className="absolute inset-0 parchment opacity-60 pointer-events-none" />

        <div className="container relative py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-8">
              <span className="h-px w-10 bg-accent" />
              <span className="eyebrow">Est. Office of Admissions · 1962</span>
              <span className="h-px w-10 bg-accent" />
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight mb-8">
              The University
              <br />
              <span className="italic font-display text-gradient-maroon">Admissions Interview,</span>
              <br />
              reimagined.
            </h1>

            <p className="font-display text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              An immersive voice interview chamber for prospective Giants. Speak with academic
              interviewers, receive a considered evaluation, and earn an evidence-based verdict —
              in the same sitting.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {user ? (
                <Link to="/dashboard">
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 ring-gold shadow-elegant tracking-wide"
                  >
                    Enter the Atelier <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth">
                    <Button
                      size="lg"
                      className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 ring-gold shadow-elegant tracking-wide"
                    >
                      Begin your interview <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/auth?mode=signup">
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-12 px-8 border-primary/30 hover:bg-secondary tracking-wide"
                    >
                      Register as applicant
                    </Button>
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin">
                  <Button size="lg" variant="ghost" className="h-12 tracking-wide">
                    Registrar's office →
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-14 flex items-center justify-center">
              <div className="gold-rule w-40" />
            </div>
          </div>

          {/* Pillars */}
          <div className="grid md:grid-cols-3 gap-px mt-20 max-w-6xl mx-auto bg-border rounded-sm overflow-hidden border border-border shadow-elegant">
            {[
              {
                icon: Mic,
                roman: "I.",
                title: "Spoken Examination",
                desc: "Articulate your reasoning aloud. Every utterance is transcribed verbatim, in the moment.",
              },
              {
                icon: Brain,
                roman: "II.",
                title: "Considered Appraisal",
                desc: "Responses are weighed for relevance, clarity, and depth of reasoning by an academic rubric.",
              },
              {
                icon: ShieldCheck,
                roman: "III.",
                title: "Formal Verdict",
                desc: "A pass or fail standing accompanied by written feedback fit for your portfolio.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-card p-8 group">
                <div className="flex items-baseline justify-between mb-6">
                  <span className="font-serif text-3xl text-accent">{f.roman}</span>
                  <f.icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
                <h3 className="font-serif text-2xl mb-2 text-foreground">{f.title}</h3>
                <div className="gold-rule w-12 my-3" />
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOTTO STRIP */}
      <section className="bg-gradient-crest text-primary-foreground py-16">
        <div className="container text-center">
          <div className="eyebrow text-accent mb-4">University Brand</div>
          <p className="font-display italic text-3xl md:text-5xl text-primary-foreground/95">
            “Nurturing Tomorrow's Noblest.”
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-primary-foreground/70 text-xs tracking-[0.28em] uppercase">
            <Award className="w-4 h-4 text-accent" />
            The Giants
            <Award className="w-4 h-4 text-accent" />
          </div>
        </div>
      </section>

      {/* INTERVIEWERS */}
      <section className="container py-24">
        <div className="text-center mb-14">
          <div className="eyebrow mb-3">The Faculty Panel</div>
          <h2 className="font-serif text-4xl md:text-5xl tracking-tight">
            Four interviewers. <span className="italic font-display">One verdict.</span>
          </h2>
          <div className="mt-6 flex justify-center">
            <div className="gold-rule w-32" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {[
            { e: "🎓", n: "Dr. Santos", t: "Academic Chair", s: "Strict · Logical" },
            { e: "💼", n: "Ms. Reyes", t: "Behavioral", s: "Empathic · Probing" },
            { e: "🤖", n: "Nova", t: "Adaptive Evaluator", s: "Futuristic · Agile" },
            { e: "🧠", n: "Prof. Cruz", t: "Technical", s: "Precise · Demanding" },
          ].map((c) => (
            <div
              key={c.n}
              className="bg-card border border-border rounded-sm p-7 text-center hover:shadow-elegant hover:-translate-y-1 transition-all duration-500 group"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-crest flex items-center justify-center mx-auto mb-5 ring-gold text-4xl">
                {c.e}
              </div>
              <div className="font-serif text-xl">{c.n}</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-accent mt-1">{c.t}</div>
              <div className="gold-rule w-10 mx-auto my-3" />
              <div className="text-xs text-muted-foreground italic">{c.s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-secondary/40">
        <div className="container py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-crest flex items-center justify-center ring-gold">
                  <span className="font-serif text-accent text-sm">URS</span>
                </div>
                <div className="font-serif text-lg">Interview Atelier</div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A program of the Office of Admissions, University of Rizal System. All evaluations
                are advisory and complement institutional review.
              </p>
            </div>
            <div>
              <div className="eyebrow mb-3">Quick Links</div>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><BookOpen className="w-3 h-3 text-accent" /> Applicant Handbook</li>
                <li className="flex items-center gap-2"><GraduationCap className="w-3 h-3 text-accent" /> Programs Offered</li>
                <li className="flex items-center gap-2"><Award className="w-3 h-3 text-accent" /> Brand & Symbol</li>
              </ul>
            </div>
            <div>
              <div className="eyebrow mb-3">Republic of the Philippines</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The University of Rizal System is a chartered state university. All content is in
                the public domain unless otherwise stated.
              </p>
            </div>
          </div>
          <div className="gold-rule" />
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            <div>© University of Rizal System</div>
            <div>Nurturing Tomorrow's Noblest</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
