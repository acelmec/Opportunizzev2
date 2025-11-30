import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
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
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Globe,
  Building2,
  Users,
  Car,
  Target,
  History,
  Plus,
  Trash2,
  Briefcase,
} from "lucide-react";
import { formatCNPJ, formatCurrency, formatPhone } from "@/lib/validators";
import type { PessoaJuridica, Socio, Funcionario, Oportunidade, Interacao } from "@shared/schema";

export default function ClientePJDetail() {
  const [, params] = useRoute("/clientes/pj/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const empresaId = params?.id;

  const { data: empresa, isLoading } = useQuery<PessoaJuridica>({
    queryKey: ["/api/pessoas-juridicas", empresaId],
    enabled: !!empresaId,
  });

  const { data: socios } = useQuery<Socio[]>({
    queryKey: ["/api/pessoas-juridicas", empresaId, "socios"],
    enabled: !!empresaId,
  });

  const { data: funcionarios } = useQuery<Funcionario[]>({
    queryKey: ["/api/pessoas-juridicas", empresaId, "funcionarios"],
    enabled: !!empresaId,
  });


  const { data: oportunidades } = useQuery<Oportunidade[]>({
    queryKey: ["/api/pessoas-juridicas", empresaId, "oportunidades"],
    enabled: !!empresaId,
  });

  const { data: interacoes } = useQuery<Interacao[]>({
    queryKey: ["/api/pessoas-juridicas", empresaId, "interacoes"],
    enabled: !!empresaId,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/pessoas-juridicas/${empresaId}`);
    },
    onSuccess: () => {
      toast({ title: "Empresa excluída com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-juridicas"] });
      navigate("/clientes/pj");
    },
    onError: () => {
      toast({ title: "Erro ao excluir empresa", variant: "destructive" });
    },
  });

  if (isLoading) {
    return <PageLoadingState />;
  }

  if (!empresa) {
    return (
      <EmptyState
        icon={Building2}
        title="Empresa não encontrada"
        description="A empresa solicitada não existe ou foi removida"
        action={{ label: "Voltar", onClick: () => navigate("/clientes/pj") }}
      />
    );
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return (parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "");
  };

  const getPorteLabel = (porte: string | null) => {
    const portes: Record<string, string> = {
      micro: "Microempresa",
      pequeno: "Pequena Empresa",
      medio: "Média Empresa",
      grande: "Grande Empresa",
    };
    return porte ? portes[porte] || porte : "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/clientes/pj")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold" data-testid="text-empresa-nome">
            {empresa.nomeFantasia || empresa.razaoSocial}
          </h1>
          <p className="text-muted-foreground font-mono">
            {formatCNPJ(empresa.cnpj)}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/cadastro/pj?edit=${empresaId}`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
        <Button
          variant="destructive"
          size="icon"
          onClick={() => {
            if (confirm("Tem certeza que deseja excluir esta empresa?")) {
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
                <AvatarFallback className="text-2xl bg-chart-2/10 text-chart-2">
                  {getInitials(empresa.nomeFantasia || empresa.razaoSocial)}
                </AvatarFallback>
              </Avatar>
              <h2 className="font-semibold text-lg">
                {empresa.nomeFantasia || empresa.razaoSocial}
              </h2>
              {empresa.segmentoAtividade && (
                <p className="text-muted-foreground">{empresa.segmentoAtividade}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {empresa.porteEmpresa && (
                  <Badge variant="secondary">
                    {getPorteLabel(empresa.porteEmpresa)}
                  </Badge>
                )}
                {empresa.numeroFuncionarios && empresa.numeroFuncionarios > 0 && (
                  <Badge variant="outline">
                    {empresa.numeroFuncionarios} func.
                  </Badge>
                )}
              </div>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              {empresa.telefone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatPhone(empresa.telefone)}</span>
                </div>
              )}
              {empresa.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{empresa.email}</span>
                </div>
              )}
              {empresa.website && (
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a href={empresa.website} target="_blank" rel="noopener" className="text-sm text-primary">
                    {empresa.website}
                  </a>
                </div>
              )}
            </div>

            <Separator className="my-6" />

            <div className="space-y-3">
              <h3 className="font-medium text-sm">Scores de Oportunidade</h3>
              <ScoreBar score={empresa.scoreVidaColetiva || 0} label="Vida Coletiva" />
              <ScoreBar score={empresa.scoreSaudeColetiva || 0} label="Saúde Coletiva" />
              <ScoreBar score={empresa.scorePatrimonial || 0} label="Patrimonial" />
              <ScoreBar score={empresa.scoreRc || 0} label="RC Empresa" />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="perfil" className="w-full">
            <TabsList className="w-full justify-start flex-wrap">
              <TabsTrigger value="perfil" data-testid="tab-perfil">
                <Building2 className="mr-2 h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="socios" data-testid="tab-socios">
                <Briefcase className="mr-2 h-4 w-4" />
                Sócios
              </TabsTrigger>
              <TabsTrigger value="funcionarios" data-testid="tab-funcionarios">
                <Users className="mr-2 h-4 w-4" />
                Funcionários
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
                    <CardTitle className="text-base">Dados Empresariais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Razão Social</span>
                      <span className="text-right">{empresa.razaoSocial}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nome Fantasia</span>
                      <span>{empresa.nomeFantasia || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">CNAE</span>
                      <span>{empresa.cnae || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segmento</span>
                      <span>{empresa.segmentoAtividade || "-"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Dados Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Porte</span>
                      <span>{getPorteLabel(empresa.porteEmpresa)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Faturamento Mensal</span>
                      <span className="font-mono">
                        {empresa.faturamentoMensal ? formatCurrency(Number(empresa.faturamentoMensal)) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Funcionários</span>
                      <span>{empresa.numeroFuncionarios || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plano Saúde Coletivo</span>
                      <span>{empresa.planoSaudeColetivo ? "Sim" : "Não"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="socios" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Quadro Societário</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {socios && socios.length > 0 ? (
                <div className="grid gap-4">
                  {socios.map((s) => (
                    <Card key={s.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{s.nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{s.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {s.cargo || "Sócio"}
                            </div>
                          </div>
                          {s.participacao && (
                            <Badge variant="secondary">{Number(s.participacao)}%</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Briefcase}
                  title="Nenhum sócio cadastrado"
                  description="Adicione os sócios da empresa"
                />
              )}
            </TabsContent>

            <TabsContent value="funcionarios" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Funcionários</h3>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar
                </Button>
              </div>
              {funcionarios && funcionarios.length > 0 ? (
                <div className="grid gap-4">
                  {funcionarios.map((f) => (
                    <Card key={f.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{f.nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{f.nome}</div>
                            <div className="text-sm text-muted-foreground">
                              {f.cargo || "Funcionário"}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {f.elegivelVidaColetiva && (
                              <Badge variant="outline" className="text-xs">Vida</Badge>
                            )}
                            {f.elegivelSaude && (
                              <Badge variant="outline" className="text-xs">Saúde</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="Nenhum funcionário"
                  description="Adicione funcionários para planos coletivos"
                />
              )}
            </TabsContent>


            <TabsContent value="oportunidades" className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Oportunidades</h3>
                <Button size="sm" onClick={() => navigate(`/oportunidades/novo?pjId=${empresaId}`)}>
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
                  description="Crie propostas de produtos para esta empresa"
                  action={{ label: "Nova Proposta", onClick: () => navigate(`/oportunidades/novo?pjId=${empresaId}`) }}
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
                        {i.descricao && <p className="text-sm mt-1">{i.descricao}</p>}
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
