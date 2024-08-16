import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface MultiChartProps {
  bpmData: any[];
  stepData: any[];
  calorieData: any[];
  predictMinuteData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const MultiChart: React.FC<MultiChartProps> = ({
  bpmData,
  stepData,
  calorieData,
  predictMinuteData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
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
          const timestamp = parseISO(item.ds).getTime();
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

    return Array.from(dataMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [bpmData, stepData, calorieData, predictMinuteData]);

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
    return format(new Date(time), 'yyyy-MM-dd HH:mm');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold" style={{ color: '#ff7300', fontWeight: 'bold' }}>
            {format(new Date(label), 'yyyy-MM-dd HH:mm')}
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

  const renderChart = (dataKey: string, color: string, yAxisLabel: string, ChartType: typeof LineChart | typeof BarChart = LineChart) => (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartType data={filteredData} syncId="healthMetrics">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            scale="time" 
            domain={['dataMin', 'dataMax']}
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
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
            <Line type="monotone" dataKey={dataKey} stroke={color} dot={false} />
          ) : (
            <Bar dataKey={dataKey} fill={color} />
          )}
        </ChartType>
      </ResponsiveContainer>
    </div>
  );

  const charts = [
    { key: 'bpm', color: '#ff7300', label: 'BPM', type: LineChart },
    { key: 'min_pred_bpm', color: '#FF5733', label: 'Predicted BPM', type: LineChart },
    { key: 'step', color: 'rgba(130, 202, 157, 0.6)', label: 'Steps', type: BarChart },
    { key: 'calorie', color: 'rgba(136, 132, 216, 0.6)', label: 'Calories', type: BarChart },
  ];

  if (combinedData.length === 0) {
    return <div className="text-center text-red-500">No data available for the charts.</div>;
  }

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
          <LineChart data={combinedData} syncId="healthMetrics">
            <XAxis 
              dataKey="timestamp" 
              type="number" 
              scale="time" 
              domain={['dataMin', 'dataMax']}
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
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