export interface CurrentWeather {
  temperature: number;
  humidity: number;
  weatherCode: number;
  windSpeed: number;
  precipitation: number;
  conditionText: string;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitationProb: number;
  weatherCode: number;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  lastUpdated: string;
}

// WMO Weather interpretation codes (WW)
// https://open-meteo.com/en/docs
export function getWeatherCondition(code: number): { text: string; icon: string } {
  if (code === 0) return { text: 'Clear sky', icon: 'Sun' };
  if (code === 1 || code === 2 || code === 3) return { text: 'Mainly clear / Partly cloudy', icon: 'CloudSun' };
  if (code === 45 || code === 48) return { text: 'Foggy', icon: 'CloudFog' };
  if (code === 51 || code === 53 || code === 55) return { text: 'Drizzle', icon: 'CloudDrizzle' };
  if (code === 61 || code === 63 || code === 65) return { text: 'Rainy', icon: 'CloudRain' };
  if (code === 71 || code === 73 || code === 75) return { text: 'Snowy', icon: 'Snowflake' };
  if (code === 80 || code === 81 || code === 82) return { text: 'Rain showers', icon: 'CloudLightning' };
  if (code === 95 || code === 96 || code === 99) return { text: 'Thunderstorm', icon: 'CloudLightning' };
  return { text: 'Overcast', icon: 'Cloud' };
}

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const data = await response.json();

  const current = data.current;
  const hourly = data.hourly;

  const hourlyForecasts: HourlyForecast[] = [];
  // Get next 6 hours of forecast
  const now = new Date();
  const currentHour = now.getHours();

  for (let i = 0; i < 6; i++) {
    const targetIdx = (currentHour + i) % 24;
    if (hourly.time[targetIdx]) {
      hourlyForecasts.push({
        time: new Date(hourly.time[targetIdx]).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        temperature: Math.round(hourly.temperature_2m[targetIdx]),
        precipitationProb: Math.round(hourly.precipitation_probability[targetIdx]),
        weatherCode: hourly.weather_code[targetIdx],
      });
    }
  }

  return {
    current: {
      temperature: Math.round(current.temperature_2m),
      humidity: Math.round(current.relative_humidity_2m),
      weatherCode: current.weather_code,
      windSpeed: Math.round(current.wind_speed_10m),
      precipitation: current.precipitation,
      conditionText: getWeatherCondition(current.weather_code).text,
    },
    hourly: hourlyForecasts,
    lastUpdated: new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),
  };
}
