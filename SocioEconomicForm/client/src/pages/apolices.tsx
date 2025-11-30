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
import type { TenantPolicy, SeguradoraMaster, TipoSeguroMaster } from "@shared/schema";

const apoilceFormSchema = z.object({
  numeroApolice: z.string().min(1, "Número da apólice é obrigatório"),
  seguradoraId: z.string().optional(),
  tipoSeguroId: z.string().optional(),
  dataInicio: z.string().optional(),
  dataVencimento: z.string().optional(),
  premioTotal: z.string().optional(),
  status: z.enum(["ativa", "vencida", "cancelada", "renovada", "em_analise"]).optional(),
  observacoes: z.string().optional(),
});

type ApoliceFormData = z.infer<typeof apoilceFormSchema>;

const statusLabels: Record<string, string> = {
  ativa: "Ativa",
  vencida: "Vencida",
  cancelada: "Cancelada",
  renovada: "Renovada",
  em_analise: "Em Análise",
};

const statusColors: Record<string, string> = {
  ativa: "bg-green-100 text-green-800",
  vencida: "bg-yellow-100 text-yellow-800",
  cancelada: "bg-red-100 text-red-800",
  renovada: "bg-blue-100 text-blue-800",
  em_analise: "bg-purple-100 text-purple-800",
};

export default function Apolices() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: apolices, isLoading } = useQuery<TenantPolicy[]>({
    queryKey: ["/api/tenant/apolices"],
  });

  const { data: seguradoras } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/seguradoras"],
  });

  const { data: tipos } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/tipos-seguro"],
  });

  const form = useForm<ApoliceFormData>({
    resolver: zodResolver(apoilceFormSchema),
    defaultValues: {
      numeroApolice: "",
      seguradoraId: "",
      tipoSeguroId: "",
      dataInicio: "",
      dataVencimento: "",
      premioTotal: "",
      status: "ativa",
      observacoes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ApoliceFormData) => {
      return apiRequest("POST", "/api/tenant/apolices", {
        ...data,
        premioTotal: data.premioTotal ? parseFloat(data.premioTotal) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/apolices"] });
      toast({
        title: "Apólice criada",
        description: "A apólice foi criada com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a apólice.",
        variant: "destructive",
      });
    },
  });

  const filteredApolices = apolices?.filter((apolice) =>
    apolice.numeroApolice.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = (data: ApoliceFormData) => {
    createMutation.mutate(data);
  };

  const getSeguradoraNome = (id?: string | null) => {
    if (!id) return "—";
    return seguradoras?.find(s => s.id === id)?.nome || "Desconhecido";
  };

  const getTipoNome = (id?: string | null) => {
    if (!id) return "—";
    return tipos?.find(t => t.id === id)?.nome || "Desconhecido";
  };

  const formatCurrency = (value?: string | number | null) => {
    if (!value) return "—";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value));
  };

  const formatDate = (date?: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apólices</h1>
          <p className="text-muted-foreground">
            Gerencie todas as apólices de seus clientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-apolice">
              <Plus className="h-4 w-4 mr-2" />
              Nova Apólice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Apólice</DialogTitle>
              <DialogDescription>
                Adicione uma nova apólice ao sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="numeroApolice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da Apólice*</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seguradoraId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma seguradora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {seguradoras?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nome}
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
                  name="tipoSeguroId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Seguro</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tipos?.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataInicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dataVencimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Vencimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="premioTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prêmio Total</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
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
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Input placeholder="Observações adicionais" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Criar Apólice"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Buscar apólice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
      ) : filteredApolices?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredApolices.map((apolice) => (
            <Card key={apolice.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{apolice.numeroApolice}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {getSeguradoraNome(apolice.seguradoraId)}
                    </CardDescription>
                  </div>
                  <Badge className={apolice.status ? statusColors[apolice.status] || "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"}>
                    {apolice.status ? statusLabels[apolice.status] : "Desconhecido"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Tipo de Seguro</p>
                  <p className="font-medium">{getTipoNome(apolice.tipoSeguroId)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Vigência</p>
                    <p className="font-medium text-xs">
                      {formatDate(apolice.dataInicio)} a {formatDate(apolice.dataVencimento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Prêmio</p>
                    <p className="font-medium text-xs">{formatCurrency(apolice.premioTotal)}</p>
                  </div>
                </div>

                {apolice.observacoes && (
                  <div className="text-sm pt-2 border-t">
                    <p className="text-muted-foreground text-xs">Observações</p>
                    <p className="text-xs line-clamp-2">{apolice.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" />
              Nenhuma apólice cadastrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
