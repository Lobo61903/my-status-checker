import { Bell } from "lucide-react";
import logoImg from "@/assets/logo.png";

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

interface GovHeaderProps {
  nome?: string;
  cpf?: string;
}

const GovHeader = ({ nome, cpf }: GovHeaderProps) => {
  return (
    <header>
      {/* Top green stripe */}
      <div className="h-1.5 w-full bg-accent" />
      {/* Header bar */}
      <div className="gov-header px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {/* Left: logo + title */}
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Logo Receita Federal"
              className="h-10 w-auto object-contain"
            />
            <div className="h-8 w-px bg-white/20 hidden sm:block" />
            <div className="hidden sm:block">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Meu Imposto de Renda
              </h2>
              <p className="text-[10px] text-white/50 tracking-wide uppercase">
                Receita Federal
              </p>
            </div>
          </div>

          {/* Right: user info */}
          {nome && cpf && (
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-white/50" />
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{nome}</p>
                <p className="text-[10px] text-white/50">CPF: {formatCpf(cpf)}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                {nome.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Bottom gold stripe */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, hsl(40 95% 50%), hsl(40 95% 55%))` }} />
    </header>
  );
};

export default GovHeader;
