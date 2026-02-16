import { Shield, Lock, Globe } from "lucide-react";
import logoImg from "@/assets/logo.png";

const GovFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-4xl px-4 py-5">
        <div className="flex flex-col gap-4">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={logoImg} alt="Logo" className="h-6 w-auto opacity-50" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[10px] text-muted-foreground">
                Ministério da Fazenda — Secretaria da Receita Federal do Brasil
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3 text-accent" />
                <span>SSL/TLS 1.3</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-accent" />
                <span>AES-256</span>
              </div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3 text-accent" />
                <span>ICP-Brasil</span>
              </div>
            </div>
          </div>
          {/* Divider */}
          <div className="border-t border-border" />
          {/* Bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground">
            <p>© {year} Receita Federal do Brasil — Todos os direitos reservados</p>
            <p>Sistema de Consulta de Pendências Fiscais • v3.8.2</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
