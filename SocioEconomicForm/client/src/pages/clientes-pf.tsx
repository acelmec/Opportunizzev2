import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { EmptyState } from "@/components/empty-state";
import { ClientListSkeleton } from "@/components/loading-state";
import { Search, UserPlus, Users, Filter, X, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PessoaFisica } from "@shared/schema";

interface ClienteComConvite extends PessoaFisica {
  conviteStatus?: "sem_convite" | "pendente" | "aceito";
  conviteId?: string;
}

export default function ClientesPF() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<string>("");
  const [scoreMin, setScoreMin] = useState<string>("");
  const [selectedClientes, setSelectedClientes] = useState<Set<string>>(new Set());

  const { data: clientes, isLoading } = useQuery<ClienteComConvite[]>({
    queryKey: ["/api/pessoas-fisicas-com-convites"],
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

  const sendConvitesMutation = useMutation({
    mutationFn: async (clienteIds: string[]) => {
      return await apiRequest("POST", "/api/convites/batch-enviar", { clienteIds });
    },
    onSuccess: () => {
      toast({ title: "Convites enviados com sucesso!" });
      setSelectedClientes(new Set());
      queryClient.invalidateQueries({ queryKey: ["/api/pessoas-fisicas-com-convites"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(new Set(filteredClientes?.map((c) => c.id) || []));
    } else {
      setSelectedClientes(new Set());
    }
  };

  const handleSelectCliente = (clienteId: string, checked: boolean) => {
    const newSelected = new Set(selectedClientes);
    if (checked) {
      newSelected.add(clienteId);
    } else {
      newSelected.delete(clienteId);
    }
    setSelectedClientes(newSelected);
  };

  const getStatusBadge = (status?: string) => {
    if (status === "pendente") {
      return <Badge variant="outline" className="bg-yellow-50">⏱️ Pendente</Badge>;
    }
    if (status === "aceito") {
      return <Badge variant="default" className="bg-green-600">✓ Aceito</Badge>;
    }
    return <Badge variant="secondary">- Sem Convite</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Clientes Cadastrados
          </h1>
          <p className="text-muted-foreground">
            Gerencie e envie convites para seus clientes
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

      {selectedClientes.size > 0 && (
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-200">
          <span className="font-medium">{selectedClientes.size} cliente(s) selecionado(s)</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => sendConvitesMutation.mutate(Array.from(selectedClientes))}
              disabled={sendConvitesMutation.isPending}
            >
              {sendConvitesMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
              ) : (
                <><Mail className="mr-2 h-4 w-4" />Enviar Convites</>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedClientes(new Set())}>
              Limpar
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <ClientListSkeleton />
      ) : filteredClientes && filteredClientes.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedClientes.size === filteredClientes.length && filteredClientes.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead className="w-32">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedClientes.has(cliente.id)}
                      onCheckedChange={(checked) => handleSelectCliente(cliente.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{cliente.nomeCompleto}</TableCell>
                  <TableCell>{cliente.cpf}</TableCell>
                  <TableCell>{cliente.email || "-"}</TableCell>
                  <TableCell>{getStatusBadge(cliente.conviteStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cliente cadastrado"
          description="Comece cadastrando seu primeiro cliente pessoa física"
          action={{ label: "Cadastrar Cliente", onClick: () => navigate("/cadastro/pf") }}
        />
      )}
    </div>
  );
}
