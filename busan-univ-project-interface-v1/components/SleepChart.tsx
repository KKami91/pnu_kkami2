import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, TooltipProps } from 'recharts';
import { format, addMinutes, isValid } from 'date-fns';

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: string;
}

interface SleepChartProps {
  data: SleepData[];
  globalStartDate: Date;
  globalEndDate: Date;
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0 && payload[0].value !== undefined) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Time: ${format(new Date(label), 'yyyy-MM-dd HH:mm')}`}</p>
        <p className="text-sm text-black">{`Sleep Stage: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const SleepChart: React.FC<SleepChartProps> = ({ 
  data, 
  globalStartDate, 
  globalEndDate,
}) => {
  const [localBrushDomain, setLocalBrushDomain] = useState<[number, number] | null>(null);

  const chartData = useMemo(() => {
    const filledData = [];
    let currentDate = new Date(globalStartDate);
    const endDate = new Date(globalEndDate);

    while (currentDate <= endDate) {
      const existingData = data.find(item => {
        const startDate = new Date(item.ds_start);
        const endDate = new Date(item.ds_end);
        return currentDate >= startDate && currentDate < endDate;
      });

      filledData.push({
        time: currentDate.getTime(),
        stage: existingData ? parseInt(existingData.stage) : 0
      });

      currentDate = addMinutes(currentDate, 1);
    }

    return filledData;
  }, [data, globalStartDate, globalEndDate]);

  const tickFormatter = (time: number) => {
    const date = new Date(time);
    return isValid(date) ? format(date, 'MM-dd HH:mm') : '';
  };

  const handleBrushChange = (domain: any) => {
    if (domain && domain.startIndex !== undefined && domain.endIndex !== undefined) {
      const startTime = chartData[domain.startIndex].time;
      const endTime = chartData[domain.endIndex].time;
      setLocalBrushDomain([startTime, endTime]);
    } else {
      setLocalBrushDomain(null);
    }
  };

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8">
      <h2 className="text-xl font-bold mb-4">Sleep Stages</h2>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={[globalStartDate.getTime(), globalEndDate.getTime()]}
            tickFormatter={tickFormatter}
          />
          <YAxis
            domain={[0, 6]}
            ticks={[0, 1, 2, 3, 4, 5, 6]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="stepAfter" dataKey="stage" stroke="#8884d8" fill="#8884d8" />
          <Brush
            dataKey="time"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            startIndex={localBrushDomain ? chartData.findIndex(d => d.time >= localBrushDomain[0]) : undefined}
            endIndex={localBrushDomain ? chartData.findIndex(d => d.time >= localBrushDomain[1]) : undefined}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SleepChart;

