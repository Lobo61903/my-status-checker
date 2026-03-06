import { useState, useEffect, useMemo } from "react";
import { Star, CheckCircle2, ChevronLeft, ChevronRight, Users } from "lucide-react";

const firstNames = [
  "Maria", "Ana", "João", "Carlos", "Fernanda", "Pedro", "Juliana", "Lucas",
  "Patrícia", "Rafael", "Camila", "Bruno", "Larissa", "Marcos", "Beatriz",
  "Rodrigo", "Isabela", "Thiago", "Letícia", "Felipe", "Gabriela", "André",
  "Mariana", "Eduardo", "Vanessa", "Ricardo", "Aline", "Daniel", "Priscila", "Gustavo",
];

const lastInitials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const cities = [
  "São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Curitiba, PR",
  "Porto Alegre, RS", "Salvador, BA", "Brasília, DF", "Fortaleza, CE",
  "Recife, PE", "Manaus, AM", "Goiânia, GO", "Campinas, SP",
  "Florianópolis, SC", "Vitória, ES", "Belém, PA",
];

const templates = [
  "Consegui liberar meu benefício rapidamente! O processo foi simples e rápido.",
  "Não sabia que tinha benefícios disponíveis. Consegui receber antes do prazo expirar.",
  "Quase perdi meu benefício por não consultar a tempo. Recomendo a todos!",
  "Processo direto e rápido. Recebi meu benefício em menos de 48 horas.",
  "Fiquei surpreso com o valor disponível. Liberação foi fácil e segura.",
  "Recomendo a todos! Consegui liberar meus benefícios sem complicações.",
  "Tinha benefícios acumulados e não sabia. Graças à consulta, recebi tudo.",
  "O atendimento foi excelente. Consegui liberar todos os meus benefícios.",
  "Estava com medo de perder meus direitos. Consultei e está tudo certo!",
  "Muito fácil de usar. Em menos de 24 horas já recebi os valores.",
  "Evitei perder meus benefícios consultando por aqui. Super recomendo!",
  "Não imaginava que tinha valores a receber. A consulta me ajudou muito.",
];

const tempos = [
  "há 1 hora", "há 3 horas", "há 5 horas", "há 1 dia", "há 2 dias",
  "há 3 dias", "há 4 dias", "há 5 dias", "há 1 semana", "há 2 semanas",
];

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateTestimonials = (count: number) =>
  Array.from({ length: count }, () => ({
    nome: `${pick(firstNames)} ${pick(lastInitials.split(""))}.`,
    cidade: pick(cities),
    texto: pick(templates),
    tempo: pick(tempos),
    stars: Math.random() > 0.15 ? 5 : 4,
  }));

const Testimonials = () => {
  const testimonials = useMemo(() => generateTestimonials(8), []);
  const [current, setCurrent] = useState(0);

  useEffect(() => { const interval = setInterval(() => { setCurrent((prev) => (prev + 1) % testimonials.length); }, 4000); return () => clearInterval(interval); }, [testimonials.length]);

  const prev = () => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((c) => (c + 1) % testimonials.length);
  const t = testimonials[current];

  return (
    <div className="rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-accent/10">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
          </div>
          <h3 className="font-bold text-foreground text-xs sm:text-sm uppercase tracking-wider">Beneficiários Atendidos</h3>
        </div>
        <span className="text-[10px] sm:text-xs text-muted-foreground">{current + 1}/{testimonials.length}</span>
      </div>

      <div className="relative min-h-[110px] sm:min-h-[130px] flex items-center">
        <button onClick={prev} className="absolute left-0 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
        <div className="mx-8 sm:mx-10 w-full animate-fade-in-up" key={current}>
          <div className="rounded-lg sm:rounded-xl bg-muted/40 p-3 sm:p-4 border border-border/50">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl gradient-primary text-xs sm:text-sm font-bold text-primary-foreground">{t.nome[0]}</div>
                <div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className="text-xs sm:text-sm font-bold text-foreground">{t.nome}</span>
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{t.cidade}</p>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground bg-muted px-1.5 sm:px-2 py-0.5 rounded-full">{t.tempo}</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">"{t.texto}"</p>
            <div className="flex gap-0.5 mt-1.5 sm:mt-2">
              {Array.from({ length: t.stars }).map((_, j) => (<Star key={j} className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-warning text-warning" />))}
            </div>
          </div>
        </div>
        <button onClick={next} className="absolute right-0 z-10 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      <div className="flex justify-center gap-1 sm:gap-1.5 mt-3 sm:mt-4">
        {testimonials.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} className={`h-1 sm:h-1.5 rounded-full transition-all ${i === current ? "w-4 sm:w-5 bg-primary" : "w-1 sm:w-1.5 bg-border"}`} />
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
