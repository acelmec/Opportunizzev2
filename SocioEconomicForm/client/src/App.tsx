import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SaasAdminSidebar } from "@/components/saas-admin-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/loading-state";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import PortalLogin from "@/pages/portal-login";
import Dashboard from "@/pages/dashboard";
import ClientesPF from "@/pages/clientes-pf";
import ClientesPJ from "@/pages/clientes-pj";
import ClientePFDetail from "@/pages/cliente-pf-detail";
import ClientePJDetail from "@/pages/cliente-pj-detail";
import CadastroPF from "@/pages/cadastro-pf";
import CadastroPJ from "@/pages/cadastro-pj";
import Oportunidades from "@/pages/oportunidades";
import Historico from "@/pages/historico";
import GestaoClientes from "@/pages/gestao-clientes";
import Configuracoes from "@/pages/configuracoes";
import ClienteDashboard from "@/pages/cliente-dashboard";
import Convite from "@/pages/convite";
import AceitarConvite from "@/pages/aceitar-convite";
import Onboarding from "@/pages/onboarding";
import TenantAdmin from "@/pages/tenant-admin";
import RegrasNegocio from "@/pages/regras-negocio";
import Account from "@/pages/account";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminTenants from "@/pages/admin/tenants";
import AdminUsers from "@/pages/admin/users";
import AdminPlans from "@/pages/admin/plans";
import AdminSeguradoras from "@/pages/admin/seguradoras";
import AdminTiposSeguro from "@/pages/admin/tipos-seguro";
import AdminVinculacoes from "@/pages/admin/vinculacoes";
import AdminSmtpConfig from "@/pages/admin/config-smtp";
import AdminChatgptConfig from "@/pages/admin/config-chatgpt";
import AdminEvolutionConfig from "@/pages/admin/config-evolution";
import TenantSmtpConfig from "@/pages/tenant/config-smtp";
import TenantEvolutionConfig from "@/pages/tenant/config-evolution";

function SaasAdminRouter() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/tenants" component={AdminTenants} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/plans" component={AdminPlans} />
      <Route path="/admin/seguradoras" component={AdminSeguradoras} />
      <Route path="/admin/tipos-seguro" component={AdminTiposSeguro} />
      <Route path="/admin/vinculacoes" component={AdminVinculacoes} />
      <Route path="/admin/config/smtp" component={AdminSmtpConfig} />
      <Route path="/admin/config/chatgpt" component={AdminChatgptConfig} />
      <Route path="/admin/config/evolution" component={AdminEvolutionConfig} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClienteRouter() {
  return (
    <Switch>
      <Route path="/" component={ClienteDashboard} />
      <Route path="/cliente/dashboard" component={ClienteDashboard} />
      <Route path="/conta" component={Account} />
      <Route path="/aceitar-convite/:token" component={AceitarConvite} />
      <Route component={NotFound} />
    </Switch>
  );
}

function CorretorRouter() {
  const { user } = useAuth();
  const isTenantAdmin = user?.role === "tenant_admin";

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clientes/pf" component={ClientesPF} />
      <Route path="/clientes/pj" component={ClientesPJ} />
      <Route path="/clientes/pf/:id" component={ClientePFDetail} />
      <Route path="/clientes/pj/:id" component={ClientePJDetail} />
      <Route path="/cadastro/pf" component={CadastroPF} />
      <Route path="/cadastro/pj" component={CadastroPJ} />
      <Route path="/oportunidades" component={Oportunidades} />
      <Route path="/historico" component={Historico} />
      <Route path="/gestao-clientes" component={GestaoClientes} />
      <Route path="/regras-negocio" component={RegrasNegocio} />
      <Route path="/configuracoes" component={Configuracoes} />
      <Route path="/conta" component={Account} />
      <Route path="/aceitar-convite/:token" component={AceitarConvite} />
      {isTenantAdmin && (
        <>
          <Route path="/admin" component={TenantAdmin} />
          <Route path="/admin/config/smtp" component={TenantSmtpConfig} />
          <Route path="/admin/config/evolution" component={TenantEvolutionConfig} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function SaasAdminLayout() {
  const sidebarStyle = {
    "--sidebar-width": "17rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <SaasAdminSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            <SaasAdminRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AuthenticatedLayout() {
  const { user } = useAuth();
  const isCliente = user?.role === "cliente";
  
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {isCliente ? <ClienteRouter /> : <CorretorRouter />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/portal/login" component={PortalLogin} />
      <Route path="/convite/:token" component={Convite} />
      <Route>
        <Landing />
      </Route>
    </Switch>
  );
}

function OnboardingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-end h-14 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <ThemeToggle />
      </header>
      <main className="flex-1 overflow-y-auto">
        <Onboarding />
      </main>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const isSaasAdmin = user?.role === "saas_admin";
  const needsOnboarding = user && !user.tenantId && !isSaasAdmin;

  if (needsOnboarding) {
    return (
      <>
        <OnboardingLayout />
        <Toaster />
      </>
    );
  }

  if (user && isSaasAdmin) {
    return (
      <>
        <SaasAdminLayout />
        <Toaster />
      </>
    );
  }

  return (
    <>
      {user ? <AuthenticatedLayout /> : <PublicRouter />}
      <Toaster />
    </>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="seguropro-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
