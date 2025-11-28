import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2" data-testid="text-404-title">
        Página não encontrada
      </h1>
      <p className="text-muted-foreground max-w-md mb-6">
        A página que você está procurando não existe ou foi movida.
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Ir para o Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
