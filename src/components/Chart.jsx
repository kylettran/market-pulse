import { useRef, useEffect, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';

export function CandleChart({ candles, height = 500, overlays = {} }) {
  const containerRef = useRef(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !candles || !candles.t?.length) return;
    setChartError(null);
    let chart;
    try {

    chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b6685',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(42, 38, 57, 0.5)' },
        horzLines: { color: 'rgba(42, 38, 57, 0.5)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(196, 181, 253, 0.3)', labelBackgroundColor: '#1a1825' },
        horzLine: { color: 'rgba(196, 181, 253, 0.3)', labelBackgroundColor: '#1a1825' },
      },
      rightPriceScale: { borderColor: '#2a2639', scaleMargins: { top: 0.05, bottom: 0.25 } },
      timeScale: { borderColor: '#2a2639', timeVisible: true, secondsVisible: false },
      width: containerRef.current.clientWidth,
      height,
    });

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#6ee7b7',
      downColor: '#fca5a5',
      borderVisible: false,
      wickUpColor: '#6ee7b7',
      wickDownColor: '#fca5a5',
    });

    const candleData = candles.t.map((time, i) => ({
      time,
      open: candles.o[i],
      high: candles.h[i],
      low: candles.l[i],
      close: candles.c[i],
    }));
    candleSeries.setData(candleData);

    // Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const volumeData = candles.t.map((time, i) => ({
      time,
      value: candles.v[i],
      color: candles.c[i] >= candles.o[i]
        ? 'rgba(110, 231, 183, 0.15)'
        : 'rgba(252, 165, 165, 0.15)',
    }));
    volumeSeries.setData(volumeData);

    // SMA overlays
    const smaColors = { sma20: '#c4b5fd', sma50: '#f59e0b', sma200: '#ef4444' };
    for (const [key, color] of Object.entries(smaColors)) {
      if (overlays[key]) {
        const series = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        const lineData = overlays[key]
          .map((v, i) => v != null ? { time: candles.t[i], value: v } : null)
          .filter(Boolean);
        series.setData(lineData);
      }
    }

    // Bollinger Bands
    if (overlays.bbUpper && overlays.bbLower) {
      for (const [, arr] of [['bbUpper', overlays.bbUpper], ['bbLower', overlays.bbLower]]) {
        const series = chart.addSeries(LineSeries, {
          color: 'rgba(139, 92, 246, 0.3)',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        const lineData = arr
          .map((v, i) => v != null ? { time: candles.t[i], value: v } : null)
          .filter(Boolean);
        series.setData(lineData);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
    } catch (err) {
      console.error('CandleChart error:', err);
      setChartError(err.message);
      if (chart) { try { chart.remove(); } catch {} }
    }
  }, [candles, overlays, height]);

  if (chartError) {
    return (
      <div className="w-full flex items-center justify-center text-text-muted text-sm" style={{ height }}>
        Chart unavailable
      </div>
    );
  }
  return <div ref={containerRef} className="w-full" />;
}

// Sub-chart for RSI / MACD
export function IndicatorChart({ data, height = 120, color = '#c4b5fd', type = 'line', timestamps }) {
  const containerRef = useRef(null);
  const [chartError, setChartError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !data?.length || !timestamps?.length) return;
    setChartError(null);
    let chart;
    try {

    chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b6685',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(42, 38, 57, 0.3)' },
        horzLines: { color: 'rgba(42, 38, 57, 0.3)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(196, 181, 253, 0.3)', labelBackgroundColor: '#1a1825' },
        horzLine: { color: 'rgba(196, 181, 253, 0.3)', labelBackgroundColor: '#1a1825' },
      },
      rightPriceScale: { borderColor: '#2a2639' },
      timeScale: { borderColor: '#2a2639', visible: false },
      width: containerRef.current.clientWidth,
      height,
    });

    if (type === 'histogram') {
      const series = chart.addSeries(HistogramSeries, {
        color,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      const lineData = data
        .map((v, i) => v != null ? { time: timestamps[i], value: v, color: v >= 0 ? '#6ee7b7' : '#fca5a5' } : null)
        .filter(Boolean);
      series.setData(lineData);
    } else {
      const series = chart.addSeries(LineSeries, {
        color,
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
      });
      const lineData = data
        .map((v, i) => v != null ? { time: timestamps[i], value: v } : null)
        .filter(Boolean);
      series.setData(lineData);
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
    } catch (err) {
      console.error('IndicatorChart error:', err);
      setChartError(err.message);
      if (chart) { try { chart.remove(); } catch {} }
    }
  }, [data, timestamps, color, type, height]);

  if (chartError) {
    return (
      <div className="w-full flex items-center justify-center text-text-muted text-xs" style={{ height }}>
        Indicator unavailable
      </div>
    );
  }
  return <div ref={containerRef} className="w-full" />;
}
