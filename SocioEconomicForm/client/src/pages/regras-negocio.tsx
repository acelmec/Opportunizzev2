import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/loading-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Scale,
  User,
  Users,
  Briefcase,
  Search,
  Target,
  ChevronRight,
  Shield,
  Info,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState } from "react";

interface RuleCondition {
  campo: string;
  operador: string;
  valor: string | number | boolean;
}

interface BusinessRule {
  id: string;
  nome: string;
  descricao: string | null;
  tipoPessoa: "pf" | "pj" | "ambos";
  tipoSeguroId: string | null;
  tipoSeguroNome: string;
  prioridade: number | null;
  condicoes: RuleCondition[];
  scoreBonus: number | null;
  ativo: boolean | null;
}

const CAMPOS_LABELS: Record<string, string> = {
  idade: "Idade",
  sexo: "Sexo",
  estadoCivil: "Estado Civil",
  profissao: "Profissão",
  rendaMensal: "Renda Mensal",
  numeroDependentes: "Nº Dependentes",
  possuiVeiculo: "Possui Veículo",
  possuiImovel: "Possui Imóvel",
  possuiEmbarcacao: "Possui Embarcação",
  quantidadeVeiculos: "Qtd. Veículos",
  quantidadeImoveis: "Qtd. Imóveis",
  segmentoAtividade: "Segmento",
  cnae: "CNAE",
  porteEmpresa: "Porte",
  faturamentoMensal: "Faturamento",
  numeroFuncionarios: "Nº Funcionários",
  possuiVeiculos: "Possui Veículos",
  possuiMaquinas: "Possui Máquinas",
  quantidadeFuncionarios: "Qtd. Funcionários",
};

const OPERADORES_LABELS: Record<string, string> = {
  "=": "igual a",
  "!=": "diferente de",
  ">": "maior que",
  ">=": "maior ou igual a",
  "<": "menor que",
  "<=": "menor ou igual a",
  "contains": "contém",
};

function formatCondition(cond: RuleCondition): string {
  const campo = CAMPOS_LABELS[cond.campo] || cond.campo;
  const operador = OPERADORES_LABELS[cond.operador] || cond.operador;
  let valor = cond.valor;
  
  if (typeof valor === "boolean") {
    valor = valor ? "Sim" : "Não";
  } else if (cond.campo === "rendaMensal" || cond.campo === "faturamentoMensal") {
    valor = `R$ ${Number(valor).toLocaleString("pt-BR")}`;
  } else if (cond.campo === "estadoCivil") {
    const estados: Record<string, string> = {
      solteiro: "Solteiro",
      casado: "Casado",
      divorciado: "Divorciado",
      viuvo: "Viúvo",
      uniao_estavel: "União Estável",
    };
    valor = estados[String(valor)] || valor;
  } else if (cond.campo === "porteEmpresa") {
    const portes: Record<string, string> = {
      micro: "Microempresa",
      pequeno: "Pequena",
      medio: "Média",
      grande: "Grande",
    };
    valor = portes[String(valor)] || valor;
  }
  
  return `${campo} ${operador} ${valor}`;
}

export default function RegrasNegocio() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoPessoa, setFilterTipoPessoa] = useState<string>("todos");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    tipoPessoa: "ambos" as "pf" | "pj" | "ambos",
    tipoSeguroId: "",
    scoreBonus: 10,
    campo: "",
    operador: "=",
    valor: "",
  });
  const [condicoes, setCondicoes] = useState<any[]>([]);

  const { data: rules = [], isLoading } = useQuery<BusinessRule[]>({
    queryKey: ["/api/regras-negocio"],
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ["/api/tipos-seguro"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/regras-negocio", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regras-negocio"] });
      toast({ title: "Regra criada com sucesso!" });
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao criar regra", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/regras-negocio/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regras-negocio"] });
      toast({ title: "Regra atualizada com sucesso!" });
      setEditingRule(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar regra", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/regras-negocio/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/regras-negocio"] });
      toast({ title: "Regra removida com sucesso!" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao remover regra", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ nome: "", descricao: "", tipoPessoa: "ambos", tipoSeguroId: "", scoreBonus: 10, campo: "", operador: "=", valor: "" });
    setCondicoes([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingRule(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setFormData({
      nome: rule.nome,
      descricao: rule.descricao || "",
      tipoPessoa: rule.tipoPessoa,
      tipoSeguroId: rule.tipoSeguroId || "",
      scoreBonus: rule.scoreBonus || 10,
      campo: "",
      operador: "=",
      valor: "",
    });
    setCondicoes(rule.condicoes || []);
    setCreateDialogOpen(true);
  };

  const handleAddCondicao = () => {
    if (formData.campo && formData.valor) {
      setCondicoes([...condicoes, { campo: formData.campo, operador: formData.operador, valor: formData.valor }]);
      setFormData({ ...formData, campo: "", operador: "=", valor: "" });
    }
  };

  const handleRemoveCondicao = (index: number) => {
    setCondicoes(condicoes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!formData.nome.trim()) {
      toast({ variant: "destructive", title: "Nome é obrigatório" });
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...formData, condicoes, regras: {} });
    } else {
      createMutation.mutate({ ...formData, condicoes, regras: {} });
    }
  };

  const filteredRules = rules.filter((rule) => {
    const matchesSearch = rule.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rule.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      rule.tipoSeguroNome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = filterTipoPessoa === "todos" || 
      rule.tipoPessoa === filterTipoPessoa ||
      rule.tipoPessoa === "ambos";
    
    return matchesSearch && matchesTipo;
  });

  const rulesByProduct = filteredRules.reduce((acc, rule) => {
    const product = rule.tipoSeguroNome;
    if (!acc[product]) {
      acc[product] = [];
    }
    acc[product].push(rule);
    return acc;
  }, {} as Record<string, BusinessRule[]>);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Scale className="h-6 w-6" />
          Regras de Negócio
        </h1>
        <p className="text-muted-foreground">
          Critérios para identificar oportunidades de seguros baseado no perfil do cliente
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Catálogo de Regras</CardTitle>
            <CardDescription>
              Estas regras ajudam a identificar automaticamente quais produtos de seguro 
              são mais adequados para cada perfil de cliente
            </CardDescription>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRule ? "Editar Regra" : "Nova Regra de Negócio"}</DialogTitle>
                <DialogDescription>
                  {editingRule ? "Atualize os dados da regra" : "Crie uma nova regra para identificar oportunidades"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Regra *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Clientes com imóvel"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição da regra..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Pessoa</Label>
                    <Select value={formData.tipoPessoa} onValueChange={(value: any) => setFormData({ ...formData, tipoPessoa: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pf">Pessoa Física</SelectItem>
                        <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                        <SelectItem value="ambos">Ambas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Produto (Opcional)</Label>
                    <Select value={formData.tipoSeguroId || "nenhum"} onValueChange={(value) => setFormData({ ...formData, tipoSeguroId: value === "nenhum" ? "" : value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Todos os produtos</SelectItem>
                        {(tipos as any[]).map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Score de Bonus</Label>
                  <Input
                    type="number"
                    value={formData.scoreBonus}
                    onChange={(e) => setFormData({ ...formData, scoreBonus: parseInt(e.target.value) })}
                    min="0"
                  />
                </div>
              </div>

              {/* Condições */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-base font-semibold">Condições (Campos Socioeconômicos)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Select value={formData.campo} onValueChange={(v) => setFormData({ ...formData, campo: v })}>
                    <SelectTrigger className="col-span-2">
                      <SelectValue placeholder="Campo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idade">Idade</SelectItem>
                      <SelectItem value="profissao">Profissão</SelectItem>
                      <SelectItem value="renda">Renda Mensal</SelectItem>
                      <SelectItem value="estadoCivil">Estado Civil</SelectItem>
                      <SelectItem value="dependentes">Dependentes</SelectItem>
                      <SelectItem value="veiculo">Veículo</SelectItem>
                      <SelectItem value="imovel">Imóvel</SelectItem>
                      <SelectItem value="moto">Moto/Moto Elétrica</SelectItem>
                      <SelectItem value="caminhao">Caminhão/Frota</SelectItem>
                      <SelectItem value="segmento">Segmento Empresa</SelectItem>
                      <SelectItem value="maquinas">Máquinas/Equipamentos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={formData.operador} onValueChange={(v) => setFormData({ ...formData, operador: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="=">=</SelectItem>
                      <SelectItem value="!=">≠</SelectItem>
                      <SelectItem value=">">&gt;</SelectItem>
                      <SelectItem value=">=">&gt;=</SelectItem>
                      <SelectItem value="<">&lt;</SelectItem>
                      <SelectItem value="<=">&lt;=</SelectItem>
                      <SelectItem value="contains">contém</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Valor"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  />
                  <Button onClick={handleAddCondicao} variant="outline" className="col-span-4">
                    Adicionar Condição
                  </Button>
                </div>

                {/* Lista de condições adicionadas */}
                {condicoes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Condições Adicionadas:</Label>
                    <div className="space-y-1">
                      {condicoes.map((cond, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                          <span>{CAMPOS_LABELS[cond.campo] || cond.campo} {cond.operador} {cond.valor}</span>
                          <Button size="sm" variant="ghost" onClick={() => handleRemoveCondicao(idx)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingRule ? "Atualizar" : "Criar"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por regra ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-regras"
              />
            </div>
            <Select value={filterTipoPessoa} onValueChange={setFilterTipoPessoa}>
              <SelectTrigger className="w-[180px]" data-testid="select-filter-tipo">
                <SelectValue placeholder="Tipo de Pessoa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{rules.length}</p>
                    <p className="text-sm text-muted-foreground">Regras Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/5 border-blue-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {rules.filter(r => r.tipoPessoa === "pf" || r.tipoPessoa === "ambos").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Para Pessoa Física</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/5 border-amber-500/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                    <Briefcase className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {rules.filter(r => r.tipoPessoa === "pj" || r.tipoPessoa === "ambos").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Para Pessoa Jurídica</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Accordion type="multiple" className="space-y-2">
            {Object.entries(rulesByProduct).map(([product, productRules]) => (
              <AccordionItem key={product} value={product} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline" data-testid={`accordion-${product}`}>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-medium">{product}</span>
                    <Badge variant="secondary">{productRules.length} regras</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {productRules.map((rule) => (
                      <Card key={rule.id} className="bg-muted/30" data-testid={`card-rule-${rule.id}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{rule.nome}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {rule.tipoPessoa === "pf" ? (
                                    <><User className="h-3 w-3 mr-1" />PF</>
                                  ) : rule.tipoPessoa === "pj" ? (
                                    <><Briefcase className="h-3 w-3 mr-1" />PJ</>
                                  ) : (
                                    <><Users className="h-3 w-3 mr-1" />Ambos</>
                                  )}
                                </Badge>
                              </div>
                              {rule.descricao && (
                                <p className="text-sm text-muted-foreground">{rule.descricao}</p>
                              )}
                              {Array.isArray(rule.condicoes) && rule.condicoes.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <Info className="h-3 w-3" />
                                    Condições:
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {rule.condicoes.map((cond, i) => (
                                      <Badge key={i} variant="outline" className="text-xs font-normal">
                                        {formatCondition(cond)}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <Target className="h-3 w-3 mr-1" />
                                +{rule.scoreBonus || 0} pts
                              </Badge>
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(rule)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setDeleteId(rule.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredRules.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Scale className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhuma regra encontrada</p>
              <p className="text-sm">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Como Funcionam as Regras
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            As regras de negócio analisam automaticamente o perfil socioeconômico de cada cliente 
            e calculam um score de oportunidade para diferentes produtos de seguro.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Para Pessoa Física (PF):</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Idade e faixa etária
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Estado civil e dependentes
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Profissão e renda mensal
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Patrimônio (veículos, imóveis, embarcações)
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Para Pessoa Jurídica (PJ):</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Segmento e atividade econômica
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Porte da empresa e faturamento
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Número de funcionários
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="h-4 w-4 text-primary" />
                  Frota de veículos e equipamentos
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive">
            Remover
          </AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
