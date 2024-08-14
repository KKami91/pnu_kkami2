import React, { useState, useCallback } from 'react';
import AnalysisChart from './AnalysisChart2';
import CombinedChart from './CombinedChart2';

interface GraphLayoutManagerProps {
  hourlyData: any[];
  dailyData: any[];
  globalStartDate: Date;
  globalEndDate: Date;
  viewMode: string;
  columnCount: number;
}

const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({
  hourlyData,
  dailyData,
  globalStartDate,
  globalEndDate,
  viewMode,
  columnCount,
}) => {
  const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

  const handleBrushChange = useCallback((domain: [number, number] | null) => {
    setBrushDomain(domain);
  }, []);

  const renderSeparateCharts = () => {
    const charts = [
      <AnalysisChart
        key="sdnn"
        data={hourlyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        onBrushChange={handleBrushChange}
        title="SDNN"
        dataKey="sdnn"
        syncId="healthData"
        showBrush={true}
      />,
      <AnalysisChart
        key="rmssd"
        data={hourlyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="RMSSD"
        dataKey="rmssd"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="bpm"
        data={hourlyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Heart Rate (BPM)"
        dataKey="bpm"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="pred_bpm"
        data={hourlyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Predicted Heart Rate (BPM)"
        dataKey="pred_bpm"
        syncId="healthData"
        showBrush={false}
        isPrediction={true}
      />,
      <AnalysisChart
        key="pred_rmssd"
        data={hourlyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Predicted RMSSD"
        dataKey="pred_rmssd"
        syncId="healthData"
        showBrush={false}
        isPrediction={true}
      />,
      <AnalysisChart
        key="steps"
        data={dailyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Steps"
        dataKey="step"
        syncId="healthData"
        showBrush={false}
      />,
      <AnalysisChart
        key="calories"
        data={dailyData}
        globalStartDate={globalStartDate}
        globalEndDate={globalEndDate}
        brushDomain={brushDomain}
        title="Calories"
        dataKey="calorie"
        syncId="healthData"
        showBrush={false}
      />,
    ];

    return (
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
          gap: '1rem'
        }}
      >
        {charts.map((chart, index) => (
          <div key={index} className="w-full">
            {React.cloneElement(chart, { brushDomain, onBrushChange: handleBrushChange })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {viewMode === 'separate' ? renderSeparateCharts() : (
        <CombinedChart
          hourlyData={hourlyData}
          dailyData={dailyData}
          globalStartDate={globalStartDate}
          globalEndDate={globalEndDate}
          onBrushChange={handleBrushChange}
        />
      )}
    </div>
  );
};

export default GraphLayoutManager;