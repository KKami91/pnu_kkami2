import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, addHours, subHours } from 'date-fns';

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
    console.log('Combining data...');
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string, adjustTime: boolean = true) => {
      if (!Array.isArray(data)) {
        console.error(`Invalid data for ${key}: expected array, got`, data);
        return;
      }
      console.log(`Processing ${key} data, length:`, data.length);
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          let timestamp = new Date(item.ds).getTime();
          if (adjustTime) {
            timestamp = subHours(new Date(timestamp), 9).getTime();
          }
          if (!dataMap.has(timestamp)) {
            dataMap.set(timestamp, { timestamp });
          }
          const value = item[key];
          if (typeof value === 'number') {
            dataMap.get(timestamp)![key] = value;
          }
        }
      });
    };

    // MongoDB 데이터 처리 (시간 조정)
    processData(bpmData, 'bpm', true);
    processData(stepData, 'step', true);
    processData(calorieData, 'calorie', true);

    // 예측 및 HRV 데이터 처리 (시간 조정 없음)
    processData(predictMinuteData, 'min_pred_bpm', false);
    processData(predictHourData, 'hour_pred_bpm', false);

    hrvHourData.forEach(item => {
      const timestamp = new Date(item.ds).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp });
      }
      dataMap.get(timestamp)!.hour_rmssd = item.hour_rmssd;
      dataMap.get(timestamp)!.hour_sdnn = item.hour_sdnn;
    });

    const result = Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    console.log('Combined data sample:', result.slice(0, 5));
    console.log('Combined data length:', result.length);
    return result;
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
      const hourlyData = combinedData.reduce((acc: any[], item: any) => {
        const hourKey = format(new Date(item.timestamp), 'yyyy-MM-dd HH:00:00');
        const existingHour = acc.find(h => h.timestamp === new Date(hourKey).getTime());
        
        if (existingHour) {
          Object.keys(item).forEach(key => {
            if (typeof item[key] === 'number') {
              if (key === 'bpm' || key === 'min_pred_bpm') {
                existingHour[key] = (existingHour[key] || 0) + item[key];
                existingHour[`${key}Count`] = (existingHour[`${key}Count`] || 0) + 1;
              } else {
                existingHour[key] = Math.max(existingHour[key] || 0, item[key]);
              }
            }
          });
        } else {
          acc.push({
            ...item,
            timestamp: new Date(hourKey).getTime(),
            bpmCount: item.bpm ? 1 : 0,
            min_pred_bpmCount: item.min_pred_bpm ? 1 : 0,
          });
        }
        return acc;
      }, []);

      return hourlyData.map(item => ({
        ...item,
        bpm: item.bpmCount ? item.bpm / item.bpmCount : null,
        min_pred_bpm: item.min_pred_bpmCount ? item.min_pred_bpm / item.min_pred_bpmCount : null,
      }));
    }
    return combinedData;
  }, [combinedData, timeUnit]);

  const displayData = useMemo(() => {
    let filteredData = processedData;
    
    if (filteredData.length > 0) {
      // 가장 최근 데이터의 타임스탬프 찾기
      const latestTimestamp = Math.max(...filteredData.map(item => item.timestamp));
      const latestDate = new Date(latestTimestamp);
      
      // 7일 전의 날짜 계산 (시간, 분, 초는 0으로 설정)
      const sevenDaysAgo = subDays(latestDate, 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      console.log('Latest date:', format(latestDate, 'yyyy-MM-dd HH:mm:ss'));
      console.log('Seven days ago:', format(sevenDaysAgo, 'yyyy-MM-dd HH:mm:ss'));

      // 7일치 데이터만 필터링
      filteredData = filteredData.filter(item => item.timestamp >= sevenDaysAgo.getTime());
    }

    if (brushDomain) {
      filteredData = filteredData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    console.log('Display data length:', filteredData.length);
    console.log('Display data sample:', filteredData.slice(0, 5));
    
    // 데이터의 시간 범위 로깅
    if (filteredData.length > 0) {
      const startDate = new Date(filteredData[0].timestamp);
      const endDate = new Date(filteredData[filteredData.length - 1].timestamp);
      console.log('Data range:', format(startDate, 'yyyy-MM-dd HH:mm'), 'to', format(endDate, 'yyyy-MM-dd HH:mm'));
    }

    return filteredData;
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
    const date = new Date(time);
    return format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
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
        <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            label={{ value: 'BPM / HRV', angle: -90, position: 'insideLeft' }} 
            domain={[0, 'dataMax']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            label={{ value: 'Steps / Calories', angle: 90, position: 'insideRight' }} 
            domain={[0, 'dataMax']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {visibleCharts.calorie && (
            <Bar yAxisId="right" dataKey="calorie" fill="rgba(136, 132, 216, 0.6)" name="Calories" />
          )}
          {visibleCharts.step && (
            <Bar yAxisId="right" dataKey="step" fill="rgba(130, 202, 157, 0.6)" name="Steps" />
          )}
          {visibleCharts.bpm && (
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke="#ff7300" name="BPM" dot={false} />
          )}
          {visibleCharts.pred_bpm && timeUnit === 'minute' && (
            <Line yAxisId="left" type="monotone" dataKey="min_pred_bpm" stroke="#A0D283" name="Predicted BPM (Minute)" dot={false} />
          )}
          {visibleCharts.pred_bpm && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_pred_bpm" stroke="#82ca9d" name="Predicted BPM (Hour)" dot={false} />
          )}
          {visibleCharts.rmssd && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_rmssd" stroke="#8884d8" name="RMSSD" dot={false} />
          )}
          {visibleCharts.sdnn && timeUnit === 'hour' && (
            <Line yAxisId="left" type="monotone" dataKey="hour_sdnn" stroke="#82ca9d" name="SDNN" dot={false} />
          )}
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