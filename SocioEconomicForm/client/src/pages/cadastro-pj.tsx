import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  validateCNPJ,
  formatCNPJ,
  formatPhone,
  formatCEP,
} from "@/lib/validators";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Phone,
  MapPin,
  DollarSign,
  Shield,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  razaoSocial: z.string().min(3, "Razão social deve ter pelo menos 3 caracteres"),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ inválido").refine((v) => validateCNPJ(v.replace(/\D/g, "")), {
    message: "CNPJ inválido",
  }),
  segmentoAtividade: z.string().optional(),
  cnae: z.string().optional(),
  porteEmpresa: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  faturamentoMensal: z.string().optional(),
  numeroFuncionarios: z.string().optional(),
  planoSaudeColetivo: z.boolean().default(false),
  consentimentoLgpd: z.boolean().default(false),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Identificação", icon: Building2 },
  { id: 2, title: "Contato", icon: Phone },
  { id: 3, title: "Endereço", icon: MapPin },
  { id: 4, title: "Finanças", icon: DollarSign },
  { id: 5, title: "Consentimento", icon: Shield },
];

export default function CadastroPJ() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjConsultado, setCnpjConsultado] = useState<boolean>(false);
  const [cnpjInfo, setCnpjInfo] = useState<{ situacao: string; dataAbertura: string } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      razaoSocial: "",
      nomeFantasia: "",
      cnpj: "",
      segmentoAtividade: "",
      cnae: "",
      porteEmpresa: "",
      telefone: "",
      email: "",
      website: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      faturamentoMensal: "",
      numeroFuncionarios: "",
      planoSaudeColetivo: false,
      consentimentoLgpd: false,
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        razaoSocial: data.razaoSocial,
        nomeFantasia: data.nomeFantasia || null,
        cnpj: data.cnpj.replace(/\D/g, ""),
        segmentoAtividade: data.segmentoAtividade || null,
        cnae: data.cnae || null,
        porteEmpresa: data.porteEmpresa || null,
        telefone: data.telefone || null,
        email: data.email || null,
        website: data.website || null,
        faturamentoMensal: data.faturamentoMensal ? data.faturamentoMensal.replace(/\D/g, "") : null,
        numeroFuncionarios: data.numeroFuncionarios ? parseInt(data.numeroFuncionarios) : 0,
        planoSaudeColetivo: data.planoSaudeColetivo,
        consentimentoLgpd: data.consentimentoLgpd,
        consentimentoTimestamp: data.consentimentoLgpd ? new Date().toISOString() : null,
        observacoes: data.observacoes || null,
        endereco: data.cep ? {
          tipo: "comercial",
          cep: data.cep.replace(/\D/g, ""),
          logradouro: data.logradouro || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
        } : null,
      };
      return await apiRequest("POST", "/api/pessoas-juridicas", payload);
    },
    onSuccess: () => {
      toast({ title: "Empresa cadastrada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-juridicas"] });
      navigate("/clientes/pj");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        form.setValue("logradouro", data.logradouro || "");
        form.setValue("bairro", data.bairro || "");
        form.setValue("cidade", data.localidade || "");
        form.setValue("estado", data.uf || "");
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const fetchCnpj = async () => {
    const cnpj = form.getValues("cnpj");
    const cleanCnpj = cnpj.replace(/\D/g, "");
    
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

      form.setValue("razaoSocial", data.dados.razaoSocial || "");
      form.setValue("nomeFantasia", data.dados.nomeFantasia || "");
      form.setValue("segmentoAtividade", data.dados.cnaeFiscalDescricao || "");
      form.setValue("cnae", String(data.dados.cnaeFiscal) || "");
      
      if (data.pessoaJuridica.porteEmpresa) {
        form.setValue("porteEmpresa", data.pessoaJuridica.porteEmpresa);
      }
      
      if (data.dados.telefone) {
        form.setValue("telefone", data.dados.telefone);
      }
      if (data.dados.email) {
        form.setValue("email", data.dados.email);
      }
      
      if (data.endereco.cep) {
        form.setValue("cep", formatCEP(data.endereco.cep));
        form.setValue("logradouro", data.endereco.logradouro || "");
        form.setValue("numero", data.endereco.numero || "");
        form.setValue("complemento", data.endereco.complemento || "");
        form.setValue("bairro", data.endereco.bairro || "");
        form.setValue("cidade", data.endereco.cidade || "");
        form.setValue("estado", data.endereco.estado || "");
      }

      setCnpjConsultado(true);
      setCnpjInfo({
        situacao: data.dados.situacaoCadastral || "",
        dataAbertura: data.dados.dataInicioAtividade || "",
      });

      toast({
        title: "Dados carregados!",
        description: `Empresa: ${data.dados.razaoSocial}`,
      });
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      toast({
        title: "Erro de conexão",
        description: "Não foi possível consultar a Receita Federal",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1:
        return ["razaoSocial", "nomeFantasia", "cnpj", "segmentoAtividade", "cnae", "porteEmpresa"];
      case 2:
        return ["telefone", "email", "website"];
      case 3:
        return ["cep", "logradouro", "numero", "bairro", "cidade", "estado"];
      case 4:
        return ["faturamentoMensal", "numeroFuncionarios", "planoSaudeColetivo"];
      case 5:
        return ["consentimentoLgpd", "observacoes"];
      default:
        return [];
    }
  };

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/clientes/pj")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nova Empresa PJ</h1>
          <p className="text-muted-foreground">Preencha os dados da empresa</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span>Etapa {currentStep} de {steps.length}</span>
          <span className="text-muted-foreground">{steps[currentStep - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? "text-primary" : isCompleted ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isActive
                      ? "border-primary bg-primary/10"
                      : isCompleted
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-muted"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="text-xs hidden md:block">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{steps[currentStep - 1].title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="00.000.000/0000-00"
                              maxLength={18}
                              onChange={(e) => {
                                field.onChange(formatCNPJ(e.target.value));
                                setCnpjConsultado(false);
                                setCnpjInfo(null);
                              }}
                              data-testid="input-cnpj"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="razaoSocial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Razão social da empresa" data-testid="input-razao" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nomeFantasia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nome fantasia" data-testid="input-fantasia" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cnae"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNAE</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="0000-0/00" data-testid="input-cnae" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="segmentoAtividade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segmento de Atividade</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Comércio, Indústria..." data-testid="input-segmento" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="porteEmpresa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porte da Empresa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-porte">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="micro">Microempresa (ME)</SelectItem>
                            <SelectItem value="pequeno">Pequena Empresa (EPP)</SelectItem>
                            <SelectItem value="medio">Média Empresa</SelectItem>
                            <SelectItem value="grande">Grande Empresa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(00) 0000-0000"
                            maxLength={15}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            data-testid="input-telefone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            placeholder="contato@empresa.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://www.empresa.com.br"
                            data-testid="input-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 3 && (
                <>
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder="00000-000"
                              maxLength={9}
                              onChange={(e) => {
                                const formatted = formatCEP(e.target.value);
                                field.onChange(formatted);
                                if (formatted.replace(/\D/g, "").length === 8) {
                                  fetchCep(formatted);
                                }
                              }}
                              data-testid="input-cep"
                            />
                            {isLoadingCep && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                            )}
                          </div>
                        </FormControl>
                        <FormDescription>Digite o CEP para autocompletar</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="logradouro"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Rua, Avenida..." data-testid="input-logradouro" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nº" data-testid="input-numero" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="complemento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Sala, Andar..." data-testid="input-complemento" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bairro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Bairro" data-testid="input-bairro" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Cidade" data-testid="input-cidade" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="UF" maxLength={2} data-testid="input-estado" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {currentStep === 4 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="faturamentoMensal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faturamento Mensal</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-faturamento"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="numeroFuncionarios"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número de Funcionários</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              placeholder="0"
                              data-testid="input-funcionarios"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="planoSaudeColetivo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-saude"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Interesse em Plano de Saúde Coletivo</FormLabel>
                          <FormDescription>
                            A empresa tem interesse em contratar plano de saúde coletivo
                            para seus funcionários?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 5 && (
                <>
                  <FormField
                    control={form.control}
                    name="consentimentoLgpd"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-lgpd"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Consentimento LGPD *</FormLabel>
                          <FormDescription>
                            Autorizo o tratamento dos dados da empresa para fins de análise
                            de perfil, envio de cotações de seguros e contato comercial,
                            conforme a Lei Geral de Proteção de Dados (LGPD).
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Informações adicionais sobre a empresa..."
                            rows={4}
                            data-testid="input-observacoes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              data-testid="button-prev"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
            {currentStep < steps.length ? (
              <Button type="button" onClick={nextStep} data-testid="button-next">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={createMutation.isPending || !form.getValues("consentimentoLgpd")}
                data-testid="button-submit"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Cadastrar Empresa
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
