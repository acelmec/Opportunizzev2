import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCNPJ, formatPhone } from "@/lib/validators";
import { LoadingSpinner } from "@/components/loading-state";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDescription } from "@/components/ui/form";
import {
  Building2,
  Users,
  UserCircle,
  Settings,
  CreditCard,
  Crown,
  Loader2,
  Save,
  Check,
  ArrowUpRight,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Bot,
  MessageSquare,
  TrendingUp,
  Package,
  Key,
  Copy,
} from "lucide-react";

interface TenantInfo {
  tenant: {
    id: string;
    nome: string;
    slug: string;
    cnpj: string | null;
    email: string | null;
    telefone: string | null;
    logoUrl: string | null;
    planId: string | null;
    status: string | null;
    trialEndsAt: string | null;
    subscriptionStartDate: string | null;
  };
  plan: {
    id: string;
    nome: string;
    maxUsuarios: number;
    maxClientes: number;
    maxApolices: number | null;
    maxTokensIa: number | null;
    maxConexoesEvolution: number | null;
    precoMensal: string;
    descricao: string | null;
  } | null;
  stats: {
    totalUsuarios: number;
    totalClientes: number;
    totalApolices: number;
    totalTokensIa: number;
    totalConexoes: number;
    clientesPF: number;
    clientesPJ: number;
    limiteUsuarios: number;
    limiteClientes: number;
    limiteApolices: number | null;
    limiteTokensIa: number | null;
    limiteConexoes: number | null;
  };
  alerts: {
    usuarios: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    clientes: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    apolices: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    tokensIa: 'ok' | 'warning' | 'exceeded' | 'unlimited';
    conexoes: 'ok' | 'warning' | 'exceeded' | 'unlimited';
  };
}

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  createdAt: string | null;
}

interface SubscriptionPlan {
  id: string;
  nome: string;
  descricao: string | null;
  precoMensal: string;
  maxUsuarios: number | null;
  maxClientes: number | null;
  maxApolices: number | null;
  maxTokensIa: number | null;
  maxConexoesEvolution: number | null;
  status: string | null;
}

const tenantFormSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

export default function TenantAdmin() {
  const { toast } = useToast();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjConsultado, setCnpjConsultado] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<{ situacao: string; dataAbertura?: string } | null>(null);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [provisionalPassword, setProvisionalPassword] = useState<string | null>(null);

  const { data: tenantInfo, isLoading: isLoadingTenant } = useQuery<TenantInfo>({
    queryKey: ["/api/tenant/info"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/tenant/users"],
  });

  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/public/planos"],
  });

  const form = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      nome: tenantInfo?.tenant?.nome || "",
      cnpj: tenantInfo?.tenant?.cnpj || "",
      email: tenantInfo?.tenant?.email || "",
      telefone: tenantInfo?.tenant?.telefone || "",
    },
  });

  useEffect(() => {
    if (tenantInfo?.tenant) {
      form.reset({
        nome: tenantInfo.tenant.nome || "",
        cnpj: tenantInfo.tenant.cnpj || "",
        email: tenantInfo.tenant.email || "",
        telefone: tenantInfo.tenant.telefone || "",
      });
    }
  }, [tenantInfo, form]);

  const updateTenantMutation = useMutation({
    mutationFn: async (data: TenantFormData) => {
      const response = await apiRequest("PATCH", "/api/tenant/info", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Dados salvos com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/info"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive",
      });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await apiRequest("PATCH", `/api/tenant/users/${userId}/role`, { role });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Permissão atualizada!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/tenant/change-plan", { planId });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Plano alterado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/info"] });
      setChangePlanOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/tenant/users/${userId}/reset-password`, {});
      return response.json();
    },
    onSuccess: (data) => {
      setProvisionalPassword(data.provisionalPassword);
      toast({ title: "Senha provisória gerada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível gerar a senha provisória",
        variant: "destructive",
      });
      setResetPasswordDialogOpen(false);
    },
  });

  const handleResetPassword = (user: User) => {
    setSelectedUserForReset(user);
    setProvisionalPassword(null);
    setResetPasswordDialogOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Senha copiada!" });
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const fetchCnpj = async () => {
    const cnpj = form.getValues("cnpj");
    const cleanCnpj = cnpj?.replace(/\D/g, "") || "";
    
    if (cleanCnpj.length !== 14) {
      toast({
        title: "CNPJ inválido",
        description: "Digite um CNPJ completo com 14 dígitos",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingCnpj(true);
    setCnpjConsultado(false);
    setCnpjInfo(null);
    
    try {
      const response = await fetch(`/api/enriquecimento/cnpj/${cleanCnpj}`);
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Erro na consulta",
          description: data.message || "Não foi possível consultar o CNPJ",
          variant: "destructive",
        });
        return;
      }

      form.setValue("nome", data.dados.razaoSocial || data.dados.nomeFantasia || "");
      
      if (data.dados.telefone) {
        form.setValue("telefone", data.dados.telefone);
      }
      if (data.dados.email) {
        form.setValue("email", data.dados.email);
      }
      
      setCnpjConsultado(true);
      setCnpjInfo({
        situacao: data.dados.situacao || "Desconhecida",
        dataAbertura: data.dados.dataAbertura,
      });
      
      toast({
        title: "CNPJ consultado!",
        description: `Dados de ${data.dados.razaoSocial || data.dados.nomeFantasia} preenchidos automaticamente`,
      });
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível consultar a Receita Federal",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

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

  const formatTokens = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '0k';
    return `${(val / 1000).toFixed(1)}k`;
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

  if (isLoadingTenant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  if (!tenantInfo) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Informações não disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const { tenant, plan, stats, alerts } = tenantInfo;
  const planPrice = plan?.precoMensal ? parseFloat(plan.precoMensal) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie sua corretora, usuários e plano
          </p>
        </div>
        <Badge variant={tenant.status === "ativo" ? "default" : "secondary"}>
          {tenant.status === "trial" ? "Período de Teste" : tenant.status}
        </Badge>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-background">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{plan?.nome || "Sem plano"}</CardTitle>
                <CardDescription>
                  {plan?.descricao || "Seu plano atual de assinatura"}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <span className="text-3xl font-bold">
                  {planPrice === 0 ? "Grátis" : `R$ ${planPrice.toFixed(2)}`}
                </span>
                {planPrice > 0 && (
                  <span className="text-muted-foreground ml-1">/mês</span>
                )}
              </div>
              <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-upgrade-plan">
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Alterar Plano</DialogTitle>
                    <DialogDescription>
                      Escolha um novo plano para sua corretora. Planos com mais recursos oferecem maior capacidade.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
                    {plans.filter(p => p.status === "ativo").map((p) => {
                      const price = parseFloat(p.precoMensal);
                      const isCurrentPlan = p.id === plan?.id;
                      return (
                        <div
                          key={p.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedPlanId === p.id 
                              ? "ring-2 ring-primary border-primary" 
                              : isCurrentPlan 
                                ? "border-muted bg-muted/30" 
                                : "hover-elevate"
                          }`}
                          onClick={() => !isCurrentPlan && setSelectedPlanId(p.id)}
                          data-testid={`option-plan-${p.id}`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{p.nome}</h4>
                              {isCurrentPlan && (
                                <Badge variant="secondary">Atual</Badge>
                              )}
                            </div>
                            <div>
                              <span className="text-2xl font-bold">
                                {price === 0 ? "Grátis" : `R$ ${price.toFixed(2)}`}
                              </span>
                              {price > 0 && <span className="text-muted-foreground text-sm">/mês</span>}
                            </div>
                            <div className="text-sm text-muted-foreground space-y-1">
                              <p>{p.maxUsuarios} usuários</p>
                              <p>{p.maxClientes?.toLocaleString("pt-BR")} clientes</p>
                              <p>{p.maxApolices === null ? "∞" : p.maxApolices} apólices</p>
                              <p>{p.maxTokensIa === null ? "∞" : `${(p.maxTokensIa / 1000).toFixed(0)}k`} tokens IA/mês</p>
                              <p>{p.maxConexoesEvolution === null ? "∞" : p.maxConexoesEvolution} conexões</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setChangePlanOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => selectedPlanId && changePlanMutation.mutate(selectedPlanId)}
                      disabled={!selectedPlanId || changePlanMutation.isPending}
                      data-testid="button-confirm-change-plan"
                    >
                      {changePlanMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Confirmar Alteração
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Usuários
                </span>
                <Badge variant={getAlertBadgeVariant(alerts?.usuarios || 'ok')}>
                  {getAlertLabel(alerts?.usuarios || 'ok')}
                </Badge>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(stats.totalUsuarios, stats.limiteUsuarios)}`}
                  style={{ width: `${getProgressWidth(stats.totalUsuarios, stats.limiteUsuarios)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.totalUsuarios} / {stats.limiteUsuarios}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <UserCircle className="h-3.5 w-3.5" />
                  Clientes
                </span>
                <Badge variant={getAlertBadgeVariant(alerts?.clientes || 'ok')}>
                  {getAlertLabel(alerts?.clientes || 'ok')}
                </Badge>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(stats.totalClientes, stats.limiteClientes)}`}
                  style={{ width: `${getProgressWidth(stats.totalClientes, stats.limiteClientes)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.totalClientes.toLocaleString("pt-BR")} / {stats.limiteClientes.toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Apólices
                </span>
                <Badge variant={getAlertBadgeVariant(alerts?.apolices || 'ok')}>
                  {getAlertLabel(alerts?.apolices || 'ok')}
                </Badge>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(stats.totalApolices, stats.limiteApolices)}`}
                  style={{ width: `${getProgressWidth(stats.totalApolices, stats.limiteApolices)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.totalApolices} / {formatLimit(stats.limiteApolices)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  Tokens IA
                </span>
                <Badge variant={getAlertBadgeVariant(alerts?.tokensIa || 'ok')}>
                  {getAlertLabel(alerts?.tokensIa || 'ok')}
                </Badge>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(stats.totalTokensIa, stats.limiteTokensIa)}`}
                  style={{ width: `${getProgressWidth(stats.totalTokensIa, stats.limiteTokensIa)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {formatTokens(stats.totalTokensIa)} / {stats.limiteTokensIa === null ? '∞' : formatTokens(stats.limiteTokensIa)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Conexões
                </span>
                <Badge variant={getAlertBadgeVariant(alerts?.conexoes || 'ok')}>
                  {getAlertLabel(alerts?.conexoes || 'ok')}
                </Badge>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div 
                  className={`h-full transition-all ${getProgressColor(stats.totalConexoes, stats.limiteConexoes)}`}
                  style={{ width: `${getProgressWidth(stats.totalConexoes, stats.limiteConexoes)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.totalConexoes} / {formatLimit(stats.limiteConexoes)}
              </p>
            </div>
          </div>

          {tenant.trialEndsAt && tenant.status === "trial" && (
            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Seu período de teste termina em {new Date(tenant.trialEndsAt).toLocaleDateString("pt-BR")}.
                Faça upgrade para continuar usando todos os recursos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info" data-testid="tab-info">
            <Building2 className="h-4 w-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="usage" data-testid="tab-usage">
            <TrendingUp className="h-4 w-4 mr-2" />
            Uso Detalhado
          </TabsTrigger>
          <TabsTrigger value="config" data-testid="tab-config">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Corretora</CardTitle>
              <CardDescription>
                Atualize as informações da sua corretora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => updateTenantMutation.mutate(data))}
                  className="space-y-4 max-w-lg"
                >
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Corretora</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-edit-nome"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="00.000.000/0000-00"
                              maxLength={18}
                              onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                              data-testid="input-edit-cnpj"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={fetchCnpj}
                            disabled={isLoadingCnpj}
                            data-testid="button-consultar-cnpj"
                          >
                            {isLoadingCnpj ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Search className="h-4 w-4 mr-2" />
                                Consultar
                              </>
                            )}
                          </Button>
                        </div>
                        <FormDescription>
                          Digite o CNPJ e clique em Consultar para preencher automaticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {cnpjConsultado && cnpjInfo && (
                    <Alert className={cnpjInfo.situacao.toUpperCase() === "ATIVA" ? "border-green-500" : "border-yellow-500"}>
                      {cnpjInfo.situacao.toUpperCase() === "ATIVA" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                      )}
                      <AlertDescription>
                        <strong>Situação Cadastral:</strong> {cnpjInfo.situacao} | 
                        <strong> Data de Abertura:</strong> {cnpjInfo.dataAbertura ? new Date(cnpjInfo.dataAbertura).toLocaleDateString("pt-BR") : "N/A"}
                      </AlertDescription>
                    </Alert>
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            data-testid="input-edit-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            data-testid="input-edit-telefone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateTenantMutation.isPending}
                    data-testid="button-save-tenant"
                  >
                    {updateTenantMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Usuários da Corretora</CardTitle>
              <CardDescription>
                Gerencie os usuários e suas permissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner className="h-6 w-6" />
                </div>
              ) : users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                          {user.role === "tenant_admin" && (
                            <Crown className="inline h-3 w-3 ml-1 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "tenant_admin" ? "default" : "secondary"}>
                            {user.role === "tenant_admin" ? "Administrador" : "Corretor"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleResetPassword(user)}
                              title="Gerar senha provisória"
                              data-testid={`button-reset-password-${user.id}`}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Select
                              value={user.role || "corretor"}
                              onValueChange={(role) =>
                                updateRoleMutation.mutate({ userId: user.id, role })
                              }
                            >
                              <SelectTrigger className="w-32" data-testid={`select-role-${user.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="corretor">Corretor</SelectItem>
                                <SelectItem value="tenant_admin">Administrador</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialog para gerar senha provisória */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) {
            setProvisionalPassword(null);
            setSelectedUserForReset(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Senha Provisória</DialogTitle>
              <DialogDescription>
                {!provisionalPassword 
                  ? `Gerar uma nova senha para ${selectedUserForReset?.firstName || ""} ${selectedUserForReset?.lastName || ""} (${selectedUserForReset?.email})?`
                  : "A senha provisória foi gerada. Compartilhe com o usuário de forma segura."
                }
              </DialogDescription>
            </DialogHeader>
            
            {provisionalPassword ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                  <span className="font-mono text-lg font-bold flex-1 text-center">
                    {provisionalPassword}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(provisionalPassword)}
                    data-testid="button-copy-password"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    O usuário deverá alterar esta senha no primeiro acesso através das configurações da conta.
                  </AlertDescription>
                </Alert>
              </div>
            ) : null}

            <DialogFooter>
              {!provisionalPassword ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setResetPasswordDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => selectedUserForReset && resetPasswordMutation.mutate(selectedUserForReset.id)}
                    disabled={resetPasswordMutation.isPending}
                    data-testid="button-confirm-reset-password"
                  >
                    {resetPasswordMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Gerar Senha
                  </Button>
                </>
              ) : (
                <Button onClick={() => setResetPasswordDialogOpen(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="usage">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Consumo de Recursos
                </CardTitle>
                <CardDescription>
                  Detalhamento do uso do seu plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Usuários
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalUsuarios} de {stats.limiteUsuarios}
                    </span>
                  </div>
                  <Progress value={(stats.totalUsuarios / stats.limiteUsuarios) * 100} className="h-3" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <UserCircle className="h-4 w-4" />
                      Clientes
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalClientes.toLocaleString("pt-BR")} de {stats.limiteClientes.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Progress value={(stats.totalClientes / stats.limiteClientes) * 100} className="h-3" />
                  <p className="text-xs text-muted-foreground">
                    PF: {stats.clientesPF.toLocaleString("pt-BR")} | PJ: {stats.clientesPJ.toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <FileText className="h-4 w-4" />
                      Apólices
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalApolices} de {formatLimit(stats.limiteApolices)}
                    </span>
                  </div>
                  <Progress 
                    value={stats.limiteApolices ? (stats.totalApolices / stats.limiteApolices) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <Bot className="h-4 w-4" />
                      Tokens IA (mês)
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatTokens(stats.totalTokensIa)} de {stats.limiteTokensIa === null ? '∞' : formatTokens(stats.limiteTokensIa)}
                    </span>
                  </div>
                  <Progress 
                    value={stats.limiteTokensIa ? (stats.totalTokensIa / stats.limiteTokensIa) * 100 : 0} 
                    className="h-3" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-medium">
                      <MessageSquare className="h-4 w-4" />
                      Conexões WhatsApp
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stats.totalConexoes} de {formatLimit(stats.limiteConexoes)}
                    </span>
                  </div>
                  <Progress 
                    value={stats.limiteConexoes ? (stats.totalConexoes / stats.limiteConexoes) * 100 : 0} 
                    className="h-3" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Detalhes do Plano
                </CardTitle>
                <CardDescription>
                  Informações sobre seu plano atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">{plan?.nome || "Sem plano"}</span>
                    <span className="text-2xl font-bold text-primary">
                      {planPrice === 0 ? "Grátis" : `R$ ${planPrice.toFixed(2)}/mês`}
                    </span>
                  </div>
                  {plan?.descricao && (
                    <p className="text-sm text-muted-foreground">{plan.descricao}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Limites do Plano</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Usuários</p>
                      <p className="text-lg font-semibold">{stats.limiteUsuarios}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Clientes</p>
                      <p className="text-lg font-semibold">{stats.limiteClientes.toLocaleString("pt-BR")}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Apólices</p>
                      <p className="text-lg font-semibold">{formatLimit(stats.limiteApolices)}</p>
                    </div>
                    <div className="p-3 rounded-lg border">
                      <p className="text-sm text-muted-foreground">Tokens IA/mês</p>
                      <p className="text-lg font-semibold">
                        {stats.limiteTokensIa === null ? '∞' : formatTokens(stats.limiteTokensIa)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg border col-span-2">
                      <p className="text-sm text-muted-foreground">Conexões WhatsApp</p>
                      <p className="text-lg font-semibold">{formatLimit(stats.limiteConexoes)}</p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={() => setChangePlanOpen(true)}
                  data-testid="button-upgrade-plan-footer"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Fazer Upgrade do Plano
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a href="/admin/config/smtp">
              <Card className="hover-elevate cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">E-mail (SMTP)</CardTitle>
                      <CardDescription>
                        Configure seu servidor de e-mail para enviar comunicações aos clientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </a>

            <a href="/admin/config/evolution">
              <Card className="hover-elevate cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">WhatsApp (Evolution)</CardTitle>
                      <CardDescription>
                        Gerencie suas conexões WhatsApp para comunicação com clientes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="secondary" className="text-xs">
                    {stats.totalConexoes} / {formatLimit(stats.limiteConexoes)} conexões
                  </Badge>
                </CardContent>
              </Card>
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
