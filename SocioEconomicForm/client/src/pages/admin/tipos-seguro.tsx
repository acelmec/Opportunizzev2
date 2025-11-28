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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Plus, Search } from "lucide-react";
import type { TipoSeguroMaster } from "@shared/schema";

const tipoSeguroFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().optional(),
  ordem: z.coerce.number().optional(),
});

type TipoSeguroFormData = z.infer<typeof tipoSeguroFormSchema>;

const categorias = [
  "automovel",
  "residencial",
  "vida",
  "saude",
  "empresarial",
  "rural",
  "transporte",
  "responsabilidade",
  "outros",
];

const categoriaLabels: Record<string, string> = {
  automovel: "Automóvel",
  residencial: "Residencial",
  vida: "Vida",
  saude: "Saúde",
  empresarial: "Empresarial",
  rural: "Rural",
  transporte: "Transporte",
  responsabilidade: "Responsabilidade",
  outros: "Outros",
};

export default function AdminTiposSeguro() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");

  const { data: tipos, isLoading } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const form = useForm<TipoSeguroFormData>({
    resolver: zodResolver(tipoSeguroFormSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      descricao: "",
      ordem: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TipoSeguroFormData) => {
      return apiRequest("POST", "/api/admin/tipos-seguro", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tipos-seguro"] });
      toast({
        title: "Tipo de seguro criado",
        description: "O tipo de seguro foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o tipo de seguro.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      return apiRequest("PUT", `/api/admin/tipos-seguro/${id}`, { ativo });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tipos-seguro"] });
    },
  });

  const filteredTipos = tipos?.filter((tipo) => {
    const matchesSearch = tipo.nome.toLowerCase().includes(search.toLowerCase());
    const matchesCategoria = filterCategoria === "all" || tipo.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const onSubmit = (data: TipoSeguroFormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Tipos de Seguro
          </h1>
          <p className="text-muted-foreground">
            Catálogo master de produtos de seguro
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-tipo-seguro">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Tipo de Seguro</DialogTitle>
              <DialogDescription>
                Adicione um novo tipo de seguro ao catálogo
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
                        <Input placeholder="Ex: Seguro Auto" {...field} data-testid="input-tipo-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoria"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-tipo-categoria">
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categorias.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {categoriaLabels[cat]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição do tipo de seguro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ordem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem de exibição</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-tipo">
                  {createMutation.isPending ? "Salvando..." : "Criar Tipo"}
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
            placeholder="Buscar tipo de seguro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tipo"
          />
        </div>
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-[180px]" data-testid="select-filter-categoria">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {categoriaLabels[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
      ) : filteredTipos?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTipos.map((tipo) => (
            <Card key={tipo.id} data-testid={`card-tipo-${tipo.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5 text-primary" />
                    {tipo.nome}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {categoriaLabels[tipo.categoria] || tipo.categoria}
                    </Badge>
                    {tipo.ordem !== null && (
                      <span className="text-xs text-muted-foreground">
                        Ordem: {tipo.ordem}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={tipo.ativo ?? false}
                  onCheckedChange={(checked) =>
                    toggleActiveMutation.mutate({ id: tipo.id, ativo: checked })
                  }
                  data-testid={`switch-tipo-active-${tipo.id}`}
                />
              </CardHeader>
              {tipo.descricao && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{tipo.descricao}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum tipo de seguro encontrado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
