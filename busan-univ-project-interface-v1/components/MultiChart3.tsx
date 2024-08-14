import React, { useState, useCallback, useMemo } from 'react';
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO } from 'date-fns';

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  pred_bpm?: number;
  pred_rmssd?: number;
  data?: number;
}

interface DataBPM {
  ds: string;
  bpm: number | null;
}

interface DataStep {
  ds: string;
  step: number | null;
}

interface DataCalorie {
  ds: string;
  calorie: number | null;
}

interface DataSleep {
  ds_start: string;
  ds_end: string;
  stage: number | null;
}

interface DataFeature {
  ds: string;
  rmssd: number | null;
  sdnn: number | null;
}

interface DataPrediction {
  ds: string;
  pred_bpm: number | null;
}

interface PredictionResponse {
  min_pred_bpm: DataPrediction[];
  hour_pred_bpm: DataPrediction[];
  day_pred_bpm: DataPrediction[];
}

interface FeatureResponse {
  hour_hrv: DataFeature[];
  day_hrv: DataFeature[];
}

interface MultiChartProps {
  data: DataItem[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const MultiChart: React.FC<MultiChartProps> = ({
  data,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [columnCount, setColumnCount] = useState(1);

  const filteredData = useMemo(() => {
    if (!brushDomain) return data;
    return data.filter(
      item => {
        const itemTime = new Date(item.ds).getTime();
        return itemTime >= brushDomain[0] && itemTime <= brushDomain[1];
      }
    );
  }, [data, brushDomain]);

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
              {`${pld.name}: ${pld.value !== null ? 
                (pld.name === 'SDNN' || pld.name === 'RMSSD' || pld.name === 'Predicted RMSSD' ? Number(pld.value).toFixed(2) : pld.value)
                : 'N/A'}`}
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
            dataKey="ds" 
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
    { key: 'pred_bpm', color: '#FF5733', label: 'Predicted BPM', type: LineChart },
    { key: 'sdnn', color: '#0088FE', label: 'SDNN (ms)', type: LineChart },
    { key: 'rmssd', color: '#00C49F', label: 'RMSSD (ms)', type: LineChart },
    { key: 'pred_rmssd', color: '#82ca9d', label: 'Predicted RMSSD (ms)', type: LineChart },
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
      </div>
      <div style={{ height: '100px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} syncId="healthMetrics">
            <XAxis 
              dataKey="ds" 
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
            />
            <Brush 
              dataKey="ds" 
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