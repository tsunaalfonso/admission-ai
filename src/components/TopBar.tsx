import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Moon, Sun, LogOut, Sparkles } from "lucide-react";

export const TopBar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">Interviewly</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-1">AI Admissions</div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          {user && (
            <>
              <Link to="/dashboard" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">Admin</Button>
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
              <Button variant="default" size="sm">Sign in</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
