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
import { Package, Plus, Trash2, Shield } from "lucide-react";
import type { SeguradoraMaster, TipoSeguroMaster, SeguradoraProduto } from "@shared/schema";

const categoriaLabels: Record<string, string> = {
  automovel: "Automóvel",
  residencial: "Residencial",
  vida: "Vida",
  saude: "Saúde",
  empresarial: "Empresarial",
  rural: "Rural",
  transporte: "Transporte",
  responsabilidade: "Responsabilidade",
  outros: "Outros",
};

export default function AdminProdutos() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<string>("");
  const [selectedSeguradora, setSelectedSeguradora] = useState<string>("");

  const { data: seguradoras } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/admin/seguradoras"],
  });

  const { data: produtos, isLoading } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const { data: vinculacoes } = useQuery<SeguradoraProduto[]>({
    queryKey: ["/api/admin/seguradora-produtos"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/seguradora-produtos", {
        seguradoraId: selectedSeguradora,
        tipoSeguroId: selectedProduto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradora-produtos"] });
      toast({
        title: "Seguradora associada",
        description: "A seguradora foi associada ao produto com sucesso.",
      });
      setIsDialogOpen(false);
      setSelectedSeguradora("");
      setSelectedProduto("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível associar a seguradora.",
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
        title: "Seguradora removida",
        description: "A seguradora foi removida do produto com sucesso.",
      });
    },
  });

  const getSeguradorasForProduto = (produtoId: string): SeguradoraMaster[] => {
    const seguradoraIds = vinculacoes
      ?.filter(v => v.tipoSeguroId === produtoId)
      .map(v => v.seguradoraId) || [];
    
    return seguradoras?.filter(s => seguradoraIds.includes(s.id)) || [];
  };

  const getVinculacaoId = (produtoId: string, seguradoraId: string): string | undefined => {
    return vinculacoes?.find(v => v.tipoSeguroId === produtoId && v.seguradoraId === seguradoraId)?.id;
  };

  const produtosPorCategoria = produtos?.reduce((acc, p) => {
    const cat = p.categoria;
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(p);
    return acc;
  }, {} as Record<string, TipoSeguroMaster[]>) || {};

  const categoriasOrdenadas = Object.keys(produtosPorCategoria).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Produtos de Seguro
          </h1>
          <p className="text-muted-foreground">
            Visualize todos os produtos e quais seguradoras comercializam cada um
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-produto-seguradora">
              <Plus className="h-4 w-4 mr-2" />
              Associar Seguradora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Associar Seguradora a Produto</DialogTitle>
              <DialogDescription>
                Selecione um produto e uma seguradora para criar a associação
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Produto</label>
                <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                  <SelectTrigger data-testid="select-produto-vinculacao">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} ({categoriaLabels[p.categoria]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Seguradora</label>
                <Select value={selectedSeguradora} onValueChange={setSelectedSeguradora}>
                  <SelectTrigger data-testid="select-seguradora-vinculacao">
                    <SelectValue placeholder="Selecione uma seguradora" />
                  </SelectTrigger>
                  <SelectContent>
                    {seguradoras?.filter(s => s.ativo).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => createMutation.mutate()} 
                disabled={!selectedProduto || !selectedSeguradora || createMutation.isPending}
                className="w-full"
                data-testid="button-save-produto-seguradora"
              >
                {createMutation.isPending ? "Associando..." : "Associar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-32" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {categoriasOrdenadas.map((categoria) => (
            <div key={categoria}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {categoriaLabels[categoria]}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {produtosPorCategoria[categoria]?.map((produto) => {
                  const seguradorasVinculadas = getSeguradorasForProduto(produto.id);
                  return (
                    <Card key={produto.id} data-testid={`card-produto-${produto.id}`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{produto.nome}</CardTitle>
                        {produto.descricao && (
                          <CardDescription className="text-xs">
                            {produto.descricao}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Seguradoras ({seguradorasVinculadas.length})
                          </p>
                          {seguradorasVinculadas.length > 0 ? (
                            <div className="space-y-2">
                              {seguradorasVinculadas.map((seg) => (
                                <div
                                  key={seg.id}
                                  className="flex items-center justify-between gap-2 p-2 bg-secondary rounded text-sm"
                                  data-testid={`seguradora-item-${seg.id}`}
                                >
                                  <span className="flex items-center gap-2 flex-1 min-w-0">
                                    <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                                    <span className="truncate">{seg.nome}</span>
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const vinculacaoId = getVinculacaoId(produto.id, seg.id);
                                      if (vinculacaoId) {
                                        deleteMutation.mutate(vinculacaoId);
                                      }
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="h-6 w-6 p-0"
                                    data-testid={`button-remove-seguradora-${seg.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhuma seguradora associada
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
