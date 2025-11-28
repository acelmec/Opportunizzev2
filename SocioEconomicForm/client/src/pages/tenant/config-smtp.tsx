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
import { Mail, Save, Send, Loader2 } from "lucide-react";
import type { TenantSmtpConfig } from "@shared/schema";

const smtpFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  host: z.string().min(1, "Host é obrigatório"),
  port: z.coerce.number().int().min(1, "Porta é obrigatória"),
  usuario: z.string().min(1, "Usuário é obrigatório"),
  senha: z.string().min(1, "Senha é obrigatória"),
  secure: z.boolean().default(true),
  remetenteEmail: z.string().email("Email inválido").nullish().or(z.literal("")),
  remetenteNome: z.string().nullish(),
  ativo: z.boolean().default(true),
});

type SmtpFormData = z.infer<typeof smtpFormSchema>;

export default function TenantSmtpConfig() {
  const { toast } = useToast();
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const { data: config, isLoading } = useQuery<TenantSmtpConfig | null>({
    queryKey: ["/api/tenant/config/smtp"],
  });

  const form = useForm<SmtpFormData>({
    resolver: zodResolver(smtpFormSchema),
    values: config ? {
      nome: config.nome,
      host: config.host,
      port: config.port || 587,
      usuario: config.usuario,
      senha: config.senha,
      secure: config.secure ?? true,
      remetenteEmail: config.remetenteEmail || "",
      remetenteNome: config.remetenteNome || "",
      ativo: config.ativo ?? true,
    } : {
      nome: "",
      host: "",
      port: 587,
      usuario: "",
      senha: "",
      secure: true,
      remetenteEmail: "",
      remetenteNome: "",
      ativo: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SmtpFormData) => {
      const payload = {
        ...data,
        remetenteEmail: data.remetenteEmail || null,
        remetenteNome: data.remetenteNome || null,
      };
      return apiRequest("POST", "/api/tenant/config/smtp", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/config/smtp"] });
      toast({
        title: "Configuração salva",
        description: "As configurações de e-mail foram salvas com sucesso.",
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
      const response = await apiRequest("POST", "/api/tenant/config/smtp/test", { emailDestino });
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
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Configuração de E-mail</h1>
        <p className="text-muted-foreground">
          Configure o servidor de e-mail para comunicação com seus clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Servidor SMTP</CardTitle>
          </div>
          <CardDescription>
            Configure as credenciais do servidor de e-mail da sua corretora
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
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Configuração</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="E-mail Principal" 
                          {...field} 
                          data-testid="input-smtp-nome"
                        />
                      </FormControl>
                      <FormDescription>
                        Um nome para identificar esta configuração
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servidor SMTP</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="smtp.gmail.com" 
                            {...field} 
                            data-testid="input-smtp-host"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Porta</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="587" 
                            {...field} 
                            data-testid="input-smtp-port"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="usuario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuário</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="seu@email.com" 
                            {...field} 
                            data-testid="input-smtp-usuario"
                          />
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
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="••••••••" 
                            {...field} 
                            data-testid="input-smtp-senha"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="remetenteEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail do Remetente</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="contato@suacorretora.com.br" 
                            {...field}
                            value={field.value ?? ""} 
                            data-testid="input-smtp-remetente-email"
                          />
                        </FormControl>
                        <FormDescription>
                          Endereço que aparecerá como remetente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="remetenteNome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Remetente</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Sua Corretora de Seguros" 
                            {...field}
                            value={field.value ?? ""} 
                            data-testid="input-smtp-remetente-nome"
                          />
                        </FormControl>
                        <FormDescription>
                          Nome que aparecerá nas mensagens
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                  <FormField
                    control={form.control}
                    name="secure"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-smtp-secure"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Conexão Segura (TLS/SSL)</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ativo"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-smtp-ativo"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Configuração Ativa</FormLabel>
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
            <DialogTitle>Testar Configuração de E-mail</DialogTitle>
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
