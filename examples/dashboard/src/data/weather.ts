// The weather from Open-Meteo (https://open-meteo.com), which needs no key.
import type {Place} from '../config';
import type {Sky, Weather} from './types';

const API = 'https://api.open-meteo.com/v1/forecast';

/** WMO weather code, as Open-Meteo gives it, to the sky the page draws. */
export function skyOf(code: number): Sky {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partly';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'rain';
}

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** The parts of Open-Meteo's answer the page uses; throws if they are not there. */
export function parseForecast(body: unknown, place: string): Weather {
  const {
    current,
    hourly,
    utc_offset_seconds: offset,
  } = (body ?? {}) as {
    current?: unknown;
    hourly?: unknown;
    utc_offset_seconds?: unknown;
  };
  const now = (current ?? {}) as {temperature_2m?: unknown; weather_code?: unknown};
  const hours = ((hourly ?? {}) as {temperature_2m?: unknown}).temperature_2m;
  if (!isNumber(now.temperature_2m) || !isNumber(now.weather_code)) {
    throw new Error('weather: no current temperature or weather code in the answer');
  }
  if (!Array.isArray(hours) || !hours.every(isNumber)) {
    throw new Error('weather: no hourly temperatures in the answer');
  }
  return {
    place,
    temperature: now.temperature_2m,
    sky: skyOf(now.weather_code),
    hourly: hours,
    utcOffsetSeconds: isNumber(offset) ? offset : undefined,
    sample: false,
  };
}

export async function fetchWeather(
  place: Place,
  units: 'celsius' | 'fahrenheit',
  signal?: AbortSignal,
): Promise<Weather> {
  const url = new URL(API);
  url.search = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,weather_code',
    hourly: 'temperature_2m',
    forecast_days: '1',
    timezone: 'auto',
    temperature_unit: units,
  }).toString();
  const response = await fetch(url, {signal});
  if (!response.ok) {
    throw new Error(`weather: ${response.status} ${response.statusText}`);
  }
  return parseForecast(await response.json(), place.name);
}
