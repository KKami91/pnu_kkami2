import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import * as d3 from 'd3';
import {LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ResponsiveContainer} from 'recharts';
import { BubbleChat } from 'flowise-embed-react';

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
  


  const App = () => {
      return (
          <BubbleChat chatflowid="1352afdb-1933-4a3f-88ea-b55d560ea805" apiHost="https://flowise-6pxd.onrender.com/" />
      );
  };

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

  function getDifferences(arr: number[]): number[] {
    const result: number[] = [];

    for (let i = 1; i < arr.length; i++) {
      result.push(arr[i] - arr[i - 1]);
    }
    return result;
  }

  function getMedian(arr: number[]): number {
    const sorted = arr.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  function getMean(arr: number[]): number {
    return arr.reduce((sum, x) => sum + x, 0) / arr.length;
  }

  function getStandardDeviation(arr: number[], ddof: number = 0): number {
    const n = arr.length;
    const mean = arr.reduce((acc, val) => acc + val, 0) / n;
    const sqDiff = arr.map((val) => (val - mean) ** 2);
    const variance = sqDiff.reduce((acc, val) => acc + val, 0) / (n - ddof);
    return Math.sqrt(variance);
  }

  function getDomain(nn_intervals: number[]): Record<string, number> {
    const diffNNI = getDifferences(nn_intervals);
    const lengthInt = nn_intervals.length;
    const meanNNI = getMean(nn_intervals);
    const medianNNI = getMedian(nn_intervals);
    const rangeNNI = Math.max(...nn_intervals) - Math.min(...nn_intervals);
    const sdsd = getStandardDeviation(diffNNI, 0);
    const rmssd = Math.sqrt(getMean(diffNNI.map(x => x ** 2)));
    const nni50 = diffNNI.filter(x => Math.abs(x) > 50).length;
    const pnni50 = (100 * nni50) / lengthInt;
    const nni20 = diffNNI.filter(x => Math.abs(x) > 20).length;
    const pnni20 = (100 * nni20) / lengthInt;
    const cvsd = rmssd / meanNNI;
    const sdnn = getStandardDeviation(nn_intervals, 1);
    const cvnni = sdnn / meanNNI;
    const hearthRateList = nn_intervals.map(x => 60000 / x);
    const meanHr = getMean(hearthRateList);
    const minHr = Math.min(...hearthRateList);
    const maxHr = Math.max(...hearthRateList);
    const stdHr = getStandardDeviation(hearthRateList, 0);

    const sdnnMax = 100
    const sdnnMin = 0
    const sdnnScore = (sdnn - sdnnMin) / (sdnnMax - sdnnMin)
    const stressScore = Math.max(0, Math.min(10, 10 * sdnnScore))

    const feature: Record<string, number> = {
      meanNNI: meanNNI,
      rmssd: rmssd,
      sdnn: sdnn,
      sdsd: sdsd,
      nni50: nni50,
      pnni50: pnni50,
      nni20: nni20,
      pnni20: pnni20,
      medianNNI: medianNNI,
      rangeNNI: rangeNNI,
      cvsd: cvsd,
      cvnni: cvnni,
      meanHr: meanHr,
      maxHr: maxHr,
      minHr: minHr,
      stdHr: stdHr,
      stressScore: stressScore
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
    console.log('hourlyData', hourlyData)
    const hourlyFeaturesData  = Object.entries(hourlyData).map(([hour, nnIntervals]) => {
      const [date, time] = hour.split(' ');
      const [hourStart, minuteStart] = time.split(':');
      const hourEnd = String(Number(hourStart) + 1).padStart(2, '0');
      const minuteEnd = String(Number(minuteStart) - 1).padStart(2, '0');
      const formattedHour = `${date} ${hourStart}:${minuteStart}:00 ~ ${hourStart}:59:00`;
      return {
        hour: formattedHour,
        features: getDomain(nnIntervals),
      };
      
    });
    setHourlyFeatures(hourlyFeaturesData);
    console.log(hourlyFeaturesData );
  };
  return (
    
    <div style={{ width: '99.5%', height: '400px' }}>
      <div>
        <label htmlFor="dateInput">Select Date: </label>
        <input type="date" id="dateInput" value={selectedDate} onChange={handleDateChange} />
        <button className="mt-4 px-4 py-2 bg-gray-300 text-red-700 rounded" onClick={calculateHourlyAverageBpm}>Calculate</button>
        
        <ul>
        {hourlyAverageBpm.map(({ hour, averageBpm }) => (
          <li key={hour}>
            {selectedDate} {hour} - Average BPM: {averageBpm}
          </li>
        ))}
      </ul>
      <h1 className="mt-4 px-4 py-2 text-3xl text-red-300">Stress Score</h1>
      <ResponsiveContainer width='100%' aspect={4.0/2.0}>
        <LineChart width={1200} height={700} data={hourlyFeatures}
        margin={{top: 20, right: 100, left: 60, bottom: 200}}>
          
          <XAxis dataKey= "hour" angle={ -60 } textAnchor="end" stroke="#eee" />
          <YAxis />
          <Tooltip contentStyle={{fontWeight: 700, color: '#111' }} />
          <Line type="monotone" dataKey="features.stressScore" stroke="#eee" />
        </LineChart>
      </ResponsiveContainer>
        
      </div>
      <App />
      <ShowDataButton data={hourlyFeatures} />
      <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>

    </div>
  );
}