import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface CombinedChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

interface ProcessedDataItem {
  timestamp: number;
  bpm: number | null;
  step: number | null;
  calorie: number | null;
  min_pred_bpm: number | null;
  hour_pred_bpm: number | null;
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
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

  const combinedData = useMemo(() => {
    const dataMap = new Map<number, ProcessedDataItem>();
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7).getTime();

    const processData = (data: any[], key: string) => {
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          const date = parseISO(item.ds);
          const timestamp = date.getTime();
          if (timestamp >= sevenDaysAgo) {
            if (!dataMap.has(timestamp)) {
              dataMap.set(timestamp, { 
                timestamp, 
                bpm: null, 
                step: null, 
                calorie: null, 
                min_pred_bpm: null,
                hour_pred_bpm: null
              });
            }
            const value = item[key];
            if (typeof value === 'number') {
              (dataMap.get(timestamp) as any)[key] = value;
            }
          }
        }
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');
    processData(predictMinuteData, 'min_pred_bpm');
    // Assuming predictHourData is available and contains 'hour_pred_bpm'
    // processData(predictHourData, 'hour_pred_bpm');

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, predictMinuteData]);

  const processedData = useMemo(() => {
    if (timeUnit === 'hour') {
      const hourlyData: { [key: string]: ProcessedDataItem } = {};
      
      combinedData.forEach(item => {
        const hourKey = format(new Date(item.timestamp), 'yyyy-MM-dd HH:00:00');
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { 
            timestamp: new Date(hourKey).getTime(),
            bpm: null,
            step: null,
            calorie: null,
            min_pred_bpm: null,
            hour_pred_bpm: null
          };
        }
        
        ['bpm', 'step', 'calorie', 'min_pred_bpm', 'hour_pred_bpm'].forEach((key) => {
          const value = (item as any)[key];
          if (value !== null) {
            if (key === 'bpm' || key === 'min_pred_bpm' || key === 'hour_pred_bpm') {
              hourlyData[hourKey][key as keyof ProcessedDataItem] = 
                ((hourlyData[hourKey][key as keyof ProcessedDataItem] as number || 0) + value) as any;
            } else {
              hourlyData[hourKey][key as keyof ProcessedDataItem] = 
                ((hourlyData[hourKey][key as keyof ProcessedDataItem] as number || 0) + value) as any;
            }
          }
        });
      });

      return Object.values(hourlyData).map(item => ({
        ...item,
        bpm: item.bpm !== null ? item.bpm / combinedData.filter(d => d.timestamp >= item.timestamp && d.timestamp < item.timestamp + 3600000).length : null,
        min_pred_bpm: item.min_pred_bpm !== null ? item.min_pred_bpm / combinedData.filter(d => d.timestamp >= item.timestamp && d.timestamp < item.timestamp + 3600000).length : null,
        hour_pred_bpm: item.hour_pred_bpm
      }));
    }
    return combinedData;
  }, [combinedData, timeUnit]);

  const filteredData = useMemo(() => {
    if (!brushDomain) return processedData;
    return processedData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [processedData, brushDomain]);

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
    return format(new Date(time), timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {`${pld.name}: ${pld.value !== null ? pld.value.toFixed(2) : 'N/A'}`}
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
    pred_bpm_minute: '#A0D283',
    pred_bpm_hour: '#82ca9d',
  };

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
        <div>
          <button
            onClick={() => setTimeUnit('minute')}
            className={`px-4 py-2 rounded mr-2 ${timeUnit === 'minute' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Minute
          </button>
          <button
            onClick={() => setTimeUnit('hour')}
            className={`px-4 py-2 rounded ${timeUnit === 'hour' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Hour
          </button>
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
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
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
            <>
              <Line yAxisId="left" type="monotone" dataKey="min_pred_bpm" stroke={colors.pred_bpm_minute} name="Predicted BPM (Minute)" dot={false} />
              {timeUnit === 'hour' && <Line yAxisId="left" type="monotone" dataKey="hour_pred_bpm" stroke={colors.pred_bpm_hour} name="Predicted BPM (Hour)" dot={false} />}
            </>
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