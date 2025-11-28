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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Bot, Save, CheckCircle } from "lucide-react";
import type { SaasChatgptConfig } from "@shared/schema";

const chatgptFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  modelo: z.string().optional(),
  maxTokens: z.coerce.number().optional(),
  temperatura: z.coerce.number().min(0).max(2).optional(),
  ativo: z.boolean().default(true),
});

type ChatgptFormData = z.infer<typeof chatgptFormSchema>;

const modelos = [
  { value: "gpt-4o", label: "GPT-4o (Recomendado)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

export default function AdminChatgptConfig() {
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<SaasChatgptConfig | null>({
    queryKey: ["/api/admin/config/chatgpt"],
  });

  const form = useForm<ChatgptFormData>({
    resolver: zodResolver(chatgptFormSchema),
    values: config ? {
      nome: config.nome,
      apiKey: config.apiKey,
      modelo: config.modelo || "gpt-4o",
      maxTokens: config.maxTokens || 4096,
      temperatura: parseFloat(config.temperature || "0.7"),
      ativo: config.ativo ?? true,
    } : {
      nome: "",
      apiKey: "",
      modelo: "gpt-4o",
      maxTokens: 4096,
      temperatura: 0.7,
      ativo: true,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ChatgptFormData) => {
      return apiRequest("POST", "/api/admin/config/chatgpt", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config/chatgpt"] });
      toast({
        title: "Configuração salva",
        description: "As configurações do ChatGPT foram salvas com sucesso.",
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

  const onSubmit = (data: ChatgptFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Configuração ChatGPT
        </h1>
        <p className="text-muted-foreground">
          Configure a API do ChatGPT para recursos de inteligência artificial
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>OpenAI / ChatGPT API</CardTitle>
          </div>
          <CardDescription>
            Configure a integração com a API do ChatGPT para habilitar recursos de IA como análise de documentos, 
            sugestões automáticas e assistente virtual.
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
                            data-testid="switch-chatgpt-active"
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
                        <Input placeholder="Ex: OpenAI Produção" {...field} data-testid="input-chatgpt-name" />
                      </FormControl>
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
                        <Input type="password" placeholder="sk-..." {...field} data-testid="input-chatgpt-apikey" />
                      </FormControl>
                      <FormDescription>
                        Sua chave de API do OpenAI. Comece com "sk-".
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-chatgpt-model">
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {modelos.map((modelo) => (
                            <SelectItem key={modelo.value} value={modelo.value}>
                              {modelo.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        O modelo determina a qualidade e velocidade das respostas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="maxTokens"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="4096" {...field} data-testid="input-chatgpt-tokens" />
                        </FormControl>
                        <FormDescription>
                          Limite máximo de tokens por resposta
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="temperatura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperatura</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" max="2" placeholder="0.7" {...field} data-testid="input-chatgpt-temp" />
                        </FormControl>
                        <FormDescription>
                          0 = preciso, 2 = criativo
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-chatgpt">
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
