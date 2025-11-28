import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/loading-state";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoPessoa, setFilterTipoPessoa] = useState<string>("todos");

  const { data: rules = [], isLoading } = useQuery<BusinessRule[]>({
    queryKey: ["/api/regras-negocio"],
  });

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
        <CardHeader>
          <CardTitle>Catálogo de Regras</CardTitle>
          <CardDescription>
            Estas regras ajudam a identificar automaticamente quais produtos de seguro 
            são mais adequados para cada perfil de cliente
          </CardDescription>
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
                            <div className="text-right">
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                <Target className="h-3 w-3 mr-1" />
                                +{rule.scoreBonus || 0} pts
                              </Badge>
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
    </div>
  );
}
