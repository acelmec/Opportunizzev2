import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, UserCheck, CreditCard, AlertTriangle, AlertCircle, TrendingUp, FileText, Bot, MessageSquare, Filter } from "lucide-react";

interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalClientes: number;
  tenantsByPlan: { planName: string; count: number }[];
}

interface UsageSummary {
  totalTenants: number;
  tenantsAtLimit: number;
  tenantsNearLimit: number;
  totalUsersUsed: number;
  totalUsersLimit: number;
  totalClientesUsed: number;
  totalClientesLimit: number;
  totalApoliciesUsed: number;
  totalApoliciesLimit: number | null;
  totalTokensUsed: number;
  totalTokensLimit: number | null;
  totalConnectionsUsed: number;
  totalConnectionsLimit: number | null;
  tenantAlerts: {
    tenantId: string;
    tenantName: string;
    type: 'usuarios' | 'clientes' | 'apolices' | 'tokens' | 'conexoes';
    severity: 'warning' | 'exceeded';
    used: number;
    limit: number;
  }[];
}

interface TenantUsage {
  tenantId: string;
  tenantName: string;
  planName: string | null;
  isActive?: boolean;
  limits: { 
    maxUsuarios: number; 
    maxClientes: number;
    maxApolices: number | null;
    maxTokensIa: number | null;
    maxConexoesEvolution: number | null;
  };
  usage: { 
    usuarios: number; 
    clientesPF: number; 
    clientesPJ: number; 
    totalClientes: number;
    apolices: number;
    tokensIa: number;
    conexoesEvolution: number;
  };
  percentages: { 
    usuarios: number; 
    clientes: number;
    apolices: number | null;
    tokensIa: number | null;
    conexoesEvolution: number | null;
  };
  alerts: { 
    usuarios: 'ok' | 'warning' | 'exceeded'; 
    clientes: 'ok' | 'warning' | 'exceeded';
    apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    conexoesEvolution: 'ok' | 'warning' | 'exceeded' | 'unlimited';
  };
}

export default function AdminDashboard() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>("all");

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: usageSummary, isLoading: isLoadingUsage } = useQuery<UsageSummary>({
    queryKey: ["/api/admin/usage-summary"],
    enabled: selectedTenantId === "all",
  });

  const { data: allTenantsUsage } = useQuery<TenantUsage[]>({
    queryKey: ["/api/admin/tenants-usage"],
  });

  const { data: selectedTenantUsage, isLoading: isLoadingTenantUsage } = useQuery<TenantUsage>({
    queryKey: ["/api/admin/tenants", selectedTenantId, "usage"],
    enabled: selectedTenantId !== "all",
  });

  const isUnlimited = (limit: number | null | undefined): boolean => {
    return limit === null || limit === undefined;
  };

  const getProgressColor = (used: number, limit: number | null | undefined) => {
    if (isUnlimited(limit)) return "bg-primary/50";
    const percent = (used / (limit as number)) * 100;
    if (percent >= 100) return "bg-destructive";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  const getProgressWidth = (used: number, limit: number | null | undefined) => {
    if (isUnlimited(limit)) return used > 0 ? 30 : 5;
    if (limit === 0) return 0;
    return Math.min((used / (limit as number)) * 100, 100);
  };

  const formatLimit = (limit: number | null | undefined): string => {
    return isUnlimited(limit) ? '∞' : String(limit);
  };

  const formatTokenLimit = (limit: number | null | undefined): string => {
    if (isUnlimited(limit)) return '∞';
    return `${((limit as number) / 1000).toFixed(0)}k`;
  };

  const getAlertBadgeVariant = (alert: string | undefined): "default" | "secondary" | "destructive" | "outline" => {
    if (alert === 'exceeded') return 'destructive';
    if (alert === 'warning') return 'secondary';
    if (alert === 'unlimited') return 'default';
    return 'outline';
  };

  const getAlertLabel = (alert: string | undefined): string => {
    if (alert === 'exceeded') return 'Limite atingido';
    if (alert === 'warning') return 'Próximo do limite';
    if (alert === 'unlimited') return 'Ilimitado';
    return 'OK';
  };

  const renderUsageBar = (
    label: string, 
    used: number, 
    limit: number | null | undefined, 
    icon?: React.ReactNode,
    formatValue?: (val: number) => string
  ) => {
    const displayUsed = formatValue ? formatValue(used) : used.toString();
    const displayLimit = isUnlimited(limit) ? '∞' : (formatValue ? formatValue(limit as number) : (limit as number).toString());
    const unlimited = isUnlimited(limit);
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium flex items-center gap-1.5">
            {icon}
            {label}
            {unlimited && <Badge variant="outline" className="ml-1 text-xs">∞</Badge>}
          </span>
          <span className="text-muted-foreground">
            {displayUsed} / {displayLimit}
          </span>
        </div>
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div 
            className={`h-full transition-all ${getProgressColor(used, limit)}`}
            style={{ width: `${getProgressWidth(used, limit)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Dashboard Administrativo
          </h1>
          <p className="text-muted-foreground">
            {selectedTenantId === "all" 
              ? "Visão geral da plataforma SeguroPro"
              : `Visão detalhada do tenant selecionado`
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
            <SelectTrigger className="w-[280px]" data-testid="select-tenant-filter">
              <SelectValue placeholder="Selecione uma corretora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-all-tenants">
                Visão Geral (Todos os Tenants)
              </SelectItem>
              {allTenantsUsage?.map((tenant) => (
                <SelectItem key={tenant.tenantId} value={tenant.tenantId} data-testid={`option-tenant-${tenant.tenantId}`}>
                  {tenant.tenantName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedTenantId === "all" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Total de Corretoras</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-total-tenants">
                    {stats?.totalTenants || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Corretoras Ativas</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold text-green-600" data-testid="text-active-tenants">
                    {stats?.activeTenants || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Usuários (Corretores)</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-total-users">
                    {stats?.totalUsers || 0}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">Clientes Portal</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div className="text-2xl font-bold" data-testid="text-total-clientes">
                    {stats?.totalClientes || 0}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumo de Uso da Plataforma
                </CardTitle>
                <CardDescription>Consumo de recursos pelos tenants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingUsage ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : usageSummary ? (
                  <>
                    {renderUsageBar("Usuários Totais", usageSummary.totalUsersUsed, usageSummary.totalUsersLimit)}
                    {renderUsageBar("Clientes Totais", usageSummary.totalClientesUsed, usageSummary.totalClientesLimit)}
                    {renderUsageBar(
                      "Apólices", 
                      usageSummary.totalApoliciesUsed, 
                      usageSummary.totalApoliciesLimit,
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    {renderUsageBar(
                      "Tokens IA (mês)", 
                      usageSummary.totalTokensUsed, 
                      usageSummary.totalTokensLimit,
                      <Bot className="h-3.5 w-3.5" />,
                      (val) => `${(val / 1000).toFixed(1)}k`
                    )}
                    {renderUsageBar(
                      "Conexões WhatsApp", 
                      usageSummary.totalConnectionsUsed, 
                      usageSummary.totalConnectionsLimit,
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t">
                      {usageSummary.tenantsAtLimit > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm">{usageSummary.tenantsAtLimit} no limite</span>
                        </div>
                      )}
                      {usageSummary.tenantsNearLimit > 0 && (
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm">{usageSummary.tenantsNearLimit} próximos</span>
                        </div>
                      )}
                      {usageSummary.tenantsAtLimit === 0 && usageSummary.tenantsNearLimit === 0 && (
                        <span className="text-sm text-muted-foreground">Todos os tenants dentro dos limites</span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Dados não disponíveis</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
                <CardDescription>Tenants por plano de assinatura</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ) : stats?.tenantsByPlan?.length ? (
                  <div className="space-y-3">
                    {stats.tenantsByPlan.map((plan) => (
                      <div key={plan.planName} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{plan.planName}</span>
                        <span className="text-sm text-muted-foreground">{plan.count} tenant(s)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum tenant cadastrado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {usageSummary?.tenantAlerts && usageSummary.tenantAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas de Uso
                </CardTitle>
                <CardDescription>Tenants que precisam de atenção</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {usageSummary.tenantAlerts.map((alert, index) => (
                    <div key={`${alert.tenantId}-${alert.type}-${index}`} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        {alert.severity === 'exceeded' ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{alert.tenantName}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.type === 'usuarios' && 'Usuários'}
                            {alert.type === 'clientes' && 'Clientes'}
                            {alert.type === 'apolices' && 'Apólices'}
                            {alert.type === 'tokens' && 'Tokens IA'}
                            {alert.type === 'conexoes' && 'Conexões'}
                            : {alert.type === 'tokens' ? `${(alert.used / 1000).toFixed(1)}k / ${(alert.limit / 1000).toFixed(0)}k` : `${alert.used} / ${alert.limit}`}
                          </p>
                        </div>
                      </div>
                      <Badge variant={alert.severity === 'exceeded' ? 'destructive' : 'secondary'}>
                        {alert.severity === 'exceeded' ? 'Limite atingido' : 'Próximo do limite'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {isLoadingTenantUsage ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : selectedTenantUsage ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Corretora</CardTitle>
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold truncate" data-testid="text-tenant-name">
                      {selectedTenantUsage.tenantName}
                    </div>
                    <Badge variant={selectedTenantUsage.isActive ? "default" : "secondary"} className="mt-1">
                      {selectedTenantUsage.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Plano</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-tenant-plan">
                      {selectedTenantUsage.planName || "Sem plano"}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-tenant-users">
                      {selectedTenantUsage.usage.usuarios} / {selectedTenantUsage.limits.maxUsuarios}
                    </div>
                    <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.usuarios)} className="mt-1">
                      {getAlertLabel(selectedTenantUsage.alerts.usuarios)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                    <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold" data-testid="text-tenant-clients">
                      {selectedTenantUsage.usage.totalClientes.toLocaleString("pt-BR")} / {selectedTenantUsage.limits.maxClientes.toLocaleString("pt-BR")}
                    </div>
                    <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.clientes)} className="mt-1">
                      {getAlertLabel(selectedTenantUsage.alerts.clientes)}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Uso de Recursos
                    </CardTitle>
                    <CardDescription>Consumo atual do tenant selecionado</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderUsageBar(
                      "Usuários", 
                      selectedTenantUsage.usage.usuarios, 
                      selectedTenantUsage.limits.maxUsuarios,
                      <Users className="h-3.5 w-3.5" />
                    )}
                    {renderUsageBar(
                      "Clientes", 
                      selectedTenantUsage.usage.totalClientes, 
                      selectedTenantUsage.limits.maxClientes,
                      <UserCheck className="h-3.5 w-3.5" />
                    )}
                    {renderUsageBar(
                      "Apólices", 
                      selectedTenantUsage.usage.apolices, 
                      selectedTenantUsage.limits.maxApolices,
                      <FileText className="h-3.5 w-3.5" />
                    )}
                    {renderUsageBar(
                      "Tokens IA (mês)", 
                      selectedTenantUsage.usage.tokensIa, 
                      selectedTenantUsage.limits.maxTokensIa,
                      <Bot className="h-3.5 w-3.5" />,
                      (val) => `${(val / 1000).toFixed(1)}k`
                    )}
                    {renderUsageBar(
                      "Conexões WhatsApp", 
                      selectedTenantUsage.usage.conexoesEvolution, 
                      selectedTenantUsage.limits.maxConexoesEvolution,
                      <MessageSquare className="h-3.5 w-3.5" />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes do Uso</CardTitle>
                    <CardDescription>Informações detalhadas de consumo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Clientes PF</p>
                          <p className="text-lg font-medium">{selectedTenantUsage.usage.clientesPF.toLocaleString("pt-BR")}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Clientes PJ</p>
                          <p className="text-lg font-medium">{selectedTenantUsage.usage.clientesPJ.toLocaleString("pt-BR")}</p>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Status dos Recursos</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">Usuários</span>
                            <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.usuarios)} size="sm">
                              {getAlertLabel(selectedTenantUsage.alerts.usuarios)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">Clientes</span>
                            <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.clientes)} size="sm">
                              {getAlertLabel(selectedTenantUsage.alerts.clientes)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">Apólices</span>
                            <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.apolices)} size="sm">
                              {getAlertLabel(selectedTenantUsage.alerts.apolices)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm">Tokens IA</span>
                            <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.tokensIa)} size="sm">
                              {getAlertLabel(selectedTenantUsage.alerts.tokensIa)}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted/50 rounded col-span-2">
                            <span className="text-sm">Conexões WhatsApp</span>
                            <Badge variant={getAlertBadgeVariant(selectedTenantUsage.alerts.conexoesEvolution)} size="sm">
                              {getAlertLabel(selectedTenantUsage.alerts.conexoesEvolution)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Tenant não encontrado</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
