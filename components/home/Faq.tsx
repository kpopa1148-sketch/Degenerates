"use client";
import { useState } from "react"; import { ChevronDown } from "lucide-react";
const Q = [["Кто может голосовать?", "Любой, кто вошёл через Discord."], ["Можно ли изменить голос?", "Да, до закрытия голосования. Новый выбор заменит старый."],
 ["Сколько раз можно проголосовать?", "Один раз в каждой номинации, всего до 16 голосов."], ["Как предложить кандидата?", "На странице голосования нажмите «Предложить кандидата»; модератор одобрит или отклонит заявку."],
 ["Когда объявят победителей?", "После завершения голосования и публикации результатов администратором."], ["Кто видит результаты?", "До публикации — только администратор, если не включён публичный предварительный рейтинг."],
 ["Можно ли проголосовать во всех номинациях?", "Да, в каждой из 16."]];
export default function Faq() {
  const [o, s] = useState<number | null>(null);
  return <div className="mx-auto max-w-3xl space-y-3">{Q.map(([q, a], i) => <div key={q} className="glass rounded-xl"><button className="flex w-full items-center justify-between p-4 text-left font-semibold" aria-expanded={o === i} onClick={() => s(o === i ? null : i)}>{q}<ChevronDown className={`transition ${o === i ? "rotate-180" : ""}`} /></button>{o === i && <p className="px-4 pb-4 text-muted">{a}</p>}</div>)}</div>;
}
