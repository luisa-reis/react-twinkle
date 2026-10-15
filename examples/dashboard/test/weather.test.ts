import {describe, expect, it} from 'vitest';
import {parseForecast, skyOf} from '../src/data/weather';

describe('skyOf', () => {
  it('groups the WMO codes into the skies the icon draws', () => {
    expect([0, 1, 3, 45, 61, 73, 95].map(skyOf)).toEqual([
      'clear',
      'partly',
      'cloudy',
      'fog',
      'rain',
      'snow',
      'storm',
    ]);
  });
});

describe('parseForecast', () => {
  it('takes the current weather and the hourly temperatures', () => {
    const body = {
      current: {temperature_2m: 18.2, weather_code: 2},
      hourly: {temperature_2m: [12, 14, 17]},
      utc_offset_seconds: 3600,
    };
    expect(parseForecast(body, 'Home')).toEqual({
      place: 'Home',
      temperature: 18.2,
      sky: 'partly',
      hourly: [12, 14, 17],
      utcOffsetSeconds: 3600,
      sample: false,
    });
  });

  it('refuses an answer without them', () => {
    expect(() => parseForecast({error: true}, 'Home')).toThrow(/current temperature/);
    expect(() =>
      parseForecast({current: {temperature_2m: 1, weather_code: 0}, hourly: {}}, 'Home'),
    ).toThrow(/hourly/);
  });
});
