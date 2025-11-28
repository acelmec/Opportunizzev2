import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PFCard } from "@/components/client-card";
import { EmptyState } from "@/components/empty-state";
import { ClientListSkeleton } from "@/components/loading-state";
import { Search, UserPlus, Users, Filter, X } from "lucide-react";
import type { PessoaFisica } from "@shared/schema";

export default function ClientesPF() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<string>("");
  const [scoreMin, setScoreMin] = useState<string>("");

  const { data: clientes, isLoading } = useQuery<PessoaFisica[]>({
    queryKey: ["/api/pessoas-fisicas"],
  });

  const filteredClientes = clientes?.filter((cliente) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesName = cliente.nomeCompleto.toLowerCase().includes(searchLower);
      const matchesCPF = cliente.cpf.includes(search.replace(/\D/g, ""));
      const matchesEmail = cliente.email?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesCPF && !matchesEmail) return false;
    }
    if (estadoCivil && cliente.estadoCivil !== estadoCivil) return false;
    if (scoreMin) {
      const minScore = parseInt(scoreMin);
      const maxScore = Math.max(
        cliente.scoreVida || 0,
        cliente.scoreAuto || 0,
        cliente.scoreResidencial || 0,
        cliente.scoreRcProfissional || 0,
        cliente.scorePrevidencia || 0,
        cliente.scoreSaude || 0
      );
      if (maxScore < minScore) return false;
    }
    return true;
  });

  const hasFilters = search || estadoCivil || scoreMin;

  const clearFilters = () => {
    setSearch("");
    setEstadoCivil("");
    setScoreMin("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Pessoas Físicas
          </h1>
          <p className="text-muted-foreground">
            Gerencie os cadastros de clientes pessoa física
          </p>
        </div>
        <Button onClick={() => navigate("/cadastro/pf")} data-testid="button-new-pf">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={estadoCivil} onValueChange={setEstadoCivil}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-estado-civil">
            <SelectValue placeholder="Estado Civil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solteiro">Solteiro(a)</SelectItem>
            <SelectItem value="casado">Casado(a)</SelectItem>
            <SelectItem value="divorciado">Divorciado(a)</SelectItem>
            <SelectItem value="viuvo">Viúvo(a)</SelectItem>
            <SelectItem value="uniao_estavel">União Estável</SelectItem>
          </SelectContent>
        </Select>
        <Select value={scoreMin} onValueChange={setScoreMin}>
          <SelectTrigger className="w-full md:w-40" data-testid="select-score">
            <SelectValue placeholder="Score Mín." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="70">Score 70+</SelectItem>
            <SelectItem value="50">Score 50+</SelectItem>
            <SelectItem value="30">Score 30+</SelectItem>
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

      {hasFilters && filteredClientes && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            {filteredClientes.length} resultado(s) encontrado(s)
          </span>
        </div>
      )}

      {isLoading ? (
        <ClientListSkeleton />
      ) : filteredClientes && filteredClientes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClientes.map((cliente) => (
            <PFCard key={cliente.id} cliente={cliente} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={hasFilters ? "Nenhum resultado" : "Nenhum cliente cadastrado"}
          description={
            hasFilters
              ? "Tente ajustar os filtros de busca"
              : "Comece cadastrando seu primeiro cliente pessoa física"
          }
          action={
            hasFilters
              ? { label: "Limpar Filtros", onClick: clearFilters }
              : { label: "Cadastrar Cliente", onClick: () => navigate("/cadastro/pf") }
          }
        />
      )}
    </div>
  );
}
