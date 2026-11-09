"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-24 text-center"><h1 className="title text-6xl">Что-то сломалось</h1><p className="mt-4 text-muted">Не удалось загрузить данные. Проверьте подключение к базе.</p><button className="btn mt-6" onClick={reset}>Повторить</button></div>;
}
