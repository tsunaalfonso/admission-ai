import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut } from "lucide-react";

export const TopBar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      {/* Institutional ribbon — evokes Republic of the Philippines bar on URS site */}
      <div className="w-full bg-gradient-crest text-primary-foreground/90 text-[10px] tracking-[0.25em] uppercase">
        <div className="container flex h-7 items-center justify-between">
          <span className="hidden sm:inline">Republic of the Philippines · University of Rizal System</span>
          <span className="sm:hidden">URS · Republic of the Philippines</span>
          <span className="text-accent">Nurturing Tomorrow's Noblest</span>
        </div>
      </div>

      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            {/* Crest mark — concentric rings + monogram */}
            <div className="relative w-12 h-12 rounded-full bg-gradient-crest flex items-center justify-center ring-gold shadow-elegant">
              <div className="absolute inset-1 rounded-full border border-accent/40" />
              <span className="font-serif text-accent text-lg leading-none tracking-tight">URS</span>
            </div>
            <div className="leading-tight">
              <div className="font-serif text-xl text-foreground">Interview Atelier</div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Office of Admissions
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            {user && (
              <>
                <Link to="/dashboard" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="font-medium tracking-wide">
                    Dashboard
                  </Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="hidden sm:inline-flex">
                    <Button variant="ghost" size="sm" className="font-medium tracking-wide">
                      Registrar
                    </Button>
                  </Link>
                )}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 ring-gold tracking-wide"
                >
                  Sign in
                </Button>
              </Link>
            )}
          </nav>
        </div>
        <div className="gold-rule" />
      </header>
    </>
  );
};
