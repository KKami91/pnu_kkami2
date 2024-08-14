import React, { useState, useCallback, useMemo } from 'react';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { format, parseISO, subHours } from 'date-fns';

interface DataItem {
  ds: string;
  bpm?: number;
  step?: number;
  calorie?: number;
  rmssd?: number;
  sdnn?: number;
  pred_bpm?: number;
  pred_rmssd?: number;
}

interface CombinedChartProps {
  data: DataItem[];
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const CombinedChart: React.FC<CombinedChartProps> = ({
  data,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [visibleCharts, setVisibleCharts] = useState<{[key: string]: boolean}>({
    calorie: true,
    step: true,
    bpm: true,
    pred_bpm: true,
    sdnn: true,
    rmssd: true,
    pred_rmssd: true,
  });

  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

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

  const toggleChart = (chartName: string) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartName]: !prev[chartName]
    }));
  };

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
                (pld.name === 'SDNN' || pld.name === 'RMSSD' ? Number(pld.value).toFixed(2) : pld.value)
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
    pred_bpm: '#A0D283',                  
    sdnn: '#0088FE',                      
    rmssd: '#00C49F',                     
    pred_rmssd: '#B2c193'                 
  };

  return (
    <div className='bg-white p-4 rounded-lg shadow'>
      <div className="mb-4 flex flex-wrap gap-4 justify-between">
        <div>
          {Object.keys(visibleCharts).map((chartName) => (
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
      </div>
      <ResponsiveContainer width="100%" height={600}>
        <ComposedChart data={filteredData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="ds"
            type="category"
            tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
            padding={{ left: 30, right: 30 }}
          />
          <YAxis 
            yAxisId="left" 
            label={{ value: 'HRV (ms) / BPM', angle: -90, position: 'insideLeft' }} 
            tickFormatter={(value) => value.toFixed(0)}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            scale="log"
            domain={['auto', 'auto']}
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
            <Line yAxisId="left" type="monotone" dataKey="bpm" stroke={colors.bpm} name="BPM" />
          )}
          {visibleCharts.pred_bpm && (
            <Line yAxisId="left" type="monotone" dataKey="pred_bpm" stroke={colors.pred_bpm} name="Predicted BPM" />
          )}
          {visibleCharts.sdnn && (
            <Line yAxisId="left" type="monotone" dataKey="sdnn" stroke={colors.sdnn} name="SDNN" />
          )}
          {visibleCharts.rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="rmssd" stroke={colors.rmssd} name="RMSSD" />
          )}
          {visibleCharts.pred_rmssd && (
            <Line yAxisId="left" type="monotone" dataKey="pred_rmssd" stroke={colors.pred_rmssd} name="Predicted RMSSD" />
          )}
          <Brush
            dataKey="ds"
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