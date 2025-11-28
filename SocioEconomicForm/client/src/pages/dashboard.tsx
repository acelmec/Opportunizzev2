import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ScoreBar } from "@/components/score-badge";
import { DashboardSkeleton } from "@/components/loading-state";
import {
  Users,
  Building2,
  Target,
  TrendingUp,
  Car,
  Home,
  Heart,
  Shield,
  Briefcase,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/validators";

interface DashboardStats {
  totalPF: number;
  totalPJ: number;
  totalOportunidades: number;
  premioEstimado: number;
  oportunidadesPorStatus: { status: string; count: number }[];
  oportunidadesPorProduto: { produto: string; count: number }[];
  scoreMedioPorProduto: { produto: string; score: number }[];
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const STATUS_LABELS: Record<string, string> = {
  novo: "Novos",
  em_proposta: "Em Proposta",
  enviado: "Enviados",
  aceito: "Aceitos",
  recusado: "Recusados",
};

const PRODUTO_LABELS: Record<string, string> = {
  vida: "Vida",
  auto: "Auto",
  residencial: "Residencial",
  rc_profissional: "RC Prof.",
  previdencia: "Previdência",
  saude: "Saúde",
};

const PRODUTO_ICONS: Record<string, typeof Heart> = {
  vida: Heart,
  auto: Car,
  residencial: Home,
  rc_profissional: Briefcase,
  previdencia: TrendingUp,
  saude: Activity,
};

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const pieData = stats?.oportunidadesPorProduto.map((item) => ({
    name: PRODUTO_LABELS[item.produto] || item.produto,
    value: item.count,
  })) || [];

  const barData = stats?.oportunidadesPorStatus.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    valor: item.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Visão geral de clientes e oportunidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pessoas Físicas"
          value={stats?.totalPF || 0}
          icon={Users}
          trend={12}
          description="vs. mês anterior"
        />
        <StatCard
          title="Pessoas Jurídicas"
          value={stats?.totalPJ || 0}
          icon={Building2}
          trend={8}
          description="vs. mês anterior"
        />
        <StatCard
          title="Oportunidades"
          value={stats?.totalOportunidades || 0}
          icon={Target}
          trend={15}
          description="ativas"
        />
        <StatCard
          title="Prêmio Estimado"
          value={formatCurrency(stats?.premioEstimado || 0)}
          icon={TrendingUp}
          trend={22}
          description="potencial"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline de Oportunidades</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="valor"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma oportunidade registrada
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhuma oportunidade registrada
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Score Médio por Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {stats?.scoreMedioPorProduto && stats.scoreMedioPorProduto.length > 0 ? (
                stats.scoreMedioPorProduto.map((item) => {
                  const Icon = PRODUTO_ICONS[item.produto] || Shield;
                  return (
                    <div
                      key={item.produto}
                      className="flex items-center gap-4"
                      data-testid={`score-produto-${item.produto}`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <ScoreBar
                        score={item.score}
                        label={PRODUTO_LABELS[item.produto] || item.produto}
                        className="flex-1"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  Cadastre clientes para ver os scores médios
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/cadastro/pf"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate transition-colors"
              data-testid="link-quick-action-pf"
            >
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium text-sm">Novo Cliente PF</div>
                <div className="text-xs text-muted-foreground">
                  Cadastrar pessoa física
                </div>
              </div>
            </a>
            <a
              href="/cadastro/pj"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate transition-colors"
              data-testid="link-quick-action-pj"
            >
              <Building2 className="h-5 w-5 text-chart-2" />
              <div>
                <div className="font-medium text-sm">Nova Empresa PJ</div>
                <div className="text-xs text-muted-foreground">
                  Cadastrar pessoa jurídica
                </div>
              </div>
            </a>
            <a
              href="/oportunidades"
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover-elevate transition-colors"
              data-testid="link-quick-action-oportunidades"
            >
              <Target className="h-5 w-5 text-chart-3" />
              <div>
                <div className="font-medium text-sm">Ver Oportunidades</div>
                <div className="text-xs text-muted-foreground">
                  Gerenciar propostas
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
