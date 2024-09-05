import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine, TooltipProps } from 'recharts';
import { format, subDays, addDays, startOfDay, endOfDay, startOfHour, subHours, max, min, startOfMonth, endOfMonth, addMinutes, startOfMinute, isBefore } from 'date-fns';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MultiChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  sleepData: any[];
  predictMinuteData: any[];
  predictHourData: any[];
  hrvHourData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

interface SleepData {
  ds_start: string;
  ds_end: string;
  stage: number | null;
}

type DateRange = '1' | '7' | '15' | '30' | 'all';


const MultiChart: React.FC<MultiChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  sleepData,
  predictMinuteData,
  predictHourData,
  hrvHourData,
  onBrushChange,
}) => {
  const [timeUnit, setTimeUnit] = useState<'minute' | 'hour'>('hour');
  const [dateRange, setDateRange] = useState<DateRange>('7');
  const [columnCount, setColumnCount] = useState(1);
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const adjustTimeZone = (date: Date) => {
    return subHours(date, 9);
  };

  const mapSleepStage = (stage: number | null): number => {
    switch(stage) {
      case 1: return -1;
      case 2: return -1.5;
      case 3: return 0;
      case 4: return -2;
      case 5: return -3;
      case 6: return -2.5;
      default: return 0;
    }
  };

  const sleepStageConfig = {
    0: { color: '#808080', label: 'Unused' },
    '-1': { color: '#FFA500', label: 'Awake' },
    '-1.5': { color: '#90EE90', label: 'Light1' },
    '-2': { color: '#32CD32', label: 'Light2' },
    '-2.5': { color: '#4169E1', label: 'REM' },
    '-3': { color: '#000080', label: 'Deep' },
  };

  const getSleepStageLabel = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'Unknown';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.label || 'Unknown';
  };

  const getSleepStageColor = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '#000000';
    const stage = value.toString() as keyof typeof sleepStageConfig;
    return sleepStageConfig[stage]?.color || '#000000';
  };

  const renderSleepStageChart = () => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filteredData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={formatDateForDisplay}
          />
          <YAxis 
            label={{ value: '', angle: -90, position: 'insideLeft' }} 
            domain={[-3.5, 0]}
            ticks={[-3, -2.5, -2, -1.5, -1, 0]}
            tickFormatter={(value) => getSleepStageLabel(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="stepAfter"
            dataKey="sleep_stage"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Sleep Stage"
          />
          {Object.entries(sleepStageConfig).map(([stage, config]) => (
            <ReferenceLine key={stage} stroke={config.color} strokeDasharray="3 3" label={config.label} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const processSleepData = (sleepData: SleepData[]) => {
    const processedData: { timestamp: number; sleep_stage: number }[] = [];
    
    sleepData.forEach((item, index) => {
      let start = new Date(item.ds_start);
      const end = new Date(item.ds_end);

      if (start.getSeconds() >= 30) {
        start = addMinutes(startOfMinute(start), 1);
      } else {
        start = startOfMinute(start);
      }

      let currentTime = start;

      while (isBefore(currentTime, end)) {
        const timestamp = adjustTimeZone(currentTime).getTime();

        if (index < sleepData.length - 1) {
          const nextItem = sleepData[index + 1];
          let nextStart = new Date(nextItem.ds_start);

          if (nextStart.getSeconds() >= 30) {
            nextStart = addMinutes(startOfMinute(nextStart), 1);
          } else {
            nextStart = startOfMinute(nextStart);
          }

          if (currentTime >= nextStart) {
            processedData.push({
              timestamp,
              sleep_stage: mapSleepStage(nextItem.stage),
            });
            currentTime = addMinutes(currentTime, 1);
            continue;
          }
        }
        processedData.push({
          timestamp,
          sleep_stage: mapSleepStage(item.stage),
        });

        currentTime = addMinutes(currentTime, 1);
      }
    });
    return processedData;
  };

  const dataRange = useMemo(() => {
    const allDates = [
      ...bpmData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
      ...stepData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
      ...calorieData.map(item => adjustTimeZone(new Date(item.ds)).getTime()),
    ];

    const start = startOfDay(new Date(Math.min(...allDates)));
    const end = endOfDay(new Date(Math.max(...allDates)));
    const minuteEnd = endOfDay(new Date(Math.max(...predictMinuteData.map(item => new Date(item.ds).getTime()))));
    const hourEnd = endOfDay(new Date(Math.max(...predictHourData.map(item => new Date(item.ds).getTime()))));

    return { start, end, minuteEnd, hourEnd };
  }, [bpmData, stepData, calorieData, predictMinuteData, predictHourData]);

  const calculateDateWindow = useCallback((range: DateRange, referenceDate: Date) => {
    const relevantEnd = timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd;
    let start: Date, end: Date;

    switch (range) {
      case '1':
        end = min([endOfDay(referenceDate), relevantEnd]);
        start = startOfDay(end);
        break;
      case '7':
        end = min([endOfDay(addDays(referenceDate, 6)), relevantEnd]);
        start = startOfDay(subDays(end, 6));
        break;
      case '15':
        end = min([endOfDay(addDays(startOfMonth(referenceDate), 14)), relevantEnd]);
        start = startOfMonth(end);
        break;
      case '30':
        end = min([endOfMonth(referenceDate), relevantEnd]);
        start = startOfMonth(end);
        break;
      case 'all':
        start = dataRange.start;
        end = relevantEnd;
        break;
      default:
        start = startOfDay(referenceDate);
        end = endOfDay(referenceDate);
    }

    start = max([start, dataRange.start]);
    end = min([end, relevantEnd]);

    return { start, end };
  }, [dataRange, timeUnit]);

  const [dateWindow, setDateWindow] = useState(() => calculateDateWindow(dateRange, dataRange.minuteEnd));

  useEffect(() => {
    setDateWindow(calculateDateWindow(dateRange, timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd));
  }, [dateRange, dataRange, calculateDateWindow, timeUnit]);

  const handleDateNavigation = (direction: 'forward' | 'backward') => {
    setBrushDomain(null);
    setDateWindow(prev => {
      let newReferenceDate: Date;
      switch (dateRange) {
        case '1':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 1) : subDays(prev.start, 1);
          break;
        case '7':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 7) : subDays(prev.start, 7);
          break;
        case '15':
          if (prev.start.getDate() === 1) {
            newReferenceDate = direction === 'forward' ? addDays(prev.start, 15) : subDays(prev.start, 15);
          } else {
            newReferenceDate = direction === 'forward' ? addDays(prev.start, 15) : startOfMonth(prev.start);
          }
          break;
        case '30':
          newReferenceDate = direction === 'forward' ? addDays(prev.start, 30) : subDays(prev.start, 30);
          break;
        default:
          return prev;
      }
      const newWindow = calculateDateWindow(dateRange, newReferenceDate);
      
      if (newWindow.start < dataRange.start || newWindow.end > (timeUnit === 'minute' ? dataRange.minuteEnd : dataRange.hourEnd)) {
        return prev;
      }    
      return newWindow;
    });
  };

  const combinedData = useMemo(() => {
    const dataMap = new Map<number, any>();

    const processData = (data: any[], key: string, adjustTime: boolean = true) => {
      if (!Array.isArray(data)) {
        return;
      }
      data.forEach((item, index) => {
        if (item && typeof item.ds === 'string') {
          let timestamp = new Date(item.ds);
          if (adjustTime) {
            timestamp = adjustTimeZone(timestamp);
          }
          const timeKey = timestamp.getTime();
          if (!dataMap.has(timeKey)) {
            dataMap.set(timeKey, { timestamp: timeKey, id: `${key}-${index}` });
          }
          const value = item[key];
          if (typeof value === 'number') {
            dataMap.get(timeKey)![key] = value;
          }
        }
      });
    };

    processData(bpmData, 'bpm', true);
    processData(stepData, 'step', true);
    processData(calorieData, 'calorie', true);
    processData(predictMinuteData, 'min_pred_bpm', false);
    processData(predictHourData, 'hour_pred_bpm', false);

    const processedSleepData = processSleepData(sleepData);
    processedSleepData.forEach(item => {
      const timeKey = item.timestamp;
      if (!dataMap.has(timeKey)) {
        dataMap.set(timeKey, { timestamp: timeKey });
      }
      dataMap.get(timeKey)!.sleep_stage = item.sleep_stage;
    });

    hrvHourData.forEach((item, index) => {
      const timestamp = new Date(item.ds).getTime();
      if (!dataMap.has(timestamp)) {
        dataMap.set(timestamp, { timestamp, id: `hrv-${index}` });
      }
      dataMap.get(timestamp)!.hour_rmssd = item.hour_rmssd;
      dataMap.get(timestamp)!.hour_sdnn = item.hour_sdnn;
    });

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, sleepData, predictMinuteData, predictHourData, hrvHourData]);

  const processedData = useMemo(() => {
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

      hrvHourData.forEach(item => {
        const hourTimestamp = startOfHour(new Date(item.ds)).getTime();
        if (!hourlyData.has(hourTimestamp)) {
          hourlyData.set(hourTimestamp, { timestamp: hourTimestamp });
        }
        const hourData = hourlyData.get(hourTimestamp);
        hourData.hour_rmssd = item.hour_rmssd;
        hourData.hour_sdnn = item.hour_sdnn;
      });

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
    return processedData.filter(item => 
      item.timestamp >= dateWindow.start.getTime() && 
      item.timestamp <= dateWindow.end.getTime()
    );
  }, [processedData, dateWindow]);
  
  const filteredData = useMemo(() => {
    if (!brushDomain) return displayData;
    return displayData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [displayData, brushDomain]);

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

  const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const date = new Date(label as number);
      const currentChart = payload[0].dataKey as string;

      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(date, timeUnit === 'minute' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd HH:00')}
          </p>
          {payload.map((pld, index) => {
            if (pld.dataKey === currentChart || (currentChart === 'bpm' && (pld.dataKey === 'min_pred_bpm' || pld.dataKey === 'hour_pred_bpm'))) {
              let value = pld.value !== null ? 
                (pld.dataKey === 'step' || pld.dataKey === 'calorie' ? 
                  Number(pld.value).toFixed(0) : 
                  Number(pld.value).toFixed(2)) 
                : 'N/A';
              
              if (pld.dataKey === 'sleep_stage') {
                const sleepStage = pld.value as number;
                value = getSleepStageLabel(sleepStage);
                return (
                  <p key={`${pld.dataKey}-${index}`} style={{ color: getSleepStageColor(sleepStage) }}>
                    Sleep Stage: {value}
                  </p>
                );
              }           
              return (
                <p key={`${pld.dataKey}-${index}`} style={{ color: pld.color }}>
                  {`${pld.name}: ${value}`}
                </p>
              );
            }
            return null;
          })}
        </div>
      );
    }
    return null;
  };

  const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart, additionalProps = {}) => (
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
            tickFormatter={(value) => value.toFixed(1)}
            domain={dataKey === 'sleep_stage' ? [-3.5, 0.5] : ['auto', 'auto']}
            ticks={dataKey === 'sleep_stage' ? [-3, -2.5, -2, -1.5, -1] : undefined}
            scale={ChartType === BarChart ? 'log' : 'auto'}
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
          {dataKey === 'sleep_stage' && (
            <>
            <ReferenceLine y={0} stroke='lightgray' strokeDasharray='3 3' />
            <ReferenceLine y={-1} stroke='lightgray' strokeDasharray='3 3' />
            <ReferenceLine y={-2} stroke='lightgray' strokeDasharray='3 3' />
            <ReferenceLine y={-3} stroke='lightgray' strokeDasharray='3 3' />
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
  
  if (timeUnit === 'hour') {
    charts.push(
      { key: 'hour_rmssd', color: '#8884d8', label: 'RMSSD', type: LineChart },
      { key: 'hour_sdnn', color: '#82ca9d', label: 'SDNN', type: LineChart }
    );
  } else {
    charts.push({ key: 'sleep_stage', color: '#000000', label: 'Sleep Stage', type: LineChart })
  }
  
  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex items-center justify-between">
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
          <LineChart data={filteredData} syncId="healthMetrics">
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
            {chart.key === 'sleep_stage' ? renderSleepStageChart() : renderChart(chart.key, chart.color, chart.label, chart.type)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChart;