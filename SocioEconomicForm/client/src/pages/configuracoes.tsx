import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Mail, 
  Phone, 
  Loader2, 
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showWhatsappKey, setShowWhatsappKey] = useState(false);
  const [emailTeste, setEmailTeste] = useState("");
  const [telefoneTeste, setTelefoneTeste] = useState("");

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    secure: false,
    usuario: "",
    senha: "",
    remetenteNome: "",
    remetenteEmail: "",
    ativo: true,
  });

  const [whatsappForm, setWhatsappForm] = useState({
    instanceName: "",
    endpoint: "",
    apiKey: "",
    ativo: true,
  });

  const { data: smtpConfig, isLoading: loadingSmtp } = useQuery({
    queryKey: ["/api/config/smtp"],
    queryFn: async () => {
      const res = await fetch("/api/config/smtp");
      if (!res.ok) return null;
      const data = await res.json();
      if (data) {
        setSmtpForm({
          host: data.host || "",
          port: data.port || 587,
          secure: data.secure || false,
          usuario: data.usuario || "",
          senha: "",
          remetenteNome: data.remetenteNome || "",
          remetenteEmail: data.remetenteEmail || "",
          ativo: data.ativo !== false,
        });
      }
      return data;
    },
  });

  const { data: whatsappConfig, isLoading: loadingWhatsapp } = useQuery({
    queryKey: ["/api/config/whatsapp"],
    queryFn: async () => {
      const res = await fetch("/api/config/whatsapp");
      if (!res.ok) return null;
      const data = await res.json();
      if (data) {
        setWhatsappForm({
          instanceName: data.instanceName || "",
          endpoint: data.endpoint || "",
          apiKey: "",
          ativo: data.ativo !== false,
        });
      }
      return data;
    },
  });

  const saveSmtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/config/smtp", smtpForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/smtp"] });
      toast({ title: "Configurações SMTP salvas com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message,
      });
    },
  });

  const deleteSmtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/config/smtp");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/smtp"] });
      setSmtpForm({
        host: "",
        port: 587,
        secure: false,
        usuario: "",
        senha: "",
        remetenteNome: "",
        remetenteEmail: "",
        ativo: true,
      });
      toast({ title: "Configurações SMTP removidas" });
    },
  });

  const saveWhatsappMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/config/whatsapp", whatsappForm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/whatsapp"] });
      toast({ title: "Configurações WhatsApp salvas com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message,
      });
    },
  });

  const deleteWhatsappMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/config/whatsapp");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/config/whatsapp"] });
      setWhatsappForm({
        instanceName: "",
        endpoint: "",
        apiKey: "",
        ativo: true,
      });
      toast({ title: "Configurações WhatsApp removidas" });
    },
  });

  const testSmtpMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/config/smtp/test", { emailDestino: emailTeste });
    },
    onSuccess: () => {
      toast({ title: "E-mail de teste enviado!", description: "Verifique sua caixa de entrada" });
      setEmailTeste("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar e-mail de teste",
        description: error.message,
      });
    },
  });

  const testWhatsappMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/config/whatsapp/test", { telefonDestino: telefoneTeste });
    },
    onSuccess: () => {
      toast({ title: "Mensagem WhatsApp de teste enviada!", description: "Verifique o número informado" });
      setTelefoneTeste("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem WhatsApp",
        description: error.message,
      });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Configure integrações de e-mail e WhatsApp para envio de convites
        </p>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList>
          <TabsTrigger value="smtp" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            E-mail (SMTP)
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            WhatsApp (Evolution API)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuração SMTP
                  </CardTitle>
                  <CardDescription>
                    Configure o servidor de e-mail para envio de convites
                  </CardDescription>
                </div>
                {smtpConfig && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Configurado</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingSmtp ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Servidor SMTP *</Label>
                      <Input
                        id="smtp-host"
                        value={smtpForm.host}
                        onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                        placeholder="smtp.gmail.com"
                        data-testid="input-smtp-host"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Porta</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={smtpForm.port}
                        onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                        placeholder="587"
                        data-testid="input-smtp-port"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-usuario">Usuário/E-mail *</Label>
                      <Input
                        id="smtp-usuario"
                        value={smtpForm.usuario}
                        onChange={(e) => setSmtpForm({ ...smtpForm, usuario: e.target.value })}
                        placeholder="seu@email.com"
                        data-testid="input-smtp-usuario"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-senha">Senha *</Label>
                      <div className="relative">
                        <Input
                          id="smtp-senha"
                          type={showSmtpPassword ? "text" : "password"}
                          value={smtpForm.senha}
                          onChange={(e) => setSmtpForm({ ...smtpForm, senha: e.target.value })}
                          placeholder={smtpConfig ? "••••••••" : "Senha do e-mail"}
                          data-testid="input-smtp-senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0"
                          onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        >
                          {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-remetente-nome">Nome do Remetente</Label>
                      <Input
                        id="smtp-remetente-nome"
                        value={smtpForm.remetenteNome}
                        onChange={(e) => setSmtpForm({ ...smtpForm, remetenteNome: e.target.value })}
                        placeholder="Corretora de Seguros"
                        data-testid="input-smtp-remetente-nome"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-remetente-email">E-mail do Remetente</Label>
                      <Input
                        id="smtp-remetente-email"
                        value={smtpForm.remetenteEmail}
                        onChange={(e) => setSmtpForm({ ...smtpForm, remetenteEmail: e.target.value })}
                        placeholder="contato@corretora.com"
                        data-testid="input-smtp-remetente-email"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtp-secure"
                      checked={smtpForm.secure}
                      onCheckedChange={(checked) => setSmtpForm({ ...smtpForm, secure: checked })}
                      data-testid="switch-smtp-secure"
                    />
                    <Label htmlFor="smtp-secure">Usar conexão segura (SSL/TLS)</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="smtp-ativo"
                      checked={smtpForm.ativo}
                      onCheckedChange={(checked) => setSmtpForm({ ...smtpForm, ativo: checked })}
                      data-testid="switch-smtp-ativo"
                    />
                    <Label htmlFor="smtp-ativo">Ativar envio de e-mails</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveSmtpMutation.mutate()}
                      disabled={!smtpForm.host || !smtpForm.usuario || saveSmtpMutation.isPending}
                      data-testid="button-save-smtp"
                    >
                      {saveSmtpMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                    {smtpConfig && (
                      <Button
                        variant="destructive"
                        onClick={() => deleteSmtpMutation.mutate()}
                        disabled={deleteSmtpMutation.isPending}
                        data-testid="button-delete-smtp"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>

                  {smtpConfig && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Testar Configuração
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Seu e-mail para teste"
                          value={emailTeste}
                          onChange={(e) => setEmailTeste(e.target.value)}
                          data-testid="input-email-teste"
                        />
                        <Button
                          onClick={() => testSmtpMutation.mutate()}
                          disabled={!emailTeste || testSmtpMutation.isPending}
                          variant="outline"
                          data-testid="button-test-smtp"
                        >
                          {testSmtpMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="mr-2 h-4 w-4" />
                              Enviar Teste
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Configuração WhatsApp (Evolution API)
                  </CardTitle>
                  <CardDescription>
                    Configure a API do Evolution para envio de mensagens WhatsApp
                  </CardDescription>
                </div>
                {whatsappConfig && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Configurado</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {loadingWhatsapp ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Para utilizar esta integração, você precisará ter uma instância do Evolution API configurada.
                      Saiba mais em <a href="https://doc.evolution-api.com/" target="_blank" rel="noopener noreferrer" className="underline">doc.evolution-api.com</a>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="wa-instance">Nome da Instância *</Label>
                    <Input
                      id="wa-instance"
                      value={whatsappForm.instanceName}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, instanceName: e.target.value })}
                      placeholder="minha-instancia"
                      data-testid="input-wa-instance"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-endpoint">Endpoint da API *</Label>
                    <Input
                      id="wa-endpoint"
                      value={whatsappForm.endpoint}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, endpoint: e.target.value })}
                      placeholder="https://api.evolution.com.br"
                      data-testid="input-wa-endpoint"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wa-apikey">API Key *</Label>
                    <div className="relative">
                      <Input
                        id="wa-apikey"
                        type={showWhatsappKey ? "text" : "password"}
                        value={whatsappForm.apiKey}
                        onChange={(e) => setWhatsappForm({ ...whatsappForm, apiKey: e.target.value })}
                        placeholder={whatsappConfig ? "••••••••" : "Sua API Key"}
                        data-testid="input-wa-apikey"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowWhatsappKey(!showWhatsappKey)}
                      >
                        {showWhatsappKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="wa-ativo"
                      checked={whatsappForm.ativo}
                      onCheckedChange={(checked) => setWhatsappForm({ ...whatsappForm, ativo: checked })}
                      data-testid="switch-wa-ativo"
                    />
                    <Label htmlFor="wa-ativo">Ativar envio via WhatsApp</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => saveWhatsappMutation.mutate()}
                      disabled={!whatsappForm.instanceName || !whatsappForm.endpoint || saveWhatsappMutation.isPending}
                      data-testid="button-save-whatsapp"
                    >
                      {saveWhatsappMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar Configurações
                        </>
                      )}
                    </Button>
                    {whatsappConfig && (
                      <Button
                        variant="destructive"
                        onClick={() => deleteWhatsappMutation.mutate()}
                        disabled={deleteWhatsappMutation.isPending}
                        data-testid="button-delete-whatsapp"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>

                  {whatsappConfig && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Testar Configuração
                      </h3>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          placeholder="Seu número para teste (ex: 5585987654321)"
                          value={telefoneTeste}
                          onChange={(e) => setTelefoneTeste(e.target.value)}
                          data-testid="input-phone-teste"
                        />
                        <Button
                          onClick={() => testWhatsappMutation.mutate()}
                          disabled={!telefoneTeste || testWhatsappMutation.isPending}
                          variant="outline"
                          data-testid="button-test-whatsapp"
                        >
                          {testWhatsappMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Phone className="mr-2 h-4 w-4" />
                              Enviar Teste
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
