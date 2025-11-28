import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Mail, Building2, Search } from "lucide-react";
import type { Tenant, User } from "@shared/schema";

export default function AdminUsers() {
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/admin/tenants"],
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/tenants", selectedTenant, "users"],
    queryFn: async () => {
      if (selectedTenant === "all") {
        const allUsers: User[] = [];
        for (const tenant of tenants || []) {
          const res = await fetch(`/api/admin/tenants/${tenant.id}/users`);
          if (res.ok) {
            const tenantUsers = await res.json();
            allUsers.push(...tenantUsers);
          }
        }
        return allUsers;
      }
      const res = await fetch(`/api/admin/tenants/${selectedTenant}/users`);
      return res.json();
    },
    enabled: !!tenants,
  });

  const filteredUsers = users?.filter((user) => {
    const searchLower = search.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.firstName?.toLowerCase().includes(searchLower) ||
      user.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const getTenantName = (tenantId: string | null | undefined) => {
    if (!tenantId) return "Sem tenant";
    const tenant = tenants?.find(t => t.id === tenantId);
    return tenant?.nome || "Desconhecido";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "saas_admin":
        return <Badge variant="default">Admin SaaS</Badge>;
      case "tenant_admin":
        return <Badge variant="secondary">Admin Tenant</Badge>;
      case "corretor":
        return <Badge variant="outline">Corretor</Badge>;
      case "cliente":
        return <Badge variant="outline">Cliente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          Usuários
        </h1>
        <p className="text-muted-foreground">
          Visualize todos os usuários por corretora
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-user"
          />
        </div>
        <Select value={selectedTenant} onValueChange={setSelectedTenant}>
          <SelectTrigger className="w-[250px]" data-testid="select-tenant-filter">
            <SelectValue placeholder="Filtrar por corretora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as corretoras</SelectItem>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredUsers?.length ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} data-testid={`card-user-${user.id}`}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-lg">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    {getRoleBadge(user.role || "corretor")}
                    {!user.isActive && <Badge variant="destructive">Inativo</Badge>}
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {getTenantName(user.tenantId || null)}
                    </span>
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhum usuário encontrado
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
