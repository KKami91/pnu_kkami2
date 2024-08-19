import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays, addDays, startOfDay, endOfDay, max, min } from 'date-fns';

interface MultiChartProps {
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

interface ProcessedDataItem {
  timestamp: number;
  bpm: number | null;
  step: number | null;
  calorie: number | null;
  min_pred_bpm: number | null;
  hour_pred_bpm: number | null;
}

type DateRange = '1' | '7' | '15' | '30' | 'all';

const MultiChart: React.FC<MultiChartProps> = ({
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
  const [dateRange, setDateRange] = useState<DateRange>('7');
  const [columnCount, setColumnCount] = useState(1);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const combinedData = useMemo(() => {
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

  const dataRange = useMemo(() => {
    const minuteEnd = new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime())));
    const hourEnd = new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime())));
    const allDates = combinedData.map(item => item.timestamp);

    return {
      start: new Date(Math.min(...allDates)),
      end: new Date(Math.max(...allDates)),
      minuteEnd,
      hourEnd,
    };
  }, [combinedData, predictMinuteData, predictHourData]);

  const [dateWindow, setDateWindow] = useState<{start: Date, end: Date}>(() => {
    const end = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
    const start = subDays(end, parseInt(dateRange) - 1);
    return { start, end };
  });

  useEffect(() => {
    const end = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
    const start = subDays(end, parseInt(dateRange) - 1);
    setDateWindow({ start, end });
  }, [timeUnit, dateRange, dataRange]);

  const handleDateNavigation = (direction: 'forward' | 'backward') => {
    const days = parseInt(dateRange);
    setDateWindow(prev => {
      let newStart: Date, newEnd: Date;
      const currentEnd = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
      if (direction === 'forward') {
        newEnd = min([addDays(prev.end, days), currentEnd]);
        newStart = subDays(newEnd, days - 1);
      } else {
        newStart = max([subDays(prev.start, days), dataRange.start]);
        newEnd = min([addDays(newStart, days - 1), currentEnd]);
      }
      return { start: newStart, end: newEnd };
    });
  };

  const displayData = useMemo(() => {
    let filteredData = combinedData;
    
    if (filteredData.length > 0) {
      console.log('Start date:', format(dateWindow.start, 'yyyy-MM-dd HH:mm:ss'));
      console.log('End date:', format(dateWindow.end, 'yyyy-MM-dd HH:mm:ss'));

      // 필터링 적용
      filteredData = filteredData.filter(item => 
        item.timestamp >= startOfDay(dateWindow.start).getTime() && 
        item.timestamp <= dateWindow.end.getTime()
      );
    }

    if (brushDomain) {
      filteredData = filteredData.filter(
        item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
      );
    }

    console.log('Display data length:', filteredData.length);
    console.log('Display data sample:', filteredData.slice(0, 5));
    
    return filteredData;
  }, [combinedData, dateWindow, brushDomain]);

  const xAxisDomain = useMemo(() => {
    return [dateWindow.start.getTime(), dateWindow.end.getTime()];
  }, [dateWindow]);

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

  const renderChart = (dataKey: keyof ProcessedDataItem, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartType data={displayData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={xAxisDomain}
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
        <div className="flex items-center">
          <button 
            onClick={() => handleDateNavigation('backward')}
            className="px-2 py-1 bg-blue-500 text-white rounded mr-2"
            disabled={dateRange === 'all' || dateWindow.start <= dataRange.start}
          >
            ←
          </button>
          <select
            value={timeUnit}
            onChange={(e) => setTimeUnit(e.target.value as 'minute' | 'hour')}
            className="mr-2 p-2 border rounded"
          >
            <option value="minute">Minute</option>
            <option value="hour">Hour</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="p-2 border rounded"
          >
            <option value="1">1 Day</option>
            <option value="7">7 Days</option>
            <option value="15">15 Days</option>
            <option value="30">30 Days</option>
            <option value="all">All Data</option>
          </select>
          <button 
            onClick={() => handleDateNavigation('forward')}
            className="px-2 py-1 bg-blue-500 text-white rounded ml-2"
            disabled={dateRange === 'all' || dateWindow.end >= (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)}
          >
            →
          </button>
        </div>
      </div>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={xAxisDomain}
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