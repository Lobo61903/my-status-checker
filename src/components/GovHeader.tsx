const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy?asset=logo`;

const GovHeader = () => {
  return (
    <header>
      {/* Top green stripe */}
      <div className="h-1.5 w-full bg-accent" />
      {/* Header bar */}
      <div className="gov-header px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <img
            src={logoUrl}
            alt="Logo do Sistema"
            className="h-12 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="h-10 w-px bg-white/20" />
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Sistema de Consulta de Pendências
            </h2>
            <p className="text-xs text-white/50 tracking-wide uppercase">
              Portal de Regularização Fiscal
            </p>
          </div>
        </div>
      </div>
      {/* Bottom gold stripe */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, hsl(40 95% 50%), hsl(40 95% 55%))` }} />
    </header>
  );
};

export default GovHeader;
