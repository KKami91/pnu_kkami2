import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, subHours, startOfDay, endOfDay, addHours, addDays, startOfHour } from 'date-fns';

interface CombinedChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
  hrvHourData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

type ChartVisibility = {
  calorie: boolean;
  step: boolean;
  bpm: boolean;
  pred_bpm: boolean;
  rmssd: boolean;
  sdnn: boolean;
};

const CombinedChart: React.FC<CombinedChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  predictHourData,
  hrvHourData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    calorie: true,
    step: true,
    bpm: true,
    pred_bpm: true,
    rmssd: true,
    sdnn: true,
  });

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const combinedData = useMemo(() => {
    // 모든 데이터를 timestamp 기준으로 결합
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string) => {
      data.forEach(item => {
        const timestamp = new Date(item.ds).getTime();
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp });
        }
        dataMap.get(timestamp)[key] = item[key];
      });
    };

    processData(bpmData, 'bpm');
    processData(stepData, 'step');
    processData(calorieData, 'calorie');
    processData(predictMinuteData, 'min_pred_bpm');
    processData(predictHourData, 'hour_pred_bpm');
    processData(hrvHourData, 'hour_rmssd');
    processData(hrvHourData, 'hour_sdnn');

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData, hrvHourData]);

  const filteredData = useMemo(() => {
    if (timeUnit === 'minute') {
      const oneWeekAgo = subHours(new Date(), 24 * 7).getTime();
      return combinedData.filter(item => item.timestamp >= oneWeekAgo);
    }
    return combinedData;
  }, [combinedData, timeUnit]);

  const processedData = useMemo(() => {
    console.log('Processing data for time unit:', timeUnit);
    if (timeUnit === 'hour') {
      const hourlyData = new Map<number, any>();

      const processHourlyData = (data: any[], key: string) => {
        data.forEach(item => {
          const hourTimestamp = startOfHour(new Date(item.timestamp)).getTime();
          if (!hourlyData.has(hourTimestamp)) {
            hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
          }
          const hourData = hourlyData.get(hourTimestamp);
          
          if (key === 'bpm' || key === 'min_pred_bpm') {
            if (!hourData[key]) {
              hourData[key] = { sum: 0, count: 0 };
            }
            hourData[key].sum += item[key];
            hourData[key].count++;
          } else {
            hourData[key] = (hourData[key] || 0) + item[key];
          }
        });
      };

      processHourlyData(combinedData, 'bpm');
      processHourlyData(combinedData, 'step');
      processHourlyData(combinedData, 'calorie');
      processHourlyData(combinedData, 'min_pred_bpm');

      // HRV 데이터 처리 (이미 시간별 데이터)
      hrvHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_rmssd = item.hour_rmssd;
        hourData.hour_sdnn = item.hour_sdnn;
      });

      // 시간별 예측 데이터 처리
      predictHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_pred_bpm = item.hour_pred_bpm;
      });

      return Array.from(hourlyData.values()).map(hourData => ({
        ...hourData,
        bpm: hourData.bpm ? hourData.bpm.sum / hourData.bpm.count : null,
        min_pred_bpm: hourData.min_pred_bpm ? hourData.min_pred_bpm.sum / hourData.min_pred_bpm.count : null,
      }));
    }
    return combinedData;
  }, [combinedData, timeUnit, hrvHourData, predictHourData]);

  const displayData = useMemo(() => {
    if (combinedData.length === 0) return [];

    const lastPredictTimestamp = Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()));
    const startDate = startOfDay(subDays(new Date(lastPredictTimestamp), timeUnit === 'minute' ? 6 : 29));

    return combinedData.filter(item => item.timestamp >= startDate.getTime());
  }, [combinedData, predictMinuteData, timeUnit]);

  const xAxisDomain = useMemo(() => {
    if (displayData.length === 0) return ['dataMin', 'dataMax'];

    const startTimestamp = displayData[0].timestamp;
    const endTimestamp = displayData[displayData.length - 1].timestamp;

    return [startTimestamp, endOfDay(new Date(endTimestamp)).getTime()];
  }, [displayData]);

  const handleBrushChange = useCallback((domain: any) => {
    if (domain && domain.length === 2) {
      setBrushDomain(domain);
      onBrushChange(domain);
    } else {
      setBrushDomain(null);
      onBrushChange(null);
    }
  }, [onBrushChange]);

  const formatDateForDisplay = (time: number) => {
    const date = new Date(time);
    return format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  const visibleData = useMemo(() => {
    if (!brushDomain) return displayData;
    return displayData.filter(item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]);
  }, [displayData, brushDomain]);

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
              {`${pld.name}: ${pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  pld.value.toFixed(0) : pld.value.toFixed(2)) 
                : 'N/A'}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const colors = {
    calorie: 'rgba(136, 132, 216, 0.6)',
    step: 'rgba(130, 202, 157, 0.6)',
    bpm: '#ff7300',
    pred_bpm_minute: '#A0D283',
    pred_bpm_hour: '#82ca9d',
    rmssd: '#8884d8',
    sdnn: '#82ca9d',
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
                onChange={() => setVisibleCharts(prev => ({...prev, [chartName]: !prev[chartName]}))}
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
        <ComposedChart data={visibleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={xAxisDomain}
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'BPM / HRV', angle: -90, position: 'insideLeft' }} 
            domain={[0, 'auto']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            scale="log"
            domain={[1, 'auto']}
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="right" dataKey="calorie" fill="rgba(136, 132, 216, 0.6)" name="Calories" barSize={timeUnit === 'minute' ? 4 : 15} />
          <Bar yAxisId="right" dataKey="step" fill="rgba(130, 202, 157, 0.6)" name="Steps" barSize={timeUnit === 'minute' ? 4 : 15} />
          <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#ff7300" name="BPM" dot={false} />
          {timeUnit === 'minute' && (
            <Line yAxisId="left" type="monotone" dataKey="min_pred_bpm" stroke="#A0D283" name="Predicted BPM (Minute)" dot={false} />
          )}
          {timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_pred_bpm" stroke="#82ca9d" name="Predicted BPM (Hour)" dot={false} />
          )}
          <Line yAxisId="left" type="monotone" dataKey="hour_rmssd" stroke="#8884d8" name="RMSSD" dot={false} />
          <Line yAxisId="left" type="monotone" dataKey="hour_sdnn" stroke="#ffc658" name="SDNN" dot={false} />
          <Brush
            dataKey="timestamp"
            height={30}
            stroke="#8884d8"
            onChange={handleBrushChange}
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CombinedChart;