import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Plus, Calendar, Building2, Car, Home, LinkIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function MinhasApolicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipoSeguroId: "",
    seguradoraId: "",
    numeroApolice: "",
    dataInicio: "",
    dataFim: "",
    premioMensal: "",
    valorCobertura: "",
    patrimonioId: "",
    observacoes: "",
  });

  const { data: apolices, isLoading } = useQuery<any[]>({
    queryKey: ["/api/portal/apolices"],
  });

  const { data: tiposSeguro } = useQuery<any[]>({
    queryKey: ["/api/portal/catalogo/tipos-seguro"],
  });

  const { data: seguradoras } = useQuery<any[]>({
    queryKey: ["/api/portal/catalogo/seguradoras"],
  });

  const { data: patrimonios } = useQuery<any[]>({
    queryKey: ["/api/portal/patrimonios"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/portal/apolices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/apolices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/protecoes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/gaps"] });
      toast({ title: "Apólice cadastrada com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar apólice", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      tipoSeguroId: "",
      seguradoraId: "",
      numeroApolice: "",
      dataInicio: "",
      dataFim: "",
      premioMensal: "",
      valorCobertura: "",
      patrimonioId: "",
      observacoes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      premioMensal: formData.premioMensal ? parseFloat(formData.premioMensal) : null,
      valorCobertura: formData.valorCobertura ? parseFloat(formData.valorCobertura) : null,
    });
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativa":
        return <Badge variant="default" className="bg-green-600">Ativa</Badge>;
      case "vencida":
        return <Badge variant="destructive">Vencida</Badge>;
      case "cancelada":
        return <Badge variant="secondary">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPatrimonioIcon = (tipo: string) => {
    switch (tipo) {
      case "veiculo":
        return <Car className="h-3 w-3" />;
      case "imovel":
        return <Home className="h-3 w-3" />;
      default:
        return <LinkIcon className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Minhas Apólices
          </h1>
          <p className="text-muted-foreground">Gerencie todas as suas apólices de seguro</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Apólice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastrar Nova Apólice</DialogTitle>
              <DialogDescription>
                Adicione uma apólice de seguro que você já possui
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Seguro *</Label>
                  <Select value={formData.tipoSeguroId} onValueChange={(v) => setFormData({ ...formData, tipoSeguroId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposSeguro?.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>{tipo.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Seguradora</Label>
                  <Select value={formData.seguradoraId} onValueChange={(v) => setFormData({ ...formData, seguradoraId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {seguradoras?.map((seg) => (
                        <SelectItem key={seg.id} value={seg.id}>{seg.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Número da Apólice</Label>
                <Input value={formData.numeroApolice} onChange={(e) => setFormData({ ...formData, numeroApolice: e.target.value })} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input type="date" value={formData.dataInicio} onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input type="date" value={formData.dataFim} onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prêmio Mensal (R$)</Label>
                  <Input type="number" step="0.01" value={formData.premioMensal} onChange={(e) => setFormData({ ...formData, premioMensal: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Valor Cobertura (R$)</Label>
                  <Input type="number" step="0.01" value={formData.valorCobertura} onChange={(e) => setFormData({ ...formData, valorCobertura: e.target.value })} />
                </div>
              </div>

              {patrimonios && patrimonios.length > 0 && (
                <div className="space-y-2">
                  <Label>Vincular a Patrimônio</Label>
                  <Select value={formData.patrimonioId} onValueChange={(v) => setFormData({ ...formData, patrimonioId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      {patrimonios.map((pat) => (
                        <SelectItem key={pat.id} value={pat.id}>
                          {pat.descricao} ({pat.tipo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} />
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || !formData.tipoSeguroId}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!apolices || apolices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma apólice cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre suas apólices existentes para ter um controle completo
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeira Apólice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {apolices.map((apolice) => (
            <Card key={apolice.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{apolice.tipoSeguroNome}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {apolice.seguradoraNome}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(apolice.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">N° Apólice</p>
                    <p className="font-medium">{apolice.numeroApolice || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Vigência</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(apolice.dataInicio)} a {formatDate(apolice.dataFim)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Prêmio Mensal</p>
                    <p className="font-medium">{formatCurrency(apolice.premioMensal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cobertura</p>
                    <p className="font-medium">{formatCurrency(apolice.valorCobertura)}</p>
                  </div>
                </div>
                {apolice.patrimonioId && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm text-muted-foreground">
                    {getPatrimonioIcon(patrimonios?.find(p => p.id === apolice.patrimonioId)?.tipo)}
                    Vinculado a: {patrimonios?.find(p => p.id === apolice.patrimonioId)?.descricao || "Patrimônio"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
