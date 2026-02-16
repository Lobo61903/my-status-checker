import { useState, useCallback } from "react";
import CpfInput from "@/components/CpfInput";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import DarfScreen from "@/components/DarfScreen";
import PixLoadingScreen from "@/components/PixLoadingScreen";
import PixPaymentScreen from "@/components/PixPaymentScreen";

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

  const handleCpfSubmit = (value: string) => {
    setCpf(value);
    setScreen("loading");
  };

  const handleLoadingComplete = useCallback((data: ResultData) => {
    setResult(data);
    setScreen("result");
  }, []);

  const handleBack = () => {
    setScreen("input");
    setCpf("");
    setResult(null);
  };

  const handleRegularizar = () => {
    setScreen("darf");
  };

  const handleBackToResult = () => {
    setScreen("result");
  };

  const handleGerarDarf = () => {
    setScreen("pix-loading");
  };

  const handlePixComplete = useCallback((pix: string) => {
    setPixCopiaCola(pix);
    setScreen("pix-payment");
  }, []);

  const handlePixError = useCallback(() => {
    setScreen("darf");
  }, []);

  const totalValor = result?.pendencias.reduce((s, p) => s + p.valorTotal, 0) ?? 0;

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
