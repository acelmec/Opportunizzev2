import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Phone, Mail, Globe, Shield, Search } from "lucide-react";
import type { SeguradoraMaster } from "@shared/schema";

export default function Seguradoras() {
  const [search, setSearch] = useState("");

  const { data: seguradoras, isLoading } = useQuery<SeguradoraMaster[]>({
    queryKey: ["/api/seguradoras"],
  });

  const filteredSeguradoras = seguradoras?.filter((seg) =>
    seg.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seguradoras</h1>
        <p className="text-muted-foreground">
          Visualize todas as seguradoras parceiras disponíveis
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredSeguradoras?.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSeguradoras.map((seg) => (
            <Card key={seg.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="h-5 w-5 text-primary" />
                      {seg.nome}
                    </CardTitle>
                    {seg.cnpj && (
                      <CardDescription className="text-xs mt-1">
                        CNPJ: {seg.cnpj}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={seg.ativo ? "default" : "secondary"}>
                    {seg.ativo ? "Ativa" : "Inativa"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {seg.codigoSusep && (
                  <div className="text-sm">
                    <p className="text-muted-foreground text-xs">Código SUSEP</p>
                    <p className="font-medium">{seg.codigoSusep}</p>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  {seg.telefoneMatriz && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs">{seg.telefoneMatriz}</span>
                    </div>
                  )}
                  {seg.emailMatriz && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs truncate">{seg.emailMatriz}</span>
                    </div>
                  )}
                  {seg.website && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a
                        href={seg.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline truncate"
                      >
                        Site
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Nenhuma seguradora encontrada
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
