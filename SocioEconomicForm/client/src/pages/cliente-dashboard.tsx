import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Heart, 
  Car, 
  Home, 
  Briefcase, 
  PiggyBank, 
  Activity,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

const productIcons: Record<string, any> = {
  vida: Heart,
  auto: Car,
  residencial: Home,
  rc_profissional: Briefcase,
  previdencia: PiggyBank,
  saude: Activity,
};

const productLabels: Record<string, string> = {
  vida: "Seguro de Vida",
  auto: "Seguro Auto",
  residencial: "Seguro Residencial",
  rc_profissional: "RC Profissional",
  previdencia: "Previdência Privada",
  saude: "Plano de Saúde",
};

interface ScoreProduct {
  produto: string;
  score: number;
  descricao: string;
}

export default function ClienteDashboardPage() {
  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  const protecoes: ScoreProduct[] = [
    { produto: "vida", score: 75, descricao: "Proteção financeira para sua família em caso de imprevistos" },
    { produto: "auto", score: 60, descricao: "Cobertura completa para seu veículo contra roubos e acidentes" },
    { produto: "residencial", score: 85, descricao: "Proteção para sua residência contra incêndios, roubos e desastres" },
    { produto: "saude", score: 70, descricao: "Acesso a atendimento médico de qualidade para você e sua família" },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: "Alta Prioridade", variant: "default" as const };
    if (score >= 60) return { label: "Média Prioridade", variant: "secondary" as const };
    return { label: "Baixa Prioridade", variant: "outline" as const };
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Minhas Proteções
          </h1>
          <p className="text-muted-foreground">
            Olá, {user?.firstName || "Cliente"}! Veja as proteções recomendadas para você
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm">{user?.email}</span>
        </div>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-full">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Bem-vindo ao Portal do Cliente</h2>
              <p className="text-muted-foreground">
                Aqui você pode acompanhar as proteções de seguro recomendadas com base no seu perfil.
                Entre em contato com seu corretor para contratar ou saber mais sobre cada produto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {protecoes.map((protecao) => {
          const Icon = productIcons[protecao.produto] || Shield;
          const scoreInfo = getScoreLabel(protecao.score);

          return (
            <Card key={protecao.produto} className="hover-elevate" data-testid={`card-protecao-${protecao.produto}`}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {productLabels[protecao.produto] || protecao.produto}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {protecao.descricao}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Recomendação</span>
                    <Badge variant={scoreInfo.variant}>{scoreInfo.label}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Score de adequação</span>
                      <span className={`font-bold ${getScoreColor(protecao.score)}`}>
                        {protecao.score}%
                      </span>
                    </div>
                    <Progress value={protecao.score} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Próximos Passos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Revise as proteções recomendadas acima</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <span>Entre em contato com seu corretor para tirar dúvidas</span>
            </li>
            <li className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span>Mantenha seus dados atualizados para melhores recomendações</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
