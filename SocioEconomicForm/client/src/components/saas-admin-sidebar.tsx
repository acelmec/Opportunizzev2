import { useLocation, Link } from "wouter";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Shield,
  FileText,
  Settings,
  LogOut,
  Mail,
  Bot,
  MessageSquare,
  Link2,
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

const mainNav = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
];

const tenantsNav = [
  {
    title: "Corretoras (Tenants)",
    url: "/admin/tenants",
    icon: Building2,
  },
  {
    title: "Usuários",
    url: "/admin/users",
    icon: Users,
  },
];

const plansNav = [
  {
    title: "Planos de Assinatura",
    url: "/admin/plans",
    icon: CreditCard,
  },
];

const catalogNav = [
  {
    title: "Seguradoras",
    url: "/admin/seguradoras",
    icon: Shield,
  },
  {
    title: "Tipos de Seguro",
    url: "/admin/tipos-seguro",
    icon: FileText,
  },
  {
    title: "Produtos",
    url: "/admin/produtos",
    icon: Package,
  },
  {
    title: "Vinculações",
    url: "/admin/vinculacoes",
    icon: Link2,
  },
];

const configNav = [
  {
    title: "Provedor SMTP",
    url: "/admin/config/smtp",
    icon: Mail,
  },
  {
    title: "API ChatGPT",
    url: "/admin/config/chatgpt",
    icon: Bot,
  },
  {
    title: "Evolution API",
    url: "/admin/config/evolution",
    icon: MessageSquare,
  },
];

export function SaasAdminSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isActive = (url: string) => {
    if (url === "/admin") {
      return location === "/admin" || location === "/";
    }
    return location.startsWith(url);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "A";
  };

  const handleLogout = async () => {
    await logout();
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
              Administração SaaS
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Visão Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
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
          <SidebarGroupLabel>Tenants</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tenantsNav.map((item) => (
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
          <SidebarGroupLabel>Comercial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {plansNav.map((item) => (
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
          <SidebarGroupLabel>Catálogo Master</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {catalogNav.map((item) => (
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
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configNav.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-4" />
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={user?.firstName || "Admin"}
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
              <Badge variant="default" className="text-xs">
                Admin SaaS
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
        <div className="mt-3">
          <SidebarMenuButton 
            onClick={handleLogout}
            data-testid="button-logout"
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
