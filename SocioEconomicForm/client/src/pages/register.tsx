import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";
import { Shield, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Building2, Search, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

const registerSchema = z.object({
  cnpj: z.string().min(14, "CNPJ deve ter 14 dígitos"),
  adminFirstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  adminLastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  adminEmail: z.string().email("Email inválido"),
  adminPassword: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.adminPassword === data.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface CnpjInfo {
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  dataAbertura: string;
  telefone: string;
  email: string;
  atividade: string;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjConsultado, setCnpjConsultado] = useState(false);
  const [cnpjInfo, setCnpjInfo] = useState<CnpjInfo | null>(null);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [verifiedCnpj, setVerifiedCnpj] = useState<string>("");

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      cnpj: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPassword: "",
      confirmPassword: "",
    },
  });

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
    setCnpjError(null);
    
    try {
      const response = await fetch(`/api/auth/consultar-cnpj/${cleanCnpj}`);
      const data = await response.json();
      
      if (!response.ok) {
        setCnpjError(data.message || "Não foi possível consultar o CNPJ");
        toast({
          title: "Erro na consulta",
          description: data.message || "Não foi possível consultar o CNPJ",
          variant: "destructive",
        });
        return;
      }

      setCnpjConsultado(true);
      setVerifiedCnpj(cleanCnpj);
      setCnpjInfo({
        razaoSocial: data.dados.razaoSocial || "",
        nomeFantasia: data.dados.nomeFantasia || "",
        situacao: data.dados.situacaoCadastral || "",
        dataAbertura: data.dados.dataInicioAtividade || "",
        telefone: data.dados.telefone || "",
        email: data.dados.email || "",
        atividade: data.dados.cnaeFiscalDescricao || "",
      });

      toast({
        title: "Empresa encontrada!",
        description: data.dados.razaoSocial,
      });
    } catch (error) {
      console.error("Erro ao buscar CNPJ:", error);
      setCnpjError("Não foi possível conectar com a Receita Federal");
      toast({
        title: "Erro de conexão",
        description: "Não foi possível consultar a Receita Federal",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const { confirmPassword, ...registerData } = data;
      const response = await apiRequest("POST", "/api/auth/register-corretora", registerData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Corretora cadastrada!",
        description: "Sua corretora foi criada com sucesso. Faça login para continuar.",
      });
      setLocation("/login");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Não foi possível cadastrar a corretora",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    const currentCnpj = data.cnpj.replace(/\D/g, "");
    
    if (!cnpjConsultado || currentCnpj !== verifiedCnpj) {
      toast({
        title: "CNPJ não validado",
        description: "Por favor, busque o CNPJ antes de continuar",
        variant: "destructive",
      });
      return;
    }

    if (cnpjInfo?.situacao?.toLowerCase() !== "ativa") {
      toast({
        title: "Empresa não ativa",
        description: "Apenas empresas com situação ATIVA podem se cadastrar",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate(data);
  };

  const currentCnpjClean = form.watch("cnpj").replace(/\D/g, "");
  const isEmpresaAtiva = cnpjInfo?.situacao?.toLowerCase() === "ativa";
  const isCnpjVerified = cnpjConsultado && currentCnpjClean === verifiedCnpj;
  const canSubmit = isCnpjVerified && isEmpresaAtiva;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Cadastrar Corretora</CardTitle>
            <CardDescription>
              Informe o CNPJ da sua corretora para buscar os dados automaticamente
            </CardDescription>
          </CardHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Dados da Corretora
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ da Corretora</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                {...field}
                                placeholder="00.000.000/0000-00"
                                className="pl-10"
                                data-testid="input-register-cnpj"
                                maxLength={18}
                                onChange={(e) => {
                                  const formatted = formatCNPJ(e.target.value);
                                  field.onChange(formatted);
                                  setCnpjConsultado(false);
                                  setCnpjInfo(null);
                                  setCnpjError(null);
                                  setVerifiedCnpj("");
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              onClick={fetchCnpj}
                              disabled={isLoadingCnpj || field.value.replace(/\D/g, "").length !== 14}
                              data-testid="button-buscar-cnpj"
                            >
                              {isLoadingCnpj ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Search className="h-4 w-4" />
                              )}
                              <span className="ml-2">Buscar</span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {cnpjError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cnpjError}</AlertDescription>
                    </Alert>
                  )}

                  {cnpjInfo && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Situação Cadastral</span>
                        {isEmpresaAtiva ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {cnpjInfo.situacao}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Razão Social: </span>
                          <span className="font-medium">{cnpjInfo.razaoSocial}</span>
                        </div>
                        {cnpjInfo.nomeFantasia && (
                          <div>
                            <span className="text-muted-foreground">Nome Fantasia: </span>
                            <span>{cnpjInfo.nomeFantasia}</span>
                          </div>
                        )}
                        {cnpjInfo.atividade && (
                          <div>
                            <span className="text-muted-foreground">Atividade: </span>
                            <span>{cnpjInfo.atividade}</span>
                          </div>
                        )}
                        {cnpjInfo.dataAbertura && (
                          <div>
                            <span className="text-muted-foreground">Data de Abertura: </span>
                            <span>{cnpjInfo.dataAbertura}</span>
                          </div>
                        )}
                      </div>

                      {!isEmpresaAtiva && (
                        <Alert variant="destructive" className="mt-3">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Apenas empresas com situação ATIVA podem se cadastrar no SeguroPro.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                {isCnpjVerified && isEmpresaAtiva && (
                  <>
                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Dados do Administrador
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informe os dados do responsável que irá administrar a corretora no sistema.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="adminFirstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    {...field}
                                    placeholder="Nome"
                                    className="pl-10"
                                    data-testid="input-register-admin-firstname"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="adminLastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sobrenome</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Sobrenome"
                                  data-testid="input-register-admin-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="adminEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email do Administrador</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="admin@email.com"
                                  className="pl-10"
                                  data-testid="input-register-admin-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="adminPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Mínimo 8 caracteres"
                                  className="pl-10 pr-10"
                                  data-testid="input-register-admin-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar Senha</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showConfirmPassword ? "text" : "password"}
                                  placeholder="Repita a senha"
                                  className="pl-10 pr-10"
                                  data-testid="input-register-confirm-password"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                  {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="font-medium">Plano Starter - Gratuito</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comece gratuitamente com 1 usuário e até 1.000 clientes. Você pode fazer upgrade a qualquer momento.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canSubmit || registerMutation.isPending}
                  data-testid="button-register-submit"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : !isCnpjVerified ? (
                    "Busque o CNPJ primeiro"
                  ) : !isEmpresaAtiva ? (
                    "Empresa não ativa"
                  ) : (
                    "Cadastrar Corretora"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Já tem uma conta?{" "}
                  <Link
                    href="/login"
                    className="text-primary hover:underline"
                    data-testid="link-login"
                  >
                    Fazer login
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>SeguroPro - Sistema de Gestão para Corretoras de Seguros</p>
      </footer>
    </div>
  );
}
