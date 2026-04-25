import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Clock, RefreshCw } from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  approval_status: ApprovalStatus;
  created_at: string;
  approved_at: string | null;
}

const TABS: { key: ApprovalStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const AdminApprovals = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<ApprovalStatus>("pending");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, approval_status, created_at, approved_at")
      .eq("approval_status", tab)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as ProfileRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase
      .from("profiles")
      .update({
        approval_status: status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
        approved_by: user?.id ?? null,
      })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Account approved" : "Account rejected");
    setRows((r) => r.filter((row) => row.id !== id));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl">Account Approvals</h2>
          <p className="text-sm text-muted-foreground">
            Review and confirm new applicant accounts before they can sign in.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 border-b border-border/60">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Clock className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">No {tab} accounts.</div>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <Card
              key={row.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border-border/60"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">
                    {row.full_name?.trim() || "(no name)"}
                  </span>
                  <Badge
                    variant={
                      row.approval_status === "approved"
                        ? "default"
                        : row.approval_status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px] uppercase tracking-wider"
                  >
                    {row.approval_status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {row.email ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Registered {new Date(row.created_at).toLocaleString()}
                </div>
              </div>

              {tab === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === row.id}
                    onClick={() => decide(row.id, "rejected")}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === row.id}
                    onClick={() => decide(row.id, "approved")}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </div>
              )}
              {tab === "rejected" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === row.id}
                  onClick={() => decide(row.id, "approved")}
                >
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
              )}
              {tab === "approved" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === row.id}
                  onClick={() => decide(row.id, "rejected")}
                >
                  <X className="w-4 h-4 mr-1" /> Revoke
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminApprovals;
