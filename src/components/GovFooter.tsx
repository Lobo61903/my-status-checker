import { Shield, Lock, Globe, Fingerprint } from "lucide-react";
import logoImg from "@/assets/logo.png";

const GovFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-4xl px-4 py-4 sm:py-5">
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Top row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <img src={logoImg} alt="Logo" className="h-5 sm:h-6 w-auto opacity-50" />
              <div className="h-4 w-px bg-border" />
              <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center sm:text-left">
                Ministério da Fazenda — Secretaria da Receita Federal do Brasil
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] text-muted-foreground flex-wrap justify-center">
              <div className="flex items-center gap-1">
                <Lock className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>SSL/TLS 1.3</span>
              </div>
              <div className="h-3 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1">
                <Shield className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>AES-256</span>
              </div>
              <div className="h-3 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1">
                <Globe className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>ICP-Brasil</span>
              </div>
              <div className="h-3 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-1">
                <Fingerprint className="h-2.5 sm:h-3 w-2.5 sm:w-3 text-accent" />
                <span>LGPD</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-2 text-[9px] sm:text-[10px] text-muted-foreground text-center">
            <p>© {year} Receita Federal do Brasil — Todos os direitos reservados</p>
            <p>CNPJ: 00.394.460/0058-87 • Sistema v3.8.2</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default GovFooter;
