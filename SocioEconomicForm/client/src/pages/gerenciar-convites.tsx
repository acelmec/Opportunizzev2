import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Trash2, Send, Link as LinkIcon, Copy, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhone } from "@/lib/validators";

export default function GerenciarConvitesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const { data: convites = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/convites"],
    retry: true,
  }) as { data: any[]; isLoading: boolean; refetch: () => void };

  const filteredConvites = convites.filter((c: any) => {
    const matchesSearch =
      c.nomeCliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteConvite = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este convite?")) return;
    try {
      await apiRequest("DELETE", `/api/convites/${id}`, {});
      toast({ title: "Convite removido com sucesso" });
      refetch();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    }
  };

  const handleSendConvite = async (id: string, email: string) => {
    try {
      const response = await apiRequest("POST", `/api/convites/${id}/enviar`, {});
      toast({ 
        title: "Sucesso!", 
        description: `Convite reenviado para ${email}. Verifique a caixa de entrada ou spam.` 
      });
      refetch();
    } catch (error: any) {
      console.error("Erro ao reenviar:", error);
      toast({ 
        variant: "destructive", 
        title: "Erro ao reenviar", 
        description: error.message || "Verifique se a configuração SMTP está ativa nas configurações da corretora"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pendente: { variant: "outline", label: "Pendente", icon: Clock },
      enviado: { variant: "secondary", label: "Enviado", icon: Mail },
      aceito: { variant: "default", label: "Aceito", icon: CheckCircle },
      expirado: { variant: "destructive", label: "Expirado", icon: XCircle },
      cancelado: { variant: "outline", label: "Cancelado", icon: XCircle },
    };
    const config = variants[status] || variants.pendente;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" /> {config.label}
      </Badge>
    );
  };

  const getShareLink = (token: string) => {
    return `${window.location.origin}/convite/${token}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Link copiado para área de transferência" });
  };

  const stats = {
    total: convites.length,
    pendentes: convites.filter((c: any) => c.status === "pendente").length,
    aceitos: convites.filter((c: any) => c.status === "aceito").length,
    enviados: convites.filter((c: any) => c.status === "enviado").length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Gerenciar Convites</h1>
          <p className="text-muted-foreground">Controle e acompanhe todos os convites enviados para clientes</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total de Convites", value: stats.total, color: "bg-blue-100 dark:bg-blue-900/30" },
            { label: "Pendentes", value: stats.pendentes, color: "bg-amber-100 dark:bg-amber-900/30" },
            { label: "Enviados", value: stats.enviados, color: "bg-purple-100 dark:bg-purple-900/30" },
            { label: "Aceitos", value: stats.aceitos, color: "bg-green-100 dark:bg-green-900/30" },
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="pt-6">
                <div className={`${stat.color} p-4 rounded-lg mb-3`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Convites</CardTitle>
            <CardDescription>Busque por nome, email ou status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex gap-2 flex-wrap">
              {["todos", "pendente", "enviado", "aceito", "expirado"].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? "default" : "outline"}
                  onClick={() => setFilterStatus(status)}
                  className="capitalize"
                >
                  {status === "todos" ? "Todos" : status}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Convites Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Convites</CardTitle>
            <CardDescription>{filteredConvites.length} convite(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConvites.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum convite encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConvites.map((convite: any) => (
                      <TableRow key={convite.id}>
                        <TableCell className="font-medium">{convite.nomeCliente}</TableCell>
                        <TableCell>{convite.email}</TableCell>
                        <TableCell>{convite.telefone ? formatPhone(convite.telefone) : "-"}</TableCell>
                        <TableCell>{getStatusBadge(convite.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(convite.criadoEm).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {convite.expiraEm ? new Date(convite.expiraEm).toLocaleDateString("pt-BR") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {/* Copy Link Dialog */}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Copiar link do convite">
                                  <LinkIcon className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Link do Convite</DialogTitle>
                                  <DialogDescription>Compartilhe este link com o cliente</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="bg-muted p-3 rounded text-sm break-all font-mono">
                                    {getShareLink(convite.token)}
                                  </div>
                                  <Button
                                    onClick={() => copyToClipboard(getShareLink(convite.token))}
                                    className="w-full"
                                  >
                                    <Copy className="h-4 w-4 mr-2" /> Copiar Link
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {/* Send/Resend Button */}
                            {(convite.status === "pendente" || convite.status === "enviado") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendConvite(convite.id, convite.email)}
                                title={convite.status === "pendente" ? "Enviar convite por email" : "Reenviar convite"}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteConvite(convite.id)}
                              title="Remover convite"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
