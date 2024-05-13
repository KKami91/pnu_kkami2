import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import * as d3 from 'd3';

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

  useEffect(() => {
    if (hourlyFeatures.length === 0 || !chartRef.current) return;

    const margin = { top: 20, right: 60, bottom: 100, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(chartRef.current)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scalePoint<string>()
    .domain(hourlyFeatures.map((d) => d.hour.slice(0, 16)))
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(hourlyFeatures, (d) => d.features.stressScore) || 10])
    .range([height, 0]);

  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(45)')
    .attr('text-anchor', 'start')
    .attr('dx', '0.8em')
    .attr('dy', '0.15em');

  svg.append('g')
    .call(d3.axisLeft(yScale));

  const line = d3.line<{ hour: string; features: Record<string, number> }>()
    .x((d) => xScale(d.hour.slice(0, 16)) as number)
    .y((d) => yScale(d.features.stressScore || 0));

  svg.append('path')
    .datum(hourlyFeatures)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 1.5)
    .attr('d', line);

  svg.selectAll('dot')
    .data(hourlyFeatures)
    .enter()
    .append('circle')
    .attr('cx', (d) => xScale(d.hour.slice(0, 16)) as number)
    .attr('cy', (d) => yScale(d.features.stressScore || 0))
    .attr('r', 3)
    .attr('fill', (d) => {
      if (d.features.stressScore < 3) return 'skyblue';
      if (d.features.stressScore < 7) return 'yellow';
      return 'red';
    });


    svg.append('text')
    .attr('x', width / 2)
    .attr('y', 0 - margin.top / 2)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .text('Stress Score Over Time');

    svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Stress Score');
  }, [hourlyFeatures]);

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
    <div style={{ width: '100%', height: '400px' }}>
      <div>
        <label htmlFor="dateInput">Select Date: </label>
        <input type="date" id="dateInput" value={selectedDate} onChange={handleDateChange} />
        <button className="mt-4 px-4 py-2 bg-gray-300 text-red-700 rounded" onClick={calculateHourlyAverageBpm}>Calculate</button>
        
      </div>

      <h2>Plot</h2>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }}></div>
      <ShowDataButton data={hourlyFeatures} />
    </div>
  );
}