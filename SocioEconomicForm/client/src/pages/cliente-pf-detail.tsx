import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScoreBar } from "@/components/score-badge";
import { PageLoadingState } from "@/components/loading-state";
import { EmptyState } from "@/components/empty-state";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  User,
  Briefcase,
  Users,
  Car,
  Home,
  Shield,
  Target,
  History,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { formatCPF, formatCurrency, formatPhone, calculateAge } from "@/lib/validators";
import type { PessoaFisica, Dependente, Patrimonio, Oportunidade, Interacao } from "@shared/schema";

const dependenteFormSchema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  dataNascimento: z.string().optional(),
  grauParentesco: z.string().min(1, "Grau de parentesco é obrigatório"),
  cpf: z.string().optional(),
  dependenteImposto: z.boolean().default(false),
});

type DependenteFormData = z.infer<typeof dependenteFormSchema>;

export default function ClientePFDetail() {
  const [, params] = useRoute("/clientes/pf/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const clienteId = params?.id;
  const [dependenteDialogOpen, setDependenteDialogOpen] = useState(false);

  const dependenteForm = useForm<DependenteFormData>({
    resolver: zodResolver(dependenteFormSchema),
    defaultValues: {
      nome: "",
      dataNascimento: "",
      grauParentesco: "",
      cpf: "",
      dependenteImposto: false,
    },
  });

  const { data: cliente, isLoading } = useQuery<PessoaFisica>({
    queryKey: ["/api/pessoas-fisicas", clienteId],
    enabled: !!clienteId,
  });

  const { data: dependentes } = useQuery<Dependente[]>({
    queryKey: ["/api/pessoas-fisicas", clienteId, "dependentes"],
    enabled: !!clienteId,
  });

  const createDependenteMutation = useMutation({
    mutationFn: async (data: DependenteFormData) => {
      return await apiRequest("POST", `/api/pessoas-fisicas/${clienteId}/dependentes`, {
        nome: data.nome,
        dataNascimento: data.dataNascimento || null,
        grauParentesco: data.grauParentesco,
        cpf: data.cpf?.replace(/\D/g, "") || null,
        dependenteImposto: data.dependenteImposto,
      });
    },
    onSuccess: () => {
      toast({ title: "Dependente adicionado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-fisicas", clienteId, "dependentes"] });
      setDependenteDialogOpen(false);
      dependenteForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar dependente", variant: "destructive" });
    },
  });

  const deleteDependenteMutation = useMutation({
    mutationFn: async (dependenteId: string) => {
      return await apiRequest("DELETE", `/api/pessoas-fisicas/${clienteId}/dependentes/${dependenteId}`);
    },
    onSuccess: () => {
      toast({ title: "Dependente removido com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-fisicas", clienteId, "dependentes"] });
    },
    onError: () => {
      toast({ title: "Erro ao remover dependente", variant: "destructive" });
    },
  });

  const onSubmitDependente = (data: DependenteFormData) => {
    createDependenteMutation.mutate(data);
  };

  const { data: patrimonios } = useQuery<Patrimonio[]>({
    queryKey: ["/api/pessoas-fisicas", clienteId, "patrimonios"],
    enabled: !!clienteId,
  });

  const { data: oportunidades } = useQuery<Oportunidade[]>({
    queryKey: ["/api/pessoas-fisicas", clienteId, "oportunidades"],
    enabled: !!clienteId,
  });

  const { data: interacoes } = useQuery<Interacao[]>({
    queryKey: ["/api/pessoas-fisicas", clienteId, "interacoes"],
    enabled: !!clienteId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/pessoas-fisicas/${clienteId}`);
    },
    onSuccess: () => {
      toast({ title: "Cliente excluído com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-fisicas"] });
      navigate("/clientes/pf");
    },
    onError: () => {
      toast({ title: "Erro ao excluir cliente", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (!cliente) {
    return (
      <EmptyState
        icon={User}
        title="Cliente não encontrado"
        description="O cliente solicitado não existe ou foi removido"
        action={{ label: "Voltar", onClick: () => navigate("/clientes/pf") }}
      />
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return (parts[0]?.charAt(0) || "") + (parts[parts.length - 1]?.charAt(0) || "");
  };

  const getEstadoCivilLabel = (estado: string | null) => {
    const estados: Record<string, string> = {
      solteiro: "Solteiro(a)",
      casado: "Casado(a)",
      divorciado: "Divorciado(a)",
      viuvo: "Viúvo(a)",
      uniao_estavel: "União Estável",
    };
    return estado ? estados[estado] || estado : "-";
  };

  const idade = cliente.dataNascimento ? calculateAge(cliente.dataNascimento) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/clientes/pf")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-cliente-nome">
            {cliente.nomeCompleto}
          </h1>
          <p className="text-muted-foreground font-mono">
            {formatCPF(cliente.cpf)}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/cadastro/pf?edit=${clienteId}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir este cliente?")) {
              deleteMutation.mutate();
            }
          }}
          data-testid="button-delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-4">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {getInitials(cliente.nomeCompleto)}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-lg">{cliente.nomeCompleto}</h2>
              {cliente.profissao && (
                <p className="text-muted-foreground">{cliente.profissao}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {cliente.consentimentoLgpd && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                    <Shield className="mr-1 h-3 w-3" />
                    LGPD OK
                  </Badge>
                )}
                {idade && (
                  <Badge variant="secondary">{idade} anos</Badge>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {cliente.celular && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatPhone(cliente.celular)}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{cliente.email}</span>
                </div>
              )}
              {cliente.empresaEmprego && (
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{cliente.empresaEmprego}</span>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <h3 className="font-medium text-sm">Scores de Oportunidade</h3>
              <ScoreBar score={cliente.scoreVida || 0} label="Seguro Vida" />
              <ScoreBar score={cliente.scoreAuto || 0} label="Seguro Auto" />
              <ScoreBar score={cliente.scoreResidencial || 0} label="Residencial" />
              <ScoreBar score={cliente.scoreRcProfissional || 0} label="RC Profissional" />
              <ScoreBar score={cliente.scorePrevidencia || 0} label="Previdência" />
              <ScoreBar score={cliente.scoreSaude || 0} label="Saúde" />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="perfil" data-testid="tab-perfil">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="patrimonio" data-testid="tab-patrimonio">
                <Car className="mr-2 h-4 w-4" />
                Patrimônio
              </TabsTrigger>
              <TabsTrigger value="familia" data-testid="tab-familia">
                <Users className="mr-2 h-4 w-4" />
                Família
              </TabsTrigger>
              <TabsTrigger value="oportunidades" data-testid="tab-oportunidades">
                <Target className="mr-2 h-4 w-4" />
                Oportunidades
              </TabsTrigger>
              <TabsTrigger value="historico" data-testid="tab-historico">
                <History className="mr-2 h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado Civil</span>
                      <span>{getEstadoCivilLabel(cliente.estadoCivil)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sexo</span>
                      <span>{cliente.sexo === "M" ? "Masculino" : cliente.sexo === "F" ? "Feminino" : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Nascimento</span>
                      <span>{cliente.dataNascimento || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dependentes</span>
                      <span>{cliente.numeroDependentes || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renda Bruta</span>
                      <span className="font-mono">
                        {cliente.rendaMensalBruta ? formatCurrency(Number(cliente.rendaMensalBruta)) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Renda Líquida</span>
                      <span className="font-mono">
                        {cliente.rendaMensalLiquida ? formatCurrency(Number(cliente.rendaMensalLiquida)) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gastos Mensais</span>
                      <span className="font-mono">
                        {cliente.gastosMensais ? formatCurrency(Number(cliente.gastosMensais)) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Economias</span>
                      <span className="font-mono">
                        {cliente.economias ? formatCurrency(Number(cliente.economias)) : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Profissão</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profissão</span>
                      <span>{cliente.profissao || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Empresa</span>
                      <span>{cliente.empresaEmprego || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ocupação de Risco</span>
                      <span>{cliente.ocupacaoRisco || "Não informado"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="patrimonio" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Bens e Patrimônio</h3>
                <Button size="sm" onClick={() => navigate(`/patrimonios/novo?pfId=${clienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {patrimonios && patrimonios.length > 0 ? (
                <div className="grid gap-4">
                  {patrimonios.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {p.tipo === "veiculo" ? (
                              <Car className="h-5 w-5" />
                            ) : p.tipo === "imovel" ? (
                              <Home className="h-5 w-5" />
                            ) : (
                              <Briefcase className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">
                              {p.tipo === "veiculo"
                                ? `${p.marcaVeiculo} ${p.modeloVeiculo} ${p.anoModelo || ""}`
                                : p.descricao || p.tipo}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {p.valorAproximado ? formatCurrency(Number(p.valorAproximado)) : "Valor não informado"}
                            </div>
                          </div>
                          <Badge variant={p.seguradoAtual ? "default" : "outline"}>
                            {p.seguradoAtual ? "Segurado" : "Não segurado"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Car}
                  title="Nenhum patrimônio"
                  description="Adicione veículos, imóveis ou outros bens"
                  action={{ label: "Adicionar", onClick: () => navigate(`/patrimonios/novo?pfId=${clienteId}`) }}
                />
              )}
            </TabsContent>

            <TabsContent value="familia" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Dependentes</h3>
                <Dialog open={dependenteDialogOpen} onOpenChange={setDependenteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-dependente">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Dependente</DialogTitle>
                    </DialogHeader>
                    <Form {...dependenteForm}>
                      <form onSubmit={dependenteForm.handleSubmit(onSubmitDependente)} className="space-y-4">
                        <FormField
                          control={dependenteForm.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome do dependente" data-testid="input-dependente-nome" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dependenteForm.control}
                          name="dataNascimento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-dependente-nascimento" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dependenteForm.control}
                          name="grauParentesco"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grau de Parentesco *</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-dependente-parentesco">
                                    <SelectValue placeholder="Selecione o parentesco" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="conjuge">Cônjuge</SelectItem>
                                  <SelectItem value="companheiro">Companheiro(a)</SelectItem>
                                  <SelectItem value="filho">Filho(a)</SelectItem>
                                  <SelectItem value="enteado">Enteado(a)</SelectItem>
                                  <SelectItem value="pai">Pai</SelectItem>
                                  <SelectItem value="mae">Mãe</SelectItem>
                                  <SelectItem value="sogro">Sogro(a)</SelectItem>
                                  <SelectItem value="irmao">Irmão/Irmã</SelectItem>
                                  <SelectItem value="avo">Avô/Avó</SelectItem>
                                  <SelectItem value="neto">Neto(a)</SelectItem>
                                  <SelectItem value="tio">Tio(a)</SelectItem>
                                  <SelectItem value="sobrinho">Sobrinho(a)</SelectItem>
                                  <SelectItem value="primo">Primo(a)</SelectItem>
                                  <SelectItem value="cunhado">Cunhado(a)</SelectItem>
                                  <SelectItem value="genro">Genro</SelectItem>
                                  <SelectItem value="nora">Nora</SelectItem>
                                  <SelectItem value="tutelado">Tutelado(a)</SelectItem>
                                  <SelectItem value="outro">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dependenteForm.control}
                          name="cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="000.000.000-00" data-testid="input-dependente-cpf" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={dependenteForm.control}
                          name="dependenteImposto"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-dependente-ir" 
                                />
                              </FormControl>
                              <FormLabel className="font-normal">Dependente para Imposto de Renda</FormLabel>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setDependenteDialogOpen(false)}
                            data-testid="button-cancel-dependente"
                          >
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={createDependenteMutation.isPending}
                            data-testid="button-save-dependente"
                          >
                            {createDependenteMutation.isPending ? "Salvando..." : "Salvar"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              {dependentes && dependentes.length > 0 ? (
                <div className="grid gap-4">
                  {dependentes.map((d) => (
                    <Card key={d.id} data-testid={`card-dependente-${d.id}`}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {d.nome.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{d.nome}</div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="capitalize">{d.grauParentesco?.replace("_", " ") || "Dependente"}</span>
                              {d.dataNascimento && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(d.dataNascimento).toLocaleDateString("pt-BR")}
                                  {" "}({calculateAge(d.dataNascimento)} anos)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {d.dependenteImposto && (
                              <Badge variant="secondary">Dep. IR</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteDependenteMutation.mutate(d.id)}
                              disabled={deleteDependenteMutation.isPending}
                              data-testid={`button-delete-dependente-${d.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nenhum dependente"
                  description="Adicione cônjuge, filhos ou outros dependentes"
                />
              )}
            </TabsContent>

            <TabsContent value="oportunidades" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Oportunidades</h3>
                <Button size="sm" onClick={() => navigate(`/oportunidades/novo?pfId=${clienteId}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Proposta
                </Button>
              </div>
              {oportunidades && oportunidades.length > 0 ? (
                <div className="grid gap-4">
                  {oportunidades.map((o) => (
                    <Card key={o.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium capitalize">{o.produto.replace("_", " ")}</div>
                            <div className="text-sm text-muted-foreground">
                              Score: {o.scorePotencial}
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge>{o.status}</Badge>
                            {o.premioEstimado && (
                              <div className="text-sm font-mono mt-1">
                                {formatCurrency(Number(o.premioEstimado))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Target}
                  title="Nenhuma oportunidade"
                  description="Crie propostas de produtos para este cliente"
                  action={{ label: "Nova Proposta", onClick: () => navigate(`/oportunidades/novo?pfId=${clienteId}`) }}
                />
              )}
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Histórico de Interações</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Registrar
                </Button>
              </div>
              {interacoes && interacoes.length > 0 ? (
                <div className="space-y-4">
                  {interacoes.map((i) => (
                    <div key={i.id} className="flex gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <History className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {i.tipo}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(i.createdAt!).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {i.descricao && (
                          <p className="text-sm mt-1">{i.descricao}</p>
                        )}
                        {i.resultado && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Resultado: {i.resultado}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={History}
                  title="Nenhuma interação"
                  description="Registre ligações, emails e visitas"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
