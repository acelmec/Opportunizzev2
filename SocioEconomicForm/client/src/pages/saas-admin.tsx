import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCNPJ, formatPhone } from "@/lib/validators";
import { LoadingSpinner } from "@/components/loading-state";
import {
  CreditCard,
  Building2,
  ShieldCheck,
  Link2,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Save,
  Check,
  X,
  Search,
  Filter,
  Package,
  Scale,
  User,
  Users,
  Briefcase,
  Car,
  Home,
  Cog,
  Target,
} from "lucide-react";

interface SubscriptionPlan {
  id: string;
  nome: string;
  descricao: string | null;
  precoMensal: string;
  maxUsuarios: number | null;
  maxClientes: number | null;
  recursos: string[] | null;
  status: string | null;
  createdAt: string | null;
}

interface Seguradora {
  id: string;
  nome: string;
  cnpj: string | null;
  codigoSusep: string | null;
  website: string | null;
  logoUrl: string | null;
  telefoneMatriz: string | null;
  emailMatriz: string | null;
  ativo: boolean | null;
}

interface TipoSeguro {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  icone: string | null;
  ativo: boolean | null;
  ordem: number | null;
}

interface SeguradoraProduto {
  id: string;
  seguradoraId: string;
  tipoSeguroId: string;
  nomeProduto: string | null;
  observacoes: string | null;
  ativo: boolean | null;
  seguradoraNome?: string;
  tipoSeguroNome?: string;
}

interface BusinessRule {
  id: string;
  nome: string;
  descricao: string | null;
  tipoPessoa: "pf" | "pj" | "ambos";
  tipoSeguroId: string | null;
  prioridade: number | null;
  condicoes: RuleCondition[];
  scoreBonus: number | null;
  regras: Record<string, any>;
  ativo: boolean | null;
  createdAt: string | null;
  tipoSeguroNome?: string;
}

interface RuleCondition {
  campo: string;
  operador: string;
  valor: string | number | boolean;
}

const planFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  precoMensal: z.string().min(1, "Preço é obrigatório"),
  maxUsuarios: z.coerce.number().min(1, "Mínimo 1 usuário"),
  maxClientes: z.coerce.number().min(1, "Mínimo 1 cliente"),
  status: z.enum(["ativo", "inativo"]),
});

const seguradoraFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  cnpj: z.string().optional(),
  codigoSusep: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  telefoneMatriz: z.string().optional(),
  emailMatriz: z.string().email().optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

const tipoSeguroFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  descricao: z.string().optional(),
  icone: z.string().optional(),
  ordem: z.coerce.number().default(0),
  ativo: z.boolean().default(true),
});

const businessRuleFormSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  tipoPessoa: z.enum(["pf", "pj", "ambos"]).default("ambos"),
  tipoSeguroId: z.string().optional(),
  prioridade: z.coerce.number().default(0),
  scoreBonus: z.coerce.number().default(10),
  ativo: z.boolean().default(true),
});

type PlanFormData = z.infer<typeof planFormSchema>;
type SeguradoraFormData = z.infer<typeof seguradoraFormSchema>;
type TipoSeguroFormData = z.infer<typeof tipoSeguroFormSchema>;
type BusinessRuleFormData = z.infer<typeof businessRuleFormSchema>;

function PlansTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/subscription-plans"],
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      precoMensal: "0",
      maxUsuarios: 1,
      maxClientes: 100,
      status: "ativo",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const response = await apiRequest("POST", "/api/admin/subscription-plans", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Plano criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PlanFormData & { id: string }) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PATCH", `/api/admin/subscription-plans/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Plano atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setDialogOpen(false);
      setEditingPlan(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/subscription-plans/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Plano removido!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subscription-plans"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    form.reset({
      nome: plan.nome,
      descricao: plan.descricao || "",
      precoMensal: plan.precoMensal,
      maxUsuarios: plan.maxUsuarios || 1,
      maxClientes: plan.maxClientes || 100,
      status: (plan.status as "ativo" | "inativo") || "ativo",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingPlan(null);
    form.reset({
      nome: "",
      descricao: "",
      precoMensal: "0",
      maxUsuarios: 1,
      maxClientes: 100,
      status: "ativo",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ ...data, id: editingPlan.id });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Planos de Assinatura</CardTitle>
          <CardDescription>Gerencie os planos disponíveis para corretoras</CardDescription>
        </div>
        <Button onClick={openCreate} data-testid="button-add-plan">
          <Plus className="h-4 w-4 mr-2" />
          Novo Plano
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plano</TableHead>
              <TableHead>Preço/mês</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Clientes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                <TableCell>
                  <div>
                    <span className="font-medium">{plan.nome}</span>
                    {plan.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{plan.descricao}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {parseFloat(plan.precoMensal) === 0
                    ? "Grátis"
                    : `R$ ${parseFloat(plan.precoMensal).toFixed(2)}`}
                </TableCell>
                <TableCell>{plan.maxUsuarios}</TableCell>
                <TableCell>{plan.maxClientes?.toLocaleString("pt-BR")}</TableCell>
                <TableCell>
                  <Badge variant={plan.status === "ativo" ? "default" : "secondary"}>
                    {plan.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(plan)}
                      data-testid={`button-edit-plan-${plan.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(plan.id)}
                      data-testid={`button-delete-plan-${plan.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
              <DialogDescription>
                {editingPlan ? "Atualize os dados do plano" : "Crie um novo plano de assinatura"}
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
                        <Input {...field} placeholder="Ex: Starter" data-testid="input-plan-nome" />
                      </FormControl>
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
                        <Textarea {...field} placeholder="Descrição do plano" data-testid="input-plan-descricao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="precoMensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Mensal (R$)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" data-testid="input-plan-preco" />
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
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-plan-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUsuarios"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Usuários</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-plan-max-usuarios" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxClientes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Máx. Clientes</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-plan-max-clientes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-plan"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este plano? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-plan"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SeguradorasTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Seguradora | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: seguradoras = [], isLoading } = useQuery<Seguradora[]>({
    queryKey: ["/api/admin/seguradoras"],
  });

  const form = useForm<SeguradoraFormData>({
    resolver: zodResolver(seguradoraFormSchema),
    defaultValues: {
      nome: "",
      cnpj: "",
      codigoSusep: "",
      website: "",
      telefoneMatriz: "",
      emailMatriz: "",
      ativo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: SeguradoraFormData) => {
      const response = await apiRequest("POST", "/api/admin/seguradoras", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Seguradora criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SeguradoraFormData & { id: string }) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PATCH", `/api/admin/seguradoras/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Seguradora atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/seguradoras/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Seguradora removida!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (item: Seguradora) => {
    setEditingItem(item);
    form.reset({
      nome: item.nome,
      cnpj: item.cnpj || "",
      codigoSusep: item.codigoSusep || "",
      website: item.website || "",
      telefoneMatriz: item.telefoneMatriz || "",
      emailMatriz: item.emailMatriz || "",
      ativo: item.ativo !== false,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    form.reset({
      nome: "",
      cnpj: "",
      codigoSusep: "",
      website: "",
      telefoneMatriz: "",
      emailMatriz: "",
      ativo: true,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: SeguradoraFormData) => {
    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredSeguradoras = seguradoras.filter((s) =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Seguradoras</CardTitle>
          <CardDescription>Cadastro de seguradoras parceiras</CardDescription>
        </div>
        <Button onClick={openCreate} data-testid="button-add-seguradora">
          <Plus className="h-4 w-4 mr-2" />
          Nova Seguradora
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar seguradora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-seguradora"
            />
          </div>
          <Badge variant="secondary">{filteredSeguradoras.length} seguradoras</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seguradora</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Código SUSEP</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeguradoras.map((item) => (
              <TableRow key={item.id} data-testid={`row-seguradora-${item.id}`}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell className="font-mono text-sm">{item.cnpj || "-"}</TableCell>
                <TableCell>{item.codigoSusep || "-"}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {item.emailMatriz || item.telefoneMatriz || "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={item.ativo !== false ? "default" : "secondary"}>
                    {item.ativo !== false ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(item)}
                      data-testid={`button-edit-seguradora-${item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(item.id)}
                      data-testid={`button-delete-seguradora-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Seguradora" : "Nova Seguradora"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Atualize os dados da seguradora" : "Cadastre uma nova seguradora"}
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
                        <Input {...field} placeholder="Nome da seguradora" data-testid="input-seguradora-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                            data-testid="input-seguradora-cnpj"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="codigoSusep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código SUSEP</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="00000" data-testid="input-seguradora-susep" />
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
                        <Input {...field} placeholder="https://www.example.com" data-testid="input-seguradora-website" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emailMatriz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Matriz</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="email@seguradora.com" data-testid="input-seguradora-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefoneMatriz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone Matriz</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="0800 000 0000"
                            maxLength={15}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            data-testid="input-seguradora-telefone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Seguradora Ativa</FormLabel>
                        <FormDescription>
                          Seguradoras inativas não aparecem nas opções de cotação
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-seguradora-ativo"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-seguradora"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover esta seguradora? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-seguradora"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function TiposSeguroTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TipoSeguro | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: tipos = [], isLoading } = useQuery<TipoSeguro[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const form = useForm<TipoSeguroFormData>({
    resolver: zodResolver(tipoSeguroFormSchema),
    defaultValues: {
      nome: "",
      categoria: "",
      descricao: "",
      icone: "",
      ordem: 0,
      ativo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TipoSeguroFormData) => {
      const response = await apiRequest("POST", "/api/admin/tipos-seguro", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Produto criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tipos-seguro"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TipoSeguroFormData & { id: string }) => {
      const { id, ...rest } = data;
      const response = await apiRequest("PATCH", `/api/admin/tipos-seguro/${id}`, rest);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tipos-seguro"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/tipos-seguro/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Produto removido!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tipos-seguro"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (item: TipoSeguro) => {
    setEditingItem(item);
    form.reset({
      nome: item.nome,
      categoria: item.categoria,
      descricao: item.descricao || "",
      icone: item.icone || "",
      ordem: item.ordem || 0,
      ativo: item.ativo !== false,
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    form.reset({
      nome: "",
      categoria: "",
      descricao: "",
      icone: "",
      ordem: 0,
      ativo: true,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: TipoSeguroFormData) => {
    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredTipos = tipos.filter((t) =>
    t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Produtos de Seguros</CardTitle>
          <CardDescription>Tipos genéricos de seguros disponíveis no mercado</CardDescription>
        </div>
        <Button onClick={openCreate} data-testid="button-add-produto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-produto"
            />
          </div>
          <Badge variant="secondary">{filteredTipos.length} produtos</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ordem</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTipos.sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((item) => (
              <TableRow key={item.id} data-testid={`row-produto-${item.id}`}>
                <TableCell className="text-muted-foreground">{item.ordem}</TableCell>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.categoria}</Badge>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">
                  {item.descricao || "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={item.ativo !== false ? "default" : "secondary"}>
                    {item.ativo !== false ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(item)}
                      data-testid={`button-edit-produto-${item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(item.id)}
                      data-testid={`button-delete-produto-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Atualize os dados do produto" : "Cadastre um novo tipo de seguro"}
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
                        <Input {...field} placeholder="Ex: Automóvel" data-testid="input-produto-nome" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="automovel" data-testid="input-produto-categoria" />
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
                        <FormLabel>Ordem</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" data-testid="input-produto-ordem" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Descrição do produto" data-testid="input-produto-descricao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="icone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ícone (Lucide)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="car, home, heart..." data-testid="input-produto-icone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Produto Ativo</FormLabel>
                        <FormDescription>
                          Produtos inativos não aparecem nas opções de cotação
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-produto-ativo"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-produto"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-produto"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function VinculacaoTab() {
  const { toast } = useToast();
  const [selectedSeguradora, setSelectedSeguradora] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: seguradoras = [] } = useQuery<Seguradora[]>({
    queryKey: ["/api/admin/seguradoras"],
  });

  const { data: tipos = [] } = useQuery<TipoSeguro[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const { data: vinculacoes = [], isLoading } = useQuery<SeguradoraProduto[]>({
    queryKey: ["/api/admin/seguradora-produtos"],
  });

  const { data: produtosSeguradora = [], refetch: refetchProdutos } = useQuery<SeguradoraProduto[]>({
    queryKey: ["/api/admin/seguradoras", selectedSeguradora, "produtos"],
    enabled: !!selectedSeguradora,
  });

  const [selectedProdutos, setSelectedProdutos] = useState<Set<string>>(new Set());

  const createMutation = useMutation({
    mutationFn: async (data: { seguradoraId: string; tipoSeguroId: string }) => {
      const response = await apiRequest("POST", "/api/admin/seguradora-produtos", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Vinculação criada!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradora-produtos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras", selectedSeguradora, "produtos"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/seguradora-produtos/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Vinculação removida!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradora-produtos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/seguradoras", selectedSeguradora, "produtos"] });
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const handleSeguradoraChange = (seguradoraId: string) => {
    setSelectedSeguradora(seguradoraId);
    const existingProdutos = vinculacoes
      .filter((v) => v.seguradoraId === seguradoraId)
      .map((v) => v.tipoSeguroId);
    setSelectedProdutos(new Set(existingProdutos));
  };

  const handleProdutoToggle = (tipoSeguroId: string) => {
    const existingVinculacao = vinculacoes.find(
      (v) => v.seguradoraId === selectedSeguradora && v.tipoSeguroId === tipoSeguroId
    );

    if (existingVinculacao) {
      deleteMutation.mutate(existingVinculacao.id);
      setSelectedProdutos((prev) => {
        const next = new Set(prev);
        next.delete(tipoSeguroId);
        return next;
      });
    } else {
      createMutation.mutate({ seguradoraId: selectedSeguradora, tipoSeguroId });
      setSelectedProdutos((prev) => new Set([...Array.from(prev), tipoSeguroId]));
    }
  };

  const getSeguradorasForProduct = (tipoSeguroId: string) => {
    return vinculacoes
      .filter((v) => v.tipoSeguroId === tipoSeguroId)
      .map((v) => seguradoras.find((s) => s.id === v.seguradoraId)?.nome)
      .filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vinculação de Produtos por Seguradora</CardTitle>
          <CardDescription>
            Selecione uma seguradora para definir quais produtos ela trabalha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedSeguradora} onValueChange={handleSeguradoraChange}>
              <SelectTrigger className="w-[300px]" data-testid="select-seguradora-vinculacao">
                <SelectValue placeholder="Selecione uma seguradora" />
              </SelectTrigger>
              <SelectContent>
                {seguradoras.filter((s) => s.ativo !== false).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSeguradora && (
              <Badge variant="secondary">
                {selectedProdutos.size} produtos vinculados
              </Badge>
            )}
          </div>

          {selectedSeguradora ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tipos.filter((t) => t.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((tipo) => (
                <div
                  key={tipo.id}
                  className={`p-3 border rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                    selectedProdutos.has(tipo.id)
                      ? "border-primary bg-primary/5"
                      : "hover-elevate"
                  }`}
                  onClick={() => handleProdutoToggle(tipo.id)}
                  data-testid={`checkbox-produto-${tipo.id}`}
                >
                  <Checkbox
                    checked={selectedProdutos.has(tipo.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{tipo.nome}</p>
                    <p className="text-xs text-muted-foreground">{tipo.categoria}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Selecione uma seguradora para gerenciar seus produtos</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo por Produto</CardTitle>
          <CardDescription>
            Veja quais seguradoras trabalham com cada produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Seguradoras</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos.filter((t) => t.ativo !== false).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((tipo) => {
                const seguradorasNames = getSeguradorasForProduct(tipo.id);
                return (
                  <TableRow key={tipo.id} data-testid={`row-resumo-${tipo.id}`}>
                    <TableCell className="font-medium">{tipo.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {seguradorasNames.slice(0, 5).map((nome, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {nome}
                          </Badge>
                        ))}
                        {seguradorasNames.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{seguradorasNames.length - 5}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge>{seguradorasNames.length}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Campos disponíveis para condições de regras
const CAMPOS_PF = [
  { value: "idade", label: "Idade", tipo: "numero" },
  { value: "sexo", label: "Sexo", tipo: "opcao", opcoes: [{ value: "M", label: "Masculino" }, { value: "F", label: "Feminino" }] },
  { value: "estadoCivil", label: "Estado Civil", tipo: "opcao", opcoes: [
    { value: "solteiro", label: "Solteiro" },
    { value: "casado", label: "Casado" },
    { value: "divorciado", label: "Divorciado" },
    { value: "viuvo", label: "Viúvo" },
    { value: "uniao_estavel", label: "União Estável" },
  ]},
  { value: "profissao", label: "Profissão", tipo: "texto" },
  { value: "rendaMensal", label: "Renda Mensal (R$)", tipo: "numero" },
  { value: "numeroDependentes", label: "Número de Dependentes", tipo: "numero" },
  { value: "possuiVeiculo", label: "Possui Veículo", tipo: "booleano" },
  { value: "possuiImovel", label: "Possui Imóvel", tipo: "booleano" },
  { value: "possuiEmbarcacao", label: "Possui Embarcação", tipo: "booleano" },
  { value: "quantidadeVeiculos", label: "Quantidade de Veículos", tipo: "numero" },
  { value: "quantidadeImoveis", label: "Quantidade de Imóveis", tipo: "numero" },
];

const CAMPOS_PJ = [
  { value: "segmentoAtividade", label: "Segmento/Atividade", tipo: "texto" },
  { value: "cnae", label: "CNAE", tipo: "texto" },
  { value: "porteEmpresa", label: "Porte da Empresa", tipo: "opcao", opcoes: [
    { value: "micro", label: "Microempresa" },
    { value: "pequeno", label: "Pequena Empresa" },
    { value: "medio", label: "Média Empresa" },
    { value: "grande", label: "Grande Empresa" },
  ]},
  { value: "faturamentoMensal", label: "Faturamento Mensal (R$)", tipo: "numero" },
  { value: "numeroFuncionarios", label: "Número de Funcionários", tipo: "numero" },
  { value: "possuiVeiculos", label: "Possui Veículos", tipo: "booleano" },
  { value: "possuiMaquinas", label: "Possui Máquinas/Equipamentos", tipo: "booleano" },
  { value: "quantidadeVeiculos", label: "Quantidade de Veículos", tipo: "numero" },
  { value: "quantidadeFuncionarios", label: "Quantidade de Funcionários", tipo: "numero" },
];

const OPERADORES = [
  { value: "=", label: "Igual a" },
  { value: "!=", label: "Diferente de" },
  { value: ">", label: "Maior que" },
  { value: ">=", label: "Maior ou igual a" },
  { value: "<", label: "Menor que" },
  { value: "<=", label: "Menor ou igual a" },
  { value: "contains", label: "Contém" },
];

function BusinessRulesTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BusinessRule | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [conditions, setConditions] = useState<RuleCondition[]>([]);

  const { data: rules = [], isLoading } = useQuery<BusinessRule[]>({
    queryKey: ["/api/admin/business-rules"],
  });

  const { data: tipos = [] } = useQuery<TipoSeguro[]>({
    queryKey: ["/api/admin/tipos-seguro"],
  });

  const form = useForm<BusinessRuleFormData>({
    resolver: zodResolver(businessRuleFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      tipoPessoa: "ambos",
      tipoSeguroId: "",
      prioridade: 0,
      scoreBonus: 10,
      ativo: true,
    },
  });

  const tipoPessoa = form.watch("tipoPessoa");

  const createMutation = useMutation({
    mutationFn: async (data: BusinessRuleFormData & { condicoes: RuleCondition[] }) => {
      const payload = {
        ...data,
        condicoes: data.condicoes,
        regras: { condicoes: data.condicoes },
        tipoSeguroId: data.tipoSeguroId || null,
      };
      const response = await apiRequest("POST", "/api/admin/business-rules", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Regra criada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-rules"] });
      setDialogOpen(false);
      form.reset();
      setConditions([]);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BusinessRuleFormData & { id: string; condicoes: RuleCondition[] }) => {
      const { id, condicoes, ...rest } = data;
      const payload = {
        ...rest,
        condicoes,
        regras: { condicoes },
        tipoSeguroId: rest.tipoSeguroId || null,
      };
      const response = await apiRequest("PATCH", `/api/admin/business-rules/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Regra atualizada com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-rules"] });
      setDialogOpen(false);
      setEditingItem(null);
      form.reset();
      setConditions([]);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/business-rules/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Regra removida!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/business-rules"] });
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const openEdit = (item: BusinessRule) => {
    setEditingItem(item);
    form.reset({
      nome: item.nome,
      descricao: item.descricao || "",
      tipoPessoa: item.tipoPessoa,
      tipoSeguroId: item.tipoSeguroId || "",
      prioridade: item.prioridade || 0,
      scoreBonus: item.scoreBonus || 10,
      ativo: item.ativo !== false,
    });
    setConditions(Array.isArray(item.condicoes) ? item.condicoes : []);
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingItem(null);
    form.reset({
      nome: "",
      descricao: "",
      tipoPessoa: "ambos",
      tipoSeguroId: "",
      prioridade: 0,
      scoreBonus: 10,
      ativo: true,
    });
    setConditions([]);
    setDialogOpen(true);
  };

  const onSubmit = (data: BusinessRuleFormData) => {
    if (editingItem) {
      updateMutation.mutate({ ...data, id: editingItem.id, condicoes: conditions });
    } else {
      createMutation.mutate({ ...data, condicoes: conditions });
    }
  };

  const addCondition = () => {
    setConditions([...conditions, { campo: "", operador: "=", valor: "" }]);
  };

  const updateCondition = (index: number, field: keyof RuleCondition, value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    setConditions(updated);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const getCamposDisponiveis = () => {
    if (tipoPessoa === "pf") return CAMPOS_PF;
    if (tipoPessoa === "pj") return CAMPOS_PJ;
    return [...CAMPOS_PF, ...CAMPOS_PJ];
  };

  const getTipoSeguroNome = (id: string | null) => {
    if (!id) return "Todos os produtos";
    const tipo = tipos.find((t) => t.id === id);
    return tipo?.nome || "Desconhecido";
  };

  const filteredRules = rules.filter((r) =>
    r.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Regras de Negócio
          </CardTitle>
          <CardDescription>
            Configure regras para recomendar produtos baseado no perfil do cliente
          </CardDescription>
        </div>
        <Button onClick={openCreate} data-testid="button-add-rule">
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar regra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-rule"
            />
          </div>
          <Badge variant="secondary">{filteredRules.length} regras</Badge>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Regra</TableHead>
              <TableHead>Tipo Pessoa</TableHead>
              <TableHead>Produto Alvo</TableHead>
              <TableHead>Condições</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.map((item) => (
              <TableRow key={item.id} data-testid={`row-rule-${item.id}`}>
                <TableCell>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    {item.descricao && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{item.descricao}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.tipoPessoa === "pf" ? (
                      <><User className="h-3 w-3 mr-1" />PF</>
                    ) : item.tipoPessoa === "pj" ? (
                      <><Briefcase className="h-3 w-3 mr-1" />PJ</>
                    ) : (
                      <><Users className="h-3 w-3 mr-1" />Ambos</>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getTipoSeguroNome(item.tipoSeguroId)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {Array.isArray(item.condicoes) ? item.condicoes.length : 0} condições
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    +{item.scoreBonus || 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={item.ativo !== false ? "default" : "secondary"}>
                    {item.ativo !== false ? "Ativa" : "Inativa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEdit(item)}
                      data-testid={`button-edit-rule-${item.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteId(item.id)}
                      data-testid={`button-delete-rule-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredRules.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  <Scale className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma regra cadastrada</p>
                  <p className="text-sm">Crie regras para recomendar produtos automaticamente</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Editar Regra" : "Nova Regra de Negócio"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Atualize as condições da regra" : "Configure uma regra para recomendar produtos"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Regra *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Profissional Liberal - RC Profissional" data-testid="input-rule-nome" />
                      </FormControl>
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
                        <Textarea {...field} placeholder="Descreva quando esta regra deve ser aplicada" data-testid="input-rule-descricao" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipoPessoa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Pessoa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-rule-tipo-pessoa">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pf">Pessoa Física</SelectItem>
                            <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
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
                        <FormLabel>Produto Recomendado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-rule-produto">
                              <SelectValue placeholder="Todos os produtos" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Todos os produtos</SelectItem>
                            {tipos.filter((t) => t.ativo !== false).map((tipo) => (
                              <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-rule-prioridade" />
                        </FormControl>
                        <FormDescription>Maior = mais importante</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scoreBonus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score Bônus</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-rule-score" />
                        </FormControl>
                        <FormDescription>Pontos adicionados ao score</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Condições</FormLabel>
                    <Button type="button" variant="outline" size="sm" onClick={addCondition} data-testid="button-add-condition">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar Condição
                    </Button>
                  </div>

                  {conditions.length === 0 ? (
                    <div className="border rounded-lg p-4 text-center text-muted-foreground">
                      <Cog className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma condição definida</p>
                      <p className="text-xs">Adicione condições para ativar esta regra</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conditions.map((cond, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                          <Select
                            value={cond.campo}
                            onValueChange={(v) => updateCondition(index, "campo", v)}
                          >
                            <SelectTrigger className="w-[180px]" data-testid={`select-condition-campo-${index}`}>
                              <SelectValue placeholder="Campo" />
                            </SelectTrigger>
                            <SelectContent>
                              {getCamposDisponiveis().map((campo) => (
                                <SelectItem key={campo.value} value={campo.value}>{campo.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={cond.operador}
                            onValueChange={(v) => updateCondition(index, "operador", v)}
                          >
                            <SelectTrigger className="w-[140px]" data-testid={`select-condition-operador-${index}`}>
                              <SelectValue placeholder="Operador" />
                            </SelectTrigger>
                            <SelectContent>
                              {OPERADORES.map((op) => (
                                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            placeholder="Valor"
                            value={String(cond.valor)}
                            onChange={(e) => updateCondition(index, "valor", e.target.value)}
                            className="flex-1"
                            data-testid={`input-condition-valor-${index}`}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCondition(index)}
                            data-testid={`button-remove-condition-${index}`}
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-rule-ativo"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Regra ativa</FormLabel>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-rule">
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A regra será removida permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete-rule"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

export default function SaasAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administração SaaS</h1>
        <p className="text-muted-foreground">
          Gerencie planos, seguradoras e produtos do sistema
        </p>
      </div>

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plans" data-testid="tab-plans">
            <CreditCard className="h-4 w-4 mr-2" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="seguradoras" data-testid="tab-seguradoras">
            <Building2 className="h-4 w-4 mr-2" />
            Seguradoras
          </TabsTrigger>
          <TabsTrigger value="produtos" data-testid="tab-produtos">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="vinculacao" data-testid="tab-vinculacao">
            <Link2 className="h-4 w-4 mr-2" />
            Vinculação
          </TabsTrigger>
          <TabsTrigger value="regras" data-testid="tab-regras">
            <Scale className="h-4 w-4 mr-2" />
            Regras
          </TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <PlansTab />
        </TabsContent>
        <TabsContent value="seguradoras">
          <SeguradorasTab />
        </TabsContent>
        <TabsContent value="produtos">
          <TiposSeguroTab />
        </TabsContent>
        <TabsContent value="vinculacao">
          <VinculacaoTab />
        </TabsContent>
        <TabsContent value="regras">
          <BusinessRulesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
