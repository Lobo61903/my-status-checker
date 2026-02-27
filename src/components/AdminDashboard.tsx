import { useState, useEffect, useCallback } from "react";
import {
  Users, Eye, BarChart3, Shield, LogOut, MapPin, Globe,
  Clock, AlertTriangle, UserPlus, Trash2, RefreshCw,
  TrendingUp, Ban, Smartphone, Monitor, ChevronRight,
  DollarSign, FileText, QrCode, Hash, Copy, CheckCircle,
  ChevronLeft, ShieldAlert, ShieldOff, Bot, Wifi, WifiOff,
  MapPinOff, Zap, Search, Unlock, ListChecks, Upload,
  ToggleLeft, ToggleRight, X, CheckSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminDashboardProps {
  token: string;
  user: { id: string; username: string; display_name: string };
  onLogout: () => void;
}

interface PaginationInfo {
  page: number;
  per_page: number;
  visits_total: number;
  funnel_total: number;
  blocked_total: number;
}

interface DashboardData {
  stats: { total_visits: number; total_events: number; total_blocked: number };
  recentVisits: any[];
  funnelData: any[];
  allFunnelData: any[];
  countryData: any[];
  blockedList: any[];
  pagination: PaginationInfo;
}

type Tab = "overview" | "visits" | "funnel" | "blocked" | "users" | "whitelist";

const PER_PAGE = 50;

const PaginationControls = ({ page, total, perPage, onPageChange }: { page: number; total: number; perPage: number; onPageChange: (p: number) => void }) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {((page - 1) * perPage) + 1}–{Math.min(page * perPage, total)} de {total}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-bold px-2">{page}/{totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const AdminDashboard = ({ token, user, onLogout }: AdminDashboardProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: "", password: "", display_name: "" });
  const [addingUser, setAddingUser] = useState(false);
  const [newBlockIp, setNewBlockIp] = useState({ ip: "", reason: "" });
  const [blockingIp, setBlockingIp] = useState(false);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  const [blockFilter, setBlockFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [clearingData, setClearingData] = useState(false);

  // Whitelist state
  const [whitelistEntries, setWhitelistEntries] = useState<any[]>([]);
  const [whitelistEnabled, setWhitelistEnabled] = useState(false);
  const [whitelistLoading, setWhitelistLoading] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ imported: number; skipped: number } | null>(null);

  const fetchDashboard = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-auth", {
        body: { action: "dashboard", token, page, per_page: PER_PAGE },
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

  const fetchWhitelist = useCallback(async () => {
    setWhitelistLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-auth", {
        body: { action: "whitelist_list", token },
      });
      if (res.data?.entries !== undefined) setWhitelistEntries(res.data.entries);
      if (res.data?.enabled !== undefined) setWhitelistEnabled(res.data.enabled);
    } catch {}
    setWhitelistLoading(false);
  }, [token]);

  const handleToggleWhitelist = async () => {
    const newVal = !whitelistEnabled;
    try {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "whitelist_toggle", token, enabled: newVal },
      });
      setWhitelistEnabled(newVal);
    } catch {}
  };

  const handleDeleteWhitelistEntry = async (id: string) => {
    if (!confirm("Remover este CPF da whitelist?")) return;
    await supabase.functions.invoke("admin-auth", {
      body: { action: "whitelist_delete", token, id },
    });
    fetchWhitelist();
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      // Detect separator: semicolon or comma
      const sep = lines[0]?.includes(';') ? ';' : ',';
      // Skip header if first line contains letters that look like a header
      const dataLines = /[a-zA-Z]{3,}/.test(lines[0]?.split(sep)[1] || '') ? lines.slice(1) : lines;
      const entries = dataLines.map(line => {
        const parts = line.split(sep).map(p => p.trim().replace(/^"|"$/g, ''));
        return { numero: parts[0] || '', cpf: (parts[1] || '').replace(/\D/g, ''), nome: parts[2] || '', link: parts[3] || '' };
      }).filter(e => e.cpf.length === 11);

      const res = await supabase.functions.invoke("admin-auth", {
        body: { action: "whitelist_import", token, entries },
      });
      setCsvResult(res.data || { imported: 0, skipped: 0 });
      fetchWhitelist();
    } catch {}
    setCsvUploading(false);
    e.target.value = '';
  };

  useEffect(() => {
    fetchDashboard(currentPage);
    fetchUsers();
    fetchWhitelist();
    const interval = setInterval(() => {
      fetchDashboard(currentPage);
      fetchUsers();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchUsers, fetchWhitelist, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchDashboard(page);
  };

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
      fetchDashboard(currentPage);
    } catch {}
    setBlockingIp(false);
  };

  const handleUnblockIp = async (ipAddress: string) => {
    if (!confirm(`Desbloquear o IP ${ipAddress}?`)) return;
    setUnblockingIp(ipAddress);
    try {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "unblock_ip", token, ip_address: ipAddress },
      });
      fetchDashboard(currentPage);
    } catch {}
    setUnblockingIp(null);
  };

  const handleClearData = async () => {
    if (!confirm("Tem certeza que deseja APAGAR todos os registros (visitas, eventos do funil e device locks)? Esta ação não pode ser desfeita.")) return;
    setClearingData(true);
    try {
      await supabase.functions.invoke("admin-auth", {
        body: { action: "clear_data", token },
      });
      fetchDashboard(currentPage);
    } catch {}
    setClearingData(false);
  };

  // Categorize block reasons
  const categorizeBlock = (reason: string | null) => {
    if (!reason) return { type: "manual", label: "Manual", icon: Ban, color: "text-muted-foreground", bg: "bg-muted" };
    const r = reason.toLowerCase();
    if (r.includes("bot ua") || r.includes("bot ")) return { type: "bot", label: "Bot / Scanner", icon: Bot, color: "text-destructive", bg: "bg-destructive/10" };
    if (r.includes("phish") || r.includes("safe") || r.includes("virus") || r.includes("netcraft") || r.includes("scam") || r.includes("checker") || r.includes("urlscan") || r.includes("censys") || r.includes("shodan") || r.includes("binaryedge")) return { type: "phishing_checker", label: "Anti-Phishing", icon: ShieldAlert, color: "text-orange-500", bg: "bg-orange-500/10" };
    if (r.includes("hosting") || r.includes("dc:") || r.includes("datacenter") || r.includes("data center")) return { type: "hosting", label: "Datacenter/Hosting", icon: ShieldOff, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (r.includes("vpn") || r.includes("proxy") || r.includes("tor") || r.includes("relay")) return { type: "vpn", label: "VPN/Proxy", icon: WifiOff, color: "text-purple-500", bg: "bg-purple-500/10" };
    if (r.includes("country") || r.includes("geo")) return { type: "geo", label: "País Bloqueado", icon: MapPinOff, color: "text-blue-500", bg: "bg-blue-500/10" };
    if (r.includes("rate limit")) return { type: "rate_limit", label: "Rate Limit", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" };
    if (r.includes("bloqueio manual") || r.includes("manual")) return { type: "manual", label: "Manual", icon: Ban, color: "text-muted-foreground", bg: "bg-muted" };
    // Check for scanner patterns in the UA string within the reason
    if (/scanner|crawl|spider|semrush|ahref|lighthouse|puppeteer|selenium|headless|curl|wget|python|httpx|scrapy/i.test(r)) return { type: "bot", label: "Bot / Scanner", icon: Bot, color: "text-destructive", bg: "bg-destructive/10" };
    return { type: "other", label: "Outro", icon: AlertTriangle, color: "text-muted-foreground", bg: "bg-muted" };
  };

  // Use allFunnelData for aggregation (complete dataset)
  const allFunnel = data?.allFunnelData || [];

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
    count: allFunnel.filter((e: any) => e.event_type === step).length,
  }));
  const maxFunnel = Math.max(...funnelCounts.map((f) => f.count), 1);

  // Unique CPFs
  const uniqueCpfs = new Set(allFunnel.filter((e: any) => e.cpf).map((e: any) => e.cpf));

  // Specific counters
  const cpfSubmittedCount = allFunnel.filter((e: any) => e.event_type === "cpf_submitted").length;
  const darfViewedCount = allFunnel.filter((e: any) => e.event_type === "darf_viewed").length;
  const pixGeneratedCount = allFunnel.filter((e: any) => e.event_type === "pix_generated").length;
  const pixCopiedCount = allFunnel.filter((e: any) => e.event_type === "pix_copied").length;
  const paymentConfirmedCount = allFunnel.filter((e: any) => e.event_type === "payment_confirmed").length;

  // Total value — only count sessions where PIX was actually generated (API returned copia e cola)
  const sessionValues: Record<string, number> = {};
  allFunnel
    .filter((e: any) => e.event_type === "pix_generated")
    .forEach((e: any) => {
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

  // Mobile vs Desktop from ALL visits (countryData now includes is_mobile)
  const mobileCount = data?.countryData?.filter((v: any) => v.is_mobile).length || 0;
  const desktopCount = (data?.countryData?.length || 0) - mobileCount;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "visits", label: "Acessos", icon: Eye },
    { id: "funnel", label: "Funil", icon: TrendingUp },
    { id: "blocked", label: "Bloqueados", icon: Ban },
    { id: "whitelist", label: "Whitelist", icon: ListChecks },
    { id: "users", label: "Usuários", icon: Users },
  ];

  const pagination = data?.pagination;

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
            <button
              onClick={handleClearData}
              disabled={clearingData}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-destructive/10 transition-colors text-xs text-destructive disabled:opacity-50"
            >
              <Trash2 className={`h-3.5 w-3.5 ${clearingData ? "animate-spin" : ""}`} />
              {clearingData ? "Apagando..." : "Limpar Dados"}
            </button>
            <button onClick={() => { fetchDashboard(currentPage); fetchUsers(); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
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
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
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
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Acessos</h3>
                  <span className="text-xs text-muted-foreground">{pagination?.visits_total || 0} total</span>
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
                <PaginationControls
                  page={currentPage}
                  total={pagination?.visits_total || 0}
                  perPage={PER_PAGE}
                  onPageChange={handlePageChange}
                />
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

                {/* Recent CPF events - paginated */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">Eventos Recentes com CPF</h3>
                    <span className="text-xs text-muted-foreground">{pagination?.funnel_total || 0} total</span>
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
                        {data.funnelData.filter((e: any) => e.cpf).map((e: any, i: number) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-2.5 tabular-nums whitespace-nowrap">{new Date(e.created_at).toLocaleString("pt-BR")}</td>
                            <td className="p-2.5 font-mono font-bold">{e.cpf}</td>
                            <td className="p-2.5">
                              <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                e.event_type === "pix_generated" ? "bg-accent/10 text-accent" :
                                e.event_type === "pix_copied" ? "bg-primary/10 text-primary" :
                                e.event_type === "payment_confirmed" ? "bg-accent/10 text-accent" :
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
                  <PaginationControls
                    page={currentPage}
                    total={pagination?.funnel_total || 0}
                    perPage={PER_PAGE}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            )}

            {/* BLOCKED */}
            {activeTab === "blocked" && data && (() => {
              const allBlocked = data.blockedList || [];
              const categorized = allBlocked.map((b: any) => ({ ...b, category: categorizeBlock(b.reason) }));
              
              // Count by type from ALL blocked (use pagination total for overview)
              const typeCounts: Record<string, number> = {};
              categorized.forEach((b: any) => {
                typeCounts[b.category.type] = (typeCounts[b.category.type] || 0) + 1;
              });

              const filteredBlocked = blockFilter === "all" ? categorized : categorized.filter((b: any) => b.category.type === blockFilter);

              const filterButtons = [
                { type: "all", label: "Todos", icon: Ban, count: allBlocked.length },
                { type: "bot", label: "Bots", icon: Bot, count: typeCounts["bot"] || 0 },
                { type: "phishing_checker", label: "Anti-Phishing", icon: ShieldAlert, count: typeCounts["phishing_checker"] || 0 },
                { type: "vpn", label: "VPN/Proxy", icon: WifiOff, count: typeCounts["vpn"] || 0 },
                { type: "geo", label: "País", icon: MapPinOff, count: typeCounts["geo"] || 0 },
                { type: "hosting", label: "Hosting", icon: ShieldOff, count: typeCounts["hosting"] || 0 },
                { type: "rate_limit", label: "Rate Limit", icon: Zap, count: typeCounts["rate_limit"] || 0 },
                { type: "manual", label: "Manual", icon: Ban, count: typeCounts["manual"] || 0 },
              ].filter(f => f.type === "all" || f.count > 0);

              return (
              <div className="space-y-4">
                {/* Stats cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Bloqueados", value: pagination?.blocked_total || 0, icon: Ban, color: "text-destructive" },
                    { label: "Bots / Scanners", value: typeCounts["bot"] || 0, icon: Bot, color: "text-destructive" },
                    { label: "Anti-Phishing", value: typeCounts["phishing_checker"] || 0, icon: ShieldAlert, color: "text-orange-500" },
                    { label: "VPN / Proxy", value: typeCounts["vpn"] || 0, icon: WifiOff, color: "text-purple-500" },
                  ].map((stat, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-xl font-extrabold tabular-nums text-foreground">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Block IP form */}
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

                {/* Filter buttons */}
                <div className="flex flex-wrap gap-2">
                  {filterButtons.map((f) => (
                    <button
                      key={f.type}
                      onClick={() => setBlockFilter(f.type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        blockFilter === f.type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <f.icon className="h-3 w-3" />
                      {f.label}
                      <span className="font-bold tabular-nums">{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Blocked list table */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">IPs Bloqueados</h3>
                    <span className="text-xs text-muted-foreground">{filteredBlocked.length} exibidos / {pagination?.blocked_total || 0} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">IP</th>
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Tipo</th>
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Motivo</th>
                          <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Data</th>
                          <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBlocked.map((b: any, i: number) => {
                          const cat = b.category;
                          const CatIcon = cat.icon;
                          return (
                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 font-mono text-foreground font-bold">{b.ip_address}</td>
                              <td className="p-2.5">
                                <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.color}`}>
                                  <CatIcon className="h-3 w-3" />
                                  {cat.label}
                                </span>
                              </td>
                              <td className="p-2.5 text-muted-foreground max-w-xs truncate" title={b.reason || "—"}>
                                {b.reason || "—"}
                              </td>
                              <td className="p-2.5 tabular-nums text-muted-foreground whitespace-nowrap">
                                {new Date(b.created_at).toLocaleString("pt-BR")}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => handleUnblockIp(b.ip_address)}
                                  disabled={unblockingIp === b.ip_address}
                                  className="p-1.5 rounded-lg hover:bg-accent/10 transition-colors text-muted-foreground hover:text-accent disabled:opacity-50"
                                  title="Desbloquear"
                                >
                                  <Unlock className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredBlocked.length === 0 && (
                          <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">
                            {blockFilter === "all" ? "Nenhum IP bloqueado" : "Nenhum bloqueio nesta categoria"}
                          </td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    page={currentPage}
                    total={pagination?.blocked_total || 0}
                    perPage={PER_PAGE}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
              );
            })()}

            {/* WHITELIST */}
            {activeTab === "whitelist" && (
              <div className="space-y-4">
                {/* Toggle + header */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" />
                      Whitelist de CPFs
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Quando ativada, somente os CPFs cadastrados poderão acessar o sistema.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleWhitelist}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      whitelistEnabled
                        ? "bg-accent/10 text-accent border border-accent/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {whitelistEnabled ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    {whitelistEnabled ? "ATIVA" : "INATIVA"}
                  </button>
                </div>

                {/* CSV Upload */}
                <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                    <Upload className="h-4 w-4 text-primary" />
                    Importar CSV
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Formato: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">numero;cpf;nome;link</code> (separado por ponto e vírgula ou vírgula). A primeira linha pode ser um cabeçalho.
                  </p>
                  <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors gradient-primary text-primary-foreground hover:opacity-90 ${csvUploading ? "opacity-50 pointer-events-none" : ""}`}>
                      <Upload className="h-3.5 w-3.5" />
                      {csvUploading ? "Importando..." : "Selecionar CSV"}
                      <input type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} disabled={csvUploading} />
                    </label>
                    {csvResult && (
                      <span className="text-xs font-medium text-foreground">
                        ✅ <strong>{csvResult.imported}</strong> importados, <strong>{csvResult.skipped}</strong> ignorados (já existiam)
                      </span>
                    )}
                  </div>
                </div>

                {/* Whitelist table */}
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-sm font-bold text-foreground">CPFs na Whitelist</h3>
                    <span className="text-xs text-muted-foreground">{whitelistEntries.length} cadastrados</span>
                  </div>
                  {whitelistLoading ? (
                    <div className="p-8 flex justify-center">
                      <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Número</th>
                            <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">CPF</th>
                            <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Nome</th>
                            <th className="text-left p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Link</th>
                            <th className="text-right p-2.5 font-bold text-muted-foreground uppercase tracking-wider">Ação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {whitelistEntries.map((e: any, i: number) => (
                            <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="p-2.5 font-mono text-muted-foreground">{e.numero || "—"}</td>
                              <td className="p-2.5 font-mono font-bold text-foreground">{e.cpf}</td>
                              <td className="p-2.5 text-foreground">{e.nome || "—"}</td>
                              <td className="p-2.5 text-primary truncate max-w-xs">
                                {e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer" className="hover:underline truncate block max-w-[180px]">{e.link}</a> : "—"}
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => handleDeleteWhitelistEntry(e.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                                  title="Remover"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {whitelistEntries.length === 0 && (
                            <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum CPF cadastrado. Importe um CSV para começar.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
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
