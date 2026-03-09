import { Bell, Menu, Wifi, BatteryFull, Signal } from "lucide-react";
import { useState } from "react";
import logoImg from "@/assets/logo.png";

const formatCpf = (cpf: string) =>
  `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;

interface GovHeaderProps {
  nome?: string;
  cpf?: string;
}

const GovHeader = ({ nome, cpf }: GovHeaderProps) => {
  return (
    <header className="sticky top-0 z-50">
      {/* Status bar - simula barra de status do celular */}
      <div className="bg-[hsl(var(--gov-dark))] px-5 py-1 flex items-center justify-between">
        <span className="text-[10px] font-medium text-white/70">
          {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <div className="flex items-center gap-1.5">
          <Signal className="h-2.5 w-2.5 text-white/70" />
          <Wifi className="h-2.5 w-2.5 text-white/70" />
          <BatteryFull className="h-3 w-3 text-white/70" />
        </div>
      </div>

      {/* App header */}
      <div className="gov-header px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="Logo"
              className="h-8 w-auto object-contain"
            />
            <div>
              <h2 className="text-[13px] font-bold text-white leading-tight">
                Meu Imposto de Renda
              </h2>
              <p className="text-[9px] text-white/40 tracking-wider uppercase">
                Receita Federal
              </p>
            </div>
          </div>

          {nome && cpf ? (
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-white/40" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/80 text-[11px] font-bold text-white shadow-lg">
                {nome.charAt(0)}
              </div>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <Menu className="h-4 w-4 text-white/60" />
            </div>
          )}
        </div>
      </div>
      {/* Thin accent line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-accent via-[hsl(var(--gov-gold))] to-accent" />
    </header>
  );
};

export default GovHeader;
