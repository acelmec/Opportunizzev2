import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { PageLoadingState } from "@/components/loading-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/validators";
import {
  Target,
  Search,
  Filter,
  X,
  Plus,
  User,
  Building2,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Oportunidade, PessoaFisica, PessoaJuridica } from "@shared/schema";

const STATUS_LABELS: Record<string, string> = {
  novo: "Novo",
  em_proposta: "Em Proposta",
  enviado: "Enviado",
  aceito: "Aceito",
  recusado: "Recusado",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  em_proposta: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  enviado: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  aceito: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  recusado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PRODUTO_LABELS: Record<string, string> = {
  vida: "Seguro Vida",
  auto: "Seguro Auto",
  residencial: "Residencial",
  rc_profissional: "RC Profissional",
  previdencia: "Previdência",
  saude: "Saúde",
};

interface OportunidadeWithCliente extends Oportunidade {
  pessoaFisica?: PessoaFisica | null;
  pessoaJuridica?: PessoaJuridica | null;
}

export default function Oportunidades() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [produtoFilter, setProdutoFilter] = useState<string>("");

  const { data: oportunidades, isLoading } = useQuery<OportunidadeWithCliente[]>({
    queryKey: ["/api/oportunidades"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest("PATCH", `/api/oportunidades/${id}`, { status });
    },
    onSuccess: () => {
      toast({ title: "Status atualizado" });
      queryClient.invalidateQueries({ queryKey: ["/api/oportunidades"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    },
  });

  const filteredOportunidades = oportunidades?.filter((op) => {
    if (statusFilter && op.status !== statusFilter) return false;
    if (produtoFilter && op.produto !== produtoFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const clienteName = op.pessoaFisica?.nomeCompleto || op.pessoaJuridica?.razaoSocial || "";
      if (!clienteName.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  const hasFilters = search || statusFilter || produtoFilter;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setProdutoFilter("");
  };

  const groupedByStatus = filteredOportunidades?.reduce((acc, op) => {
    const status = op.status || "novo";
    if (!acc[status]) acc[status] = [];
    acc[status].push(op);
    return acc;
  }, {} as Record<string, OportunidadeWithCliente[]>);

  if (isLoading) {
    return <PageLoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Oportunidades
          </h1>
          <p className="text-muted-foreground">
            Gerencie o pipeline de propostas e oportunidades
          </p>
        </div>
        <Button onClick={() => navigate("/oportunidades/novo")} data-testid="button-new-op">
          <Plus className="mr-2 h-4 w-4" />
          Nova Oportunidade
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40" data-testid="select-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="novo">Novo</SelectItem>
            <SelectItem value="em_proposta">Em Proposta</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aceito">Aceito</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={produtoFilter} onValueChange={setProdutoFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-produto">
            <SelectValue placeholder="Produto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vida">Seguro Vida</SelectItem>
            <SelectItem value="auto">Seguro Auto</SelectItem>
            <SelectItem value="residencial">Residencial</SelectItem>
            <SelectItem value="rc_profissional">RC Profissional</SelectItem>
            <SelectItem value="previdencia">Previdência</SelectItem>
            <SelectItem value="saude">Saúde</SelectItem>
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

      {hasFilters && filteredOportunidades && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{filteredOportunidades.length} oportunidade(s)</span>
        </div>
      )}

      {filteredOportunidades && filteredOportunidades.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {["novo", "em_proposta", "enviado", "aceito", "recusado"].map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">{STATUS_LABELS[status]}</h3>
                <Badge variant="secondary" className="text-xs">
                  {groupedByStatus?.[status]?.length || 0}
                </Badge>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {groupedByStatus?.[status]?.map((op) => (
                  <Card
                    key={op.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => navigate(`/oportunidades/${op.id}`)}
                    data-testid={`card-op-${op.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {op.pessoaFisica ? (
                          <User className="h-4 w-4 text-primary" />
                        ) : (
                          <Building2 className="h-4 w-4 text-chart-2" />
                        )}
                        <span className="text-sm font-medium truncate">
                          {op.pessoaFisica?.nomeCompleto ||
                            op.pessoaJuridica?.nomeFantasia ||
                            op.pessoaJuridica?.razaoSocial ||
                            "Cliente"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className="text-xs"
                        >
                          {PRODUTO_LABELS[op.produto] || op.produto}
                        </Badge>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            <span>Score: {op.scorePotencial || 0}</span>
                          </div>
                          {op.premioEstimado && (
                            <span className="text-xs font-mono font-medium">
                              {formatCurrency(Number(op.premioEstimado))}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title={hasFilters ? "Nenhum resultado" : "Nenhuma oportunidade"}
          description={
            hasFilters
              ? "Tente ajustar os filtros"
              : "Crie oportunidades a partir dos perfis de clientes"
          }
          action={
            hasFilters
              ? { label: "Limpar Filtros", onClick: clearFilters }
              : { label: "Nova Oportunidade", onClick: () => navigate("/oportunidades/novo") }
          }
        />
      )}
    </div>
  );
}
