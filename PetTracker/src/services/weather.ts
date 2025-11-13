import { Coordinate } from "../types";

export interface RainForecast {
  willRain: boolean;
  rainIntervals: Array<{ start: string; end: string }>;
  city?: string;
}

// Folosește Open-Meteo (gratuit, fără API key)
// https://open-meteo.com/en/docs#api_form
export async function getRainForecast(
  coord: Coordinate
): Promise<RainForecast> {
  // Obține prognoza orară pentru precipitații
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.latitude}&longitude=${coord.longitude}&hourly=precipitation&timezone=auto`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Eroare la fetch meteo");
  const data = await resp.json();

  // Extrage ora curentă și ziua
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  // Extrage orele și precipitațiile
  const times: string[] = data.hourly.time; // ex: "2025-11-13T15:00"
  const prec: number[] = data.hourly.precipitation;

  // Caută intervale cu precipitații > 0 pentru azi, de la ora curentă înainte
  const rainIntervals: Array<{ start: string; end: string }> = [];
  let lastStart: string | null = null;
  let lastEnd: string | null = null;

  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    if (!time.startsWith(today)) continue;
    if (new Date(time) < now) continue;
    const hasRain = prec[i] > 0;
    if (hasRain) {
      if (!lastStart) lastStart = time;
      lastEnd = time;
    } else if (lastStart && lastEnd) {
      rainIntervals.push({ start: lastStart, end: lastEnd });
      lastStart = null;
      lastEnd = null;
    }
  }
  if (lastStart && lastEnd) {
    rainIntervals.push({ start: lastStart, end: lastEnd });
  }

  return {
    willRain: rainIntervals.length > 0,
    rainIntervals,
    city: undefined, // Open-Meteo nu returnează numele orașului
  };
}
