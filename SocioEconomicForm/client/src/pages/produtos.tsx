import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Package, Shield } from "lucide-react";
import type { TipoSeguroMaster, SeguradoraMaster, SeguradoraProduto } from "@shared/schema";

const categoriaLabels: Record<string, string> = {
  automovel: "Automóvel",
  motocicleta: "Motocicleta",
  caminhao: "Caminhão",
  nautico: "Náutico",
  aeronautico: "Aeronáutico",
  vida: "Vida",
  vida_coletivo: "Vida Coletivo",
  saude: "Saúde",
  saude_coletivo: "Saúde Coletivo",
  odontologico: "Odontológico",
  residencial: "Residencial",
  empresarial: "Empresarial",
  condominio: "Condomínio",
  rc_profissional: "RC Profissional",
  rc_geral: "RC Geral",
  garantia: "Garantia",
  fianca_locaticia: "Fiança Locatícia",
  viagem: "Viagem",
  pet: "Pet",
  equipamentos: "Equipamentos",
  cyber: "Cyber",
  rural: "Rural",
  previdencia: "Previdência",
  consorcio: "Consórcio",
  capitalizacao: "Capitalização",
  transporte: "Transporte",
  frota: "Frota",
  acidentes_pessoais: "Acidentes Pessoais",
  rc_obras: "RC Obras",
  rc_produtos: "RC Produtos",
  rc_ambiental: "RC Ambiental",
  rc_empregador: "RC Empregador",
  rc_operacoes: "RC Operações",
  eventos: "Eventos",
  engenharia: "Engenharia",
  gestao: "Gestão",
  lucros_cessantes: "Lucros Cessantes",
};

export default function Produtos() {
  const { toast } = useToast();

  const { data: produtos, isLoading: produtosLoading } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/tipos-seguro"],
  });

  const { data: seguradoras, isLoading: seguradoresLoading } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/seguradoras"],
  });

  const { data: vinculacoes } = useQuery<SeguradoraProduto[]>({
    queryKey: ["/api/seguradora-produtos"],
  });

  const isLoading = produtosLoading || seguradoresLoading;

  const getSeguradorasForProduto = (produtoId: string): SeguradoraMaster[] => {
    const seguradoraIds = vinculacoes
      ?.filter(v => v.tipoSeguroId === produtoId && v.ativo)
      .map(v => v.seguradoraId) || [];
    
    return seguradoras?.filter(s => seguradoraIds.includes(s.id) && s.ativo) || [];
  };

  const produtosPorCategoria = produtos?.reduce((acc, p) => {
    if (!p.ativo) return acc;
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
      <div>
        <h1 className="text-2xl font-bold">Produtos de Seguro</h1>
        <p className="text-muted-foreground">
          Visualize todos os produtos disponíveis e as seguradoras que comercializam cada um
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((j) => (
                  <Skeleton key={j} className="h-48" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : categoriasOrdenadas.length > 0 ? (
        <div className="space-y-8">
          {categoriasOrdenadas.map((categoria) => (
            <div key={categoria}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {categoriaLabels[categoria] || categoria}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {produtosPorCategoria[categoria]?.map((produto) => {
                  const seguradorasVinculadas = getSeguradorasForProduto(produto.id);
                  return (
                    <Card key={produto.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{produto.nome}</CardTitle>
                        {produto.descricao && (
                          <CardDescription className="text-xs line-clamp-2">
                            {produto.descricao}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Comercializado por ({seguradorasVinculadas.length})
                          </p>
                          {seguradorasVinculadas.length > 0 ? (
                            <div className="space-y-2">
                              {seguradorasVinculadas.map((seg) => (
                                <div
                                  key={seg.id}
                                  className="flex items-center gap-2 p-2 bg-secondary/50 rounded text-sm hover:bg-secondary transition-colors"
                                >
                                  <Shield className="h-3 w-3 text-primary flex-shrink-0" />
                                  <span className="truncate font-medium">{seg.nome}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              Nenhuma seguradora comercializa este produto no momento
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
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum produto disponível no momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
