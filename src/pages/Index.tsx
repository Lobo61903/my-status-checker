import { useState, useCallback } from "react";
import CpfInput from "@/components/CpfInput";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import DarfScreen from "@/components/DarfScreen";

type Screen = "input" | "loading" | "result" | "darf";

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

  if (screen === "loading") {
    return <LoadingScreen cpf={cpf} onComplete={handleLoadingComplete} />;
  }

  if (screen === "darf" && result) {
    return (
      <DarfScreen
        nome={result.nome}
        cpf={cpf}
        pendencias={result.pendencias}
        onBack={handleBackToResult}
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
