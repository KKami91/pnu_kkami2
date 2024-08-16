import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, addHours } from 'date-fns';

interface CombinedChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

type ChartVisibility = {
  calorie: boolean;
  step: boolean;
  bpm: boolean;
  pred_bpm: boolean;
};

const CombinedChart: React.FC<CombinedChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    calorie: true,
    step: true,
    bpm: true,
    pred_bpm: true,
  });

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const combinedData = useMemo(() => {
    const dataMap = new Map();

    const processData = (data: any[], key: string) => {
      if (!Array.isArray(data)) {
        console.error(`Invalid data for ${key}: expected array, got`, data);
        return;
      }
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          let kstDate = parseISO(item.ds);
          
          // predict bpm 데이터의 경우 9시간을 더함
          if (key === 'min_pred_bpm') {
            kstDate = addHours(kstDate, 9);
          }
          
          // KST를 UTC로 변환 (9시간 빼기)
          const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
          const timestamp = utcDate.getTime();
          
          if (!dataMap.has(timestamp)) {
            dataMap.set(timestamp, { timestamp });
          }
          const value = item[key];
          dataMap.get(timestamp)[key] = value != null ? Number(value) : null;
        }
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');
    processData(predictMinuteData, 'min_pred_bpm');

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    console.log('Combined data points:', result.length);
    return result;
  }, [bpmData, stepData, calorieData, predictMinuteData]);

  const dateRange = useMemo(() => {
    if (combinedData.length === 0) return { start: new Date(), end: new Date() };
    const timestamps = combinedData.map(item => item.timestamp);
    return {
      start: new Date(Math.min(...timestamps)),
      end: new Date(Math.max(...timestamps)),
    };
  }, [combinedData]);

  const sevenDaysAgo = useMemo(() => {
    return subDays(dateRange.end, 7).getTime();
  }, [dateRange]);

  const filteredData = useMemo(() => {
    const sevenDayData = combinedData.filter(item => item.timestamp >= sevenDaysAgo);
    console.log('Filtered data points:', sevenDayData.length);
    return sevenDayData;
  }, [combinedData, sevenDaysAgo]);

  const handleBrushChange = useCallback((newBrushDomain: any) => {
    if (newBrushDomain && newBrushDomain.length === 2) {
      setBrushDomain(newBrushDomain);
      onBrushChange(newBrushDomain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const formatDateForBrush = (time: number) => {
    const date = new Date(time);
    return format(date, 'yyyy-MM-dd HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, 'yyyy-MM-dd HH:mm')}
          </p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value !== null ? pld.value : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const toggleChart = (chartName: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

  const colors = {
    calorie: 'rgba(136, 132, 216, 0.6)',
    step: 'rgba(130, 202, 157, 0.6)',
    bpm: '#ff7300',
    pred_bpm: '#A0D283',
  };

  if (filteredData.length === 0) {
    return (
      <div>
        <p>No data available for the last 7 days.</p>
        <p>Date range: {format(dateRange.start, 'yyyy-MM-dd')} to {format(dateRange.end, 'yyyy-MM-dd')}</p>
        <p>BPM data count: {bpmData.length}</p>
        <p>Step data count: {stepData.length}</p>
        <p>Calorie data count: {calorieData.length}</p>
        <p>Prediction data count: {predictMinuteData.length}</p>
      </div>
    );
  }

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex flex-wrap gap-4 justify-between">
        <div>
          {(Object.keys(visibleCharts) as Array<keyof ChartVisibility>).map((chartName) => (
            <label key={chartName} className="inline-flex items-center cursor-pointer mr-4">
              <input
                type="checkbox"
                checked={visibleCharts[chartName]}
                onChange={() => toggleChart(chartName)}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">{chartName.toUpperCase()}</span>
            </label>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'BPM', angle: -90, position: 'insideLeft' }} 
            tickFormatter={(value) => value.toFixed(0)}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            scale="log"
            tickFormatter={(value) => Math.round(value).toString()}
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill={colors.calorie} name="Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill={colors.step} name="Steps" />
          )}
          {visibleCharts.bpm && (
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke={colors.bpm} name="BPM" dot={false} />
          )}
          {visibleCharts.pred_bpm && (
            <Line yAxisId="left" type="monotone" dataKey="min_pred_bpm" stroke={colors.pred_bpm} name="Predicted BPM" dot={false} />
          )}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={formatDateForBrush}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;