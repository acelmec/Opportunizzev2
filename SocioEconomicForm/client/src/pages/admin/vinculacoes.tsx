import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link2, Plus, Trash2, Shield, FileText } from "lucide-react";
import type { SeguradoraMaster, TipoSeguroMaster, SeguradoraProduto } from "@shared/schema";

export default function AdminVinculacoes() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSeguradora, setSelectedSeguradora] = useState<string>("");
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const [filterSeguradora, setFilterSeguradora] = useState<string>("all");

  const { data: seguradoras } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/admin/seguradoras"],
  });

  const { data: tipos } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const { data: vinculacoes, isLoading } = useQuery<SeguradoraProduto[]>({
    queryKey: ["/api/admin/seguradora-produtos"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/seguradora-produtos", {
        seguradoraId: selectedSeguradora,
        tipoSeguroId: selectedTipo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradora-produtos"] });
      toast({
        title: "Vinculação criada",
        description: "A vinculação foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      setSelectedSeguradora("");
      setSelectedTipo("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a vinculação.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/seguradora-produtos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradora-produtos"] });
      toast({
        title: "Vinculação removida",
        description: "A vinculação foi removida com sucesso.",
      });
    },
  });

  const getSeguradoraNome = (id: string) => {
    return seguradoras?.find(s => s.id === id)?.nome || "Desconhecido";
  };

  const getTipoNome = (id: string) => {
    return tipos?.find(t => t.id === id)?.nome || "Desconhecido";
  };

  const filteredVinculacoes = vinculacoes?.filter((v) => {
    return filterSeguradora === "all" || v.seguradoraId === filterSeguradora;
  });

  const groupedBySeguradora = filteredVinculacoes?.reduce((acc, v) => {
    const segId = v.seguradoraId;
    if (!acc[segId]) {
      acc[segId] = [];
    }
    acc[segId].push(v);
    return acc;
  }, {} as Record<string, SeguradoraProduto[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Vinculações Seguradora-Produto
          </h1>
          <p className="text-muted-foreground">
            Associe seguradoras aos tipos de seguro que oferecem
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-vinculacao">
              <Plus className="h-4 w-4 mr-2" />
              Nova Vinculação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Vinculação</DialogTitle>
              <DialogDescription>
                Associe uma seguradora a um tipo de seguro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Seguradora</label>
                <Select value={selectedSeguradora} onValueChange={setSelectedSeguradora}>
                  <SelectTrigger data-testid="select-vinculacao-seguradora">
                    <SelectValue placeholder="Selecione a seguradora" />
                  </SelectTrigger>
                  <SelectContent>
                    {seguradoras?.filter(s => s.ativo).map((seg) => (
                      <SelectItem key={seg.id} value={seg.id}>
                        {seg.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Seguro</label>
                <Select value={selectedTipo} onValueChange={setSelectedTipo}>
                  <SelectTrigger data-testid="select-vinculacao-tipo">
                    <SelectValue placeholder="Selecione o tipo de seguro" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipos?.filter(t => t.ativo).map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!selectedSeguradora || !selectedTipo || createMutation.isPending}
                className="w-full"
                data-testid="button-save-vinculacao"
              >
                {createMutation.isPending ? "Salvando..." : "Criar Vinculação"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filterSeguradora} onValueChange={setFilterSeguradora}>
          <SelectTrigger className="w-[250px]" data-testid="select-filter-seguradora">
            <SelectValue placeholder="Filtrar por seguradora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as seguradoras</SelectItem>
            {seguradoras?.filter(s => s.ativo).map((seg) => (
              <SelectItem key={seg.id} value={seg.id}>
                {seg.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="outline">
          {filteredVinculacoes?.length || 0} vinculações
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedBySeguradora && Object.keys(groupedBySeguradora).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(groupedBySeguradora).map(([segId, items]) => (
            <Card key={segId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {getSeguradoraNome(segId)}
                </CardTitle>
                <CardDescription>
                  {items.length} produto(s) vinculado(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {items.map((v) => (
                    <Badge
                      key={v.id}
                      variant="secondary"
                      className="flex items-center gap-2 py-1.5"
                    >
                      <FileText className="h-3 w-3" />
                      {getTipoNome(v.tipoSeguroId)}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => deleteMutation.mutate(v.id)}
                        data-testid={`button-delete-vinculacao-${v.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma vinculação encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
