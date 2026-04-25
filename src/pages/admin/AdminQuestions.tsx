import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Question {
  id: string;
  character_id: string | null;
  question_text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  expected_keywords: string[] | null;
  is_active: boolean;
}
interface CharRef { id: string; name: string; avatar_emoji: string; }

const emptyQ = (charId: string): Omit<Question, "id"> => ({
  character_id: charId,
  question_text: "",
  category: "general",
  difficulty: "medium",
  expected_keywords: [],
  is_active: true,
});

const AdminQuestions = () => {
  const [characters, setCharacters] = useState<CharRef[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<Omit<Question, "id">>(emptyQ(""));
  const [keywordInput, setKeywordInput] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [{ data: cs }, { data: qs }] = await Promise.all([
      supabase.from("ai_characters").select("id, name, avatar_emoji").order("name"),
      supabase.from("questions").select("*").order("created_at", { ascending: false }),
    ]);
    setCharacters(cs ?? []);
    setQuestions(qs ?? []);
  };
  useEffect(() => { void load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyQ(characters[0]?.id ?? ""));
    setKeywordInput("");
    setOpen(true);
  };
  const openEdit = (q: Question) => {
    setEditing(q);
    setForm({ ...q });
    setKeywordInput((q.expected_keywords ?? []).join(", "));
    setOpen(true);
  };

  const save = async () => {
    if (!form.question_text.trim()) {
      toast.error("Question text required");
      return;
    }
    setSaving(true);
    const keywords = keywordInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    const payload = { ...form, expected_keywords: keywords };
    const { error } = editing
      ? await supabase.from("questions").update(payload).eq("id", editing.id)
      : await supabase.from("questions").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Updated" : "Created");
    setOpen(false);
    void load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    void load();
  };

  const visible = questions.filter((q) => filter === "all" || q.character_id === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Interview questions</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All interviewers</SelectItem>
              {characters.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.avatar_emoji} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90">
            <Plus className="w-4 h-4 mr-2" /> New
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {visible.map((q) => {
          const c = characters.find((x) => x.id === q.character_id);
          return (
            <Card key={q.id} className="p-4 border-border/60 flex items-start gap-3">
              <div className="text-2xl shrink-0">{c?.avatar_emoji ?? "❓"}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{q.question_text}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">{c?.name ?? "Unassigned"}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{q.category}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{q.difficulty}</Badge>
                  {!q.is_active && <Badge variant="outline" className="text-xs">inactive</Badge>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => openEdit(q)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => del(q.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Card className="p-10 text-center border-dashed">
            <p className="text-muted-foreground text-sm">No questions yet.</p>
          </Card>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit question" : "New question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Interviewer</Label>
              <Select
                value={form.character_id ?? ""}
                onValueChange={(v) => setForm({ ...form, character_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select interviewer" /></SelectTrigger>
                <SelectContent>
                  {characters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Question</Label>
              <Textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} rows={3} maxLength={500} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} maxLength={50} />
              </div>
              <div>
                <Label className="text-xs">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v as Question["difficulty"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Expected keywords (comma-separated)</Label>
              <Input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} placeholder="motivation, goals, learning" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="active" className="text-sm">Active</Label>
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

export default AdminQuestions;
