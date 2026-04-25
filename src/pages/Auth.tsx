import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Sparkles, Mail, Lock, User as UserIcon } from "lucide-react";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});
const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, "Name required").max(100),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);

    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ email, password, fullName });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: parsed.data.fullName },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Account created! You're signed in.");
        navigate("/dashboard");
      } else {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      <div className="absolute inset-0 parchment opacity-60 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex flex-col items-center justify-center gap-3 mb-8">
          <div className="relative w-16 h-16 rounded-full bg-gradient-crest flex items-center justify-center ring-gold shadow-elegant">
            <div className="absolute inset-1.5 rounded-full border border-accent/40" />
            <span className="font-serif text-accent text-xl">URS</span>
          </div>
          <div className="text-center">
            <div className="font-serif text-2xl">Interview Atelier</div>
            <div className="eyebrow mt-1">Office of Admissions</div>
          </div>
        </Link>

        <div className="bg-card border border-border rounded-sm p-10 shadow-elegant ring-gold">
          <div className="text-center mb-2">
            <div className="eyebrow">{mode === "signup" ? "New Applicant" : "Returning Applicant"}</div>
          </div>
          <h1 className="font-serif text-3xl text-center mb-2">
            {mode === "signup" ? "Register for Admission" : "Welcome Back"}
          </h1>
          <div className="flex justify-center mb-3">
            <div className="gold-rule w-16" />
          </div>
          <p className="font-display italic text-center text-muted-foreground mb-7">
            {mode === "signup"
              ? "Begin your application to the University of Rizal System."
              : "Sign in to resume your admissions interview."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan dela Cruz"
                    className="pl-10 h-11 rounded-sm border-border focus-visible:ring-primary"
                    required
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@urs.edu.ph"
                  className="pl-10 h-11 rounded-sm border-border focus-visible:ring-primary"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="pl-10 h-11 rounded-sm border-border focus-visible:ring-primary"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 rounded-sm ring-gold shadow-elegant tracking-[0.15em] uppercase text-xs font-semibold"
            >
              {busy ? "Please wait…" : mode === "signup" ? "Submit Registration" : "Sign In"}
            </Button>
          </form>

          <div className="mt-7 flex justify-center">
            <div className="gold-rule w-24" />
          </div>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already registered?" : "First time applying?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary font-semibold hover:text-accent transition-colors underline-offset-4 hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Register now"}
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.28em] text-muted-foreground mt-6">
          Republic of the Philippines · University of Rizal System
        </p>
      </div>
    </div>
  );
};

export default Auth;

