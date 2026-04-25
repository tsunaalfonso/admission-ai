import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Character {
  id: string;
  name: string;
  title: string;
  description: string;
  personality: string;
  greeting: string;
  voice_style: string;
  avatar_emoji: string;
  is_active: boolean;
}

const empty = (): Omit<Character, "id"> => ({
  name: "",
  title: "",
  description: "",
  personality: "",
  greeting: "",
  voice_style: "neutral",
  avatar_emoji: "🤖",
  is_active: true,
});

const AdminCharacters = () => {
  const [list, setList] = useState<Character[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("ai_characters")
      .select("*")
      .order("name");
    setList(data ?? []);
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty());
    setOpen(true);
  };
  const openEdit = (c: Character) => {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.title.trim() || !form.greeting.trim()) {
      toast.error("Name, title and greeting are required");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    const { error } = editing
      ? await supabase.from("ai_characters").update(payload).eq("id", editing.id)
      : await supabase.from("ai_characters").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Character updated" : "Character created");
    setOpen(false);
    void load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this character? Existing interviews will be preserved but it cannot be selected anymore.")) return;
    const { error } = await supabase.from("ai_characters").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">AI Interview Characters</h2>
        <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" /> New character
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {list.map((c) => (
          <Card key={c.id} className="p-5 border-border/60">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{c.avatar_emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  {!c.is_active && <span className="text-xs bg-muted px-2 py-0.5 rounded">inactive</span>}
                </div>
                <div className="text-xs text-primary mb-1">{c.title}</div>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit character" : "New character"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px,1fr] gap-3">
              <div>
                <Label className="text-xs">Emoji</Label>
                <Input value={form.avatar_emoji} onChange={(e) => setForm({ ...form, avatar_emoji: e.target.value })} maxLength={4} className="text-center text-2xl" />
              </div>
              <div>
                <Label className="text-xs">Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} maxLength={400} />
            </div>
            <div>
              <Label className="text-xs">Personality (used in AI prompt)</Label>
              <Textarea value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })} rows={2} maxLength={400} />
            </div>
            <div>
              <Label className="text-xs">Greeting (spoken at start)</Label>
              <Textarea value={form.greeting} onChange={(e) => setForm({ ...form, greeting: e.target.value })} rows={3} maxLength={500} />
            </div>
            <div>
              <Label className="text-xs">Voice style</Label>
              <Input value={form.voice_style} onChange={(e) => setForm({ ...form, voice_style: e.target.value })} placeholder="formal, warm, futuristic, technical, neutral" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active" className="text-sm">Active (visible to students)</Label>
              <Switch id="active" checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCharacters;
