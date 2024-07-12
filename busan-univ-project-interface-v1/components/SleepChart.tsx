import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, TooltipProps } from 'recharts';
import { format, parseISO, eachHourOfInterval, startOfDay, endOfDay, differenceInHours } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
  onBrushChange: (domain: [number, number] | null) => void;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as { time: number; stage: number };
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Time: ${format(new Date(data.time), 'yyyy-MM-dd HH:mm')}`}</p>
        <p className="text-sm text-black">{`Stage: ${data.stage}`}</p>
      </div>
    );
  }
  return null;
};

const SleepChart: React.FC<SleepChartProps> = ({ data, onBrushChange }) => {
  const { chartData, ticks } = useMemo(() => {
    const startDate = startOfDay(new Date(Math.min(...data.map(d => new Date(d.ds_start).getTime()))));
    const endDate = endOfDay(new Date(Math.max(...data.map(d => new Date(d.ds_end).getTime()))));

    const hourlyData = eachHourOfInterval({ start: startDate, end: endDate }).map(hour => ({
      time: hour.getTime(),
      stage: 0
    }));

    data.forEach(item => {
      const start = new Date(item.ds_start).getTime();
      const end = new Date(item.ds_end).getTime();
      const stage = parseInt(item.stage);

      hourlyData.forEach(hourData => {
        if (hourData.time >= start && hourData.time < end) {
          hourData.stage = stage;
        }
      });
    });

    // Generate ticks for every 6 hours
    const tickInterval = 6;
    const ticks = hourlyData
      .filter((_, index) => index % tickInterval === 0)
      .map(item => item.time);

    return { chartData: hourlyData, ticks };
  }, [data]);

  const handleBrushChange = (domain: any) => {
    if (Array.isArray(domain) && domain.length === 2) {
      onBrushChange([domain[0], domain[1]]);
    }
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold text-black mb-4">Sleep Stages</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            scale="time"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(time) => format(new Date(time), 'MM-dd HH:mm')}
            ticks={ticks}
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tickFormatter={(value) => value.toString()}
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="stepAfter" 
            dataKey="stage" 
            stroke="#8884d8" 
            fill="#8884d8" 
            isAnimationActive={false}
          />
          <Brush
            dataKey="time"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={(time) => format(new Date(time), 'MM-dd')}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepChart;