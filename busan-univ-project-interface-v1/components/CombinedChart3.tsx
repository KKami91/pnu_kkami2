import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface CombinedChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
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
  predictHourData,
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

  useEffect(() => {
    console.log('Input data lengths:', {
      bpmData: bpmData.length,
      stepData: stepData.length,
      calorieData: calorieData.length,
      predictMinuteData: predictMinuteData.length,
      predictHourData: predictHourData.length
    });
    if (bpmData.length > 0) console.log('Sample bpmData:', bpmData[0]);
    if (stepData.length > 0) console.log('Sample stepData:', stepData[0]);
    if (calorieData.length > 0) console.log('Sample calorieData:', calorieData[0]);
    if (predictMinuteData.length > 0) console.log('Sample predictMinuteData:', predictMinuteData[0]);
    if (predictHourData.length > 0) console.log('Sample predictHourData:', predictHourData[0]);
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);

  const combinedData = useMemo(() => {
    console.log('Combining data...');
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string) => {
      if (!Array.isArray(data) || data.length === 0) {
        console.warn(`No data for ${key}`);
        return;
      }
      console.log(`Processing ${key} data, length:`, data.length);
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          let timestamp;
          try {
            timestamp = new Date(item.ds).getTime();
          } catch (error) {
            console.error(`Invalid date format for ${key}:`, item.ds);
            return;
          }
          if (!dataMap.has(timestamp)) {
            dataMap.set(timestamp, { timestamp });
          }
          const value = item[key];
          if (typeof value === 'number' && !isNaN(value)) {
            dataMap.get(timestamp)![key] = value;
          } else {
            console.warn(`Invalid value for ${key}:`, value);
          }
        } else {
          console.warn(`Invalid item format for ${key}:`, item);
        }
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');
    processData(predictMinuteData, 'min_pred_bpm');
    processData(predictHourData, 'hour_pred_bpm');

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    console.log('Combined data sample:', result.slice(0, 5));
    console.log('Combined data length:', result.length);
    return result;
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);

  const filteredData = useMemo(() => {
    const oneWeekAgo = subDays(new Date(), 7).getTime();
    const filtered = combinedData.filter(item => item.timestamp >= oneWeekAgo);
    console.log('Filtered data length:', filtered.length);
    console.log('Filtered data sample:', filtered.slice(0, 5));
    return filtered;
  }, [combinedData]);

  const processedData = useMemo(() => {
    console.log('Processing data for time unit:', timeUnit);
    if (timeUnit === 'hour') {
      const hourlyData: { [key: string]: any } = {};
      
      filteredData.forEach(item => {
        const date = new Date(item.timestamp);
        const hourKey = format(date, 'yyyy-MM-dd HH:00:00');
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { 
            timestamp: item.timestamp,
            bpm: 0,
            step: 0,
            calorie: 0,
            min_pred_bpm: 0,
            hour_pred_bpm: 0,
            count: 0
          };
        }
        
        ['bpm', 'step', 'calorie', 'min_pred_bpm', 'hour_pred_bpm'].forEach((key) => {
          if (item[key] !== null && item[key] !== undefined && !isNaN(item[key])) {
            hourlyData[hourKey][key] += item[key];
          }
        });
        hourlyData[hourKey].count++;
      });

      const result = Object.values(hourlyData).map(item => ({
        ...item,
        bpm: item.count > 0 ? item.bpm / item.count : null,
        min_pred_bpm: item.count > 0 ? item.min_pred_bpm / item.count : null,
        hour_pred_bpm: item.hour_pred_bpm,
      }));
      console.log('Processed hourly data sample:', result.slice(0, 5));
      console.log('Processed hourly data length:', result.length);
      return result;
    }
    console.log('Processed minute data sample:', filteredData.slice(0, 5));
    console.log('Processed minute data length:', filteredData.length);
    return filteredData;
  }, [filteredData, timeUnit]);

  const displayData = useMemo(() => {
    if (!brushDomain) return processedData;
    const brushedData = processedData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
    console.log('Display data length:', brushedData.length);
    console.log('Display data sample:', brushedData.slice(0, 5));
    return brushedData;
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

  const formatDateForDisplay = (time: number) => {
    //const kstDate = new Date(time + 9 * 60 * 60 * 1000);  // UTC to KST
    const kstDate = new Date(time);  // UTC to KST
    return format(kstDate, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      //const kstDate = new Date(label + 9 * 60 * 60 * 1000);  // UTC to KST
      const kstDate = new Date(label);  // UTC to KST
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(kstDate, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
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
        <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateForDisplay}
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
            <Line yAxisId="left" type="monotone" dataKey={timeUnit === 'minute' ? 'min_pred_bpm' : 'hour_pred_bpm'} 
                  stroke={timeUnit === 'minute' ? colors.pred_bpm_minute : colors.pred_bpm_hour} 
                  name={`Predicted BPM (${timeUnit === 'minute' ? 'Minute' : 'Hour'})`} 
                  dot={false} />
          )}
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={formatDateForDisplay}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;