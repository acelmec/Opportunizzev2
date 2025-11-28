import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { PageLoadingState } from "@/components/loading-state";
import { formatCurrency } from "@/lib/validators";
import {
  Car,
  Home,
  Briefcase,
  Search,
  Filter,
  X,
  Plus,
  User,
  Building2,
  Ship,
  Package,
} from "lucide-react";
import type { Patrimonio, PessoaFisica, PessoaJuridica } from "@shared/schema";

const TIPO_LABELS: Record<string, string> = {
  veiculo: "Veículo",
  imovel: "Imóvel",
  equipamento: "Equipamento",
  colecao: "Coleção",
  embarcacao: "Embarcação",
};

const TIPO_ICONS: Record<string, typeof Car> = {
  veiculo: Car,
  imovel: Home,
  equipamento: Briefcase,
  colecao: Package,
  embarcacao: Ship,
};

interface PatrimonioWithOwner extends Patrimonio {
  pessoaFisica?: PessoaFisica | null;
  pessoaJuridica?: PessoaJuridica | null;
}

export default function Patrimonios() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [seguradoFilter, setSeguradoFilter] = useState<string>("");

  const { data: patrimonios, isLoading } = useQuery<PatrimonioWithOwner[]>({
    queryKey: ["/api/patrimonios"],
  });

  const filteredPatrimonios = patrimonios?.filter((p) => {
    if (tipoFilter && p.tipo !== tipoFilter) return false;
    if (seguradoFilter === "sim" && !p.seguradoAtual) return false;
    if (seguradoFilter === "nao" && p.seguradoAtual) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const ownerName = p.pessoaFisica?.nomeCompleto || p.pessoaJuridica?.razaoSocial || "";
      const desc = p.descricao || "";
      const marca = p.marcaVeiculo || "";
      const modelo = p.modeloVeiculo || "";
      const combined = `${ownerName} ${desc} ${marca} ${modelo}`.toLowerCase();
      if (!combined.includes(searchLower)) return false;
    }
    return true;
  });

  const hasFilters = search || tipoFilter || seguradoFilter;

  const clearFilters = () => {
    setSearch("");
    setTipoFilter("");
    setSeguradoFilter("");
  };

  const totalValor = filteredPatrimonios?.reduce(
    (acc, p) => acc + (Number(p.valorAproximado) || 0),
    0
  ) || 0;

  const totalNaoSegurado = filteredPatrimonios?.filter((p) => !p.seguradoAtual).length || 0;

  if (isLoading) {
    return <PageLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Patrimônios
          </h1>
          <p className="text-muted-foreground">
            Visualize todos os bens cadastrados
          </p>
        </div>
        <Button onClick={() => navigate("/patrimonios/novo")} data-testid="button-new">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Patrimônio
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Total de Bens</div>
            <div className="text-2xl font-bold font-mono">
              {filteredPatrimonios?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Valor Total</div>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalValor)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Não Segurados</div>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {totalNaoSegurado}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por proprietário, descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="select-tipo">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="veiculo">Veículo</SelectItem>
            <SelectItem value="imovel">Imóvel</SelectItem>
            <SelectItem value="equipamento">Equipamento</SelectItem>
            <SelectItem value="colecao">Coleção</SelectItem>
            <SelectItem value="embarcacao">Embarcação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={seguradoFilter} onValueChange={setSeguradoFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="select-segurado">
            <SelectValue placeholder="Segurado?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">Segurado</SelectItem>
            <SelectItem value="nao">Não Segurado</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {hasFilters && filteredPatrimonios && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{filteredPatrimonios.length} patrimônio(s)</span>
        </div>
      )}

      {filteredPatrimonios && filteredPatrimonios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatrimonios.map((p) => {
            const Icon = TIPO_ICONS[p.tipo] || Briefcase;
            return (
              <Card
                key={p.id}
                className="hover-elevate transition-all"
                data-testid={`card-patrimonio-${p.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">
                            {p.tipo === "veiculo"
                              ? `${p.marcaVeiculo} ${p.modeloVeiculo}`
                              : p.descricao || TIPO_LABELS[p.tipo]}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {TIPO_LABELS[p.tipo]}
                            {p.anoModelo && ` • ${p.anoModelo}`}
                          </p>
                        </div>
                        <Badge variant={p.seguradoAtual ? "default" : "outline"}>
                          {p.seguradoAtual ? "Segurado" : "Não segurado"}
                        </Badge>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        {p.pessoaFisica ? (
                          <>
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm truncate">
                              {p.pessoaFisica.nomeCompleto}
                            </span>
                          </>
                        ) : p.pessoaJuridica ? (
                          <>
                            <Building2 className="h-4 w-4 text-chart-2" />
                            <span className="text-sm truncate">
                              {p.pessoaJuridica.nomeFantasia || p.pessoaJuridica.razaoSocial}
                            </span>
                          </>
                        ) : null}
                      </div>

                      {p.valorAproximado && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Valor</span>
                            <span className="font-mono font-medium">
                              {formatCurrency(Number(p.valorAproximado))}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Car}
          title={hasFilters ? "Nenhum resultado" : "Nenhum patrimônio cadastrado"}
          description={
            hasFilters
              ? "Tente ajustar os filtros"
              : "Adicione veículos, imóveis e outros bens dos clientes"
          }
          action={
            hasFilters
              ? { label: "Limpar Filtros", onClick: clearFilters }
              : { label: "Adicionar Patrimônio", onClick: () => navigate("/patrimonios/novo") }
          }
        />
      )}
    </div>
  );
}
