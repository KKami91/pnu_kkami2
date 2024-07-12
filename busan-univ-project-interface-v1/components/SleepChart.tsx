import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { format, parseISO } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
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
  switch (stage) {
    case 'Awake': return 4;
    case 'REM': return 3;
    case '1': return 2;
    case '2': return 1;
    case '3': return 0;
    default: return -1;
  }
};

const SleepChart: React.FC<SleepChartProps> = ({ data }) => {
  const chartData = data.map(item => ({
    ...item,
    stageNumber: stageToNumber(item.stage),
  }));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold text-black mb-4">Sleep Stages</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ds_start"
            tickFormatter={(tick) => format(parseISO(tick), 'HH:mm')}
            type="category"
            scale="time"
            domain={['dataMin', 'dataMax']}
          />
          <YAxis
            tickFormatter={(tick) => {
              switch (tick) {
                case 0: return '3';
                case 1: return '2';
                case 2: return '1';
                case 3: return 'REM';
                case 4: return 'Awake';
                default: return '';
              }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="step" dataKey="stageNumber" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepChart;