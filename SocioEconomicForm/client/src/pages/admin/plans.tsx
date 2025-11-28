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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { CreditCard, Plus, Users, UserCheck } from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";

const planFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
  precoMensal: z.coerce.number().min(0, "Preço deve ser maior ou igual a 0"),
  maxUsers: z.coerce.number().min(1, "Mínimo de 1 usuário"),
  maxClients: z.coerce.number().min(1, "Mínimo de 1 cliente"),
});

type PlanFormData = z.infer<typeof planFormSchema>;

export default function AdminPlans() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/admin/planos"],
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      precoMensal: 0,
      maxUsers: 1,
      maxClients: 100,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      return apiRequest("POST", "/api/admin/planos", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/planos"] });
      toast({
        title: "Plano criado",
        description: "O plano foi criado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlanFormData) => {
    createMutation.mutate(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Planos de Assinatura
          </h1>
          <p className="text-muted-foreground">
            Gerencie os planos disponíveis para as corretoras
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-plan">
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Plano</DialogTitle>
              <DialogDescription>
                Defina as características do novo plano de assinatura
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Professional" {...field} data-testid="input-plan-name" />
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
                        <Input placeholder="Descrição do plano" {...field} data-testid="input-plan-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="precoMensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço Mensal (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} data-testid="input-plan-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxUsers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max. Usuários</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-plan-max-users" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxClients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max. Clientes</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-plan-max-clients" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending} data-testid="button-save-plan">
                  {createMutation.isPending ? "Salvando..." : "Criar Plano"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plans?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} data-testid={`card-plan-${plan.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {plan.nome}
                  </CardTitle>
                  {plan.status === "ativo" ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                {plan.descricao && (
                  <CardDescription>{plan.descricao}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">
                  {formatCurrency(parseFloat(plan.precoMensal) || 0)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{plan.maxUsuarios} usuários</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    <span>{plan.maxClientes} clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum plano cadastrado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
