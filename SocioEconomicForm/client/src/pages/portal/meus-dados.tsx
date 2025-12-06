import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Briefcase, DollarSign, Users, Phone, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const estadoCivilOptions = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União Estável" },
];

const preferenciaContatoOptions = [
  { value: "email", label: "E-mail" },
  { value: "telefone", label: "Telefone" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function MeusDadosPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, error } = useQuery<{
    pessoaFisica: any;
    endereco: any;
    dependentes: any[];
  }>({
    queryKey: ["/api/portal/meus-dados"],
  });

  const [formData, setFormData] = useState<any>({});

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/portal/meus-dados", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portal/meus-dados"] });
      toast({ title: "Dados atualizados com sucesso!" });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar dados", description: error.message, variant: "destructive" });
    },
  });

  const handleEdit = () => {
    setFormData({
      profissao: data?.pessoaFisica?.profissao || "",
      empresaEmprego: data?.pessoaFisica?.empresaEmprego || "",
      ocupacaoRisco: data?.pessoaFisica?.ocupacaoRisco || "",
      rendaMensalBruta: data?.pessoaFisica?.rendaMensalBruta || "",
      rendaMensalLiquida: data?.pessoaFisica?.rendaMensalLiquida || "",
      gastosMensais: data?.pessoaFisica?.gastosMensais || "",
      economias: data?.pessoaFisica?.economias || "",
      numeroDependentes: data?.pessoaFisica?.numeroDependentes || 0,
      estadoCivil: data?.pessoaFisica?.estadoCivil || "",
      telefone: data?.pessoaFisica?.telefone || "",
      celular: data?.pessoaFisica?.celular || "",
      preferenciaContato: data?.pessoaFisica?.preferenciaContato || "",
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data?.pessoaFisica) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Não foi possível carregar seus dados. Tente novamente mais tarde.
          </CardContent>
        </Card>
      </div>
    );
  }

  const pf = data.pessoaFisica;
  const endereco = data.endereco;

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus Dados</h1>
          <p className="text-muted-foreground">Mantenha suas informações atualizadas para melhores recomendações</p>
        </div>
        {!isEditing && (
          <Button onClick={handleEdit}>Editar Dados</Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
          <CardDescription>Informações básicas do seu cadastro</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-xs">Nome Completo</Label>
            <p className="font-medium">{pf.nomeCompleto}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">CPF</Label>
            <p className="font-medium">{pf.cpf}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Data de Nascimento</Label>
            <p className="font-medium">{pf.dataNascimento || "-"}</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Estado Civil</Label>
            {isEditing ? (
              <Select value={formData.estadoCivil} onValueChange={(v) => setFormData({ ...formData, estadoCivil: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {estadoCivilOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">{estadoCivilOptions.find(o => o.value === pf.estadoCivil)?.label || "-"}</p>
            )}
          </div>
          {endereco && (
            <div className="md:col-span-2">
              <Label className="text-muted-foreground text-xs">Endereço</Label>
              <p className="font-medium">
                {[endereco.logradouro, endereco.numero, endereco.complemento, endereco.bairro, endereco.cidade, endereco.estado]
                  .filter(Boolean).join(", ") || "-"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-muted-foreground text-xs">Telefone</Label>
            {isEditing ? (
              <Input value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
            ) : (
              <p className="font-medium">{pf.telefone || "-"}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Celular</Label>
            {isEditing ? (
              <Input value={formData.celular} onChange={(e) => setFormData({ ...formData, celular: e.target.value })} />
            ) : (
              <p className="font-medium">{pf.celular || "-"}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Preferência de Contato</Label>
            {isEditing ? (
              <Select value={formData.preferenciaContato} onValueChange={(v) => setFormData({ ...formData, preferenciaContato: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {preferenciaContatoOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium">{preferenciaContatoOptions.find(o => o.value === pf.preferenciaContato)?.label || "-"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Dados Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-muted-foreground text-xs">Profissão</Label>
            {isEditing ? (
              <Input value={formData.profissao} onChange={(e) => setFormData({ ...formData, profissao: e.target.value })} />
            ) : (
              <p className="font-medium">{pf.profissao || "-"}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Empresa/Empregador</Label>
            {isEditing ? (
              <Input value={formData.empresaEmprego} onChange={(e) => setFormData({ ...formData, empresaEmprego: e.target.value })} />
            ) : (
              <p className="font-medium">{pf.empresaEmprego || "-"}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Ocupação de Risco</Label>
            {isEditing ? (
              <Input value={formData.ocupacaoRisco} onChange={(e) => setFormData({ ...formData, ocupacaoRisco: e.target.value })} />
            ) : (
              <p className="font-medium">{pf.ocupacaoRisco || "-"}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dados Financeiros
          </CardTitle>
          <CardDescription>Informações importantes para adequação de produtos</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-xs">Renda Mensal Bruta</Label>
            {isEditing ? (
              <Input type="number" value={formData.rendaMensalBruta} onChange={(e) => setFormData({ ...formData, rendaMensalBruta: e.target.value })} />
            ) : (
              <p className="font-medium">{formatCurrency(pf.rendaMensalBruta)}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Renda Mensal Líquida</Label>
            {isEditing ? (
              <Input type="number" value={formData.rendaMensalLiquida} onChange={(e) => setFormData({ ...formData, rendaMensalLiquida: e.target.value })} />
            ) : (
              <p className="font-medium">{formatCurrency(pf.rendaMensalLiquida)}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Gastos Mensais</Label>
            {isEditing ? (
              <Input type="number" value={formData.gastosMensais} onChange={(e) => setFormData({ ...formData, gastosMensais: e.target.value })} />
            ) : (
              <p className="font-medium">{formatCurrency(pf.gastosMensais)}</p>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Economias/Reserva</Label>
            {isEditing ? (
              <Input type="number" value={formData.economias} onChange={(e) => setFormData({ ...formData, economias: e.target.value })} />
            ) : (
              <p className="font-medium">{formatCurrency(pf.economias)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Dependentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground text-xs">Número de Dependentes</Label>
              {isEditing ? (
                <Input type="number" min="0" value={formData.numeroDependentes} onChange={(e) => setFormData({ ...formData, numeroDependentes: parseInt(e.target.value) || 0 })} />
              ) : (
                <p className="font-medium">{pf.numeroDependentes || 0}</p>
              )}
            </div>
          </div>
          {data.dependentes && data.dependentes.length > 0 && (
            <div className="mt-4">
              <Label className="text-muted-foreground text-xs mb-2 block">Dependentes Cadastrados</Label>
              <div className="space-y-2">
                {data.dependentes.map((dep: any) => (
                  <div key={dep.id} className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{dep.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {dep.grauParentesco} {dep.dataNascimento && `- ${dep.dataNascimento}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações
          </Button>
        </div>
      )}
    </div>
  );
}
