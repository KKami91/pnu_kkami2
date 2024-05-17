import { useState } from 'react';
import axios from 'axios';

const UploadPage = () => {
  const [metadataId, setMetadataId] = useState('');
  const [endTime, setEndTime] = useState('');
  const [beatsPerMinute, setBeatsPerMinute] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/upload_post', {
        metadataId,
        endTime,
        beatsPerMinute,
      });

      console.log('Upload successful:', response.data);
      // 업로드 성공 후 처리할 로직 추가
    } catch (error) {
      console.error('Upload error:', error);
      // 업로드 실패 시 처리할 로직 추가
    }
  };

  return (
    <div>
      <h1>Upload Data</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Metadata ID:</label>
          <input
            type="text"
            value={metadataId}
            onChange={(e) => setMetadataId(e.target.value)}
          />
        </div>
        <div>
          <label>End Time:</label>
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
        <div>
          <label>Beats Per Minute:</label>
          <input
            type="number"
            value={beatsPerMinute}
            onChange={(e) => setBeatsPerMinute(Number(e.target.value))}
          />
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default UploadPage;