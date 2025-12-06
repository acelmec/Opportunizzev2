import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Shield, TrendingUp, Car, Home, Users, Heart, Info } from "lucide-react";
import { Link } from "wouter";

export default function GapsProtecaoPage() {
  const { data, isLoading } = useQuery<{
    gaps: any[];
    hasRules: boolean;
    patrimonios: any[];
    dependentes: any[];
  }>({
    queryKey: ["/api/portal/gaps"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const gaps = data?.gaps || [];
  const hasRules = data?.hasRules || false;
  const patrimonios = data?.patrimonios || [];
  const dependentes = data?.dependentes || [];

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

  const getGapIcon = (tipoSeguro: string) => {
    if (tipoSeguro.toLowerCase().includes("auto") || tipoSeguro.toLowerCase().includes("veículo")) {
      return <Car className="h-5 w-5" />;
    }
    if (tipoSeguro.toLowerCase().includes("resid") || tipoSeguro.toLowerCase().includes("imóvel")) {
      return <Home className="h-5 w-5" />;
    }
    if (tipoSeguro.toLowerCase().includes("vida") || tipoSeguro.toLowerCase().includes("saúde")) {
      return <Heart className="h-5 w-5" />;
    }
    return <Shield className="h-5 w-5" />;
  };

  if (!hasRules) {
    return (
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Gaps de Proteção
          </h1>
          <p className="text-muted-foreground">Análise de oportunidades de proteção para seu perfil</p>
        </div>

        <Card className="border-muted">
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Análise não disponível</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Seu corretor ainda não configurou as regras de análise de proteção. 
              Entre em contato com ele para mais informações sobre os seguros recomendados para seu perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasVeiculos = patrimonios.some(p => p.tipo === "veiculo");
  const hasImoveis = patrimonios.some(p => p.tipo === "imovel");
  const hasDependentes = dependentes.length > 0;

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Gaps de Proteção
        </h1>
        <p className="text-muted-foreground">Oportunidades de proteção identificadas para seu perfil</p>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Como funciona?</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Analisamos seu perfil, patrimônios cadastrados e dependentes para identificar proteções importantes.
                A análise considera as regras definidas por sua corretora de seguros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="py-4 text-center">
            <Car className={`h-8 w-8 mx-auto mb-2 ${hasVeiculos ? "text-green-600" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">{patrimonios.filter(p => p.tipo === "veiculo").length} Veículo(s)</p>
            {!hasVeiculos && (
              <Link href="/patrimonios">
                <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-primary">Cadastrar</Button>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Home className={`h-8 w-8 mx-auto mb-2 ${hasImoveis ? "text-green-600" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">{patrimonios.filter(p => p.tipo === "imovel").length} Imóvel(is)</p>
            {!hasImoveis && (
              <Link href="/patrimonios">
                <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-primary">Cadastrar</Button>
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <Users className={`h-8 w-8 mx-auto mb-2 ${hasDependentes ? "text-green-600" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium">{dependentes.length} Dependente(s)</p>
            {!hasDependentes && (
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-xs p-0 h-auto text-primary">Cadastrar</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {gaps.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Parabéns!</h3>
            <p className="text-muted-foreground">
              Você está bem protegido! Não identificamos gaps de proteção com base nos seus patrimônios e perfil cadastrados.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {gaps.length} oportunidade(s) identificada(s)
          </h2>
          {gaps.map((gap, index) => (
            <Card key={index} className={gap.prioridade === "alta" ? "border-red-200 dark:border-red-800" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${gap.prioridade === "alta" ? "bg-red-100 dark:bg-red-900" : gap.prioridade === "media" ? "bg-amber-100 dark:bg-amber-900" : "bg-muted"}`}>
                      {getGapIcon(gap.tipoSeguroNome)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{gap.tipoSeguroNome}</CardTitle>
                      <CardDescription>{gap.categoria}</CardDescription>
                    </div>
                  </div>
                  {getPrioridadeBadge(gap.prioridade)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 mt-0.5 ${getPrioridadeColor(gap.prioridade)}`} />
                    <div>
                      <p className="text-sm font-medium">Por que você precisa dessa proteção?</p>
                      <p className="text-sm text-muted-foreground">{gap.motivo}</p>
                    </div>
                  </div>
                  
                  {gap.patrimonio && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Patrimônio relacionado</p>
                      <p className="text-sm font-medium">{gap.patrimonio.descricao}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Índice de Adequação</span>
                      <span className="font-medium">{gap.score}%</span>
                    </div>
                    <Progress value={gap.score} className="h-2" />
                  </div>

                  {gap.regrasAplicadas && gap.regrasAplicadas.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Regras aplicadas: {gap.regrasAplicadas.join(", ")}
                    </div>
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
