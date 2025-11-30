import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
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
  validateCPF,
  formatCPF,
  formatPhone,
  formatCEP,
} from "@/lib/validators";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Shield,
  Loader2,
} from "lucide-react";

const formSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido").refine((v) => validateCPF(v.replace(/\D/g, "")), {
    message: "CPF inválido",
  }),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  estadoCivil: z.string().optional(),
  telefone: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  preferenciaContato: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  profissao: z.string().optional(),
  empresaEmprego: z.string().optional(),
  ocupacaoRisco: z.string().optional(),
  rendaMensalBruta: z.string().optional(),
  rendaMensalLiquida: z.string().optional(),
  gastosMensais: z.string().optional(),
  economias: z.string().optional(),
  consentimentoLgpd: z.boolean().default(false),
  consentimentoEscopo: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const steps = [
  { id: 1, title: "Identificação", icon: User },
  { id: 2, title: "Contato", icon: Phone },
  { id: 3, title: "Endereço", icon: MapPin },
  { id: 4, title: "Profissão", icon: Briefcase },
  { id: 5, title: "Finanças", icon: DollarSign },
  { id: 6, title: "Dependentes", icon: User },
  { id: 7, title: "Consentimento", icon: Shield },
];

interface Dependente {
  id?: string;
  nome: string;
  tipoRelacao: string;
  dataNascimento: string;
}

export default function CadastroPF() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [dependentes, setDependentes] = useState<Dependente[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: "",
      cpf: "",
      dataNascimento: "",
      sexo: "",
      estadoCivil: "",
      telefone: "",
      celular: "",
      email: "",
      preferenciaContato: "",
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      profissao: "",
      empresaEmprego: "",
      ocupacaoRisco: "",
      rendaMensalBruta: "",
      rendaMensalLiquida: "",
      gastosMensais: "",
      economias: "",
      consentimentoLgpd: false,
      consentimentoEscopo: "",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        nomeCompleto: data.nomeCompleto,
        cpf: data.cpf.replace(/\D/g, ""),
        dataNascimento: data.dataNascimento || null,
        sexo: data.sexo || null,
        estadoCivil: data.estadoCivil || null,
        telefone: data.telefone || null,
        celular: data.celular || null,
        email: data.email || null,
        preferenciaContato: data.preferenciaContato || null,
        profissao: data.profissao || null,
        empresaEmprego: data.empresaEmprego || null,
        ocupacaoRisco: data.ocupacaoRisco || null,
        rendaMensalBruta: data.rendaMensalBruta ? data.rendaMensalBruta.replace(/\D/g, "") : null,
        rendaMensalLiquida: data.rendaMensalLiquida ? data.rendaMensalLiquida.replace(/\D/g, "") : null,
        gastosMensais: data.gastosMensais ? data.gastosMensais.replace(/\D/g, "") : null,
        economias: data.economias ? data.economias.replace(/\D/g, "") : null,
        consentimentoLgpd: data.consentimentoLgpd,
        consentimentoEscopo: data.consentimentoEscopo || null,
        consentimentoTimestamp: data.consentimentoLgpd ? new Date().toISOString() : null,
        observacoes: data.observacoes || null,
        dependentes: dependentes,
        endereco: data.cep ? {
          tipo: "residencial",
          cep: data.cep.replace(/\D/g, ""),
          logradouro: data.logradouro || null,
          numero: data.numero || null,
          complemento: data.complemento || null,
          bairro: data.bairro || null,
          cidade: data.cidade || null,
          estado: data.estado || null,
        } : null,
      };
      return await apiRequest("POST", "/api/pessoas-fisicas", payload);
    },
    onSuccess: () => {
      toast({ title: "Cliente cadastrado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-fisicas"] });
      navigate("/clientes/pf");
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
        return ["nomeCompleto", "cpf", "dataNascimento", "sexo", "estadoCivil"];
      case 2:
        return ["telefone", "celular", "email", "preferenciaContato"];
      case 3:
        return ["cep", "logradouro", "numero", "bairro", "cidade", "estado"];
      case 4:
        return ["profissao", "empresaEmprego", "ocupacaoRisco"];
      case 5:
        return ["rendaMensalBruta", "rendaMensalLiquida", "gastosMensais", "economias"];
      case 6:
        return [];
      case 7:
        return ["consentimentoLgpd", "consentimentoEscopo", "observacoes"];
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
          onClick={() => navigate("/clientes/pf")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Novo Cliente PF</h1>
          <p className="text-muted-foreground">Preencha os dados do cliente</p>
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
                    name="nomeCompleto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome completo" data-testid="input-nome" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="000.000.000-00"
                              maxLength={14}
                              onChange={(e) => field.onChange(formatCPF(e.target.value))}
                              data-testid="input-cpf"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dataNascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-nascimento" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sexo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sexo</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-sexo">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">Masculino</SelectItem>
                              <SelectItem value="F">Feminino</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="estadoCivil"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado Civil</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-estado-civil">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                              <SelectItem value="casado">Casado(a)</SelectItem>
                              <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                              <SelectItem value="uniao_estavel">União Estável</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      name="celular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Celular</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="(00) 00000-0000"
                              maxLength={15}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                              data-testid="input-celular"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                            placeholder="email@exemplo.com"
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferenciaContato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferência de Contato</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-preferencia">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                            <SelectItem value="email">E-mail</SelectItem>
                            <SelectItem value="telefone">Telefone</SelectItem>
                          </SelectContent>
                        </Select>
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
                            <Input {...field} placeholder="Apto, Bloco..." data-testid="input-complemento" />
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
                  <FormField
                    control={form.control}
                    name="profissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profissão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-profissao">
                              <SelectValue placeholder="Selecione a profissão" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="acougueiro">Açougueiro(a)</SelectItem>
                            <SelectItem value="acompanhante_idosos">Acompanhante de Idosos</SelectItem>
                            <SelectItem value="acupunturista">Acupunturista</SelectItem>
                            <SelectItem value="administrador">Administrador(a)</SelectItem>
                            <SelectItem value="advogado">Advogado(a)</SelectItem>
                            <SelectItem value="agente_saude">Agente de Saúde</SelectItem>
                            <SelectItem value="agente_transito">Agente de Trânsito</SelectItem>
                            <SelectItem value="agricultor">Agricultor(a)</SelectItem>
                            <SelectItem value="agronomo">Agrônomo(a)</SelectItem>
                            <SelectItem value="alfaiate">Alfaiate</SelectItem>
                            <SelectItem value="almoxarife">Almoxarife</SelectItem>
                            <SelectItem value="analista_sistemas">Analista de Sistemas</SelectItem>
                            <SelectItem value="aposentado">Aposentado(a)</SelectItem>
                            <SelectItem value="arquiteto">Arquiteto(a)</SelectItem>
                            <SelectItem value="artesao">Artesão/Artesã</SelectItem>
                            <SelectItem value="artista">Artista</SelectItem>
                            <SelectItem value="ascensorista">Ascensorista</SelectItem>
                            <SelectItem value="assessor_imprensa">Assessor(a) de Imprensa</SelectItem>
                            <SelectItem value="assistente_administrativo">Assistente Administrativo</SelectItem>
                            <SelectItem value="assistente_social">Assistente Social</SelectItem>
                            <SelectItem value="atleta">Atleta</SelectItem>
                            <SelectItem value="ator_atriz">Ator/Atriz</SelectItem>
                            <SelectItem value="auditor">Auditor(a)</SelectItem>
                            <SelectItem value="autonomo">Autônomo(a)</SelectItem>
                            <SelectItem value="auxiliar_cozinha">Auxiliar de Cozinha</SelectItem>
                            <SelectItem value="auxiliar_escritorio">Auxiliar de Escritório</SelectItem>
                            <SelectItem value="auxiliar_limpeza">Auxiliar de Limpeza</SelectItem>
                            <SelectItem value="auxiliar_producao">Auxiliar de Produção</SelectItem>
                            <SelectItem value="babysitter">Babá</SelectItem>
                            <SelectItem value="balconista">Balconista</SelectItem>
                            <SelectItem value="bancario">Bancário(a)</SelectItem>
                            <SelectItem value="barbeiro">Barbeiro</SelectItem>
                            <SelectItem value="bibliotecario">Bibliotecário(a)</SelectItem>
                            <SelectItem value="biologo">Biólogo(a)</SelectItem>
                            <SelectItem value="biomedico">Biomédico(a)</SelectItem>
                            <SelectItem value="bombeiro">Bombeiro(a)</SelectItem>
                            <SelectItem value="borracheiro">Borracheiro(a)</SelectItem>
                            <SelectItem value="cabeleireiro">Cabeleireiro(a)</SelectItem>
                            <SelectItem value="cabista">Cabista</SelectItem>
                            <SelectItem value="caixa">Caixa</SelectItem>
                            <SelectItem value="camareiro">Camareira/Camareiro</SelectItem>
                            <SelectItem value="caminhoneiro">Caminhoneiro(a)</SelectItem>
                            <SelectItem value="cantor">Cantor(a)</SelectItem>
                            <SelectItem value="carpinteiro">Carpinteiro(a)</SelectItem>
                            <SelectItem value="carteiro">Carteiro(a)</SelectItem>
                            <SelectItem value="chaveiro">Chaveiro(a)</SelectItem>
                            <SelectItem value="chef_cozinha">Chef de Cozinha</SelectItem>
                            <SelectItem value="churrasqueiro">Churrasqueiro(a)</SelectItem>
                            <SelectItem value="cientista">Cientista</SelectItem>
                            <SelectItem value="coach">Coach</SelectItem>
                            <SelectItem value="cobrador">Cobrador(a)</SelectItem>
                            <SelectItem value="comerciante">Comerciante</SelectItem>
                            <SelectItem value="comissario_bordo">Comissário(a) de Bordo</SelectItem>
                            <SelectItem value="confeiteiro">Confeiteiro(a)</SelectItem>
                            <SelectItem value="consultor">Consultor(a)</SelectItem>
                            <SelectItem value="contador">Contador(a)</SelectItem>
                            <SelectItem value="contramestre">Contramestre</SelectItem>
                            <SelectItem value="copeiro">Copeiro(a)</SelectItem>
                            <SelectItem value="corretor_imoveis">Corretor(a) de Imóveis</SelectItem>
                            <SelectItem value="corretor_seguros">Corretor(a) de Seguros</SelectItem>
                            <SelectItem value="costureira">Costureira/Costureiro</SelectItem>
                            <SelectItem value="cozinheiro">Cozinheiro(a)</SelectItem>
                            <SelectItem value="cuidador">Cuidador(a)</SelectItem>
                            <SelectItem value="delegado">Delegado(a)</SelectItem>
                            <SelectItem value="dentista">Dentista</SelectItem>
                            <SelectItem value="desempregado">Desempregado(a)</SelectItem>
                            <SelectItem value="designer">Designer</SelectItem>
                            <SelectItem value="designer_interiores">Designer de Interiores</SelectItem>
                            <SelectItem value="despachante">Despachante</SelectItem>
                            <SelectItem value="diarista">Diarista</SelectItem>
                            <SelectItem value="digitador">Digitador(a)</SelectItem>
                            <SelectItem value="diretor">Diretor(a)</SelectItem>
                            <SelectItem value="do_lar">Do Lar</SelectItem>
                            <SelectItem value="domestica">Empregado(a) Doméstico(a)</SelectItem>
                            <SelectItem value="economista">Economista</SelectItem>
                            <SelectItem value="eletricista">Eletricista</SelectItem>
                            <SelectItem value="eletrotecnico">Eletrotécnico(a)</SelectItem>
                            <SelectItem value="embalador">Embalador(a)</SelectItem>
                            <SelectItem value="empresario">Empresário(a)</SelectItem>
                            <SelectItem value="encanador">Encanador(a)</SelectItem>
                            <SelectItem value="enfermeiro">Enfermeiro(a)</SelectItem>
                            <SelectItem value="engenheiro">Engenheiro(a)</SelectItem>
                            <SelectItem value="engenheiro_civil">Engenheiro(a) Civil</SelectItem>
                            <SelectItem value="engenheiro_eletrico">Engenheiro(a) Elétrico</SelectItem>
                            <SelectItem value="engenheiro_mecanico">Engenheiro(a) Mecânico</SelectItem>
                            <SelectItem value="engenheiro_producao">Engenheiro(a) de Produção</SelectItem>
                            <SelectItem value="engenheiro_software">Engenheiro(a) de Software</SelectItem>
                            <SelectItem value="entregador">Entregador(a)</SelectItem>
                            <SelectItem value="enxovalhista">Enxovalhista</SelectItem>
                            <SelectItem value="estagiario">Estagiário(a)</SelectItem>
                            <SelectItem value="esteticista">Esteticista</SelectItem>
                            <SelectItem value="estilista">Estilista</SelectItem>
                            <SelectItem value="estivador">Estivador(a)</SelectItem>
                            <SelectItem value="estudante">Estudante</SelectItem>
                            <SelectItem value="farmaceutico">Farmacêutico(a)</SelectItem>
                            <SelectItem value="faxineiro">Faxineiro(a)</SelectItem>
                            <SelectItem value="ferramenteiro">Ferramenteiro(a)</SelectItem>
                            <SelectItem value="ferreiro">Ferreiro(a)</SelectItem>
                            <SelectItem value="fisco">Fiscal (Fisco)</SelectItem>
                            <SelectItem value="fiscal">Fiscal</SelectItem>
                            <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                            <SelectItem value="florista">Florista</SelectItem>
                            <SelectItem value="fonoaudiologo">Fonoaudiólogo(a)</SelectItem>
                            <SelectItem value="fotografo">Fotógrafo(a)</SelectItem>
                            <SelectItem value="freelancer">Freelancer</SelectItem>
                            <SelectItem value="fresador">Fresador(a)</SelectItem>
                            <SelectItem value="fretista">Fretista</SelectItem>
                            <SelectItem value="funcionario_publico">Funcionário(a) Público(a)</SelectItem>
                            <SelectItem value="funileiro">Funileiro(a)</SelectItem>
                            <SelectItem value="garcom">Garçom/Garçonete</SelectItem>
                            <SelectItem value="gari">Gari</SelectItem>
                            <SelectItem value="geologo">Geólogo(a)</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="gerente_banco">Gerente de Banco</SelectItem>
                            <SelectItem value="gerente_vendas">Gerente de Vendas</SelectItem>
                            <SelectItem value="guarda">Guarda</SelectItem>
                            <SelectItem value="guia_turistico">Guia Turístico(a)</SelectItem>
                            <SelectItem value="historiador">Historiador(a)</SelectItem>
                            <SelectItem value="ilustrador">Ilustrador(a)</SelectItem>
                            <SelectItem value="influenciador">Influenciador(a) Digital</SelectItem>
                            <SelectItem value="instalador">Instalador(a)</SelectItem>
                            <SelectItem value="instrutor">Instrutor(a)</SelectItem>
                            <SelectItem value="jardineiro">Jardineiro(a)</SelectItem>
                            <SelectItem value="jornalista">Jornalista</SelectItem>
                            <SelectItem value="juiz">Juiz(a)</SelectItem>
                            <SelectItem value="laboratorista">Laboratorista</SelectItem>
                            <SelectItem value="lanterneiro">Lanterneiro(a)</SelectItem>
                            <SelectItem value="lavador">Lavador(a)</SelectItem>
                            <SelectItem value="lavrador">Lavrador(a)</SelectItem>
                            <SelectItem value="leiloeiro">Leiloeiro(a)</SelectItem>
                            <SelectItem value="locutor">Locutor(a)</SelectItem>
                            <SelectItem value="manobrista">Manobrista</SelectItem>
                            <SelectItem value="maquiador">Maquiador(a)</SelectItem>
                            <SelectItem value="marceneiro">Marceneiro(a)</SelectItem>
                            <SelectItem value="maricultora">Maricultor(a)</SelectItem>
                            <SelectItem value="marketing">Profissional de Marketing</SelectItem>
                            <SelectItem value="massagista">Massagista</SelectItem>
                            <SelectItem value="mecanico">Mecânico(a)</SelectItem>
                            <SelectItem value="mecanico_aviao">Mecânico(a) de Aviação</SelectItem>
                            <SelectItem value="medico">Médico(a)</SelectItem>
                            <SelectItem value="medico_veterinario">Médico(a) Veterinário(a)</SelectItem>
                            <SelectItem value="mestre_obras">Mestre de Obras</SelectItem>
                            <SelectItem value="metalurgico">Metalúrgico(a)</SelectItem>
                            <SelectItem value="militar">Militar</SelectItem>
                            <SelectItem value="minerador">Minerador(a)</SelectItem>
                            <SelectItem value="modelo">Modelo</SelectItem>
                            <SelectItem value="montador">Montador(a)</SelectItem>
                            <SelectItem value="motoboy">Motoboy/Motogirl</SelectItem>
                            <SelectItem value="motorista">Motorista</SelectItem>
                            <SelectItem value="motorista_app">Motorista de Aplicativo</SelectItem>
                            <SelectItem value="motorista_onibus">Motorista de Ônibus</SelectItem>
                            <SelectItem value="musico">Músico(a)</SelectItem>
                            <SelectItem value="nutricionista">Nutricionista</SelectItem>
                            <SelectItem value="oceanografo">Oceanógrafo(a)</SelectItem>
                            <SelectItem value="odontologo">Odontólogo(a)</SelectItem>
                            <SelectItem value="operador_caixa">Operador(a) de Caixa</SelectItem>
                            <SelectItem value="operador_maquinas">Operador(a) de Máquinas</SelectItem>
                            <SelectItem value="operador_telemarketing">Operador(a) de Telemarketing</SelectItem>
                            <SelectItem value="operador">Operador(a)</SelectItem>
                            <SelectItem value="optico">Óptico(a)</SelectItem>
                            <SelectItem value="orientador">Orientador(a)</SelectItem>
                            <SelectItem value="ourives">Ourives</SelectItem>
                            <SelectItem value="padeiro">Padeiro(a)</SelectItem>
                            <SelectItem value="paisagista">Paisagista</SelectItem>
                            <SelectItem value="passadeira">Passadeira/Passador</SelectItem>
                            <SelectItem value="pastor">Pastor(a)</SelectItem>
                            <SelectItem value="pecuarista">Pecuarista</SelectItem>
                            <SelectItem value="pedagogo">Pedagogo(a)</SelectItem>
                            <SelectItem value="pedreiro">Pedreiro(a)</SelectItem>
                            <SelectItem value="pensionista">Pensionista</SelectItem>
                            <SelectItem value="perfumista">Perfumista</SelectItem>
                            <SelectItem value="perito">Perito(a)</SelectItem>
                            <SelectItem value="pescador">Pescador(a)</SelectItem>
                            <SelectItem value="pesquisador">Pesquisador(a)</SelectItem>
                            <SelectItem value="piloto">Piloto(a)</SelectItem>
                            <SelectItem value="pintor">Pintor(a)</SelectItem>
                            <SelectItem value="pizzaiolo">Pizzaiolo(a)</SelectItem>
                            <SelectItem value="podolog">Podólogo(a)</SelectItem>
                            <SelectItem value="policial">Policial</SelectItem>
                            <SelectItem value="policial_civil">Policial Civil</SelectItem>
                            <SelectItem value="policial_militar">Policial Militar</SelectItem>
                            <SelectItem value="porteiro">Porteiro(a)</SelectItem>
                            <SelectItem value="produtor_cultural">Produtor(a) Cultural</SelectItem>
                            <SelectItem value="produtor_rural">Produtor(a) Rural</SelectItem>
                            <SelectItem value="professor">Professor(a)</SelectItem>
                            <SelectItem value="programador">Programador(a)</SelectItem>
                            <SelectItem value="promotor_justica">Promotor(a) de Justiça</SelectItem>
                            <SelectItem value="promotor_vendas">Promotor(a) de Vendas</SelectItem>
                            <SelectItem value="projetista">Projetista</SelectItem>
                            <SelectItem value="psicologo">Psicólogo(a)</SelectItem>
                            <SelectItem value="psiquiatra">Psiquiatra</SelectItem>
                            <SelectItem value="publicitario">Publicitário(a)</SelectItem>
                            <SelectItem value="quimico">Químico(a)</SelectItem>
                            <SelectItem value="radialista">Radialista</SelectItem>
                            <SelectItem value="radiologista">Radiologista</SelectItem>
                            <SelectItem value="recepcionista">Recepcionista</SelectItem>
                            <SelectItem value="relacoes_publicas">Relações Públicas</SelectItem>
                            <SelectItem value="relojoeiro">Relojoeiro(a)</SelectItem>
                            <SelectItem value="repositor">Repositor(a)</SelectItem>
                            <SelectItem value="representante">Representante Comercial</SelectItem>
                            <SelectItem value="salva_vidas">Salva-vidas</SelectItem>
                            <SelectItem value="sapateiro">Sapateiro(a)</SelectItem>
                            <SelectItem value="secretaria">Secretário(a)</SelectItem>
                            <SelectItem value="secretaria_executiva">Secretário(a) Executivo(a)</SelectItem>
                            <SelectItem value="seguranca">Segurança</SelectItem>
                            <SelectItem value="serralheiro">Serralheiro(a)</SelectItem>
                            <SelectItem value="servidor_publico">Servidor(a) Público(a)</SelectItem>
                            <SelectItem value="sindico">Síndico(a)</SelectItem>
                            <SelectItem value="sociologo">Sociólogo(a)</SelectItem>
                            <SelectItem value="soldador">Soldador(a)</SelectItem>
                            <SelectItem value="sommelier">Sommelier</SelectItem>
                            <SelectItem value="supervisor">Supervisor(a)</SelectItem>
                            <SelectItem value="tapeceiro">Tapeceiro(a)</SelectItem>
                            <SelectItem value="tatuador">Tatuador(a)</SelectItem>
                            <SelectItem value="taxista">Taxista</SelectItem>
                            <SelectItem value="tecnico">Técnico(a)</SelectItem>
                            <SelectItem value="tecnico_contabilidade">Técnico(a) em Contabilidade</SelectItem>
                            <SelectItem value="tecnico_enfermagem">Técnico(a) em Enfermagem</SelectItem>
                            <SelectItem value="tecnico_informatica">Técnico(a) em Informática</SelectItem>
                            <SelectItem value="tecnico_laboratorio">Técnico(a) em Laboratório</SelectItem>
                            <SelectItem value="tecnico_mecanica">Técnico(a) em Mecânica</SelectItem>
                            <SelectItem value="tecnico_radiologia">Técnico(a) em Radiologia</SelectItem>
                            <SelectItem value="tecnico_seguranca">Técnico(a) em Segurança</SelectItem>
                            <SelectItem value="tecelao">Tecelão/Tecelã</SelectItem>
                            <SelectItem value="telefonista">Telefonista</SelectItem>
                            <SelectItem value="terapeuta">Terapeuta</SelectItem>
                            <SelectItem value="terapeuta_ocupacional">Terapeuta Ocupacional</SelectItem>
                            <SelectItem value="tesoureiro">Tesoureiro(a)</SelectItem>
                            <SelectItem value="torneiro">Torneiro(a)</SelectItem>
                            <SelectItem value="tradutor">Tradutor(a)</SelectItem>
                            <SelectItem value="tratorista">Tratorista</SelectItem>
                            <SelectItem value="urbanista">Urbanista</SelectItem>
                            <SelectItem value="vendedor">Vendedor(a)</SelectItem>
                            <SelectItem value="veterinario">Veterinário(a)</SelectItem>
                            <SelectItem value="vidraceiro">Vidraceiro(a)</SelectItem>
                            <SelectItem value="vigilante">Vigilante</SelectItem>
                            <SelectItem value="vistoriador">Vistoriador(a)</SelectItem>
                            <SelectItem value="web_designer">Web Designer</SelectItem>
                            <SelectItem value="zelador">Zelador(a)</SelectItem>
                            <SelectItem value="zootecnista">Zootecnista</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="empresaEmprego"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Empresa onde trabalha</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nome da empresa" data-testid="input-empresa" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ocupacaoRisco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ocupação de Risco</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-ocupacao-risco">
                              <SelectValue placeholder="Selecione se aplicável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nenhum">Nenhum risco específico</SelectItem>
                            <SelectItem value="operacao_industrial">Operação Industrial</SelectItem>
                            <SelectItem value="medico">Médico / Área da Saúde</SelectItem>
                            <SelectItem value="motorista">Motorista Profissional</SelectItem>
                            <SelectItem value="construcao">Construção Civil</SelectItem>
                            <SelectItem value="seguranca">Segurança</SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Ocupações com exposição a riscos podem influenciar no scoring
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {currentStep === 5 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="rendaMensalBruta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renda Mensal Bruta</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-renda-bruta"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rendaMensalLiquida"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Renda Mensal Líquida</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-renda-liquida"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gastosMensais"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gastos Mensais Estimados</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-gastos"
                            />
                          </FormControl>
                          <FormDescription>
                            Inclua moradia, alimentação, transporte, etc.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="economias"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Economias / Investimentos</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="R$ 0,00"
                              data-testid="input-economias"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {currentStep === 6 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex-1">
                      <Input placeholder="Nome do dependente" id="dep-nome" data-testid="input-dependente-nome" />
                    </div>
                    <div className="flex-1">
                      <Select onValueChange={(val) => {
                        const depNome = (document.getElementById("dep-nome") as HTMLInputElement)?.value || "";
                        const depData = (document.getElementById("dep-data") as HTMLInputElement)?.value || "";
                        if (!val || !depData) {
                          toast({ title: "Tipo e Data de Nascimento são obrigatórios", variant: "destructive" });
                          return;
                        }
                      }}>
                        <SelectTrigger data-testid="select-tipo-relacao">
                          <SelectValue placeholder="Tipo de Relação *" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conjuge">Cônjuge</SelectItem>
                          <SelectItem value="filho">Filho(a)</SelectItem>
                          <SelectItem value="pai">Pai</SelectItem>
                          <SelectItem value="mae">Mãe</SelectItem>
                          <SelectItem value="irma">Irmã/Irmão</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Input type="date" placeholder="Data Nascimento *" id="dep-data" data-testid="input-dependente-data" className="flex-1" />
                      <Button type="button" size="sm" onClick={() => {
                        const nome = (document.getElementById("dep-nome") as HTMLInputElement)?.value;
                        const tipoRel = (document.querySelector('[data-testid="select-tipo-relacao"]') as any)?.textContent?.split('\n')[0]?.trim();
                        const data = (document.getElementById("dep-data") as HTMLInputElement)?.value;
                        if (!tipoRel || tipoRel === "Tipo de Relação *" || !data) {
                          toast({ title: "Preencha Tipo e Data de Nascimento", variant: "destructive" });
                          return;
                        }
                        setDependentes([...dependentes, { nome: nome || "", tipoRelacao: tipoRel, dataNascimento: data }]);
                        (document.getElementById("dep-nome") as HTMLInputElement).value = "";
                        (document.getElementById("dep-data") as HTMLInputElement).value = "";
                      }}>Adicionar</Button>
                    </div>
                  </div>
                  {dependentes.length > 0 && (
                    <div className="mt-6 space-y-2">
                      <p className="text-sm font-medium">{dependentes.length} dependente(s) adicionado(s)</p>
                      {dependentes.map((dep, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{dep.nome || "(sem nome)"} - {dep.tipoRelacao}</span>
                          <Button variant="ghost" size="sm" onClick={() => setDependentes(dependentes.filter((_, i) => i !== idx))}>Remover</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 7 && (
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
                            Autorizo o tratamento dos meus dados pessoais para fins de análise
                            de perfil, envio de cotações de seguros e contato comercial,
                            conforme a Lei Geral de Proteção de Dados (LGPD).
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consentimentoEscopo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Escopo do Consentimento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-escopo">
                              <SelectValue placeholder="Selecione o escopo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="contato_comercial">Apenas contato comercial</SelectItem>
                            <SelectItem value="cotacoes">Contato e envio de cotações</SelectItem>
                            <SelectItem value="completo">
                              Completo (inclui compartilhamento com seguradoras)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                            placeholder="Informações adicionais sobre o cliente..."
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
                    Cadastrar Cliente
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
