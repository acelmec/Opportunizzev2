import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Shield, Plus, Search, Phone, Mail, Globe } from "lucide-react";
import type { SeguradoraMaster } from "@shared/schema";

const seguradoraFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().optional(),
});

type SeguradoraFormData = z.infer<typeof seguradoraFormSchema>;

export default function AdminSeguradoras() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: seguradoras, isLoading } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/admin/seguradoras"],
  });

  const form = useForm<SeguradoraFormData>({
    resolver: zodResolver(seguradoraFormSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      telefone: "",
      email: "",
      website: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SeguradoraFormData) => {
      return apiRequest("POST", "/api/admin/seguradoras", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras"] });
      toast({
        title: "Seguradora criada",
        description: "A seguradora foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a seguradora.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      return apiRequest("PUT", `/api/admin/seguradoras/${id}`, { ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras"] });
    },
  });

  const filteredSeguradoras = seguradoras?.filter((seg) =>
    seg.nome.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: SeguradoraFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Seguradoras
          </h1>
          <p className="text-muted-foreground">
            Catálogo master de seguradoras da plataforma
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-seguradora">
              <Plus className="h-4 w-4 mr-2" />
              Nova Seguradora
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Seguradora</DialogTitle>
              <DialogDescription>
                Adicione uma nova seguradora ao catálogo master
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Porto Seguro" {...field} data-testid="input-seguradora-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="00.000.000/0000-00" {...field} data-testid="input-seguradora-cnpj" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(11) 0000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contato@seguradora.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.seguradora.com.br" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-seguradora">
                  {createMutation.isPending ? "Salvando..." : "Criar Seguradora"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar seguradora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-seguradora"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSeguradoras?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSeguradoras.map((seg) => (
            <Card key={seg.id} data-testid={`card-seguradora-${seg.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    {seg.nome}
                  </CardTitle>
                  {seg.cnpj && (
                    <CardDescription>CNPJ: {seg.cnpj}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={seg.ativo ?? false}
                    onCheckedChange={(checked) =>
                      toggleActiveMutation.mutate({ id: seg.id, ativo: checked })
                    }
                    data-testid={`switch-seguradora-active-${seg.id}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {seg.telefoneMatriz && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {seg.telefoneMatriz}
                    </span>
                  )}
                  {seg.emailMatriz && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {seg.emailMatriz}
                    </span>
                  )}
                  {seg.website && (
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <a href={seg.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Site
                      </a>
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma seguradora encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
