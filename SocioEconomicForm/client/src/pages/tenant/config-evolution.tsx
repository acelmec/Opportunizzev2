import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MessageCircle, Plus, Trash2, Loader2, Phone, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import type { TenantChannelConnection } from "@shared/schema";

export default function TenantEvolutionConfig() {
  const { toast } = useToast();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<TenantChannelConnection | null>(null);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newPhoneNumber, setNewPhoneNumber] = useState("");

  const { data: connections, isLoading } = useQuery<TenantChannelConnection[]>({
    queryKey: ["/api/tenant/config/evolution"],
  });

  const { data: tenantUsage } = useQuery<{ 
    usage: { conexoesEvolution: number }; 
    limits: { maxConexoesEvolution: number | null } 
  }>({
    queryKey: ["/api/tenant/usage"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { instanceName: string; phoneNumber?: string }) => {
      const response = await apiRequest("POST", "/api/tenant/config/evolution", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao criar conexão");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/config/evolution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/usage"] });
      toast({
        title: "Conexão criada",
        description: "A conexão WhatsApp foi criada com sucesso.",
      });
      setAddDialogOpen(false);
      setNewInstanceName("");
      setNewPhoneNumber("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const response = await apiRequest("DELETE", `/api/tenant/config/evolution/${connectionId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao remover conexão");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/config/evolution"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/usage"] });
      toast({
        title: "Conexão removida",
        description: "A conexão WhatsApp foi removida com sucesso.",
      });
      setDeleteDialogOpen(false);
      setSelectedConnection(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/tenant/config/evolution/${id}`, { status });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenant/config/evolution"] });
      toast({
        title: "Status atualizado",
        description: "O status da conexão foi atualizado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreateConnection = () => {
    if (newInstanceName) {
      createMutation.mutate({ 
        instanceName: newInstanceName, 
        phoneNumber: newPhoneNumber || undefined 
      });
    }
  };

  const onDeleteConnection = () => {
    if (selectedConnection) {
      deleteMutation.mutate(selectedConnection.id);
    }
  };

  const currentConnections = tenantUsage?.usage.conexoesEvolution ?? connections?.length ?? 0;
  const maxConnections = tenantUsage?.limits.maxConexoesEvolution;
  const isUnlimited = maxConnections === null;
  const canAddMore = isUnlimited || currentConnections < (maxConnections ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Conexões WhatsApp</h1>
        <p className="text-muted-foreground">
          Gerencie as conexões WhatsApp (Evolution API) da sua corretora
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <CardTitle>Números Conectados</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {currentConnections} / {isUnlimited ? "∞" : maxConnections} conexões
              </div>
              <Button
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                disabled={!canAddMore}
                data-testid="button-add-connection"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conexão
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure as instâncias WhatsApp para comunicação com clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : connections && connections.length > 0 ? (
            <div className="space-y-4">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`connection-card-${connection.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{connection.instanceName}</h3>
                      {connection.phoneNumber && (
                        <p className="text-sm text-muted-foreground">
                          {connection.phoneNumber}
                        </p>
                      )}
                      {connection.lastConnectedAt && (
                        <p className="text-xs text-muted-foreground">
                          Última conexão: {new Date(connection.lastConnectedAt).toLocaleString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={connection.status === "ativo" ? "default" : "secondary"}
                      className={connection.status === "ativo" ? "bg-green-500" : ""}
                    >
                      {connection.status === "ativo" ? (
                        <><Wifi className="h-3 w-3 mr-1" /> Ativo</>
                      ) : (
                        <><WifiOff className="h-3 w-3 mr-1" /> Inativo</>
                      )}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleStatusMutation.mutate({
                        id: connection.id,
                        status: connection.status === "ativo" ? "inativo" : "ativo"
                      })}
                      disabled={toggleStatusMutation.isPending}
                      data-testid={`button-toggle-status-${connection.id}`}
                    >
                      {connection.status === "ativo" ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedConnection(connection);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`button-delete-connection-${connection.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conexão WhatsApp configurada</p>
              <p className="text-sm">Clique em "Nova Conexão" para adicionar</p>
            </div>
          )}

          {!canAddMore && !isUnlimited && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Você atingiu o limite de conexões do seu plano. 
                Entre em contato para fazer upgrade.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            <DialogDescription>
              Adicione uma nova instância WhatsApp para comunicação com clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Instância</label>
              <Input
                placeholder="Ex: Atendimento Principal"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                data-testid="input-instance-name"
              />
              <p className="text-xs text-muted-foreground">
                Um nome para identificar esta conexão
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Telefone (opcional)</label>
              <Input
                placeholder="Ex: +55 11 99999-9999"
                value={newPhoneNumber}
                onChange={(e) => setNewPhoneNumber(e.target.value)}
                data-testid="input-phone-number"
              />
              <p className="text-xs text-muted-foreground">
                O número será vinculado após escanear o QR Code
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewInstanceName("");
                setNewPhoneNumber("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={onCreateConnection}
              disabled={!newInstanceName || createMutation.isPending}
              data-testid="button-confirm-add"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar Conexão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Conexão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a conexão "{selectedConnection?.instanceName}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedConnection(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConnection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
