import { useState, useCallback } from "react";
import CpfInput from "@/components/CpfInput";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";

type Screen = "input" | "loading" | "result";

interface ResultData {
  nome: string;
  nascimento: string;
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

  if (screen === "loading") {
    return <LoadingScreen cpf={cpf} onComplete={handleLoadingComplete} />;
  }

  if (screen === "result" && result) {
    return (
      <ResultScreen
        nome={result.nome}
        nascimento={result.nascimento}
        cpf={cpf}
        onBack={handleBack}
      />
    );
  }

  return <CpfInput onSubmit={handleCpfSubmit} />;
};

export default Index;
