import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface Sample {
  beatsPerMinute: number;
  time: string;
}

interface Metadata {
  clientRecordVersion: number;
  dataOrigin: {
    packageName: string;
  };
  id: string;
  lastModifiedTime: string;
  recordingMethod: number;
}

interface Data {
  endTime: string;
  endZoneOffset: {};
  metadata: Metadata;
  samples: Sample[];
  startTime: string;
  startZoneOffset: {};
}

export default function ReadJsonPage() {
  const [data, setData] = useState<Data[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [hourlyAverageBpm, setHourlyAverageBpm] = useState<{ hour: string; averageBpm: number }[]>([]);
  const [hourlyFeatures, setHourlyFeatures] = useState<{ hour: string; features: Record<string, number> }[]>([]);
  const chartRef = useRef<HTMLDivElement>(null);

  const ShowDataButton: React.FC<{ data: typeof hourlyFeatures }> = ({ data }) => {
    const handleClick = () => {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
      }
    };

    return <button className="mt-4 px-4 py-2 bg-gray-300 text-red-700 rounded" onClick={handleClick}>Show Data</button>;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<Data[]>('/hrv.json');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching JSON data:', error);
      }
    };

    fetchData();
  }, []);

  function diff(arr: number[]): number[] {
    const result: number[] = [];

    for (let i = 1; i < arr.length; i++) {
      result.push(arr[i] - arr[i - 1]);
    }
    return result;
  }

  function median(arr: number[]): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  function mean(arr: number[]): number {
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
  }

  function std(arr: number[], ddof: number = 0): number {
    const n = arr.length;
    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const sqDiff = arr.map((val) => (val - mean) ** 2);
    const variance = sqDiff.reduce((acc, val) => acc + val, 0) / (n - ddof);
    return Math.sqrt(variance);
  }

  function get_domain(nn_intervals: number[]): Record<string, number> {
    const diff_nni_ = diff(nn_intervals);
    const length_int_ = nn_intervals.length;
    const mean_nni_ = mean(nn_intervals);
    const median_nni_ = median(nn_intervals);
    const range_nni_ = Math.max(...nn_intervals) - Math.min(...nn_intervals);
    const sdsd_ = std(diff_nni_, 0);
    const rmssd_ = Math.sqrt(mean(diff_nni_.map(x => x ** 2)));
    const nni_50_ = diff_nni_.filter(x => Math.abs(x) > 50).length;
    const pnni_50_ = (100 * nni_50_) / length_int_;
    const nni_20_ = diff_nni_.filter(x => Math.abs(x) > 20).length;
    const pnni_20_ = (100 * nni_20_) / length_int_;
    const cvsd_ = rmssd_ / mean_nni_;
    const sdnn_ = std(nn_intervals, 1);
    const cvnni_ = sdnn_ / mean_nni_;
    const hearth_rate_list_ = nn_intervals.map(x => 60000 / x);
    const mean_hr_ = mean(hearth_rate_list_);
    const min_hr_ = Math.min(...hearth_rate_list_);
    const max_hr_ = Math.max(...hearth_rate_list_);
    const std_hr_ = std(hearth_rate_list_, 0);

    const sdnn_max_ = 100
    const sdnn_min_ = 0
    const sdnn_score_ = (sdnn_ - sdnn_min_) / (sdnn_max_ - sdnn_min_)
    const stress_score_ = Math.max(0, Math.min(10, 10 * sdnn_score_))

    const feature: Record<string, number> = {
      mean_nni: mean_nni_,
      rmssd: rmssd_,
      sdnn: sdnn_,
      sdsd: sdsd_,
      nni_50: nni_50_,
      pnni_50: pnni_50_,
      nni_20: nni_20_,
      pnni_20: pnni_20_,
      median_nni: median_nni_,
      range_nni: range_nni_,
      cvsd: cvsd_,
      cvnni: cvnni_,
      mean_hr: mean_hr_,
      max_hr: max_hr_,
      min_hr: min_hr_,
      std_hr: std_hr_,
      stress_score: stress_score_
    };

    return feature

    };
    
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value);
  };

  const calculateHourlyAverageBpm = () => {
    const startDateTime = new Date(`${selectedDate}T00:00:00+0900`);
    const endDateTime = new Date(`${selectedDate}T23:59:59+0900`);

    const filteredData = data.filter(item => {
      const itemDateTime = new Date(item.startTime);
      
      return itemDateTime >= startDateTime && itemDateTime <= endDateTime;
    });

    const hourlyData: { [hour: string]: number[] } = {};

    filteredData.forEach(item => {
      const itemDateTime = new Date(item.startTime);
      const year = itemDateTime.getFullYear();
      const month = String(itemDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(itemDateTime.getDate()).padStart(2, '0');
      const hour = String(itemDateTime.getHours()).padStart(2, '0');
    
      const hourKey = `${year}-${month}-${day} ${hour}:00:00`;
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = [];
      }
      hourlyData[hourKey].push(...item.samples.map(sample => 60000 / sample.beatsPerMinute));
    });

    const hourlyFeaturesData  = Object.entries(hourlyData).map(([hour, nnIntervals]) => {
      const [date, time] = hour.split(' ');
      const [hourStart, minuteStart] = time.split(':');
      const hourEnd = String(Number(hourStart) + 1).padStart(2, '0');
      const minuteEnd = String(Number(minuteStart) - 1).padStart(2, '0');
      const formattedHour = `${date} ${hourStart}:${minuteStart}:00 ~ ${hourStart}:59:00`;
      return {
        hour: formattedHour,
        features: get_domain(nnIntervals),
      };
      
    });
    setHourlyFeatures(hourlyFeaturesData);
    console.log(hourlyFeaturesData );
  };
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <div>
        <label htmlFor="dateInput">Select Date: </label>
        <input type="date" id="dateInput" value={selectedDate} onChange={handleDateChange} />
        <button className="mt-4 px-4 py-2 bg-gray-300 text-red-700 rounded" onClick={calculateHourlyAverageBpm}>Calculate</button>
        
      </div>

      <h2>Plot</h2>
      <ul>
        {hourlyAverageBpm.map(({ hour, averageBpm }) => (
          <li key={hour}>
            {selectedDate} {hour} - Average BPM: {averageBpm}
          </li>
        ))}
      </ul>
      <Plot
        data={[
          {
            x: hourlyFeatures.map((feature) => feature.hour.slice(0, 16)),
            y: hourlyFeatures.map((feature) => feature.features.stress_score as number),
            mode: 'lines',
            type: 'scatter',
            name: 'Stress Score',
            line: {
              color: 'rgba(0, 0, 0, 1)',
            },
          },
        ]}
        layout={{
          title: 'Stress Score Over Time',
          //plot_bgcolor: 'red',
          //paper_bgcolor: 'red',
          xaxis: {
            title: 'Time',
          },
          yaxis: {
            title: 'Stress Score',
            range: [0,10],
          },
          shapes: [
            {
              type: 'rect',
              xref: 'paper',
              x0: 0,
              x1: 1,
              yref: 'y',
              y0: 0,
              y1: 3,
              fillcolor: 'skyblue',
              opacity: 0.5,
              line: {width: 0}
            },
            {
              type: 'rect',
              xref: 'paper', 
              x0: 0,
              x1: 1,
              yref: 'y',
              y0: 3,
              y1: 7,
              fillcolor: 'yellow',
              opacity: 0.5,
              line: {width: 0}
            },
            {
              type: 'rect',
              xref: 'paper',
              x0: 0, 
              x1: 1,
              yref: 'y',
              y0: 7,
              y1: 10,
              fillcolor: 'red',
              opacity: 0.5,
              line: {width: 0}
            }]
        }}
        style={{ width: '100%', height: '400px' }}
      />
      <ShowDataButton data={hourlyFeatures} />
    </div>
  );
}