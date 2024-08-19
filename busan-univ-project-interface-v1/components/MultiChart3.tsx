import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface MultiChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
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

const MultiChart: React.FC<MultiChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  predictHourData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [columnCount, setColumnCount] = useState(1);
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('minute');

  const combinedData = useMemo(() => {
    console.log('Combining data...');
    const dataMap = new Map<number, ProcessedDataItem>();

    const processData = (data: any[], key: string) => {
      if (!Array.isArray(data)) {
        console.error(`Invalid data for ${key}: expected array, got`, data);
        return;
      }
      console.log(`Processing ${key} data, length:`, data.length);
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          const kstDate = parseISO(item.ds);
          const utcDate = new Date(kstDate.getTime() - 9 * 60 * 60 * 1000);
          const timestamp = utcDate.getTime();
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
          const value = key.includes('pred') ? item[key] : item[key.replace('_pred', '')];
          if (typeof value === 'number') {
            (dataMap.get(timestamp) as any)[key] = value;
          }
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
    if (timeUnit === 'minute') {
      const oneWeekAgo = subDays(new Date(), 7).getTime();
      return combinedData.filter(item => item.timestamp >= oneWeekAgo);
    }
    return combinedData;
  }, [combinedData, timeUnit]);

  const processedData = useMemo(() => {
    console.log('Processing data for time unit:', timeUnit);
    if (timeUnit === 'hour') {
      const hourlyData: { [key: string]: ProcessedDataItem } = {};
      
      filteredData.forEach(item => {
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
                ((hourlyData[hourKey][key as keyof ProcessedDataItem] as number || 0) + value) / 2;
            } else {
              hourlyData[hourKey][key as keyof ProcessedDataItem] = 
                ((hourlyData[hourKey][key as keyof ProcessedDataItem] as number || 0) + value) as any;
            }
          }
        });
      });

      const result = Object.values(hourlyData);
      console.log('Processed hourly data sample:', result.slice(0, 5));
      return result;
    }
    console.log('Processed minute data sample:', filteredData.slice(0, 5));
    return filteredData;
  }, [filteredData, timeUnit]);

  const displayData = useMemo(() => {
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

  const formatDateForDisplay = (time: number) => {
    const kstDate = new Date(time + 9 * 60 * 60 * 1000);  // UTC to KST
    return format(kstDate, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const kstDate = new Date(label + 9 * 60 * 60 * 1000);  // UTC to KST
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

  const renderChart = (dataKey: keyof ProcessedDataItem, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartType data={filteredData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateForDisplay}
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
            tickFormatter={(value) => value.toFixed(0)}
            scale={ChartType === BarChart ? 'log' : 'auto'}
            domain={ChartType === BarChart ? ['auto', 'auto'] : undefined}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {ChartType === LineChart ? (
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} {...additionalProps} />
          ) : (
            <Bar dataKey={dataKey} fill={color} {...additionalProps} />
          )}
          {dataKey === 'bpm' && (
            <>
              {timeUnit === 'minute' && (
                <Line type="monotone" dataKey="min_pred_bpm" stroke="#A0D283" dot={false} name="Predicted BPM (Minute)" />
              )}
              {timeUnit === 'hour' && (
                <Line type="monotone" dataKey="hour_pred_bpm" stroke="#82ca9d" dot={false} name="Predicted BPM (Hour)" />
              )}
            </>
          )}
        </ChartType>
      </ResponsiveContainer>
    </div>
  );

  const charts = [
    { key: 'bpm', color: '#ff7300', label: 'BPM', type: LineChart },
    { key: 'step', color: 'rgba(130, 202, 157, 0.6)', label: 'Steps', type: BarChart },
    { key: 'calorie', color: 'rgba(136, 132, 216, 0.6)', label: 'Calories', type: BarChart },
  ];

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex justify-between items-center">
        <div>
          {[1, 2, 3].map(count => (
            <button
              key={count}
              onClick={() => setColumnCount(count)}
              className={`px-4 py-2 rounded ml-2 ${columnCount === count ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {count} Column{count !== 1 ? 's' : ''}
            </button>
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
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={processedData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatDateForDisplay}
            />
            <Brush 
              dataKey="timestamp" 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
              tickFormatter={formatDateForDisplay}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div 
        className={`grid gap-4`} 
        style={{ 
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gridAutoRows: `calc((100vh - 300px) / ${Math.ceil(charts.length / columnCount)})`
        }}
      >
        {charts.map(chart => (
          <div key={chart.key} className="w-full h-full">
            {renderChart(chart.key as keyof ProcessedDataItem, chart.color, chart.label, chart.type)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChart;