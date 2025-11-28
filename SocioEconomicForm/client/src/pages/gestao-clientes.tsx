import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Plus, 
  Send, 
  Upload, 
  Loader2, 
  Mail, 
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Copy,
  Trash2,
} from "lucide-react";
import type { Convite } from "@shared/schema";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  enviado: { label: "Enviado", variant: "default" },
  aceito: { label: "Aceito", variant: "default" },
  expirado: { label: "Expirado", variant: "destructive" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export default function GestaoClientesPage() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCanal, setSelectedCanal] = useState<string>("email");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedClients, setImportedClients] = useState<Array<{ nome: string; email: string; telefone: string }>>([]);

  const [newConvite, setNewConvite] = useState({
    nomeCliente: "",
    email: "",
    telefone: "",
    mensagemPersonalizada: "",
  });

  const { data: convites = [], isLoading } = useQuery<Convite[]>({
    queryKey: ["/api/convites"],
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["/api/clientes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newConvite) => {
      return apiRequest("POST", "/api/convites", {
        ...data,
        canalEnvio: selectedCanal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/convites"] });
      toast({ title: "Convite criado com sucesso!" });
      setDialogOpen(false);
      setNewConvite({ nomeCliente: "", email: "", telefone: "", mensagemPersonalizada: "" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar convite",
        description: error.message,
      });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: async (clientes: Array<{ nome: string; email: string; telefone: string }>) => {
      return apiRequest("POST", "/api/convites/bulk", { clientes });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/convites"] });
      toast({ title: `${data.created} convites criados com sucesso!` });
      setImportDialogOpen(false);
      setImportedClients([]);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar convites",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/convites/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/convites"] });
      toast({ title: "Convite removido" });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/convites/${id}/enviar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/convites"] });
      toast({ title: "Convite enviado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar convite",
        description: error.message,
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(line => line.trim());
      
      const clients: Array<{ nome: string; email: string; telefone: string }> = [];
      
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim().replace(/"/g, ""));
        if (parts.length >= 1) {
          clients.push({
            nome: parts[0] || "",
            email: parts[1] || "",
            telefone: parts[2] || "",
          });
        }
      }
      
      setImportedClients(clients);
    };
    reader.readAsText(file);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Link copiado!" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pendente":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "enviado":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "aceito":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expirado":
      case "cancelado":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie convites e clientes do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-import-csv">
                <Upload className="mr-2 h-4 w-4" />
                Importar CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Clientes via CSV</DialogTitle>
                <DialogDescription>
                  Faça upload de um arquivo CSV com os dados dos clientes (nome, email, telefone)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivo CSV
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Formato esperado: nome,email,telefone (com cabeçalho)
                  </p>
                </div>

                {importedClients.length > 0 && (
                  <div className="space-y-2">
                    <Label>Clientes a importar ({importedClients.length})</Label>
                    <div className="max-h-48 overflow-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>E-mail</TableHead>
                            <TableHead>Telefone</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importedClients.map((client, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{client.nome}</TableCell>
                              <TableCell>{client.email}</TableCell>
                              <TableCell>{client.telefone}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => bulkCreateMutation.mutate(importedClients)}
                  disabled={importedClients.length === 0 || bulkCreateMutation.isPending}
                >
                  {bulkCreateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar {importedClients.length} Convites
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-invite">
                <Plus className="mr-2 h-4 w-4" />
                Novo Convite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Convite</DialogTitle>
                <DialogDescription>
                  Envie um convite para um cliente acessar o sistema
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Cliente *</Label>
                  <Input
                    id="nome"
                    value={newConvite.nomeCliente}
                    onChange={(e) => setNewConvite({ ...newConvite, nomeCliente: e.target.value })}
                    placeholder="Nome completo"
                    data-testid="input-nome-cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newConvite.email}
                    onChange={(e) => setNewConvite({ ...newConvite, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    data-testid="input-email-cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                  <Input
                    id="telefone"
                    value={newConvite.telefone}
                    onChange={(e) => setNewConvite({ ...newConvite, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    data-testid="input-telefone-cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Canal de Envio</Label>
                  <Select value={selectedCanal} onValueChange={setSelectedCanal}>
                    <SelectTrigger data-testid="select-canal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          E-mail
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem Personalizada (Opcional)</Label>
                  <Textarea
                    id="mensagem"
                    value={newConvite.mensagemPersonalizada}
                    onChange={(e) => setNewConvite({ ...newConvite, mensagemPersonalizada: e.target.value })}
                    placeholder="Digite uma mensagem personalizada para incluir no convite..."
                    className="resize-none"
                    data-testid="textarea-mensagem"
                  />
                  <p className="text-xs text-muted-foreground">
                    Se deixar vazio, será usada a mensagem padrão
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMutation.mutate(newConvite)}
                  disabled={!newConvite.nomeCliente || createMutation.isPending}
                  data-testid="button-create-invite"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Criar Convite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Convites</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {convites.filter(c => c.status === "pendente" || c.status === "enviado").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceitos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {convites.filter(c => c.status === "aceito").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(clientes as any[]).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Convites Enviados</CardTitle>
          <CardDescription>
            Lista de todos os convites criados e seu status atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : convites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum convite criado ainda</p>
              <p className="text-sm">Crie um convite para convidar clientes ao sistema</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {convites.map((convite) => (
                  <TableRow key={convite.id} data-testid={`row-convite-${convite.id}`}>
                    <TableCell className="font-medium">{convite.nomeCliente}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {convite.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {convite.email}
                          </div>
                        )}
                        {convite.telefone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {convite.telefone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {convite.canalEnvio === "whatsapp" ? (
                          <><Phone className="h-3 w-3 mr-1" /> WhatsApp</>
                        ) : (
                          <><Mail className="h-3 w-3 mr-1" /> E-mail</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(convite.status || "pendente")}
                        <Badge variant={statusLabels[convite.status || "pendente"]?.variant || "secondary"}>
                          {statusLabels[convite.status || "pendente"]?.label || convite.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {convite.createdAt ? new Date(convite.createdAt).toLocaleDateString("pt-BR") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(convite.status === "pendente" || convite.status === "enviado") && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => sendMutation.mutate(convite.id)}
                            title="Enviar convite"
                            disabled={sendMutation.isPending}
                            data-testid={`button-send-${convite.id}`}
                          >
                            {sendMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyInviteLink(convite.token)}
                          title="Copiar link"
                          data-testid={`button-copy-${convite.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {convite.status !== "aceito" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(convite.id)}
                            title="Remover"
                            data-testid={`button-delete-${convite.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
