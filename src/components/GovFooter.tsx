import { Shield, Home, FileText, HelpCircle } from "lucide-react";

type Tab = "inicio" | "consultas" | "seguranca" | "ajuda";

interface GovFooterProps {
  activeTab?: Tab;
  onTabChange?: (tab: Tab) => void;
}

const GovFooter = ({ activeTab = "inicio", onTabChange }: GovFooterProps) => {
  const tabs: { id: Tab; icon: typeof Home; label: string }[] = [
    { id: "inicio", icon: Home, label: "Início" },
    { id: "consultas", icon: FileText, label: "Consultas" },
    { id: "seguranca", icon: Shield, label: "Segurança" },
    { id: "ajuda", icon: HelpCircle, label: "Ajuda" },
  ];

  return (
    <footer className="sticky bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom">
      <div className="px-2 py-2 pb-3">
        <div className="flex items-center justify-around">
          {tabs.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-95 ${
                  isActive ? "" : "opacity-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-[9px] ${isActive ? "font-semibold text-primary" : "font-medium text-muted-foreground"}`}>
                  {label}
                </span>
              </button>
            );
          })}
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
