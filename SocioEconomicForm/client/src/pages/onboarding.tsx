import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCNPJ, formatPhone } from "@/lib/validators";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormDescription } from "@/components/ui/form";
import {
  Building2,
  Check,
  Users,
  UserCircle,
  Loader2,
  ArrowRight,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  nome: string;
  descricao: string | null;
  precoMensal: string;
  precoAnual: string | null;
  maxUsuarios: number | null;
  maxClientes: number | null;
  maxOportunidades: number | null;
  acessoWhatsapp: boolean | null;
  acessoEmail: boolean | null;
  acessoRelatorios: boolean | null;
  acessoApi: boolean | null;
  status: string | null;
}

const formSchema = z.object({
  nome: z.string().min(3, "Nome da corretora deve ter pelo menos 3 caracteres"),
  cnpj: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Onboarding() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [step, setStep] = useState<"plan" | "info">("plan");
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjConsultado, setCnpjConsultado] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<{ situacao: string; dataAbertura?: string } | null>(null);

  const { data: plans = [], isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/public/planos"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      email: "",
      telefone: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: FormData & { planId: string | null }) => {
      const response = await fetch("/api/tenant/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Erro ao criar corretora");
      }
      return result;
    },
    onSuccess: (data) => {
      toast({
        title: "Corretora criada!",
        description: "Sua corretora foi configurada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar corretora",
        description: error.message || "Não foi possível criar a corretora",
        variant: "destructive",
      });
    },
  });

  const handlePlanSelect = (planId: string | null) => {
    setSelectedPlan(planId);
    setStep("info");
  };

  const handleSubmit = (data: FormData) => {
    signupMutation.mutate({ ...data, planId: selectedPlan });
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

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (num === 0) return "Grátis";
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Bem-vindo ao SeguroPro
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {step === "plan"
              ? "Escolha o plano ideal para sua corretora de seguros"
              : "Complete as informações da sua corretora"}
          </p>
        </div>

        {step === "plan" && (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`relative cursor-pointer transition-all hover-elevate ${
                    selectedPlan === plan.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {plan.maxUsuarios === 10 && (
                    <Badge
                      className="absolute -top-2 left-1/2 -translate-x-1/2"
                      variant="default"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Mais popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.nome}</CardTitle>
                    <CardDescription>{plan.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="text-3xl font-bold mb-4">
                      {formatPrice(plan.precoMensal)}
                      {parseFloat(plan.precoMensal) > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                          /mês
                        </span>
                      )}
                    </div>
                    <ul className="space-y-3 text-sm text-left">
                      <li className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                          {plan.maxUsuarios === 1
                            ? "1 usuário"
                            : `Até ${plan.maxUsuarios} usuários`}
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4 text-primary" />
                        <span>
                          Até {plan.maxClientes?.toLocaleString("pt-BR")} clientes
                        </span>
                      </li>
                      {plan.acessoWhatsapp && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Integração WhatsApp</span>
                        </li>
                      )}
                      {plan.acessoEmail && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Envio de e-mails</span>
                        </li>
                      )}
                      {plan.acessoRelatorios && (
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>Relatórios avançados</span>
                        </li>
                      )}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={selectedPlan === plan.id ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlanSelect(plan.id);
                      }}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      {selectedPlan === plan.id ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Selecionado
                        </>
                      ) : (
                        "Selecionar"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {plans.length === 0 && (
              <Card className="text-center py-10">
                <CardContent>
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Nenhum plano disponível no momento.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => handlePlanSelect(null)}
                    data-testid="button-continue-no-plan"
                  >
                    Continuar sem plano
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {step === "info" && (
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Corretora
              </CardTitle>
              <CardDescription>
                Preencha os dados básicos para configurar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Corretora *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ex: Corretora XYZ Seguros"
                            data-testid="input-nome-corretora"
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
                              onChange={(e) =>
                                field.onChange(formatCNPJ(e.target.value))
                              }
                              data-testid="input-cnpj-corretora"
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={fetchCnpj}
                            disabled={isLoadingCnpj}
                            data-testid="button-consultar-cnpj-onboarding"
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
                            placeholder="contato@corretora.com.br"
                            data-testid="input-email-corretora"
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
                            onChange={(e) =>
                              field.onChange(formatPhone(e.target.value))
                            }
                            data-testid="input-telefone-corretora"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep("plan")}
                      className="flex-1"
                      data-testid="button-back-plans"
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={signupMutation.isPending}
                      data-testid="button-create-corretora"
                    >
                      {signupMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      Criar Corretora
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
