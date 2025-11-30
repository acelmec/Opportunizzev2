import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Mail, Globe, Shield, Package } from "lucide-react";
import type { SeguradoraMaster } from "@shared/schema";

interface SeguradoraProduto {
  id: string;
  tipoSeguroId: string;
  nome: string;
  categoria: string;
}

export default function SeguradoresDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: seguradora, isLoading } = useQuery<SeguradoraMaster>({
    queryKey: [`/api/seguradoras/${id}`],
    enabled: !!id,
  });

  const { data: produtos } = useQuery<SeguradoraProduto[]>({
    queryKey: [`/api/seguradoras/${id}/produtos`],
    enabled: !!id,
  });

  if (!id) return <div>Seguradora não encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/seguradoras")}>
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle>Produtos Comercializados</CardTitle>
              </div>
              <CardDescription>
                {produtos?.length || 0} tipo(s) de seguro disponível(is)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {produtos && produtos.length > 0 ? (
                <div className="space-y-2">
                  {produtos.map((produto) => (
                    <div
                      key={produto.id}
                      className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Package className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-medium">{produto.nome}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {produto.categoria}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum produto vinculado a esta seguradora
                </p>
              )}
            </CardContent>
          </Card>
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
