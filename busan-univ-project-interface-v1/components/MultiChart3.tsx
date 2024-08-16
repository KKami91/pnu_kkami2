import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subDays } from 'date-fns';

interface MultiChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
  timeUnit: 'minute' | 'hour';
}

const MultiChart: React.FC<MultiChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
  timeUnit,
}) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [columnCount, setColumnCount] = useState(1);

  const combinedData = useMemo(() => {
    const dataMap = new Map();

    const processData = (data: any[], key: string) => {
      if (!Array.isArray(data)) {
        console.error(`Invalid data for ${key}: expected array, got`, data);
        return;
      }
      data.forEach(item => {
        if (item && typeof item.ds === 'string') {
          const date = parseISO(item.ds);
          const timestamp = date.getTime();
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
    if (timeUnit === 'hour') {
      processData(predictMinuteData, 'min_pred_bpm');
    }

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, predictMinuteData, timeUnit]);

  const filteredData = useMemo(() => {
    if (!brushDomain) return combinedData;
    return combinedData.filter(
      item => item.timestamp >= brushDomain[0] && item.timestamp <= brushDomain[1]
    );
  }, [combinedData, brushDomain]);

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
              {`${pld.name}: ${pld.value !== null ? pld.value : 'N/A'}`}
            </p>
          ))}
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
            tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
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
          {dataKey === 'bpm' && timeUnit === 'hour' && (
            <Line type="monotone" dataKey="min_pred_bpm" stroke="#A0D283" dot={false} name="Predicted BPM" />
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
      <div className="mb-4 flex justify-end items-center">
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
      </div>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={(tick) => format(new Date(tick), timeUnit === 'minute' ? 'MM-dd HH:mm' : 'MM-dd HH:00')}
            />
            <Brush 
              dataKey="timestamp" 
              height={30} 
              stroke="#8884d8" 
              onChange={handleBrushChange}
              tickFormatter={formatDateForBrush}
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
            {renderChart(chart.key, chart.color, chart.label, chart.type)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MultiChart;