import { MessageSquare, Star, CheckCircle2 } from "lucide-react";

const testimonials = [
  {
    nome: "Maria S.",
    cidade: "São Paulo, SP",
    texto: "Regularizei meu CPF em menos de 24 horas! Estava com medo das consequências, mas o processo foi rápido e simples.",
    tempo: "há 2 dias",
  },
  {
    nome: "Carlos R.",
    cidade: "Rio de Janeiro, RJ",
    texto: "Tinha uma multa pendente e nem sabia. Graças à consulta consegui resolver antes do bloqueio do CPF.",
    tempo: "há 5 dias",
  },
  {
    nome: "Ana P.",
    cidade: "Belo Horizonte, MG",
    texto: "Estava quase sendo incluída no SERASA. Regularizei a tempo e evitei todas as restrições bancárias.",
    tempo: "há 1 semana",
  },
  {
    nome: "João M.",
    cidade: "Curitiba, PR",
    texto: "Processo simples e direto. Consegui quitar minha pendência com desconto nos juros. Recomendo!",
    tempo: "há 3 dias",
  },
];

const Testimonials = () => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">Comentários de quem regularizou</h3>
      </div>

      <div className="space-y-4">
        {testimonials.map((t, i) => (
          <div key={i} className="rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {t.nome[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-foreground">{t.nome}</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <p className="text-xs text-muted-foreground">{t.cidade}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{t.tempo}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t.texto}</p>
            <div className="flex gap-0.5 mt-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Star key={j} className="h-3.5 w-3.5 fill-warning text-warning" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Testimonials;
