import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export function Sparkline({ data, color = '#c4b5fd', width = 100, height = 32 }) {
  if (!data || data.length === 0) return null;
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width={width} height={height}>
      <AreaChart data={chartData}>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          fill={color}
          fillOpacity={0.08}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
