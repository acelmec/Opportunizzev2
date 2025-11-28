import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Mail, Save, CheckCircle, Send, Loader2 } from "lucide-react";
import type { SaasSmtpConfig } from "@shared/schema";

const smtpFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  host: z.string().min(1, "Host é obrigatório"),
  porta: z.coerce.number().min(1, "Porta é obrigatória"),
  usuario: z.string().min(1, "Usuário é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
  seguro: z.boolean().default(true),
  emailRemetente: z.string().email("Email inválido").optional().or(z.literal("")),
  nomeRemetente: z.string().optional(),
  ativo: z.boolean().default(true),
});

type SmtpFormData = z.infer<typeof smtpFormSchema>;

export default function AdminSmtpConfig() {
  const { toast } = useToast();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data: config, isLoading } = useQuery<SaasSmtpConfig | null>({
    queryKey: ["/api/admin/config/smtp"],
  });

  const form = useForm<SmtpFormData>({
    resolver: zodResolver(smtpFormSchema),
    values: config ? {
      nome: config.nome,
      host: config.host,
      porta: config.port || 587,
      usuario: config.usuario,
      senha: config.senha,
      seguro: config.secure ?? true,
      emailRemetente: config.remetenteEmail || "",
      nomeRemetente: config.remetenteNome || "",
      ativo: config.ativo ?? true,
    } : {
      nome: "",
      host: "",
      porta: 587,
      usuario: "",
      senha: "",
      seguro: true,
      emailRemetente: "",
      nomeRemetente: "",
      ativo: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SmtpFormData) => {
      return apiRequest("POST", "/api/admin/config/smtp", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/smtp"] });
      toast({
        title: "Configuração salva",
        description: "As configurações SMTP foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (emailDestino: string) => {
      const response = await apiRequest("POST", "/api/admin/config/smtp/test", { emailDestino });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar e-mail de teste");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "E-mail enviado",
        description: "O e-mail de teste foi enviado com sucesso! Verifique sua caixa de entrada.",
      });
      setTestDialogOpen(false);
      setTestEmail("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SmtpFormData) => {
    saveMutation.mutate(data);
  };

  const onTestSubmit = () => {
    if (testEmail) {
      testMutation.mutate(testEmail);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Configuração SMTP
        </h1>
        <p className="text-muted-foreground">
          Configure o provedor de email para envio de notificações
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>Provedor de Email</CardTitle>
          </div>
          <CardDescription>
            Estas configurações serão usadas para enviar emails de convite, recuperação de senha e notificações do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {config ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium">Configuração ativa</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhuma configuração salva</span>
                    )}
                  </div>
                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm">Ativo</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-smtp-active"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Configuração</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Gmail, SendGrid" {...field} data-testid="input-smtp-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servidor SMTP (Host)</FormLabel>
                        <FormControl>
                          <Input placeholder="smtp.gmail.com" {...field} data-testid="input-smtp-host" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="porta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="587" {...field} data-testid="input-smtp-port" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="usuario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="usuario@email.com" {...field} data-testid="input-smtp-user" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="senha"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha / App Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} data-testid="input-smtp-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="seguro"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-4 rounded-lg border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-smtp-secure"
                        />
                      </FormControl>
                      <div className="space-y-0.5">
                        <FormLabel>Conexão Segura (TLS)</FormLabel>
                        <FormDescription>
                          Use TLS para conexão segura. Recomendado para a maioria dos provedores.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="emailRemetente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email do Remetente</FormLabel>
                        <FormControl>
                          <Input placeholder="noreply@seguropro.com.br" {...field} data-testid="input-smtp-sender-email" />
                        </FormControl>
                        <FormDescription>
                          Email que aparecerá como remetente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nomeRemetente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Remetente</FormLabel>
                        <FormControl>
                          <Input placeholder="SeguroPro" {...field} data-testid="input-smtp-sender-name" />
                        </FormControl>
                        <FormDescription>
                          Nome que aparecerá como remetente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-smtp">
                    <Save className="h-4 w-4 mr-2" />
                    {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                  {config && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setTestDialogOpen(true)}
                      data-testid="button-test-smtp"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Testar Envio
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testar Configuração SMTP</DialogTitle>
            <DialogDescription>
              Envie um e-mail de teste para verificar se as configurações estão corretas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail de Destino</label>
              <Input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                data-testid="input-test-email"
              />
              <p className="text-xs text-muted-foreground">
                O e-mail de teste será enviado para este endereço
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestDialogOpen(false);
                setTestEmail("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={onTestSubmit}
              disabled={!testEmail || testMutation.isPending}
              data-testid="button-send-test"
            >
              {testMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
