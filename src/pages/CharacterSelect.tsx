import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft } from "lucide-react";

interface AICharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  greeting: string;
  avatar_emoji: string;
  voice_style: string;
}

const CharacterSelect = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("ai_characters")
        .select("id, name, title, description, greeting, avatar_emoji, voice_style")
        .eq("is_active", true)
        .order("name");
      setCharacters(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container py-10 max-w-6xl">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to dashboard
        </Link>
        <h1 className="text-4xl font-bold tracking-tight mb-2">Choose your interviewer</h1>
        <p className="text-muted-foreground mb-8">Each AI persona evaluates differently. Pick the one for your interview.</p>

        {loading ? (
          <div className="text-muted-foreground">Loading characters...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {characters.map((c) => (
              <Card key={c.id} className="bg-gradient-card border-border/60 p-7 hover:border-primary/50 hover:shadow-glow transition-all group">
                <div className="flex items-start gap-5">
                  <div className="text-6xl float">{c.avatar_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">
                      {c.voice_style}
                    </Badge>
                    <h3 className="text-2xl font-bold">{c.name}</h3>
                    <div className="text-sm text-primary font-medium mb-2">{c.title}</div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{c.description}</p>
                    <Button
                      onClick={() => navigate(`/interview/${c.id}`)}
                      className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 group-hover:translate-x-0.5 transition-transform"
                    >
                      Start with {c.name.split(" ")[0]} <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CharacterSelect;
