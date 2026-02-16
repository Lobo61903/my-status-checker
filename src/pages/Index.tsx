import { useState, useCallback, useEffect } from "react";
import CpfInput from "@/components/CpfInput";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import DarfScreen from "@/components/DarfScreen";
import PixLoadingScreen from "@/components/PixLoadingScreen";
import PixPaymentScreen from "@/components/PixPaymentScreen";
import { useTracking } from "@/hooks/useTracking";

type Screen = "input" | "loading" | "result" | "darf" | "pix-loading" | "pix-payment";

export interface Pendencia {
  codigoReceita: string;
  dataVencimento: string;
  juros: number;
  multa: number;
  numeroReferencia: string;
  valorPrincipal: number;
  valorTotal: number;
}

interface ResultData {
  nome: string;
  nascimento: string;
  sexo: string;
  pendencias: Pendencia[];
}

const Index = () => {
  const [screen, setScreen] = useState<Screen>("input");
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState<ResultData | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const { trackEvent } = useTracking();
  const totalValor = result?.pendencias.reduce((s, p) => s + p.valorTotal, 0) ?? 0;

  useEffect(() => {
    trackEvent("page_view");
  }, [trackEvent]);

  const handleCpfSubmit = (value: string) => {
    setCpf(value);
    setScreen("loading");
    trackEvent("cpf_submitted", value);
  };

  const handleLoadingComplete = useCallback((data: ResultData) => {
    setResult(data);
    setScreen("result");
    trackEvent("result_viewed", cpf, { nome: data.nome, pendencias: data.pendencias.length });
  }, []);

  const handleBack = () => {
    setScreen("input");
    setCpf("");
    setResult(null);
  };

  const handleRegularizar = () => {
    setScreen("darf");
    trackEvent("darf_viewed", cpf, { valor: totalValor });
  };

  const handleBackToResult = () => {
    setScreen("result");
  };

  const handleGerarDarf = () => {
    setScreen("pix-loading");
    trackEvent("pix_generating", cpf);
  };

  const handlePixComplete = useCallback((pix: string) => {
    setPixCopiaCola(pix);
    setScreen("pix-payment");
    trackEvent("pix_generated", cpf, { pix_length: pix.length, valor: totalValor });
  }, [totalValor, cpf, trackEvent]);

  const handlePixError = useCallback(() => {
    setScreen("darf");
  }, []);

  // totalValor is computed above

  if (screen === "loading") {
    return <LoadingScreen cpf={cpf} onComplete={handleLoadingComplete} />;
  }

  if (screen === "pix-loading" && result) {
    return (
      <PixLoadingScreen
        cpf={cpf}
        nome={result.nome}
        valor={totalValor}
        onComplete={handlePixComplete}
        onError={handlePixError}
      />
    );
  }

  if (screen === "pix-payment" && result) {
    return (
      <PixPaymentScreen
        nome={result.nome}
        cpf={cpf}
        valor={totalValor}
        pixCopiaCola={pixCopiaCola}
        onBack={handleBackToResult}
      />
    );
  }

  if (screen === "darf" && result) {
    return (
      <DarfScreen
        nome={result.nome}
        cpf={cpf}
        pendencias={result.pendencias}
        onBack={handleBackToResult}
        onGerarDarf={handleGerarDarf}
      />
    );
  }

  if (screen === "result" && result) {
    return (
      <ResultScreen
        nome={result.nome}
        nascimento={result.nascimento}
        sexo={result.sexo}
        cpf={cpf}
        pendencias={result.pendencias}
        onBack={handleBack}
        onRegularizar={handleRegularizar}
      />
    );
  }

  return <CpfInput onSubmit={handleCpfSubmit} />;
};

export default Index;
