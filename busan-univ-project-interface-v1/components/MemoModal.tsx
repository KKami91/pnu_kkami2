// import React, { useState } from 'react';

// interface MemoModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   data: {
//     timestamp: number;
//     value: number;
//     type: 'bpm' | 'step' | 'calorie' | 'sleep';
//   };
//   onSave: (memo: string) => void;
// }

// const MemoModal: React.FC<MemoModalProps> = ({ isOpen, onClose, data, onSave }) => {
//   const [memo, setMemo] = useState('');

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white p-4 rounded-lg">
//         <h2 className="text-lg font-bold mb-2">{data.type.toUpperCase()} Data</h2>
//         <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
//         <p>Value: {data.value}</p>
//         <textarea
//           className="w-full mt-2 p-2 border rounded"
//           value={memo}
//           onChange={(e) => setMemo(e.target.value)}
//           placeholder="Enter your memo here..."
//         />
//         <div className="mt-4 flex justify-end">
//           <button
//             className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
//             onClick={() => {
//               onSave(memo);
//               onClose();
//             }}
//           >
//             Save
//           </button>
//           <button
//             className="px-4 py-2 bg-gray-300 rounded"
//             onClick={onClose}
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MemoModal;


import React, { useState, useEffect } from 'react';
import { Memo } from './types';

// interface MemoModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onSave: (memo: string) => void;
//   data: {
//     timestamp: number;
//     end?: number; // ??? 
//     value: number;
//     type: string;
//   };
//   existingMemo: string;
// }

interface MemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memo: string) => void;
  data: {
    timestamp: number;
    end?: number;
    value: number;
    type: string;
  };
  existingMemo: string | Memo;
}

function getSleepStageLabel(value: number): string {
  switch(value) {
    case 1: return 'Awake';
    case 2: return 'Light1';
    case 3: return 'Light2';
    case 4: return 'Deep';
    case 5: return 'REM';
    default: return 'Unknown';
  }
}

const MemoModal: React.FC<MemoModalProps> = ({ isOpen, onClose, onSave, data, existingMemo }) => {
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMemo(typeof existingMemo === 'string' ? existingMemo : existingMemo.content);
    }
  }, [isOpen, existingMemo]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg w-96">
        <h2 className="text-lg font-bold mb-2">{data.type.toUpperCase()} Data</h2>
        <p>Timestamp: {formatTimestamp(data.timestamp)}</p>
        {data.type === 'sleep' && data.end && (
          <p>End Time: {formatTimestamp(data.end)}</p>
        )}
        <p>Value: {data.type === 'sleep' ? getSleepStageLabel(data.value) : data.value}</p>
        <textarea
          className="w-full mt-2 p-2 border rounded"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Enter your memo here..."
        />
        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
            onClick={() => onSave(memo)}
          >
            Save
          </button>
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoModal;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white p-4 rounded-lg w-96">
//         <h2 className="text-lg font-bold mb-2">{data.type.toUpperCase()} Data</h2>
//         <p>Timestamp: {new Date(data.timestamp).toLocaleString()}</p>
//         <p>Value: {data.value}</p>
//         <textarea
//           className="w-full mt-2 p-2 border rounded"
//           value={memo}
//           onChange={(e) => setMemo(e.target.value)}
//           placeholder="Enter your memo here..."
//         />
//         <div className="mt-4 flex justify-end">
//           <button
//             className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
//             onClick={() => onSave(memo)}
//           >
//             Save
//           </button>
//           <button
//             className="px-4 py-2 bg-gray-300 rounded"
//             onClick={onClose}
//           >
//             Cancel
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default MemoModal;