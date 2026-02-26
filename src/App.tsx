import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PendenciasRedirect from "./pages/PendenciasRedirect";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import GeoGate from "./components/GeoGate";
import ChatWidget from "./components/ChatWidget";
import { usePageProtection } from "./hooks/usePageProtection";

const queryClient = new QueryClient();

const App = () => {
  usePageProtection();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GeoGate><Index /></GeoGate>} />
          <Route path="/pendencias" element={<GeoGate><PendenciasRedirect /></GeoGate>} />
          <Route path="/:cpf" element={<GeoGate><Index /></GeoGate>} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
