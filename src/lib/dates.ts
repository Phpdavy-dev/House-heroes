export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Maandag als start van de week */
export function startOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d);
  const day = (x.getDay() + 6) % 7; // ma=0 ... zo=6
  x.setDate(x.getDate() - day);
  return x;
}

export function startOfMonth(d: Date = new Date()): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}

/** 1..7, hoeveel dagen van deze week zijn (incl. vandaag) verstreken */
export function daysElapsedThisWeek(now: Date = new Date()): number {
  return ((now.getDay() + 6) % 7) + 1;
}

export function daysLeftThisWeek(now: Date = new Date()): number {
  return 7 - daysElapsedThisWeek(now);
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("nl-NL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
