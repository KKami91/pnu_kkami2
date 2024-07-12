import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO, differenceInMinutes } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SleepData;
      const startTime = parseISO(data.ds_start);
      const endTime = parseISO(data.ds_end);
      const duration = differenceInMinutes(endTime, startTime);
  
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="text-sm font-bold text-black">{`Time: ${format(startTime, 'yyyy-MM-dd HH:mm')} - ${format(endTime, 'HH:mm')}`}</p>
          <p className="text-sm text-black">{`Stage: ${data.stage}`}</p>
          <p className="text-sm text-black">{`Duration: ${duration} minutes`}</p>
        </div>
      );
    }
    return null;
  };

  const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
    const chartData = data.map(item => {
      const startTime = parseISO(item.ds_start);
      const endTime = parseISO(item.ds_end);
      return {
        ...item,
        x: startTime.getTime(),
        y: parseInt(item.stage),
        z: differenceInMinutes(endTime, startTime), // duration in minutes
      };
    });
  
    const minTime = Math.min(...chartData.map(d => d.x));
    const maxTime = Math.max(...chartData.map(d => d.x));
    const minStage = Math.min(...chartData.map(d => d.y));
    const maxStage = Math.max(...chartData.map(d => d.y));
  
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-bold text-black mb-4">Sleep Stages</h2>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
          >
            <CartesianGrid />
            <XAxis
              dataKey="x"
              type="number"
              domain={[minTime, maxTime]}
              tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
              name="Time"
            />
            <YAxis
              dataKey="y"
              type="number"
              domain={[minStage, maxStage]}
              name="Stage"
              ticks={Array.from({length: maxStage - minStage + 1}, (_, i) => i + minStage)}
            />
            <ZAxis
              dataKey="z"
              type="number"
              range={[20, 200]}
              name="Duration"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Sleep Stage" data={chartData} fill="#8884d8" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  export default SleepChart;