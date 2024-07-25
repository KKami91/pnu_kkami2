import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import GraphLayoutManager from '../../components/GraphLayoutManager';
import { min, max } from 'date-fns';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app'

const LoadingSpinner = () => (
  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
    <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
  </div>
)

const SkeletonLoader = () => (
  <div className="animate-pulse">
    <div className="h-64 bg-gray-300 rounded"></div>
    <div className="mt-4 h-4 bg-gray-300 rounded w-3/4"></div>
    <div className="mt-2 h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
)

interface AnalysisData {
  ds: string
  sdnn: number | null
  rmssd: number | null
}

interface PredictionData {
  ds: string
  y: number | null
}

interface SleepData {
  ds_start: string
  ds_end: string
  stage: string
}

interface StepData {
  ds: string
  step: number
}

interface CalorieData {
  ds: string
  calorie: number
}

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('')
  const [message, setMessage] = useState('')
  const [analysisDates, setAnalysisDates] = useState([])
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isLoadingDate, setIsLoadingDate] = useState(false)
  const [analysisGraphData, setAnalysisGraphData] = useState<AnalysisData[]>([])
  const [predictionGraphData, setPredictionGraphData] = useState<PredictionData[]>([])
  const [sleepData, setSleepData] = useState<SleepData[]>([])
  const [stepData, setStepData] = useState<StepData[]>([])
  const [calorieData, setCalorieData] = useState<StepData[]>([])
  const [selectedDate, setSelectedDate] = useState('')
  const [showGraphs, setShowGraphs] = useState(false)
  const [viewMode, setViewMode] = useState('separate')
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false)

  const { globalStartDate, globalEndDate } = useMemo(() => {
    const allDates = [
      ...analysisGraphData.map(item => new Date(item.ds)),
      ...predictionGraphData.map(item => new Date(item.ds)),
      ...sleepData.map(item => new Date(item.ds_start)),
      ...sleepData.map(item => new Date(item.ds_end)),
      ...stepData.map(item => new Date(item.ds)),
      ...calorieData.map(item => new Date(item.ds))
    ]
    return {
      globalStartDate: allDates.length > 0 ? min(allDates) : new Date(),
      globalEndDate: allDates.length > 0 ? max(allDates) : new Date()
    }
  }, [analysisGraphData, predictionGraphData, sleepData, stepData, calorieData])
  
  const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const date = e.target.value
    setSelectedDate(date)
    if (date) {
      setIsLoadingDate(true)
      setShowGraphs(false) // 데이터 로딩 시작 시 그래프 숨김
      await Promise.all([
        fetchAnalysisGraphData(selectedUser, date),
        fetchPredictionGraphData(selectedUser, date),
        fetchStepData(selectedUser, date),
        fetchSleepData(selectedUser, date),
        fetchCalorieData(selectedUser, date)
      ])
      setIsLoadingDate(false)
      setShowGraphs(true) // 데이터 로딩 완료 시 그래프 표시
    }
  }

  const handleViewModeChange = (mode: string) => {
    setIsLoadingGraphs(true)
    setViewMode(mode)
    setTimeout(() => {
      setIsLoadingGraphs(false)
    }, 1000) // 스켈레톤 로딩을 1초 동안 보여줍니다.
  }

  const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = e.target.value
    setSelectedUser(user)
    setSelectedDate('')
    setAnalysisDates([])
    if (user) {
      setIsLoadingUser(true)
      await checkDb(user)
      await fetchAnalysisDates(user)
      setIsLoadingUser(false)
    }
  }

  const fetchAnalysisDates = async (user: string) => {
    try {
      const response = await axios.get(`${API_URL}/analysis_dates/${user}`)
      setAnalysisDates(response.data.dates)
    } catch (error) {
      console.error('Error fetching analysis data:', error)
      setMessage(`Error fetching analysis dates: ${error instanceof Error ? error.message : String(error)}`)
      setAnalysisDates([])
    }
  }

  const checkDb = async (user: string) => {
    try {
      await axios.post(`${API_URL}/check_db`, { user_email: user })
    } catch (error) {
      setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const fetchAnalysisGraphData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/analysis_data/${user}/${date}`)
      setAnalysisGraphData(response.data.data)
    } catch (error) {
      console.error('Error fetching analysis graph data:', error)
      setMessage(`Error fetching analysis data: ${error instanceof Error ? error.message : String(error)}`)
      setAnalysisGraphData([])
    }
  }

  const fetchPredictionGraphData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/prediction_data/${user}/${date}`)
      setPredictionGraphData(response.data.data.map((item: any) => ({
        ds: item.ds,
        y: item.y
      })))
    } catch (error) {
      console.error('Error fetching prediction graph data:', error)
      setMessage(`Error fetching prediction data: ${error instanceof Error ? error.message : String(error)}`)
      setPredictionGraphData([])
    }
  }

  const fetchStepData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/step_data/${user}/${date}`)
      setStepData(response.data.data)
    } catch (error) {
      console.error('Error fetching step data:', error)
      setMessage(`Error fetching step data: ${error instanceof Error ? error.message : String(error)}`)
      setStepData([])
    }
  }

  const fetchSleepData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/sleep_data/${user}/${date}`)
      setSleepData(response.data.data)
    } catch (error) {
      console.error('Error fetching sleep data:', error)
      setMessage(`Error fetching sleep data: ${error instanceof Error ? error.message : String(error)}`)
      setSleepData([])
    }
  }

  const fetchCalorieData = async (user: string, date: string) => {
    try {
      const response = await axios.get(`${API_URL}/calorie_data/${user}/${date}`)
      setCalorieData(response.data.data)
    } catch (error) {
      console.error('Error fetching calorie data:', error)
      setMessage(`Error fetching calorie data: ${error instanceof Error ? error.message : String(error)}`)
      setCalorieData([])
    }
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate and Sleep Analysis Dashboard</h1>
      <div className="mb-4 flex items-center">
        <label className="mr-2">계정 선택:</label>
        <select 
          value={selectedUser} 
          onChange={handleUserSelect}
          className="border p-2 rounded mr-2"
        >
          <option value="">Select a user</option>
          {users.map(user => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        {isLoadingUser && <LoadingSpinner />}
      </div>
      {selectedUser && (
        <div className="mb-4 flex items-center">
          <label className="mr-2">분석 날짜:</label>
          {analysisDates.length > 0 ? (
            <select 
              value={selectedDate} 
              onChange={handleDateSelect}
              className="border p-2 rounded mr-2"
            >
              <option value="">Select a date</option>
              {analysisDates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          ) : (
            <p>No analysis dates available</p>
          )}
          {isLoadingDate && <LoadingSpinner />}
        </div>
      )}
      {selectedDate && (
        <div className="mb-4">
          <label className="mr-2">보는 방식:</label>
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="separate">여러개로</option>
            <option value="combined">하나로</option>
          </select>
        </div>
      )}
      {message && <p className="mt-4">{message}</p>}
      <div className="mt-8">
        {isLoadingDate ? (
          <LoadingSpinner />
        ) : showGraphs ? (
          <GraphLayoutManager
            analysisData={analysisGraphData}
            predictionData={predictionGraphData}
            stepData={stepData}
            sleepData={sleepData}
            calorieData={calorieData}
            globalStartDate={globalStartDate}
            globalEndDate={globalEndDate}
          />
        ) : null}
        {showGraphs && analysisGraphData.length === 0 && predictionGraphData.length === 0 && sleepData.length === 0 && stepData.length === 0 && calorieData.length === 0 && (
          <div className="text-center text-red-500">No data available for the charts.</div>
        )}
      </div>
    </div>
  )
}

// import { useState, useEffect, useMemo } from 'react'
// import axios from 'axios'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// import AnalysisChart from '../../components/AnalysisChart';
// import SleepChart from '../../components/SleepChart';
// import GraphLayoutManager from '../../components/GraphLayoutManager';
// import { min, max } from 'date-fns';

// const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
// const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';

// const LoadingSpinner = () => (
//   <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
//     <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
//   </div>
// );

// const SkeletonLoader = () => (
//   <div className="animate-pulse">
//     <div className="h-64 bg-gray-300 rounded"></div>
//     <div className="mt-4 h-4 bg-gray-300 rounded w-3/4"></div>
//     <div className="mt-2 h-4 bg-gray-300 rounded w-1/2"></div>
//   </div>
// );

// interface AnalysisData {
//   ds: string;
//   sdnn: number | null;
//   rmssd: number | null;
// }

// interface PredictionData {
//   ds: string;
//   y: number | null;
// }

// interface SleepData {
//   ds_start: string;
//   ds_end: string;
//   stage: string;
// }

// interface StepData {
//   ds: string;
//   step: number;
// }

// export default function Home() {
//   // ... (이전 상태들은 그대로 유지)
//   const [selectedUser, setSelectedUser] = useState('')
//   const [message, setMessage] = useState('')
//   const [analysisDates, setAnalysisDates] = useState([])
//   const [analysisSelectedDate, setAnalysisSelectedDate] = useState('')
//   const [isLoadingUser, setIsLoadingUser] = useState(false)
//   const [isLoadingDate, setIsLoadingDate] = useState(false)
//   const [analysisGraphData, setAnalysisGraphData] = useState<AnalysisData[]>([])
//   const [predictionGraphData, setPredictionGraphData] = useState<PredictionData[]>([])
//   //   const [analysisGraphData, setAnalysisGraphData] = useState<AnalysisData[]>([])
// //   const [predictionGraphData, setPredictionGraphData] = useState<PredictionData[]>([])
//   const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);
//   const [sleepDates, setSleepDates] = useState<string[]>([]);
//   const [sleepSelectedDate, setSleepSelectedDate] = useState('');
//   const [sleepData, setSleepData] = useState<SleepData[]>([]);
//   const [stepData, setStepData] = useState<StepData[]>([]);
//   const [selectedDate, setSelectedDate] = useState('')

//   const { globalStartDate, globalEndDate } = useMemo(() => {
//     const allDates = [
//       ...analysisGraphData.map(item => new Date(item.ds)),
//       ...predictionGraphData.map(item => new Date(item.ds))
//     ];
//     return {
//       globalStartDate: allDates.length > 0 ? min(allDates) : new Date(),
//       globalEndDate: allDates.length > 0 ? max(allDates) : new Date()
//     };
//   }, [analysisGraphData, predictionGraphData]);
  
//   const handleDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const date = e.target.value
//     setSelectedDate(date)
//     if (date) {
//       setIsLoadingDate(true)
//       await Promise.all([
//         fetchAnalysisGraphData(selectedUser, date),
//         fetchPredictionGraphData(selectedUser, date),
//         fetchStepData(selectedUser, date),
//         fetchSleepData(selectedUser, date)
//       ]);
//       setIsLoadingDate(false)
//     }
//   }

//   const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const user = e.target.value
//     setSelectedUser(user)
//     setSelectedDate('')
//     setAnalysisDates([])
//     if (user) {
//       setIsLoadingUser(true)
//       await checkDb(user)
//       await fetchAnalysisDates(user)
//       setIsLoadingUser(false)
//     }
//   }

//   const fetchAnalysisDates = async (user: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/analysis_dates/${user}`);
//       console.log('in analysisDates');
//       console.log(response);
//       setAnalysisDates(response.data.dates);
//     } catch (error) {
//       setMessage(`Error fetching analysis dates: ${error instanceof Error ? error.message : String(error)}`);
//       setAnalysisDates([]);
//     }
//   }
//   const checkDb = async (user: string) => {
//     try {
//       const response = await axios.post(`${API_URL}/check_db`, { user_email: user })
//       console.log('in checkDb');
//       console.log(response);
//     } catch (error) {
//       setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
//     }
//   }

//   const fetchAnalysisGraphData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/analysis_data/${user}/${date}`);
//       console.log(response);
//       setAnalysisGraphData(response.data.data);
//     } catch (error) {
//       console.log('error....');
//       setMessage(`Error fetching analysis data: ${error instanceof Error ? error.message : String(error)}`);
//       setAnalysisGraphData([]);
//     }
//   }

//   const fetchPredictionGraphData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/prediction_data/${user}/${date}`);
//       console.log(response);
//       setPredictionGraphData(response.data.data.map((item: any) => ({
//         ds: item.ds,
//         y: item.y
//       })));
//     } catch (error) {
//       console.log('error....');
//       setMessage(`Error fetching prediction data: ${error instanceof Error ? error.message : String(error)}`);
//       setPredictionGraphData([]);
//     }
//   }

//   const fetchStepData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/step_data/${user}/${date}`);
//       setStepData(response.data.data);
//     } catch (error) {
//       setMessage(`Error fetching step data: ${error instanceof Error ? error.message : String(error)}`);
//       setStepData([]);
//     }
//   }

//   const fetchSleepData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/sleep_data/${user}/${date}`);
//       setSleepData(response.data.data);
//     } catch (error) {
//       console.log('error....');
//       setMessage(`Error fetching sleep data: ${error instanceof Error ? error.message : String(error)}`);
//       setSleepData([]);
//     }
//   }

//   const handleBrushChange = (newDomain: [number, number] | null) => {
//     setBrushDomain(newDomain);
//   };


//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Heart Rate and Sleep Analysis Dashboard</h1>
//       <div className="mb-4 flex items-center">
//         <label className="mr-2">계정 선택:</label>
//         <select 
//           value={selectedUser} 
//           onChange={handleUserSelect}
//           className="border p-2 rounded mr-2"
//         >
//           <option value="">Select a user</option>
//           {users.map(user => (
//             <option key={user} value={user}>{user}</option>
//           ))}
//         </select>
//         {isLoadingUser && <LoadingSpinner />}
//       </div>
//       {selectedUser && (
//         <div className="mb-4 flex items-center">
//           <label className="mr-2">분석 날짜:</label>
//           {analysisDates.length > 0 ? (
//             <select 
//               value={selectedDate} 
//               onChange={handleDateSelect}
//               className="border p-2 rounded mr-2"
//             >
//               <option value="">Select a date</option>
//               {analysisDates.map(date => (
//                 <option key={date} value={date}>{date}</option>
//               ))}
//             </select>
//           ) : (
//             <p>No analysis dates available</p>
//           )}
//           {isLoadingDate && <LoadingSpinner />}
//         </div>
//       )}
      
//       {message && <p className="mt-4">{message}</p>}
//       <div className="mt-8">
//         {isLoadingDate ? (
//           <SkeletonLoader />
//         ) : (
//           <GraphLayoutManager
//             analysisData={analysisGraphData}
//             predictionData={predictionGraphData}
//             stepData={stepData}
//             sleepData={sleepData}
//             globalStartDate={globalStartDate}
//             globalEndDate={globalEndDate}
//             onBrushChange={handleBrushChange}
//           />
//         )}
//           {!isLoadingDate && analysisGraphData.length === 0 && predictionGraphData.length === 0 && sleepData.length === 0 && stepData.length === 0 && (
//             <div className="text-center text-red-500">No data available for the charts.</div>
//           )}
//       </div>
//     </div>
//   )
// }

// BPM 다 나오는 버전
// import { useState, useEffect, useMemo } from 'react'
// import axios from 'axios'
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
// import AnalysisChart from '../../components/AnalysisChart';
// import { min, max } from 'date-fns';

// const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
// const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';

// const LoadingSpinner = () => (
//   <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ml-2">
//     <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
//   </div>
// );

// const SkeletonLoader = () => (
//   <div className="animate-pulse">
//     <div className="h-64 bg-gray-300 rounded"></div>
//     <div className="mt-4 h-4 bg-gray-300 rounded w-3/4"></div>
//     <div className="mt-2 h-4 bg-gray-300 rounded w-1/2"></div>
//   </div>
// );

// interface AnalysisData {
//   ds: string;
//   sdnn: number | null;
//   rmssd: number | null;
// }

// interface PredictionData {
//   ds: string;
//   y: number | null;
// }

// export default function Home() {
//   const [selectedUser, setSelectedUser] = useState('')
//   const [message, setMessage] = useState('')
//   const [analysisDates, setAnalysisDates] = useState([])
//   const [analysisSelectedDate, setAnalysisSelectedDate] = useState('')
//   const [analysisGraphData, setAnalysisGraphData] = useState<AnalysisData[]>([])
//   const [predictionGraphData, setPredictionGraphData] = useState<PredictionData[]>([])
//   const [isLoadingUser, setIsLoadingUser] = useState(false)
//   const [isLoadingDate, setIsLoadingDate] = useState(false)
//   const [brushDomain, setBrushDomain] = useState<[number, number] | null>(null);

//   const { globalStartDate, globalEndDate } = useMemo(() => {
//     const allDates = [
//       ...analysisGraphData.map(item => new Date(item.ds)),
//       ...predictionGraphData.map(item => new Date(item.ds))
//     ];
//     return {
//       globalStartDate: allDates.length > 0 ? min(allDates) : new Date(),
//       globalEndDate: allDates.length > 0 ? max(allDates) : new Date()
//     };
//   }, [analysisGraphData, predictionGraphData]);
  
//   const handleAnalysisDateSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const date = e.target.value
//     setAnalysisSelectedDate(date)
//     if (date) {
//       setIsLoadingDate(true)
//       await Promise.all([
//         fetchAnalysisGraphData(selectedUser, date),
//         fetchPredictionGraphData(selectedUser, date)
//       ]);
//       setIsLoadingDate(false)
//     }
//   }

//   const handleBrushChange = (newDomain: [number, number] | null) => {
//     setBrushDomain(newDomain);
//   };

//   const handleUserSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const user = e.target.value
//     setSelectedUser(user)
//     setAnalysisSelectedDate('')
//     setAnalysisDates([])
//     if (user) {
//       setIsLoadingUser(true)
//       await checkDb(user)
//       await fetchAnalysisDates(user)
//       setIsLoadingUser(false)
//     }
//   }

//   const checkDb = async (user: string) => {
//     try {
//       const response = await axios.post(`${API_URL}/check_db`, { user_email: user })
//       console.log('in checkDb');
//       console.log(response);
//     } catch (error) {
//       setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
//     }
//   }

//   const fetchAnalysisDates = async (user: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/analysis_dates/${user}`);
//       console.log('in analysisDates');
//       console.log(response);
//       setAnalysisDates(response.data.dates);
//     } catch (error) {
//       setMessage(`Error fetching analysis dates: ${error instanceof Error ? error.message : String(error)}`);
//       setAnalysisDates([]);
//     }
//   }

//   const fetchAnalysisGraphData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/analysis_data/${user}/${date}`);
//       console.log(response);
//       setAnalysisGraphData(response.data.data);
//     } catch (error) {
//       console.log('error....');
//       setMessage(`Error fetching analysis data: ${error instanceof Error ? error.message : String(error)}`);
//       setAnalysisGraphData([]);
//     }
//   }

//   const fetchPredictionGraphData = async (user: string, date: string) => {
//     try {
//       const response = await axios.get(`${API_URL}/prediction_data/${user}/${date}`);
//       console.log(response);
//       setPredictionGraphData(response.data.data.map((item: any) => ({
//         ds: item.ds,
//         y: item.y
//       })));
//     } catch (error) {
//       console.log('error....');
//       setMessage(`Error fetching prediction data: ${error instanceof Error ? error.message : String(error)}`);
//       setPredictionGraphData([]);
//     }
//   }

  

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Heart Rate Analysis Dashboard</h1>
//       <div className="mb-4 flex items-center">
//         <label className="mr-2">계정 선택:</label>
//         <select 
//           value={selectedUser} 
//           onChange={handleUserSelect}
//           className="border p-2 rounded mr-2"
//         >
//           <option value="">Select a user</option>
//           {users.map(user => (
//             <option key={user} value={user}>{user}</option>
//           ))}
//         </select>
//         {isLoadingUser && <LoadingSpinner />}
//       </div>
//       {selectedUser && (
//         <div className="mb-4 flex items-center">
//           <label className="mr-2">분석 저장 날짜:</label>
//           {analysisDates.length > 0 ? (
//             <select 
//               value={analysisSelectedDate} 
//               onChange={handleAnalysisDateSelect}
//               className="border p-2 rounded mr-2"
//             >
//               <option value="">Select a analysis date</option>
//               {analysisDates.map(date => (
//                 <option key={date} value={date}>{date}</option>
//               ))}
//             </select>
//           ) : (
//             <p>No analysis dates available</p>
//           )}
//           {isLoadingDate && <LoadingSpinner />}
//         </div>
//       )}
      
//       {message && <p className="mt-4">{message}</p>}
//       <div className="mt-8">
//         {isLoadingDate ? (
//           <SkeletonLoader />
//         ) : analysisGraphData.length > 0 ? (
//           <>
//             <AnalysisChart 
//               data={analysisGraphData} 
//               globalStartDate={globalStartDate}
//               globalEndDate={globalEndDate}
//               onBrushChange={handleBrushChange}
//             />
//             {predictionGraphData.length > 0 && (
//               <AnalysisChart 
//                 data={predictionGraphData} 
//                 isPrediction={true}
//                 globalStartDate={globalStartDate}
//                 globalEndDate={globalEndDate}
//                 onBrushChange={handleBrushChange}
//               />
//             )}
//           </>
//         ) : (
//           <div className="text-center text-red-500">No data available for the chart.</div>
//         )}
//       </div>
//     </div>
//   )
// }