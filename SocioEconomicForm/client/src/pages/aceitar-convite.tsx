import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AceitarConvitePage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: user } = useQuery({
    queryKey: ["/api/auth/user"],
  });

  useEffect(() => {
    const acceptInvite = async () => {
      if (!user || !token) return;

      try {
        const conviteRes = await fetch(`/api/convites/token/${token}`);
        if (!conviteRes.ok) {
          const data = await conviteRes.json();
          throw new Error(data.message || "Convite inválido");
        }
        const convite = await conviteRes.json();

        await apiRequest("PATCH", `/api/convites/${convite.id}/status`, {
          status: "aceito",
          clienteUserId: user.id,
          token: token,
        });

        setSuccess(true);
        toast({
          title: "Convite aceito!",
          description: "Bem-vindo ao portal do cliente. Você será redirecionado em instantes.",
        });

        setTimeout(() => {
          setLocation("/cliente/dashboard");
        }, 2000);
      } catch (error: any) {
        setErrorMsg(error.message || "Erro ao aceitar convite");
        toast({
          variant: "destructive",
          title: "Erro",
          description: error.message || "Erro ao aceitar convite",
        });
      } finally {
        setProcessing(false);
      }
    };

    if (user && token) {
      acceptInvite();
    }
  }, [user, token, setLocation, toast]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processando seu convite...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-3 rounded-full w-fit mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Convite Aceito!</CardTitle>
            <CardDescription>
              Bem-vindo ao portal do cliente
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              Você será redirecionado para o seu dashboard em instantes...
            </p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Erro ao Aceitar Convite</CardTitle>
          <CardDescription>
            {errorMsg}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Entre em contato com seu corretor para mais informações.
          </p>
          <Button variant="outline" onClick={() => setLocation("/")}>
            Voltar para Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
