import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
}

const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const chartData = useMemo(() => {
    if (!startDate || !endDate) return [];

    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return data
      .filter(item => {
        const itemDate = parseISO(item.ds_start);
        return itemDate >= start && itemDate <= end;
      })
      .map(item => ({
        time: parseISO(item.ds_start).getTime(),
        stage: parseInt(item.stage)
      }))
      .sort((a, b) => a.time - b.time);
  }, [data, startDate, endDate]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="text-sm font-bold">{format(new Date(label), 'yyyy-MM-dd HH:mm')}</p>
          <p className="text-sm">{`Stage: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold text-black mb-4">Sleep Stages</h2>
      <div className="flex space-x-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded"
        />
      </div>
      {chartData.length > 0 ? (
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                type="number"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(time) => format(new Date(time), 'MM-dd HH:mm')}
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
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-500">Please select a date range to view sleep data.</p>
      )}
    </div>
  );
};

export default SleepChart;