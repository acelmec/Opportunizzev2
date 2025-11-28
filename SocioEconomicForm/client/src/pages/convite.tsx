import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Clock, Shield } from "lucide-react";

export default function ConvitePage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [accepting, setAccepting] = useState(false);

  const { data: convite, isLoading, error } = useQuery({
    queryKey: ["/api/convites/token", token],
    queryFn: async () => {
      const res = await fetch(`/api/convites/token/${token}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Erro ao buscar convite");
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const handleAcceptInvite = async () => {
    setAccepting(true);
    window.location.href = `/api/login?returnTo=/aceitar-convite/${token}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Convite Inválido</CardTitle>
            <CardDescription>
              {(error as Error).message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              O convite que você está tentando acessar pode ter expirado ou já foi utilizado.
              Entre em contato com seu corretor para solicitar um novo convite.
            </p>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar para Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Você foi convidado!</CardTitle>
          <CardDescription>
            Seu corretor de seguros enviou um convite para você acessar o portal do cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Nome:</span>
              <span className="font-medium">{convite?.nomeCliente || "Cliente"}</span>
            </div>
            {convite?.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">E-mail:</span>
                <span className="font-medium">{convite.email}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-amber-600 font-medium">Aguardando aceite</span>
              </div>
            </div>
          </div>

          {convite?.mensagemPersonalizada && (
            <div className="bg-accent/10 rounded-lg p-4 border border-accent/30">
              <p className="text-sm font-medium mb-2 text-accent">Mensagem do seu corretor:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{convite.mensagemPersonalizada}</p>
            </div>
          )}

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Ao aceitar este convite, você terá acesso ao portal do cliente onde poderá visualizar suas
              proteções de seguro recomendadas e manter seus dados atualizados.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleAcceptInvite}
              disabled={accepting}
              data-testid="button-accept-invite"
            >
              {accepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aceitar Convite e Criar Conta
                </>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Você será redirecionado para criar sua conta de acesso
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
