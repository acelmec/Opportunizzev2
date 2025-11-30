import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import type { TipoSeguroMaster } from "@shared/schema";

interface SeguradoraCatalogo {
  seguradora: {
    id: string;
    nome: string;
    cnpj: string;
    codigoSusep: string;
    ativo: boolean;
  };
  nomeProduto: string;
  observacoes?: string;
}

interface CatalogoResponse {
  tipoSeguro: TipoSeguroMaster;
  seguradoras: SeguradoraCatalogo[];
  total: number;
}

export default function TiposSeguroDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: tipoSeguro, isLoading: tipoLoading } = useQuery<TipoSeguroMaster>({
    queryKey: [`/api/tipos-seguro/${id}`],
    enabled: !!id,
  });

  const { data: catalogoData, isLoading: catalogoLoading } = useQuery<CatalogoResponse>({
    queryKey: [`/api/catalogo/seguradoras-por-produto/${id}`],
    enabled: !!id,
  });

  if (!id) return <div>Tipo de seguro não encontrado</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/tipos-seguro")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {tipoLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : tipoSeguro ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-3xl">{tipoSeguro.nome}</CardTitle>
                    <CardDescription className="mt-2 capitalize">
                      Categoria: {tipoSeguro.categoria}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={tipoSeguro.ativo ? "default" : "secondary"}>
                  {tipoSeguro.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            {tipoSeguro.descricao && (
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2 font-medium">Descrição:</p>
                  <p>{tipoSeguro.descricao}</p>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Seguradoras que Comercializam este Produto</CardTitle>
              </div>
              <CardDescription>
                {catalogoData?.total || 0} seguradora(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {catalogoLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : catalogoData?.seguradoras && catalogoData.seguradoras.length > 0 ? (
                <div className="space-y-3">
                  {catalogoData.seguradoras.map((item) => (
                    <div
                      key={item.seguradora.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="h-4 w-4 text-primary" />
                          <p className="font-semibold">{item.seguradora.nome}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          CNPJ: {item.seguradora.cnpj}
                        </p>
                        {item.nomeProduto && (
                          <p className="text-sm text-muted-foreground mb-1">
                            <span className="font-medium">Nome do Produto:</span> {item.nomeProduto}
                          </p>
                        )}
                        {item.observacoes && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Observações:</span> {item.observacoes}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">{item.seguradora.codigoSusep}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma seguradora comercializa este tipo de seguro no momento
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Tipo de seguro não encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
