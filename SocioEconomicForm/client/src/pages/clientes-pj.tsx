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
import { PJCard } from "@/components/client-card";
import { EmptyState } from "@/components/empty-state";
import { ClientListSkeleton } from "@/components/loading-state";
import { Search, Building2, Filter, X, Plus } from "lucide-react";
import type { PessoaJuridica } from "@shared/schema";

export default function ClientesPJ() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [porte, setPorte] = useState<string>("");
  const [scoreMin, setScoreMin] = useState<string>("");

  const { data: empresas, isLoading } = useQuery<PessoaJuridica[]>({
    queryKey: ["/api/pessoas-juridicas"],
  });

  const filteredEmpresas = empresas?.filter((empresa) => {
    if (search) {
      const searchLower = search.toLowerCase();
      const matchesRazao = empresa.razaoSocial.toLowerCase().includes(searchLower);
      const matchesFantasia = empresa.nomeFantasia?.toLowerCase().includes(searchLower);
      const matchesCNPJ = empresa.cnpj.includes(search.replace(/\D/g, ""));
      const matchesEmail = empresa.email?.toLowerCase().includes(searchLower);
      if (!matchesRazao && !matchesFantasia && !matchesCNPJ && !matchesEmail) return false;
    }
    if (porte && empresa.porteEmpresa !== porte) return false;
    if (scoreMin) {
      const minScore = parseInt(scoreMin);
      const maxScore = Math.max(
        empresa.scoreVidaColetiva || 0,
        empresa.scoreSaudeColetiva || 0,
        empresa.scorePatrimonial || 0,
        empresa.scoreRc || 0
      );
      if (maxScore < minScore) return false;
    }
    return true;
  });

  const hasFilters = search || porte || scoreMin;

  const clearFilters = () => {
    setSearch("");
    setPorte("");
    setScoreMin("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Pessoas Jurídicas
          </h1>
          <p className="text-muted-foreground">
            Gerencie os cadastros de empresas
          </p>
        </div>
        <Button onClick={() => navigate("/cadastro/pj")} data-testid="button-new-pj">
          <Plus className="mr-2 h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, CNPJ ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <Select value={porte} onValueChange={setPorte}>
          <SelectTrigger className="w-full md:w-48" data-testid="select-porte">
            <SelectValue placeholder="Porte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="micro">Microempresa</SelectItem>
            <SelectItem value="pequeno">Pequena</SelectItem>
            <SelectItem value="medio">Média</SelectItem>
            <SelectItem value="grande">Grande</SelectItem>
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

      {hasFilters && filteredEmpresas && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>
            {filteredEmpresas.length} resultado(s) encontrado(s)
          </span>
        </div>
      )}

      {isLoading ? (
        <ClientListSkeleton />
      ) : filteredEmpresas && filteredEmpresas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredEmpresas.map((empresa) => (
            <PJCard key={empresa.id} empresa={empresa} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={hasFilters ? "Nenhum resultado" : "Nenhuma empresa cadastrada"}
          description={
            hasFilters
              ? "Tente ajustar os filtros de busca"
              : "Comece cadastrando sua primeira empresa"
          }
          action={
            hasFilters
              ? { label: "Limpar Filtros", onClick: clearFilters }
              : { label: "Cadastrar Empresa", onClick: () => navigate("/cadastro/pj") }
          }
        />
      )}
    </div>
  );
}
