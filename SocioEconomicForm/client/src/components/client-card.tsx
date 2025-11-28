import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  User,
  ChevronRight,
  Car,
  Home,
  Shield,
} from "lucide-react";
import { formatCurrency, formatCPF, formatCNPJ } from "@/lib/validators";
import { ScoreBadge } from "./score-badge";
import type { PessoaFisica, PessoaJuridica } from "@shared/schema";

interface PFCardProps {
  cliente: PessoaFisica;
}

export function PFCard({ cliente }: PFCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    const first = parts[0]?.charAt(0) || "";
    const last = parts[parts.length - 1]?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  const getBestScore = () => {
    const scores = [
      { label: "Vida", value: cliente.scoreVida || 0 },
      { label: "Auto", value: cliente.scoreAuto || 0 },
      { label: "Residencial", value: cliente.scoreResidencial || 0 },
      { label: "RC Prof.", value: cliente.scoreRcProfissional || 0 },
      { label: "Previdência", value: cliente.scorePrevidencia || 0 },
      { label: "Saúde", value: cliente.scoreSaude || 0 },
    ];
    return scores.sort((a, b) => b.value - a.value)[0];
  };

  const bestScore = getBestScore();

  return (
    <Card
      className="hover-elevate transition-all"
      data-testid={`card-cliente-pf-${cliente.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(cliente.nomeCompleto)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="font-semibold truncate"
                  data-testid={`text-nome-${cliente.id}`}
                >
                  {cliente.nomeCompleto}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {formatCPF(cliente.cpf)}
                </p>
              </div>
              <ScoreBadge
                score={bestScore.value}
                label={bestScore.label}
                size="sm"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {cliente.profissao && (
                <Badge variant="secondary" className="text-xs">
                  <User className="mr-1 h-3 w-3" />
                  {cliente.profissao}
                </Badge>
              )}
              {cliente.consentimentoLgpd && (
                <Badge
                  variant="outline"
                  className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  LGPD OK
                </Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {cliente.celular && (
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cliente.celular}</span>
                </div>
              )}
              {cliente.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{cliente.email}</span>
                </div>
              )}
            </div>

            {cliente.rendaMensalBruta && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Renda Mensal
                  </span>
                  <span className="font-mono font-medium text-sm">
                    {formatCurrency(Number(cliente.rendaMensalBruta))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/clientes/pf/${cliente.id}`}>
              Ver Detalhes
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PJCardProps {
  empresa: PessoaJuridica;
}

export function PJCard({ empresa }: PJCardProps) {
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    const first = parts[0]?.charAt(0) || "";
    const last = parts.length > 1 ? parts[1]?.charAt(0) || "" : "";
    return (first + last).toUpperCase();
  };

  const getPorteLabel = (porte: string | null) => {
    const portes: Record<string, string> = {
      micro: "Microempresa",
      pequeno: "Pequena",
      medio: "Média",
      grande: "Grande",
    };
    return porte ? portes[porte] || porte : "";
  };

  const getBestScore = () => {
    const scores = [
      { label: "Vida Coletiva", value: empresa.scoreVidaColetiva || 0 },
      { label: "Saúde Coletiva", value: empresa.scoreSaudeColetiva || 0 },
      { label: "Patrimonial", value: empresa.scorePatrimonial || 0 },
      { label: "RC", value: empresa.scoreRc || 0 },
    ];
    return scores.sort((a, b) => b.value - a.value)[0];
  };

  const bestScore = getBestScore();

  return (
    <Card
      className="hover-elevate transition-all"
      data-testid={`card-cliente-pj-${empresa.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarFallback className="bg-chart-2/10 text-chart-2 font-medium">
              {getInitials(empresa.nomeFantasia || empresa.razaoSocial)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3
                  className="font-semibold truncate"
                  data-testid={`text-razao-${empresa.id}`}
                >
                  {empresa.nomeFantasia || empresa.razaoSocial}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {formatCNPJ(empresa.cnpj)}
                </p>
              </div>
              <ScoreBadge
                score={bestScore.value}
                label={bestScore.label}
                size="sm"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {empresa.porteEmpresa && (
                <Badge variant="secondary" className="text-xs">
                  <Building2 className="mr-1 h-3 w-3" />
                  {getPorteLabel(empresa.porteEmpresa)}
                </Badge>
              )}
              {empresa.numeroFuncionarios && empresa.numeroFuncionarios > 0 && (
                <Badge variant="outline" className="text-xs">
                  {empresa.numeroFuncionarios} funcionários
                </Badge>
              )}
              {empresa.consentimentoLgpd && (
                <Badge
                  variant="outline"
                  className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800"
                >
                  <Shield className="mr-1 h-3 w-3" />
                  LGPD OK
                </Badge>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {empresa.telefone && (
                <div className="flex items-center gap-1.5 truncate">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{empresa.telefone}</span>
                </div>
              )}
              {empresa.email && (
                <div className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{empresa.email}</span>
                </div>
              )}
            </div>

            {empresa.faturamentoMensal && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Faturamento Mensal
                  </span>
                  <span className="font-mono font-medium text-sm">
                    {formatCurrency(Number(empresa.faturamentoMensal))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/clientes/pj/${empresa.id}`}>
              Ver Detalhes
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
