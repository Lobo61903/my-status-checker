const logoUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-proxy?asset=logo`;

const GovHeader = () => {
  return (
    <header>
      {/* Top green stripe */}
      <div className="h-1 w-full bg-primary" />
      {/* Header bar */}
      <div className="gov-header px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="h-8 w-px bg-white/20" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Sistema de Consulta de Pendências
            </h2>
            <p className="text-xs text-white/60">Portal de Regularização</p>
          </div>
        </div>
      </div>
      {/* Bottom accent stripe */}
      <div className="h-0.5 w-full bg-accent" />
    </header>
  );
};

export default GovHeader;
