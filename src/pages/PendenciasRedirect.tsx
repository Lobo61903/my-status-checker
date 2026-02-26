import { useSearchParams, Navigate } from "react-router-dom";

const PendenciasRedirect = () => {
  const [searchParams] = useSearchParams();
  const cpfRaw = searchParams.get("cpf") || "";
  const cpfDigits = cpfRaw.replace(/\D/g, "");

  if (cpfDigits) {
    return <Navigate to={`/${cpfDigits}`} replace />;
  }

  return <Navigate to="/" replace />;
};

export default PendenciasRedirect;
