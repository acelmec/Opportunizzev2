import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Search, Shield, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { SeguradoraMaster } from "@shared/schema";

export default function AdminSeguradoras() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: seguradoras, isLoading } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/seguradoras"],
  });

  const filteredSeguradoras = seguradoras?.filter((seg) =>
    seg.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gerenciamento de Seguradoras</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seguradoras e seus produtos comercializados
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar seguradora..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filteredSeguradoras?.length ? (
        <div className="space-y-3">
          {filteredSeguradoras.map((seg) => (
            <Card
              key={seg.id}
              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-accent"
              onClick={() => navigate(`/admin/seguradoras/${seg.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{seg.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {seg.cnpj || "N/A"} • SUSEP: {seg.codigoSusep || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={seg.ativo ? "default" : "secondary"}>
                      {seg.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Nenhuma seguradora encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
