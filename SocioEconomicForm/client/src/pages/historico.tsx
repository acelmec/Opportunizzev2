import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { PageLoadingState } from "@/components/loading-state";
import {
  History,
  Search,
  Filter,
  X,
  Phone,
  Mail,
  MapPin,
  FileText,
  RefreshCw,
  MessageSquare,
  User,
  Building2,
} from "lucide-react";
import type { Interacao, PessoaFisica, PessoaJuridica } from "@shared/schema";

const TIPO_LABELS: Record<string, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  visita: "Visita",
  proposta: "Proposta",
  renovacao: "Renovação",
  whatsapp: "WhatsApp",
};

const TIPO_ICONS: Record<string, typeof Phone> = {
  ligacao: Phone,
  email: Mail,
  visita: MapPin,
  proposta: FileText,
  renovacao: RefreshCw,
  whatsapp: MessageSquare,
};

interface InteracaoWithCliente extends Interacao {
  pessoaFisica?: PessoaFisica | null;
  pessoaJuridica?: PessoaJuridica | null;
}

export default function Historico() {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("");

  const { data: interacoes, isLoading } = useQuery<InteracaoWithCliente[]>({
    queryKey: ["/api/interacoes"],
  });

  const filteredInteracoes = interacoes?.filter((i) => {
    if (tipoFilter && i.tipo !== tipoFilter) return false;
    if (search) {
      const searchLower = search.toLowerCase();
      const clienteName = i.pessoaFisica?.nomeCompleto || i.pessoaJuridica?.razaoSocial || "";
      const desc = i.descricao || "";
      if (!clienteName.toLowerCase().includes(searchLower) && !desc.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  const hasFilters = search || tipoFilter;

  const clearFilters = () => {
    setSearch("");
    setTipoFilter("");
  };

  const groupByDate = (items: InteracaoWithCliente[]) => {
    const groups: Record<string, InteracaoWithCliente[]> = {};
    items.forEach((item) => {
      const date = new Date(item.createdAt!).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    return groups;
  };

  if (isLoading) {
    return <PageLoadingState />;
  }

  const groupedInteracoes = filteredInteracoes ? groupByDate(filteredInteracoes) : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-page-title">
          Histórico de Interações
        </h1>
        <p className="text-muted-foreground">
          Acompanhe todas as interações com clientes
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-tipo">
            <SelectValue placeholder="Tipo de Interação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ligacao">Ligação</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="proposta">Proposta</SelectItem>
            <SelectItem value="renovacao">Renovação</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
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

      {hasFilters && filteredInteracoes && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>{filteredInteracoes.length} interação(ões)</span>
        </div>
      )}

      {filteredInteracoes && filteredInteracoes.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedInteracoes).map(([date, items]) => (
            <div key={date}>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 capitalize">
                {date}
              </h2>
              <div className="space-y-3">
                {items.map((interacao) => {
                  const Icon = TIPO_ICONS[interacao.tipo] || History;
                  return (
                    <Card key={interacao.id} data-testid={`card-interacao-${interacao.id}`}>
                      <CardContent className="py-4">
                        <div className="flex gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="capitalize">
                                {TIPO_LABELS[interacao.tipo] || interacao.tipo}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(interacao.createdAt!).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              {interacao.pessoaFisica ? (
                                <>
                                  <User className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">
                                    {interacao.pessoaFisica.nomeCompleto}
                                  </span>
                                </>
                              ) : interacao.pessoaJuridica ? (
                                <>
                                  <Building2 className="h-4 w-4 text-chart-2" />
                                  <span className="font-medium text-sm">
                                    {interacao.pessoaJuridica.nomeFantasia ||
                                      interacao.pessoaJuridica.razaoSocial}
                                  </span>
                                </>
                              ) : null}
                            </div>
                            {interacao.descricao && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {interacao.descricao}
                              </p>
                            )}
                            {interacao.resultado && (
                              <div className="mt-2 text-sm">
                                <span className="text-muted-foreground">Resultado: </span>
                                <span>{interacao.resultado}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title={hasFilters ? "Nenhum resultado" : "Nenhuma interação registrada"}
          description={
            hasFilters
              ? "Tente ajustar os filtros"
              : "As interações com clientes aparecerão aqui"
          }
          action={
            hasFilters ? { label: "Limpar Filtros", onClick: clearFilters } : undefined
          }
        />
      )}
    </div>
  );
}
