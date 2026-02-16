import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import logoImg from "@/assets/logo.png";

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

interface GovHeaderProps {
  nome?: string;
  cpf?: string;
}

const GovHeader = ({ nome, cpf }: GovHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header>
      {/* Top green stripe */}
      <div className="h-1 w-full bg-accent" />
      {/* Header bar */}
      <div className="gov-header px-4 py-2.5 sm:py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src={logoImg}
              alt="Logo Receita Federal"
              className="h-8 sm:h-10 w-auto object-contain"
            />
            <div className="h-6 sm:h-8 w-px bg-white/20" />
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide leading-tight">
                Meu Imposto de Renda
              </h2>
              <p className="text-[8px] sm:text-[10px] text-white/50 tracking-wide uppercase">
                Receita Federal do Brasil
              </p>
            </div>
          </div>

          {/* Right: user info */}
          {nome && cpf ? (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex items-center gap-3">
                <Bell className="h-4 w-4 text-white/50" />
                <div className="text-right">
                  <p className="text-xs font-bold text-white leading-tight">{nome}</p>
                  <p className="text-[10px] text-white/50">CPF: {formatCpf(cpf)}</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                  {nome.charAt(0)}
                </div>
              </div>
              {/* Mobile */}
              <div className="flex sm:hidden items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[10px] font-bold text-white">
                  {nome.charAt(0)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-[10px] text-white/50">
              <span className="hidden sm:inline">gov.br</span>
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white/10">
                <Menu className="h-3.5 w-3.5 text-white/60" />
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bottom gold stripe */}
      <div className="h-0.5 sm:h-1 w-full" style={{ background: `linear-gradient(90deg, hsl(40 95% 50%), hsl(40 95% 55%))` }} />
    </header>
  );
};

export default GovHeader;
