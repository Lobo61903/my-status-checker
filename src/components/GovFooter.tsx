import { Shield, Lock } from "lucide-react";

const GovFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-8">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-accent" />
              <span>Conexão SSL Segura</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <span>Dados Criptografados</span>
            </div>
          </div>
          <p>© {year} Receita Federal do Brasil — Todos os direitos reservados</p>
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
