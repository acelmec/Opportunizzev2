import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertTriangle, Shield, TrendingUp } from "lucide-react";

export default function GapsProtecaoPage() {
  const { data: gaps, isLoading } = useQuery<any[]>({
    queryKey: ["/api/portal/gaps"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getPrioridadeBadge = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <Badge variant="destructive">Alta Prioridade</Badge>;
      case "media":
        return <Badge variant="default" className="bg-amber-500">Média Prioridade</Badge>;
      default:
        return <Badge variant="secondary">Baixa Prioridade</Badge>;
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "text-red-600 dark:text-red-400";
      case "media":
        return "text-amber-600 dark:text-amber-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-red-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-blue-500";
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Gaps de Proteção
        </h1>
        <p className="text-muted-foreground">Oportunidades de proteção identificadas para seu perfil</p>
      </div>

      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Como funciona?</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Analisamos seu perfil, patrimônio e dependentes para identificar proteções importantes que você ainda não possui.
                Entre em contato com seu corretor para mais informações sobre cada produto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!gaps || gaps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Parabéns!</h3>
            <p className="text-muted-foreground">
              Você está bem protegido! Não identificamos gaps de proteção no momento.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {gaps.map((gap) => (
            <Card key={gap.tipoSeguroId} className={gap.prioridade === "alta" ? "border-red-200 dark:border-red-800" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{gap.tipoSeguroNome}</CardTitle>
                    <CardDescription>{gap.categoria}</CardDescription>
                  </div>
                  {getPrioridadeBadge(gap.prioridade)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <AlertTriangle className={`h-5 w-5 ${getPrioridadeColor(gap.prioridade)}`} />
                    <p className="text-sm">{gap.motivo}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Score de Adequação</span>
                      <span className="font-medium">{gap.score}%</span>
                    </div>
                    <Progress value={gap.score} className="h-2" />
                  </div>

                  {gap.regrasAplicadas > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {gap.regrasAplicadas} regra(s) de negócio aplicada(s) na análise
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
