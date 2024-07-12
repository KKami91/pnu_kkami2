import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, TooltipProps } from 'recharts';
import { format, parseISO, addHours, isValid } from 'date-fns';
import { HelpCircle } from 'lucide-react';

interface DataItem {
  ds: string;
  sdnn: number | null;
  rmssd: number | null;
}

interface AnalysisChartProps {
  data: DataItem[];
}

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-bold text-black">{`Date: ${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-black">
            {`${entry.name}: ${entry.value != null ? Number(entry.value).toFixed(2) : 'N/A'} ms`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ExplanationTooltip: React.FC<{ content: string }> = ({ content }) => (
  <div className="absolute z-10 p-2 bg-white border border-gray-300 rounded shadow" style={{ width: '300px', left: '25px', top: '-5px' }}>
    <p className="text-sm text-black whitespace-pre-line">{content}</p>
  </div>
);

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
  const [showSDNNExplanation, setShowSDNNExplanation] = useState(false);
  const [showRMSSDExplanation, setShowRMSSDExplanation] = useState(false);

  const formattedData = useMemo(() => {
    const sortedData = [...data].sort((a, b) => new Date(a.ds).getTime() - new Date(b.ds).getTime());
    const filledData: DataItem[] = [];

    for (let i = 0; i < sortedData.length; i++) {
      const currentDate = new Date(sortedData[i].ds);
      filledData.push({
        ...sortedData[i],
        ds: format(currentDate, 'yyyy-MM-dd HH:mm'),
      });

      if (i < sortedData.length - 1) {
        const nextDate = new Date(sortedData[i + 1].ds);
        let currentHour = addHours(currentDate, 1);

        while (currentHour < nextDate) {
          filledData.push({
            ds: format(currentHour, 'yyyy-MM-dd HH:mm'),
            sdnn: null,
            rmssd: null,
          });
          currentHour = addHours(currentHour, 1);
        }
      }
    }

    return filledData.filter(item => isValid(parseISO(item.ds)));
  }, [data]);

  const handleBrushChange = (newDomain: any) => {
    if (Array.isArray(newDomain) && newDomain.length === 2) {
      setBrushDomain(newDomain as [number, number]);
    }
  };

  const renderChart = (
    chartData: DataItem[],
    title: string,
    dataKey: keyof DataItem,
    color: string,
    syncId: string,
    showBrush: boolean,
    explanation: string,
    showExplanation: boolean,
    setShowExplanation: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    return (
      <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow-lg mb-8 relative">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-bold text-black mr-2">{title}</h2>
          <div
            className="relative"
            onMouseEnter={() => setShowExplanation(true)}
            onMouseLeave={() => setShowExplanation(false)}
          >
            <HelpCircle size={18} className="text-gray-500 cursor-help" />
            {showExplanation && <ExplanationTooltip content={explanation} />}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 35 }}
            syncId={syncId}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="ds"
              tick={{ fill: '#666', fontSize: 10 }}
              tickFormatter={(tick) => format(new Date(tick), 'MM-dd HH:mm')}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#666', fontSize: 12 }}
              label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#666' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="linear"
              dataKey={dataKey}
              stroke={color}
              name={dataKey.toUpperCase()}
              dot={{ r: 3, strokeWidth: 1 }}
              strokeWidth={2}
              connectNulls={false}
            />
            {showBrush && (
              <Brush
                dataKey="ds"
                height={30}
                stroke={color}
                onChange={handleBrushChange}
                startIndex={brushDomain ? brushDomain[0] : undefined}
                endIndex={brushDomain ? brushDomain[1] : undefined}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const sdnnExplanation = "* 전체적인 HRV를 나타내는 지표로써, 장기간의 기록에서 모든 주기성을 반영\n\n* SDNN이 높다면 전반적인 자율신경계의 변동성이 크다는 것을 의미, 건강한 심장 기능과 관련이 있습니다.\n\n* SDNN이 낮다면 자율신경계의 변동성이 낮아 스트레스에 취약할 수 있습니다. 또한, 종종 심혈관 질환과 연관이 있습니다.";
  const rmssdExplanation = "* 단기 HRV를 반영하며, 주로 보교감 신경계의 활동을 나타냄\n\nRMSSD가 높다면 부교감신경의 활성도가 높다는 것을 의미, 일반적으로 좋은 회복 능력과 관련이 있습니다.\n\n* RMSSD가 낮다면 부교감신경의 활성도가 낮아 스트레스,피로,우울증이 있을 수 있습니다.";

  return (
    <div>
      {renderChart(formattedData, "SDNN : 정상 심박 간격(NN intervals)의 표준편차", "sdnn", "#8884d8", "sync", true, sdnnExplanation, showSDNNExplanation, setShowSDNNExplanation)}
      {renderChart(formattedData, "RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균", "rmssd", "#82ca9d", "sync", false, rmssdExplanation, showRMSSDExplanation, setShowRMSSDExplanation)}
    </div>
  );
};

export default AnalysisChart;