import React, { useState } from 'react';
import AnalysisChart from './AnalysisChart';
import SleepChart from './SleepChart';

interface GraphLayoutManagerProps {
  analysisData: any;
  predictionData: any;
  stepData: any;
  sleepData: any;
  globalStartDate: Date;
  globalEndDate: Date;
  onBrushChange: (domain: [number, number] | null) => void;
}

const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({
  analysisData,
  predictionData,
  stepData,
  sleepData,
  globalStartDate,
  globalEndDate,
  onBrushChange,
}) => {
  const [layoutType, setLayoutType] = useState<'separate' | 'combined'>('separate');
  const [columnsCount, setColumnsCount] = useState(1);
  const [visibleCharts, setVisibleCharts] = useState({
    sdnn: true,
    rmssd: true,
    step: true,
    bpm: true,
    sleep: true,
  });

  const toggleChart = (chartName: keyof typeof visibleCharts) => {
    setVisibleCharts(prev => ({ ...prev, [chartName]: !prev[chartName] }));
  };

  const renderSeparateCharts = () => {
    const charts = [
      visibleCharts.sdnn && (
        <AnalysisChart
          key="sdnn"
          data={analysisData}
          globalStartDate={globalStartDate}
          globalEndDate={globalEndDate}
          onBrushChange={onBrushChange}
          title="SDNN : 정상 심박 간격(NN intervals)의 표준편차"
          dataKey="sdnn"
        />
      ),
      visibleCharts.rmssd && (
        <AnalysisChart
          key="rmssd"
          data={analysisData}
          globalStartDate={globalStartDate}
          globalEndDate={globalEndDate}
          onBrushChange={onBrushChange}
          title="RMSSD : 연속된 정상 심박 간격(NN intervals)차이의 제곱근 평균"
          dataKey="rmssd"
        />
      ),
      visibleCharts.step && (
        <AnalysisChart
          key="step"
          data={stepData}
          globalStartDate={globalStartDate}
          globalEndDate={globalEndDate}
          onBrushChange={onBrushChange}
          title="시간별 걸음 수"
          dataKey="step"
        />
      ),
      visibleCharts.bpm && (
        <AnalysisChart
          key="bpm"
          data={predictionData}
          isPrediction={true}
          globalStartDate={globalStartDate}
          globalEndDate={globalEndDate}
          onBrushChange={onBrushChange}
          title="심박수 BPM"
          dataKey="y"
        />
      ),
      visibleCharts.sleep && (
        <SleepChart
          key="sleep"
          data={sleepData}
          onBrushChange={onBrushChange}
        />
      ),
    ].filter(Boolean);

    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columnsCount}, 1fr)`, gap: '1rem' }}>
        {charts}
      </div>
    );
  };

  const renderCombinedChart = () => {
    // 여기에 모든 데이터를 하나의 차트에 표시하는 로직을 구현합니다.
    // 이는 새로운 컴포넌트를 만들거나 AnalysisChart를 수정하여 구현할 수 있습니다.
    return <div>Combined Chart (To be implemented)</div>;
  };

  return (
    <div>
      <div className="mb-4">
        <label className="mr-2">Layout Type:</label>
        <select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value as 'separate' | 'combined')}
          className="border p-2 rounded mr-4"
        >
          <option value="separate">Separate Charts</option>
          <option value="combined">Combined Chart</option>
        </select>

        {layoutType === 'separate' && (
          <>
            <label className="mr-2">Columns:</label>
            <input
              type="number"
              min="1"
              max="5"
              value={columnsCount}
              onChange={(e) => setColumnsCount(Number(e.target.value))}
              className="border p-2 rounded w-16 mr-4"
            />
          </>
        )}
      </div>

      {layoutType === 'separate' && (
        <div className="mb-4">
          {Object.entries(visibleCharts).map(([key, value]) => (
            <label key={key} className="mr-4">
              <input
                type="checkbox"
                checked={value}
                onChange={() => toggleChart(key as keyof typeof visibleCharts)}
                className="mr-1"
              />
              {key.toUpperCase()}
            </label>
          ))}
        </div>
      )}

      {layoutType === 'separate' ? renderSeparateCharts() : renderCombinedChart()}
    </div>
  );
};

export default GraphLayoutManager;