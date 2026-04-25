import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, Users, MessagesSquare, FileText, UserCheck } from "lucide-react";

interface Stats {
  totalInterviews: number;
  totalStudents: number;
  passRate: number;
  avgScore: number;
}

const AdminLayout = () => {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    void (async () => {
      const [{ count: ic }, { data: results }, { count: sc }] = await Promise.all([
        supabase.from("interviews").select("*", { count: "exact", head: true }),
        supabase.from("results").select("final_score, passed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      const total = results?.length ?? 0;
      const passed = results?.filter((r) => r.passed).length ?? 0;
      const avg = total
        ? Math.round((results!.reduce((s, r) => s + r.final_score, 0) / total) * 10) / 10
        : 0;
      setStats({
        totalInterviews: ic ?? 0,
        totalStudents: sc ?? 0,
        passRate: total ? Math.round((passed / total) * 100) : 0,
        avgScore: avg,
      });
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="container py-8">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Admin</div>
          <h1 className="text-3xl font-bold">Control center</h1>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total interviews" value={stats?.totalInterviews ?? "—"} />
          <StatCard label="Students" value={stats?.totalStudents ?? "—"} />
          <StatCard label="Pass rate" value={stats ? `${stats.passRate}%` : "—"} />
          <StatCard label="Average score" value={stats?.avgScore ?? "—"} />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border/60">
          <AdminTab to="/admin" end icon={LayoutDashboard} label="Overview" />
          <AdminTab to="/admin/characters" icon={Users} label="Characters" />
          <AdminTab to="/admin/questions" icon={MessagesSquare} label="Questions" />
          <AdminTab to="/admin/results" icon={FileText} label="Results" />
          <AdminTab to="/admin/approvals" icon={UserCheck} label="Approvals" />
        </div>

        <Outlet />
      </main>
    </div>
  );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <Card className="p-5 border-border/60">
    <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
    <div className="text-3xl font-bold font-mono text-gradient">{value}</div>
  </Card>
);

const AdminTab = ({
  to,
  icon: Icon,
  label,
  end,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`
    }
  >
    <Icon className="w-4 h-4" /> {label}
  </NavLink>
);

export default AdminLayout;
