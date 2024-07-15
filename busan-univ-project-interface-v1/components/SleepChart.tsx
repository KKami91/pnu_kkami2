import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
  globalStartDate: Date;
  globalEndDate: Date;
  brushDomain: [number, number] | null;
  onBrushChange: (domain: [number, number] | null) => void;
  syncId: string;
}

const SleepChart: React.FC<SleepChartProps> = ({ 
  data, 
  globalStartDate, 
  globalEndDate, 
  brushDomain, 
  onBrushChange,
  syncId
}) => {
  const chartData = data.map(item => ({
    time: new Date(item.ds_start).getTime(),
    stage: parseInt(item.stage)
  }));

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const startTime = chartData[domain.startIndex].time;
      const endTime = chartData[domain.endIndex].time;
      onBrushChange([startTime, endTime]);
    } else {
      onBrushChange(null);
    }
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4">Sleep Stages</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          syncId={syncId}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={brushDomain || ['dataMin', 'dataMax']}
            tickFormatter={(time) => format(new Date(time), 'MM-dd HH:mm')}
          />
          <YAxis
            tickFormatter={(value) => value.toString()}
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
          />
          <Tooltip
            labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd HH:mm')}
            formatter={(value: number) => [`Stage ${value}`, '']}
          />
          <Area type="stepAfter" dataKey="stage" stroke="#8884d8" fill="#8884d8" />
          <Brush
            dataKey="time"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            startIndex={brushDomain ? brushDomain[0] : undefined}
            endIndex={brushDomain ? brushDomain[1] : undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepChart;