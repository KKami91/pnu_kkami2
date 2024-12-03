import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ArrowRightIcon } from "./ui/ArrowRight";
import axios from 'axios';
import { format } from 'date-fns';
import { ScrollArea } from "@/components/ui/scroll-area";
import debounce from 'lodash/debounce';

interface SearchResult {
  type: string;
  memo: string;
  timestamp?: Date;
  timestamp_start?: Date;
  timestamp_end?: Date;
}

interface SearchMemoDataProps {
  selectedUser?: string;
}

export default function SearchMemoData({ selectedUser }: SearchMemoDataProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchMemos = useCallback(async (term: string) => {
    if (!selectedUser || !term.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.get('/api/searchMemos', {
        params: {
          user_email: selectedUser,
          searchTerm: term.trim()
        }
      });
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching memos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser]);

  // 디바운스된 검색 함수 생성
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      searchMemos(term);
    }, 300), // 300ms 딜레이
    [searchMemos]
  );

  const formatTime = (result: SearchResult) => {
    if (result.type === 'sleep' && result.timestamp_start && result.timestamp_end) {
      return `${format(new Date(result.timestamp_start), 'yyyy-MM-dd')}`;
    }
    return result.timestamp ? format(new Date(result.timestamp), 'yyyy-MM-dd') : '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleResultClick = (result: SearchResult) => {
    const date = result.timestamp_start || result.timestamp;
    if (date) {
      const event = new CustomEvent('dateSelect', {
        detail: { date: format(new Date(date), 'yyyy-MM-dd') }
      });
      window.dispatchEvent(event);
      setShowResults(false);
      setSearchTerm('');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      debouncedSearch.cancel(); // cleanup
    };
  }, [debouncedSearch]);

  return (
    <div className="relative" ref={searchRef}>
      <div className="space-y-2">
        <div className="relative">
          <Input
            id="search-memo"
            className="peer pe-9 ps-9"
            placeholder="Search Memo"
            type="search"
            value={searchTerm}
            onChange={handleInputChange}
            disabled={!selectedUser}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Search size={16} strokeWidth={2} />
          </div>
          {isLoading && (
            <div className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            </div>
          )}
        </div>
      </div>

      {showResults && searchTerm.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg z-50">
          <ScrollArea className="max-h-[calc(100vh-16rem)] overflow-y-auto">
            {results.length > 0 ? (
              <div className="p-2 space-y-2">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="rounded-lg p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleResultClick(result)}
                  >
                    <div className="text-sm text-muted-foreground mt-1">
                      {result.memo}
                    </div>
                    <div className="text-sm font-medium">
                      ( {formatTime(result)} )
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No memos found
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}