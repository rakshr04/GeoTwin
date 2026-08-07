import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sun, CloudSun, CloudFog, CloudDrizzle, CloudRain, Snowflake, CloudLightning, Cloud, Wind, Droplets } from 'lucide-react';
import { fetchWeather, type WeatherData } from '../../services/weatherService';

interface LiveWeatherPanelProps {
  latitude: number;
  longitude: number;
}

const WeatherIcon: React.FC<{ code: number; className?: string }> = ({ code, className = 'size-8' }) => {
  if (code === 0) return <Sun className={`${className} text-[#D99A2B]`} />;
  if (code === 1 || code === 2 || code === 3) return <CloudSun className={`${className} text-[#9BBE55]`} />;
  if (code === 45 || code === 48) return <CloudFog className={`${className} text-[#77785A]`} />;
  if (code === 51 || code === 53 || code === 55) return <CloudDrizzle className={`${className} text-[#4C91CF]`} />;
  if (code === 61 || code === 63 || code === 65) return <CloudRain className={`${className} text-[#4C91CF]`} />;
  if (code === 71 || code === 73 || code === 75) return <Snowflake className={`${className} text-[#F0EEE5]`} />;
  if (code === 80 || code === 81 || code === 82) return <CloudLightning className={`${className} text-[#C95B4A]`} />;
  if (code === 95 || code === 96 || code === 99) return <CloudLightning className={`${className} text-[#C95B4A]`} />;
  return <Cloud className={`${className} text-[#77785A]`} />;
};

export const LiveWeatherPanel: React.FC<LiveWeatherPanelProps> = ({ latitude, longitude }) => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadWeather = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const weatherData = await fetchWeather(latitude, longitude);
      setData(weatherData);
    } catch (err) {
      setError('Unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    loadWeather();

    // Auto-refresh every 12 minutes
    const timer = setInterval(() => {
      loadWeather(true);
    }, 12 * 60 * 1000);

    return () => clearInterval(timer);
  }, [loadWeather]);

  if (loading) {
    return (
      <div className="bg-[#18211D] border-0 rounded-2xl p-4 animate-pulse h-[260px] flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div className="h-4 bg-[#121A16] rounded w-2/3"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#121A16]"></div>
          <div className="space-y-2 flex-1">
            <div className="h-8 bg-[#121A16] rounded w-1/3"></div>
            <div className="h-4 bg-[#121A16] rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-10 bg-[#121A16] rounded w-full"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#18211D] border-0 rounded-2xl p-4 h-[260px] flex flex-col justify-between text-[#F8FAF8] shadow-[0_8px_30px_rgba(0,0,0,0.3)]">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#76B78C] font-mono">Live Weather</h3>
          <p className="text-xs text-[#EF4444] mt-2">Could not retrieve forecast.</p>
        </div>
        <button
          onClick={() => loadWeather(true)}
          className="w-full py-2 bg-[#387A4E] hover:bg-[#2E6540] text-[#F8FAF8] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-[0_0_12px_rgba(56,122,78,0.3)]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#18211D] border-0 rounded-2xl p-5 flex flex-col justify-between text-[#F8FAF8] h-[260px] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_0_20px_rgba(56,122,78,0.2)] transition-all">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#76B78C] font-mono">Live Weather</h3>
          <p className="text-[10px] font-mono text-[#819089] mt-0.5">Updated: {data.lastUpdated}</p>
        </div>
        <button
          onClick={() => loadWeather(true)}
          disabled={refreshing}
          className="p-1.5 rounded-xl border-0 bg-[#121A16] text-[#94C7A5] hover:text-[#F8FAF8] transition-all disabled:opacity-50 cursor-pointer"
          title="Refresh weather"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex items-center gap-3 my-2">
        <WeatherIcon code={data.current.weatherCode} className="w-10 h-10" />
        <div>
          <div className="text-2xl font-bold font-mono tracking-tight text-[#F8FAF8]">{data.current.temperature}°C</div>
          <div className="text-xs font-semibold text-[#AEB9B3]">{data.current.conditionText}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-b border-[#387A4E]/20 py-2">
        <div className="flex items-center gap-1.5 text-[#819089]">
          <Droplets className="w-3.5 h-3.5 text-[#3B82F6]" />
          <span>Humid: <strong className="text-[#F8FAF8]">{data.current.humidity}%</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-[#819089]">
          <Wind className="w-3.5 h-3.5 text-[#22C55E]" />
          <span>Wind: <strong className="text-[#F8FAF8]">{data.current.windSpeed} km/h</strong></span>
        </div>
      </div>

      <div className="pt-2">
        <div className="text-[9px] uppercase tracking-wider font-mono font-semibold text-[#76B78C] mb-1.5">6-Hour Forecast</div>
        <div className="flex justify-between gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {data.hourly.map((h, i) => (
            <div key={i} className="flex flex-col items-center min-w-[42px] text-center bg-[#121A16] p-1.5 rounded-xl border-0">
              <span className="text-[9px] font-mono text-[#819089] block">{h.time.split(' ')[0]}</span>
              <WeatherIcon code={h.weatherCode} className="w-4 h-4 my-1" />
              <span className="text-[10px] font-bold font-mono text-[#F8FAF8]">{h.temperature}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
