import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from "axios";
import { on } from "events";


interface InputBoxProps {
    selectedDate: string | null;
    selectedUser: string;
}

export default function InputBox({ selectedDate, selectedUser }: InputBoxProps){
    const [memo, setMemo] = useState('');
    const [existingMemo, setExistingMemo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (selectedDate && selectedUser) {
            fetchMemo();
        }
    }, [selectedDate, selectedUser])

    const fetchMemo = async () => {
        try {
            if (!selectedDate || !selectedUser) return;

            const timestamp = new Date(selectedDate)
            

            const response = await axios.get('/api/getDayMemos', {
                params: {
                    user_email: selectedUser,
                    timestamp: timestamp
                }
            });
            if (response.data && response.data.length > 0) {
                setExistingMemo(response.data[0].memo);
                setMemo(response.data[0].memo);
            } else {
                setExistingMemo('');
                setMemo('');
            }
        } catch (error) {
            console.error('Error fetching memo: ', error)
        }
    }

    const handleSaveMemo = async () => {
        console.log('in WriteInputBox ; ', selectedUser, selectedDate)
    
        if (!selectedDate || !selectedUser) return;
    
        setIsLoading(true);
        try {
            const timestamp = new Date(selectedDate);
    
            await axios.post('/api/saveDayMemo', {
                user_email: selectedUser,
                timestamp: timestamp,
                memo: memo
            });
    
            setExistingMemo(memo);
            setIsEditing(false);  // 저장 후 수정 모드 종료
        } catch (error) {
            console.error('Error saving memo: ', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    return (
        <div className="space-y-2 ml-2 mr-2">
          <Label htmlFor="textarea-11" className="grid place-items-center text-base">메모</Label>
          <Textarea 
          id="textarea-11" 
          //className={existingMemo !== '' ? 'read-only:bg-muted' : ''}
          className={existingMemo !== '' && !isEditing ? 'read-only:bg-muted' : ''}
          placeholder="Leave a comment2"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          //readOnly={existingMemo !== ''}
          readOnly={existingMemo !== '' && !isEditing}

          />
          <div className="flex justify-end">
            <Button 
            variant="outline"
            //onClick={handleSaveMemo}
            //onClick={isEditing ? handleSaveMemo : handleEditClick}
            onClick={existingMemo ? (isEditing ? handleSaveMemo : handleEditClick) : handleSaveMemo}
            >
                {/* {existingMemo ? "수정" : "등록"} */}
                {/* {isLoading ? "저장 중..." : (existingMemo ? "수정" : "등록")} */}
                {existingMemo ? (isEditing ? "저장" : "수정") : "등록"}
            </Button>
          </div>
        </div>  
      );
}

