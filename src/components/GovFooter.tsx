import { Shield, Lock, Home, FileText, HelpCircle } from "lucide-react";

const GovFooter = () => {
  return (
    <footer className="sticky bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      {/* App-style bottom navigation */}
      <div className="px-2 py-2 pb-3">
        <div className="flex items-center justify-around">
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl">
            <Home className="h-5 w-5 text-primary" />
            <span className="text-[9px] font-semibold text-primary">Início</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl opacity-50">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-[9px] font-medium text-muted-foreground">Consultas</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl opacity-50">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-[9px] font-medium text-muted-foreground">Segurança</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl opacity-50">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <span className="text-[9px] font-medium text-muted-foreground">Ajuda</span>
          </button>
        </div>
      </div>
      {/* Home indicator */}
      <div className="flex justify-center pb-1">
        <div className="h-1 w-32 rounded-full bg-foreground/20" />
      </div>
    </footer>
  );
};

export default GovFooter;
