import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Package, Plus, Car, Home, Briefcase, Anchor, Gem, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const tipoPatrimonioOptions = [
  { value: "veiculo", label: "Veículo", icon: Car },
  { value: "imovel", label: "Imóvel", icon: Home },
  { value: "equipamento", label: "Equipamento", icon: Briefcase },
  { value: "embarcacao", label: "Embarcação", icon: Anchor },
  { value: "colecao", label: "Coleção", icon: Gem },
];

const usoVeiculoOptions = [
  { value: "particular", label: "Particular" },
  { value: "comercial", label: "Comercial" },
  { value: "misto", label: "Misto" },
];

const tipoImovelOptions = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "comercial", label: "Comercial" },
  { value: "terreno", label: "Terreno" },
  { value: "rural", label: "Rural" },
];

export default function MeusPatrimoniosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo: "",
    descricao: "",
    valorAproximado: "",
    dataAquisicao: "",
    seguradoAtual: false,
    marcaVeiculo: "",
    modeloVeiculo: "",
    anoFabricacao: "",
    anoModelo: "",
    placa: "",
    usoVeiculo: "",
    tipoImovel: "",
    areaM2: "",
    quartos: "",
    valorVenal: "",
    residencialPrincipal: false,
  });

  const { data: patrimonios, isLoading } = useQuery<any[]>({
    queryKey: ["/api/portal/patrimonios"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/portal/patrimonios", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/patrimonios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/gaps"] });
      toast({ title: "Patrimônio cadastrado com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: "Erro ao cadastrar patrimônio", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/portal/patrimonios/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/patrimonios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/portal/gaps"] });
      toast({ title: "Patrimônio removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao remover patrimônio", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      tipo: "",
      descricao: "",
      valorAproximado: "",
      dataAquisicao: "",
      seguradoAtual: false,
      marcaVeiculo: "",
      modeloVeiculo: "",
      anoFabricacao: "",
      anoModelo: "",
      placa: "",
      usoVeiculo: "",
      tipoImovel: "",
      areaM2: "",
      quartos: "",
      valorVenal: "",
      residencialPrincipal: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      tipo: formData.tipo,
      descricao: formData.descricao,
      valorAproximado: formData.valorAproximado ? parseFloat(formData.valorAproximado) : null,
      dataAquisicao: formData.dataAquisicao || null,
      seguradoAtual: formData.seguradoAtual,
      marcaVeiculo: formData.tipo === "veiculo" ? formData.marcaVeiculo : null,
      modeloVeiculo: formData.tipo === "veiculo" ? formData.modeloVeiculo : null,
      anoFabricacao: formData.tipo === "veiculo" && formData.anoFabricacao ? parseInt(formData.anoFabricacao) : null,
      anoModelo: formData.tipo === "veiculo" && formData.anoModelo ? parseInt(formData.anoModelo) : null,
      placa: formData.tipo === "veiculo" ? formData.placa : null,
      usoVeiculo: formData.tipo === "veiculo" ? formData.usoVeiculo : null,
      tipoImovel: formData.tipo === "imovel" ? formData.tipoImovel : null,
      areaM2: formData.tipo === "imovel" && formData.areaM2 ? parseFloat(formData.areaM2) : null,
      quartos: formData.tipo === "imovel" && formData.quartos ? parseInt(formData.quartos) : null,
      valorVenal: formData.tipo === "imovel" && formData.valorVenal ? parseFloat(formData.valorVenal) : null,
      residencialPrincipal: formData.tipo === "imovel" ? formData.residencialPrincipal : false,
    });
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getPatrimonioIcon = (tipo: string) => {
    const option = tipoPatrimonioOptions.find(o => o.value === tipo);
    if (!option) return Package;
    return option.icon;
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
            <Package className="h-6 w-6 text-primary" />
            Meus Patrimônios
          </h1>
          <p className="text-muted-foreground">Gerencie seus bens para análise de proteção adequada</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Patrimônio
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Patrimônio</DialogTitle>
              <DialogDescription>
                Adicione um bem para análise de seguro adequado
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Patrimônio *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoPatrimonioOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição *</Label>
                <Input 
                  value={formData.descricao} 
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder={formData.tipo === "veiculo" ? "Ex: Honda Civic 2022" : formData.tipo === "imovel" ? "Ex: Apartamento Centro" : "Descrição do bem"}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Valor Aproximado (R$)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={formData.valorAproximado} 
                    onChange={(e) => setFormData({ ...formData, valorAproximado: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Aquisição</Label>
                  <Input 
                    type="date" 
                    value={formData.dataAquisicao} 
                    onChange={(e) => setFormData({ ...formData, dataAquisicao: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="seguradoAtual" 
                  checked={formData.seguradoAtual}
                  onCheckedChange={(checked) => setFormData({ ...formData, seguradoAtual: checked as boolean })}
                />
                <Label htmlFor="seguradoAtual" className="text-sm">Já possui seguro para este bem</Label>
              </div>

              {formData.tipo === "veiculo" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Car className="h-4 w-4" /> Dados do Veículo
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input 
                        value={formData.marcaVeiculo} 
                        onChange={(e) => setFormData({ ...formData, marcaVeiculo: e.target.value })}
                        placeholder="Ex: Honda, Toyota..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo</Label>
                      <Input 
                        value={formData.modeloVeiculo} 
                        onChange={(e) => setFormData({ ...formData, modeloVeiculo: e.target.value })}
                        placeholder="Ex: Civic, Corolla..."
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Ano Fabricação</Label>
                      <Input 
                        type="number" 
                        value={formData.anoFabricacao} 
                        onChange={(e) => setFormData({ ...formData, anoFabricacao: e.target.value })}
                        placeholder="2023"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ano Modelo</Label>
                      <Input 
                        type="number" 
                        value={formData.anoModelo} 
                        onChange={(e) => setFormData({ ...formData, anoModelo: e.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Placa</Label>
                      <Input 
                        value={formData.placa} 
                        onChange={(e) => setFormData({ ...formData, placa: e.target.value.toUpperCase() })}
                        placeholder="ABC1D23"
                        maxLength={7}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Uso do Veículo</Label>
                    <Select value={formData.usoVeiculo} onValueChange={(v) => setFormData({ ...formData, usoVeiculo: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {usoVeiculoOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {formData.tipo === "imovel" && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" /> Dados do Imóvel
                  </h4>
                  <div className="space-y-2">
                    <Label>Tipo de Imóvel</Label>
                    <Select value={formData.tipoImovel} onValueChange={(v) => setFormData({ ...formData, tipoImovel: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoImovelOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Área (m²)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.areaM2} 
                        onChange={(e) => setFormData({ ...formData, areaM2: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quartos</Label>
                      <Input 
                        type="number" 
                        value={formData.quartos} 
                        onChange={(e) => setFormData({ ...formData, quartos: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Valor Venal (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.valorVenal} 
                        onChange={(e) => setFormData({ ...formData, valorVenal: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="residencialPrincipal" 
                      checked={formData.residencialPrincipal}
                      onCheckedChange={(checked) => setFormData({ ...formData, residencialPrincipal: checked as boolean })}
                    />
                    <Label htmlFor="residencialPrincipal" className="text-sm">É minha residência principal</Label>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || !formData.tipo || !formData.descricao}>
                  {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Cadastrar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!patrimonios || patrimonios.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum patrimônio cadastrado</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre seus bens para que possamos identificar as melhores proteções para você
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Cadastrar Primeiro Patrimônio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {patrimonios.map((patrimonio) => {
            const Icon = getPatrimonioIcon(patrimonio.tipo);
            return (
              <Card key={patrimonio.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{patrimonio.descricao}</CardTitle>
                        <CardDescription>
                          {tipoPatrimonioOptions.find(o => o.value === patrimonio.tipo)?.label}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {patrimonio.seguradoAtual ? (
                        <Badge variant="default" className="bg-green-600">Segurado</Badge>
                      ) : (
                        <Badge variant="outline">Sem seguro</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(patrimonio.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Valor Aproximado</p>
                      <p className="font-medium">{formatCurrency(patrimonio.valorAproximado)}</p>
                    </div>
                    {patrimonio.tipo === "veiculo" && (
                      <>
                        <div>
                          <p className="text-muted-foreground text-xs">Veículo</p>
                          <p className="font-medium">{patrimonio.marcaVeiculo} {patrimonio.modeloVeiculo}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Ano/Placa</p>
                          <p className="font-medium">{patrimonio.anoFabricacao}/{patrimonio.anoModelo} - {patrimonio.placa}</p>
                        </div>
                      </>
                    )}
                    {patrimonio.tipo === "imovel" && (
                      <>
                        <div>
                          <p className="text-muted-foreground text-xs">Tipo</p>
                          <p className="font-medium">{tipoImovelOptions.find(o => o.value === patrimonio.tipoImovel)?.label || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Área/Quartos</p>
                          <p className="font-medium">{patrimonio.areaM2 ? `${patrimonio.areaM2}m²` : "-"} {patrimonio.quartos ? `/ ${patrimonio.quartos} quartos` : ""}</p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
