import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Phone, Mail, Globe, Shield, Package, Plus, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import type { SeguradoraMaster } from "@shared/schema";

interface ContatoLocal {
  id: string;
  nomeContato: string;
  cargo?: string;
  departamento?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  regional?: string;
  estado?: string;
  cidade?: string;
}

interface SenhaSeguradora {
  id: string;
  nomeSistema: string;
  url?: string;
  usuario: string;
  observacoes?: string;
}

interface TelefoneSeguradora {
  id: string;
  tipoTelefone: "suporte_comercial" | "assistencia" | "sinistros";
  canalContato: "email" | "whatsapp" | "telefone";
  valor: string;
}

export default function SeguradoresDetalhes() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showSenhas, setShowSenhas] = useState<Record<string, boolean>>({});

  const { data: seguradora, isLoading } = useQuery<SeguradoraMaster>({
    queryKey: [`/api/seguradoras/${id}`],
    enabled: !!id,
  });

  const { data: contatosLocais } = useQuery<ContatoLocal[]>({
    queryKey: [`/api/tenant/seguradora-contatos/${id}`],
    enabled: !!id,
  });

  const { data: senhas } = useQuery<SenhaSeguradora[]>({
    queryKey: [`/api/tenant/seguradora-senhas/${id}`],
    enabled: !!id,
  });

  const { data: telefones } = useQuery<TelefoneSeguradora[]>({
    queryKey: [`/api/tenant/seguradora-telefones/${id}`],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return apiRequest("DELETE", `/api/tenant/seguradora-contatos/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenant/seguradora-contatos/${id}`] });
      toast({ title: "Contato removido" });
    },
  });

  if (!id) return <div>Seguradora não encontrada</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/seguradoras")}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-20 w-full" />
      ) : seguradora ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-3xl">{seguradora.nome}</CardTitle>
                    <CardDescription className="mt-2">
                      {seguradora.cnpj ? `CNPJ: ${seguradora.cnpj}` : ""}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={seguradora.ativo ? "default" : "secondary"}>
                  {seguradora.ativo ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="info" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="contatos-geral">Contatos Geral</TabsTrigger>
              <TabsTrigger value="contatos-local">Contatos Local</TabsTrigger>
              <TabsTrigger value="telefones">Telefones</TabsTrigger>
              <TabsTrigger value="senhas">Senhas</TabsTrigger>
            </TabsList>

            {/* ABA 1: INFORMAÇÕES CADASTRAIS */}
            <TabsContent value="info">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Cadastrais</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código SUSEP</p>
                    <p className="font-medium">{seguradora.codigoSusep || "N/A"}</p>
                  </div>
                  {seguradora.website && (
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a href={seguradora.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        Visitar
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: CONTATOS GERAL (Admin SaaS) */}
            <TabsContent value="contatos-geral">
              <Card>
                <CardHeader>
                  <CardTitle>Contatos Gerais (Administração)</CardTitle>
                  <CardDescription>Informações gerenciais da seguradora</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {seguradora.telefoneMatriz && (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded">
                      <Phone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Telefone Matriz</p>
                        <p className="font-medium">{seguradora.telefoneMatriz}</p>
                      </div>
                    </div>
                  )}
                  {seguradora.emailMatriz && (
                    <div className="flex items-center gap-2 p-3 bg-secondary/50 rounded">
                      <Mail className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email Matriz</p>
                        <p className="font-medium text-sm">{seguradora.emailMatriz}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 3: CONTATOS LOCAL (CRUD) */}
            <TabsContent value="contatos-local">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Contatos Locais</CardTitle>
                    <CardDescription>Contatos de atendimento local da seguradora</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Contato Local</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Nome do Contato" />
                        <Input placeholder="Cargo" />
                        <Input placeholder="Departamento" />
                        <Input placeholder="Telefone" />
                        <Input placeholder="Celular" />
                        <Input placeholder="Email" />
                        <Button className="w-full">Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {contatosLocais && contatosLocais.length > 0 ? (
                    <div className="space-y-2">
                      {contatosLocais.map((contato) => (
                        <div key={contato.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{contato.nomeContato}</p>
                            {contato.cargo && <p className="text-xs text-muted-foreground">{contato.cargo}</p>}
                            {contato.email && <p className="text-xs text-muted-foreground">{contato.email}</p>}
                            {contato.celular && <p className="text-xs text-muted-foreground">{contato.celular}</p>}
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(contato.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum contato cadastrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 4: TELEFONES */}
            <TabsContent value="telefones">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Telefones</CardTitle>
                    <CardDescription>Contatos telefônicos por tipo</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Telefone</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Valor (email, telefone, etc)" />
                        <Button className="w-full">Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {telefones && telefones.length > 0 ? (
                    <div className="space-y-2">
                      {telefones.map((tel) => (
                        <div key={tel.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Badge className="mb-2 capitalize">{tel.tipoTelefone.replace(/_/g, " ")}</Badge>
                            <p className="text-sm font-medium">{tel.valor}</p>
                            <p className="text-xs text-muted-foreground capitalize">{tel.canalContato}</p>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhum telefone cadastrado</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 5: GESTÃO DE SENHAS */}
            <TabsContent value="senhas">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>Gestão de Senhas</CardTitle>
                      <CardDescription>Acesso restrito a Administrador/Corretor</CardDescription>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Nova Senha de Sistema</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Input placeholder="Nome do Sistema" />
                        <Input placeholder="URL" />
                        <Input placeholder="Usuário" />
                        <Input type="password" placeholder="Senha" />
                        <Button className="w-full">Salvar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {senhas && senhas.length > 0 ? (
                    <div className="space-y-2">
                      {senhas.map((senha) => (
                        <div key={senha.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{senha.nomeSistema}</p>
                            {senha.url && <p className="text-xs text-muted-foreground break-all">{senha.url}</p>}
                            <p className="text-xs text-muted-foreground">Usuário: {senha.usuario}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => setShowSenhas({ ...showSenhas, [senha.id]: !showSenhas[senha.id] })}>
                              {showSenhas[senha.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">Nenhuma senha cadastrada</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Seguradora não encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
