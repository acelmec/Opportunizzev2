import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, UserPlus, Search, AlertTriangle, AlertCircle, FileText, Bot, MessageSquare } from "lucide-react";
import type { Tenant, SubscriptionPlan } from "@shared/schema";

type AlertLevel = 'ok' | 'warning' | 'exceeded' | 'unlimited';

interface TenantUsage {
  tenantId: string;
  tenantName: string;
  planName: string | null;
  isActive: boolean;
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
    apolices: number;
    tokensIa: number;
    conexoesEvolution: number;
  };
  alerts: { 
    usuarios: AlertLevel; 
    clientes: AlertLevel;
    apolices: AlertLevel;
    tokensIa: AlertLevel;
    conexoesEvolution: AlertLevel;
  };
}

export default function AdminTenants() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: tenantsUsage, isLoading } = useQuery<TenantUsage[]>({
    queryKey: ["/api/admin/tenants-usage"],
  });

  const { data: plans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/planos"],
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/tenants/${id}/toggle-active`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants-usage"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tenants"] });
      toast({
        title: "Status atualizado",
        description: "O status do tenant foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    },
  });

  const filteredTenants = tenantsUsage?.filter((tenant) =>
    tenant.tenantName.toLowerCase().includes(search.toLowerCase())
  );

  const getAlertIcon = (alert: AlertLevel) => {
    if (alert === 'exceeded') {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (alert === 'warning') {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return null;
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return "bg-destructive";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Corretoras (Tenants)
        </h1>
        <p className="text-muted-foreground">
          Gerencie as corretoras e visualize o uso de recursos contratados
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tenant"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTenants?.length ? (
        <div className="space-y-4">
          {filteredTenants.map((tenant) => (
            <Card key={tenant.tenantId} data-testid={`card-tenant-${tenant.tenantId}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">{tenant.tenantName}</CardTitle>
                    {!tenant.isActive && <Badge variant="destructive">Bloqueado</Badge>}
                    {tenant.isActive && <Badge variant="default">Ativo</Badge>}
                  </div>
                  <CardDescription>
                    Plano: {tenant.planName || "Sem plano"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Ativo</span>
                  <Switch
                    checked={tenant.isActive}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: tenant.tenantId, isActive: checked })
                    }
                    data-testid={`switch-tenant-active-${tenant.tenantId}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Usuários</span>
                        {getAlertIcon(tenant.alerts.usuarios)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tenant.usage.usuarios} / {tenant.limits.maxUsuarios}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full transition-all ${getProgressColor(tenant.percentages.usuarios)}`}
                        style={{ width: `${Math.min(tenant.percentages.usuarios, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.percentages.usuarios}% utilizado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Clientes</span>
                        {getAlertIcon(tenant.alerts.clientes)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tenant.usage.totalClientes} / {tenant.limits.maxClientes}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full transition-all ${getProgressColor(tenant.percentages.clientes)}`}
                        style={{ width: `${Math.min(tenant.percentages.clientes, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.percentages.clientes}% utilizado ({tenant.usage.clientesPF} PF + {tenant.usage.clientesPJ} PJ)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Apólices</span>
                        {getAlertIcon(tenant.alerts.apolices)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tenant.usage.apolices} / {tenant.limits.maxApolices !== null ? tenant.limits.maxApolices : '∞'}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full transition-all ${tenant.alerts.apolices === 'unlimited' ? 'bg-muted' : getProgressColor(tenant.percentages.apolices)}`}
                        style={{ width: `${tenant.alerts.apolices === 'unlimited' ? 0 : Math.min(tenant.percentages.apolices, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.alerts.apolices === 'unlimited' ? 'Ilimitado' : `${tenant.percentages.apolices}% utilizado`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Tokens IA (mês)</span>
                        {getAlertIcon(tenant.alerts.tokensIa)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(tenant.usage.tokensIa / 1000).toFixed(1)}k / {tenant.limits.maxTokensIa !== null ? `${(tenant.limits.maxTokensIa / 1000).toFixed(0)}k` : '∞'}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full transition-all ${tenant.alerts.tokensIa === 'unlimited' ? 'bg-muted' : getProgressColor(tenant.percentages.tokensIa)}`}
                        style={{ width: `${tenant.alerts.tokensIa === 'unlimited' ? 0 : Math.min(tenant.percentages.tokensIa, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.alerts.tokensIa === 'unlimited' ? 'Ilimitado' : `${tenant.percentages.tokensIa}% utilizado`}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Conexões WhatsApp</span>
                        {getAlertIcon(tenant.alerts.conexoesEvolution)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {tenant.usage.conexoesEvolution} / {tenant.limits.maxConexoesEvolution !== null ? tenant.limits.maxConexoesEvolution : '∞'}
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div 
                        className={`h-full transition-all ${tenant.alerts.conexoesEvolution === 'unlimited' ? 'bg-muted' : getProgressColor(tenant.percentages.conexoesEvolution)}`}
                        style={{ width: `${tenant.alerts.conexoesEvolution === 'unlimited' ? 0 : Math.min(tenant.percentages.conexoesEvolution, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {tenant.alerts.conexoesEvolution === 'unlimited' ? 'Ilimitado' : `${tenant.percentages.conexoesEvolution}% utilizado`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma corretora encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
