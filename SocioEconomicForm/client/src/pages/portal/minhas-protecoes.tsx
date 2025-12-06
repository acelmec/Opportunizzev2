import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, CheckCircle, Calendar, Building2 } from "lucide-react";

export default function MinhasProtecoesPage() {
  const { data: protecoes, isLoading } = useQuery<any[]>({
    queryKey: ["/api/portal/protecoes"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Minhas Proteções
        </h1>
        <p className="text-muted-foreground">Suas apólices de seguro ativas</p>
      </div>

      {!protecoes || protecoes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma proteção ativa</h3>
            <p className="text-muted-foreground">
              Você ainda não possui apólices de seguro cadastradas.
              Consulte os Gaps de Proteção para ver recomendações.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {protecoes.map((protecao) => (
            <Card key={protecao.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900 p-2 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{protecao.tipoSeguroNome}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {protecao.seguradoraNome}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">Ativa</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">N° Apólice</p>
                    <p className="font-medium">{protecao.numeroApolice || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vigência</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(protecao.dataInicio)} a {formatDate(protecao.dataFim)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Prêmio Mensal</p>
                    <p className="font-medium">{formatCurrency(protecao.premioMensal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cobertura</p>
                    <p className="font-medium">{formatCurrency(protecao.valorCobertura)}</p>
                  </div>
                </div>
                {protecao.observacoes && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-muted-foreground text-xs">Observações</p>
                    <p className="text-sm">{protecao.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
