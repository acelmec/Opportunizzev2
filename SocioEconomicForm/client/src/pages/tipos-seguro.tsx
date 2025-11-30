import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { FileText, Search, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { TipoSeguroMaster } from "@shared/schema";

export default function TiposSeguro() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: tipos, isLoading } = useQuery<TipoSeguroMaster[]>({
    queryKey: ["/api/tipos-seguro"],
  });

  const filteredTipos = tipos?.filter((tipo) =>
    tipo.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tipos de Seguro</h1>
        <p className="text-muted-foreground">
          Explore os diferentes tipos de seguro disponíveis e as seguradoras que os comercializam
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tipo de seguro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredTipos?.length ? (
        <div className="space-y-3">
          {filteredTipos.map((tipo) => (
            <Card
              key={tipo.id}
              className="hover:shadow-md transition-shadow cursor-pointer hover:bg-accent"
              onClick={() => navigate(`/tipos-seguro/${tipo.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{tipo.nome}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {tipo.categoria}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Nenhum tipo de seguro encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
