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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageSquare, Save, CheckCircle } from "lucide-react";
import type { SaasEvolutionConfig } from "@shared/schema";

const evolutionFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  instanceName: z.string().min(1, "Nome da instância é obrigatório"),
  endpoint: z.string().url("URL inválida").min(1, "Endpoint é obrigatório"),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  webhookUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

type EvolutionFormData = z.infer<typeof evolutionFormSchema>;

export default function AdminEvolutionConfig() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<SaasEvolutionConfig | null>({
    queryKey: ["/api/admin/config/evolution"],
  });

  const form = useForm<EvolutionFormData>({
    resolver: zodResolver(evolutionFormSchema),
    values: config ? {
      nome: config.nome,
      instanceName: config.instanceName,
      endpoint: config.endpoint,
      apiKey: config.apiKey,
      webhookUrl: "",
      ativo: config.ativo ?? true,
    } : {
      nome: "",
      instanceName: "",
      endpoint: "",
      apiKey: "",
      webhookUrl: "",
      ativo: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: EvolutionFormData) => {
      return apiRequest("POST", "/api/admin/config/evolution", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/evolution"] });
      toast({
        title: "Configuração salva",
        description: "As configurações da Evolution API foram salvas com sucesso.",
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

  const onSubmit = (data: EvolutionFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Configuração Evolution API
        </h1>
        <p className="text-muted-foreground">
          Configure a Evolution API para integração com WhatsApp
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Evolution API (WhatsApp)</CardTitle>
          </div>
          <CardDescription>
            A Evolution API permite enviar mensagens via WhatsApp. Configure uma instância 
            para habilitar notificações, convites e comunicação com clientes via WhatsApp.
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
                            data-testid="switch-evolution-active"
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
                        <Input placeholder="Ex: WhatsApp Produção" {...field} data-testid="input-evolution-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instanceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Instância</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: seguropro-main" {...field} data-testid="input-evolution-instance" />
                      </FormControl>
                      <FormDescription>
                        Nome da instância cadastrada na Evolution API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endpoint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endpoint da API</FormLabel>
                      <FormControl>
                        <Input placeholder="https://evolution.exemplo.com" {...field} data-testid="input-evolution-endpoint" />
                      </FormControl>
                      <FormDescription>
                        URL base do servidor Evolution API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Sua chave de API" {...field} data-testid="input-evolution-apikey" />
                      </FormControl>
                      <FormDescription>
                        Chave de autenticação da Evolution API
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="webhookUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook URL (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://seguropro.com.br/api/webhook/whatsapp" {...field} data-testid="input-evolution-webhook" />
                      </FormControl>
                      <FormDescription>
                        URL para receber notificações de mensagens recebidas
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-evolution">
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
