import { useState, useEffect  } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import HeartRateChart from '../../components/HeartRateChart';

const users = ['hswchaos@gmail.com', 'subak63@gmail.com']
const API_URL = 'https://heart-rate-app10-hotofhe3yq-du.a.run.app';

export default function Home() {
    const [selectedUser, setSelectedUser] = useState('')
    const [message, setMessage] = useState('')
    const [predictionDates, setPredictionDates] = useState([])
    const [selectedDate, setSelectedDate] = useState('')
    const [graphData, setGraphData] = useState([])

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUser(e.target.value)
  }

  const handleDateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDate(e.target.value)
  }

  const handleSubmit = async () => {
    if (!selectedUser) {
      setMessage('Please select a user')
      return
    }

    try {
        const response = await axios.post('https://heart-rate-app10-hotofhe3yq-du.a.run.app/analyze_and_predict', { user_email: selectedUser })
        setMessage(`Analysis requested for ${selectedUser}. Response: ${JSON.stringify(response.data)}`)
      } catch (error) {
        setMessage(`Error occurred: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    const fetchPredictionDates = async () => {
        if (!selectedUser) {
          setMessage('Please select a user')
          return
        }

        try {
            const response = await axios.get(`${API_URL}/prediction_dates/${selectedUser}`);
            setPredictionDates(response.data.dates);
          } catch (error) {
            setMessage(`Error fetching prediction dates: ${error instanceof Error ? error.message : String(error)}`);
          }
        };

    const fetchGraphData = async () => {
        if (!selectedUser || !selectedDate) {
            setMessage('Please select a user and a prediction date');
            return;
        }
    
    try {
        // ISO 형식으로 날짜 변환 및 인코딩
        const encodedDate = encodeURIComponent(selectedDate);
        const response = await axios.get(`${API_URL}/prediction_data/${selectedUser}/${encodedDate}`);
        setGraphData(response.data.data);
        } catch (error) {
        setMessage(`Error fetching graph data: ${error instanceof Error ? error.message : String(error)}`);
        }
    };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Rate Analysis Dashboard</h1>
      <div className="mb-4">
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
        <button 
          onClick={handleSubmit}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Analyze Heart Rate
        </button>
      </div>
      <div className="mb-4">
        <button 
          onClick={fetchPredictionDates}
          className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mr-2"
        >
          Fetch Prediction Dates
        </button>
        <select 
          value={selectedDate} 
          onChange={handleDateSelect}
          className="border p-2 rounded mr-2"
        >
          <option value="">Select a prediction date</option>
          {predictionDates.map(date => (
            <option key={date} value={date}>{date}</option>
          ))}
        </select>
        <button 
          onClick={fetchGraphData}
          className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
        >
          Show Graph
        </button>
      </div>
      {message && <p className="mt-4">{message}</p>}
      {graphData.length > 0 ? (
        <div className="mt-8">
            <HeartRateChart data={graphData} />
        </div>
      ) : (
        <div className="mt-8 text-center text-red-500">No data available for the chart.</div>
      ) }
    </div>
  )
}