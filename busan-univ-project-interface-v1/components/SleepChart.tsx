import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';

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
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Time: ${format(parseISO(data.ds_start), 'yyyy-MM-dd HH:mm')} - ${format(parseISO(data.ds_end), 'HH:mm')}`}</p>
        <p className="text-sm text-black">{`Stage: ${data.stage}`}</p>
      </div>
    );
  }
  return null;
};

const stageToNumber = (stage: string): number => {
  const stageNum = parseInt(stage, 10);
  return isNaN(stageNum) ? 0 : stageNum;
};

const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    ...item,
    x: new Date(item.ds_start).getTime(),
    y: stageToNumber(item.stage),
    z: (new Date(item.ds_end).getTime() - new Date(item.ds_start).getTime()) / 60000, // duration in minutes
  }));

  const minTime = Math.min(...chartData.map(d => d.x));
  const maxTime = Math.max(...chartData.map(d => d.x));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold text-black mb-4">Sleep Stages</h2>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
            domain={[0, 6]}
            tickFormatter={(stage) => {
              switch (stage) {
                case 1: return 'Stage 1';
                case 2: return 'Stage 2';
                case 3: return 'Stage 3';
                case 4: return 'Stage 4';
                case 5: return 'REM';
                case 6: return 'Awake';
                default: return '';
              }
            }}
            name="Stage"
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