const rub = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function money(n: number): string {
  return rub.format(Math.round(n));
}

export function moneyPlain(n: number): string {
  return `${Math.round(n).toLocaleString('ru-RU')} ₽`;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function fmtDateTime(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

export function fmtTime(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}

export function fmtDate(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  return `${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.${dt.getFullYear()}`;
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
