import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, Globe, Shield, Package, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SeguradoraMaster, TipoSeguroMaster } from "@shared/schema";

interface SeguradoraProduto {
  id: string;
  tipoSeguroId: string;
  nome: string;
  categoria: string;
}

export default function AdminSeguradoresDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: seguradora, isLoading } = useQuery<SeguradoraMaster>({
    queryKey: [`/api/seguradoras/${id}`],
    enabled: !!id,
  });

  const { data: produtosVinculados } = useQuery<SeguradoraProduto[]>({
    queryKey: [`/api/seguradoras/${id}/produtos`],
    enabled: !!id,
  });

  const { data: todosProdutos } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/tipos-seguro"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (produtoId: string) => {
      return apiRequest("DELETE", `/api/seguradora-produtos/${produtoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/seguradoras/${id}/produtos`] });
      toast({ title: "Produto removido", description: "Produto desvinculado com sucesso" });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tipoSeguroIds: string[]) => {
      for (const tipoId of tipoSeguroIds) {
        await apiRequest("POST", "/api/seguradora-produtos", {
          seguradoraId: id,
          tipoSeguroId: tipoId,
          ativo: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/seguradoras/${id}/produtos`] });
      setSelectedProducts([]);
      toast({ title: "Produtos adicionados", description: "Produtos vinculados com sucesso" });
    },
  });

  if (!id) return <div>Seguradora não encontrada</div>;

  const vinculadosIds = produtosVinculados?.map((p) => p.tipoSeguroId) || [];
  const naoDvinculados = todosProdutos?.filter((p) => !vinculadosIds.includes(p.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/seguradoras")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : seguradora ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-3xl">{seguradora.nome}</CardTitle>
                    <CardDescription className="mt-2">
                      {seguradora.cnpj ? `CNPJ: ${seguradora.cnpj}` : ""}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={seguradora.ativo ? "default" : "secondary"}>
                  {seguradora.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {seguradora.codigoSusep && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código SUSEP</p>
                    <p className="font-medium">{seguradora.codigoSusep}</p>
                  </div>
                )}
                {seguradora.telefoneMatriz && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{seguradora.telefoneMatriz}</p>
                    </div>
                  </div>
                )}
                {seguradora.emailMatriz && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-sm">{seguradora.emailMatriz}</p>
                    </div>
                  </div>
                )}
                {seguradora.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={seguradora.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm text-primary hover:underline"
                      >
                        Visitar
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  <CardTitle>Produtos Vinculados</CardTitle>
                </div>
                <CardDescription>
                  {produtosVinculados?.length || 0} produto(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {produtosVinculados && produtosVinculados.length > 0 ? (
                  <div className="space-y-2">
                    {produtosVinculados.map((produto) => (
                      <div
                        key={produto.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-primary flex-shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {produto.categoria}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(produto.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum produto vinculado
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  <CardTitle>Adicionar Produtos</CardTitle>
                </div>
                <CardDescription>
                  {naoDvinculados.length} produto(s) disponível(is)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {naoDvinculados.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {naoDvinculados.map((produto) => (
                        <div key={produto.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={produto.id}
                            checked={selectedProducts.includes(produto.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([...selectedProducts, produto.id]);
                              } else {
                                setSelectedProducts(
                                  selectedProducts.filter((p) => p !== produto.id)
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={produto.id}
                            className="flex-1 cursor-pointer text-sm font-normal"
                          >
                            <span>{produto.nome}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              ({produto.categoria})
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                    <Button
                      onClick={() => addMutation.mutate(selectedProducts)}
                      disabled={selectedProducts.length === 0 || addMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar ({selectedProducts.length})
                    </Button>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Todos os produtos já foram vinculados
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Seguradora não encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
