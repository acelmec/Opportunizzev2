import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingSpinner } from "@/components/loading-state";
import { CreditCard, Users, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionPlan {
  id: string;
  nome: string;
  descricao: string | null;
  precoMensal: string;
  precoAnual: string | null;
  maxUsuarios: number;
  maxClientes: number;
  maxOportunidades: number;
  maxApolices: number;
  maxTokensIa: number;
  maxConexoesEvolution: number;
  acessoWhatsapp: boolean;
  acessoEmail: boolean;
  acessoRelatorios: boolean;
  acessoApi: boolean;
  status: string;
}

interface TenantPlan {
  planId: string | null;
  status: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
}

export default function PlanosAssinatura() {
  const { user } = useAuth();

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const { data: tenantPlan, isLoading: isLoadingTenant } = useQuery<TenantPlan>({
    queryKey: ["/api/tenant/subscription"],
  });

  if (isLoadingPlans || isLoadingTenant) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const currentPlan = tenantPlan?.planId ? plans.find(p => p.id === tenantPlan.planId) : null;
  const isActive = tenantPlan?.status === "ativo" || tenantPlan?.status === "trial";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Planos de Assinatura
        </h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e limites de uso
        </p>
      </div>

      {/* Status Atual */}
      {currentPlan && (
        <Card className={isActive ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {isActive ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Plano Ativo
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      Plano Inativo
                    </>
                  )}
                </CardTitle>
                <CardDescription>{currentPlan.nome}</CardDescription>
              </div>
              <Badge variant={isActive ? "default" : "destructive"}>
                {tenantPlan?.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Limite de Clientes</p>
              <p className="text-2xl font-bold">{currentPlan.maxClientes}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conexões WhatsApp</p>
              <p className="text-2xl font-bold">{currentPlan.maxConexoesEvolution}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuários</p>
              <p className="text-2xl font-bold">{currentPlan.maxUsuarios}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Todos os Planos */}
      <Card>
        <CardHeader>
          <CardTitle>Planos Disponíveis</CardTitle>
          <CardDescription>
            Consulte os limites e recursos de cada plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Users className="h-4 w-4" />
                      Clientes
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <MessageSquare className="h-4 w-4" />
                      WhatsApp
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Usuários</TableHead>
                  <TableHead className="text-right">Oportunidades</TableHead>
                  <TableHead>Recursos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => {
                  const isCurrent = plan.id === currentPlan?.id;
                  return (
                    <TableRow key={plan.id} className={isCurrent ? "bg-primary/5" : ""}>
                      <TableCell className="font-medium">
                        <div>
                          {plan.nome}
                          {isCurrent && <Badge className="ml-2" variant="secondary">Ativo</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <p className="font-semibold">R$ {parseFloat(plan.precoMensal).toLocaleString("pt-BR")}/mês</p>
                          {plan.precoAnual && <p className="text-xs text-muted-foreground">R$ {parseFloat(plan.precoAnual).toLocaleString("pt-BR")}/ano</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{plan.maxClientes}</TableCell>
                      <TableCell className="text-right font-semibold">{plan.maxConexoesEvolution}</TableCell>
                      <TableCell className="text-right">{plan.maxUsuarios}</TableCell>
                      <TableCell className="text-right">{plan.maxOportunidades}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.acessoWhatsapp && <Badge variant="outline" className="text-xs">WhatsApp</Badge>}
                          {plan.acessoEmail && <Badge variant="outline" className="text-xs">Email</Badge>}
                          {plan.acessoRelatorios && <Badge variant="outline" className="text-xs">Relatórios</Badge>}
                          {plan.acessoApi && <Badge variant="outline" className="text-xs">API</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Limite Gratuito */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Plano Gratuito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>O plano gratuito inclui:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Até <strong>500 clientes</strong> (Pessoas Físicas e Jurídicas)</li>
            <li><strong>1 conexão WhatsApp</strong> gratuita</li>
            <li>Acesso a email para invites</li>
            <li>Gestão de Clientes e Oportunidades</li>
            <li>Limite de 30 dias em modo trial</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
