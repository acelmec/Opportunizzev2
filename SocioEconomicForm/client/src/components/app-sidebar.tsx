import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Users,
  Building2,
  Car,
  Target,
  History,
  Settings,
  LogOut,
  UserPlus,
  Shield,
  Send,
  User,
  Crown,
  Scale,
  Package,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const corretorMainNav = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Pessoas Físicas",
    url: "/clientes/pf",
    icon: Users,
  },
  {
    title: "Pessoas Jurídicas",
    url: "/clientes/pj",
    icon: Building2,
  },
];

const corretorRegistration: { title: string; url: string; icon: any }[] = [];

const corretorManagement = [
  {
    title: "Oportunidades",
    url: "/oportunidades",
    icon: Target,
  },
  {
    title: "Histórico",
    url: "/historico",
    icon: History,
  },
];

const corretorClientes = [
  {
    title: "Gestão de Clientes",
    url: "/gestao-clientes",
    icon: Send,
  },
];

const corretorRegras = [
  {
    title: "Regras de Negócio",
    url: "/regras-negocio",
    icon: Scale,
  },
];

const corretorProdutos = [
  {
    title: "Produtos",
    url: "/produtos",
    icon: Package,
  },
];

const adminNav = [
  {
    title: "Administração",
    url: "/admin",
    icon: Crown,
  },
];

const clienteNav = [
  {
    title: "Minhas Proteções",
    url: "/cliente/dashboard",
    icon: Shield,
  },
  {
    title: "Meu Perfil",
    url: "/cliente/perfil",
    icon: User,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isCorretor = user?.role !== "cliente";
  const isTenantAdmin = user?.role === "tenant_admin";
  const showAdminMenu = isTenantAdmin;

  const isActive = (url: string) => {
    if (url === "/" || url === "/cliente/dashboard") {
      return location === "/" || location === url;
    }
    return location.startsWith(url);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const getRoleBadge = () => {
    if (user?.role === "admin") return { label: "Admin", variant: "default" as const };
    if (user?.role === "cliente") return { label: "Cliente", variant: "secondary" as const };
    return { label: "Corretor", variant: "outline" as const };
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-semibold" data-testid="text-app-name">
              SeguroPro
            </span>
            <span className="text-xs text-muted-foreground">
              {isCorretor ? "Gestão de Seguros" : "Portal do Cliente"}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {isCorretor ? (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Principal</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorMainNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Cadastro</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorRegistration.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Gestão</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorManagement.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Clientes do Sistema</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorClientes.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Inteligência</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorRegras.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Catálogo</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {corretorProdutos.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {showAdminMenu && (
              <SidebarGroup>
                <SidebarGroupLabel>Administração</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminNav.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.url)}
                          data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                        >
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clienteNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={user?.firstName || "Usuário"}
              className="object-cover"
            />
            <AvatarFallback>
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center gap-2">
              <span
                className="truncate text-sm font-medium"
                data-testid="text-user-name"
              >
                {user?.firstName} {user?.lastName}
              </span>
              <Badge variant={getRoleBadge().variant} className="text-xs">
                {getRoleBadge().label}
              </Badge>
            </div>
            <span
              className="truncate text-xs text-muted-foreground"
              data-testid="text-user-email"
            >
              {user?.email}
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <SidebarMenuButton
              asChild
              className="flex-1"
              isActive={location === "/conta"}
              data-testid="button-account"
            >
              <Link href="/conta">
                <User className="h-4 w-4" />
                <span>Minha Conta</span>
              </Link>
            </SidebarMenuButton>
          </div>
          <div className="flex gap-2">
            {isCorretor && (
              <SidebarMenuButton
                asChild
                className="flex-1"
                data-testid="button-settings"
              >
                <Link href="/configuracoes">
                  <Settings className="h-4 w-4" />
                  <span>Configurações</span>
                </Link>
              </SidebarMenuButton>
            )}
            <SidebarMenuButton data-testid="button-logout" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
