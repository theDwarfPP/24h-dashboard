import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import advertiserAData from '../data/advertiserA.json';
import { useAppContext } from '../context/AppContext';

const quickOptions = [
  '今天', '昨天', '最近3天', '最近7天', '最近15天', '最近30天', '上周', '本月'
];

export const DatePicker = () => {
  const { advertiser, customData, defaultDateRange, dataSource } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStartDate = searchParams.get('startDate') || defaultDateRange.start;
  const urlEndDate = searchParams.get('endDate') || defaultDateRange.end;
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Local state for selection process
  const [tempStart, setTempStart] = useState<string | null>(urlStartDate);
  const [tempEnd, setTempEnd] = useState<string | null>(urlEndDate);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  
  // View state for calendars
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(urlStartDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });


  useEffect(() => {
    if (isOpen) {
      setTempStart(urlStartDate);
      setTempEnd(urlEndDate);
      setSelecting('start');
      const d = new Date(urlStartDate);
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [isOpen, urlStartDate, urlEndDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectQuick = (option: string) => {
    if (option === '今天') {
      searchParams.set('startDate', '2026-04-15');
      searchParams.set('endDate', '2026-04-15');
    } else if (option === '最近7天') {
      searchParams.set('startDate', '2026-03-15');
      searchParams.set('endDate', '2026-03-21');
    } else {
      searchParams.set('startDate', '2026-03-01');
      searchParams.set('endDate', '2026-03-31');
    }
    setSearchParams(searchParams);
    setIsOpen(false);
  };

  const handleDateClick = (dateStr: string) => {
    if (selecting === 'start') {
      setTempStart(dateStr);
      setTempEnd(null);
      setSelecting('end');
    } else {
      if (tempStart && dateStr < tempStart) {
        // If clicked date is before start date, make it the new start date
        setTempStart(dateStr);
        setTempEnd(null);
        setSelecting('end');
      } else {
        setTempEnd(dateStr);
        setSelecting('start');
        // Apply selection
        searchParams.set('startDate', tempStart!);
        searchParams.set('endDate', dateStr);
        setSearchParams(searchParams);
        setIsOpen(false);
      }
    }
  };

  const isDateInRange = (dateStr: string) => {
    if (!tempStart || !tempEnd) return false;
    return dateStr > tempStart && dateStr < tempEnd;
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handlePrevYear = () => {
    setViewDate(new Date(viewDate.getFullYear() - 1, viewDate.getMonth(), 1));
  };

  const handleNextYear = () => {
    setViewDate(new Date(viewDate.getFullYear() + 1, viewDate.getMonth(), 1));
  };

  // Get date status from Excel data
  const dateStatusMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    const groupedByDay: Record<string, any[]> = {};

    const sourceData = dataSource === 'custom' ? customData : advertiserAData;
    
    // Filter by current advertiser
    const filteredData = sourceData.filter((item: any) => item.name === advertiser);

    filteredData.forEach((item: any) => {
      const dateStr = item.date;
      if (!groupedByDay[dateStr]) groupedByDay[dateStr] = [];
      groupedByDay[dateStr].push(item);
    });

    Object.keys(groupedByDay).forEach(dateStr => {
      const dayItems = groupedByDay[dateStr];
      // Scheme A: If any valid hour is false, the day is false
      const validDayItems = dayItems.filter((item: any) => item.roi24h !== undefined && item.roi24h !== null);
      const isReflowCompleted = validDayItems.length > 0 && validDayItems.every((item: any) => item.isReflowCompleted === true);
      map[dateStr] = isReflowCompleted;
    });

    return map;
  }, [advertiser, customData, dataSource]);

  const renderCalendar = (year: number, month: number, isLeft: boolean) => {
    const d = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOfWeek = d.getDay();
    const monthStr = month.toString().padStart(2, '0');
    const days = Array(startDayOfWeek).fill(null).concat(Array.from({length: daysInMonth}, (_, i) => i + 1));
    
    // Fill the rest of the grid to maintain height (optional, but good for layout)
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className={`flex space-x-4 ${isLeft ? '' : 'invisible'}`}>
            <ChevronsLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={isLeft ? handlePrevYear : undefined} />
            <ChevronLeft className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={isLeft ? handlePrevMonth : undefined} />
          </div>
          <span className="text-base font-medium text-gray-900">{year}年 {month}月</span>
          <div className={`flex space-x-4 ${!isLeft ? '' : 'invisible'}`}>
            <ChevronRight className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={!isLeft ? handleNextMonth : undefined} />
            <ChevronsRight className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" onClick={!isLeft ? handleNextYear : undefined} />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-y-4 text-center mb-4">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} className="text-sm text-gray-600">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-2 text-center">
          {days.map((d, i) => {
            if (!d) return <div key={i} className="py-1.5"></div>;
            
            const dateStr = `${year}-${monthStr}-${d.toString().padStart(2, '0')}`;
            const isStart = dateStr === tempStart;
            const isEnd = dateStr === tempEnd;
            const inRange = isDateInRange(dateStr);
            const isSingleDay = isStart && isEnd;

            const hasStatus = dateStatusMap[dateStr] !== undefined;
            const isReflowCompleted = dateStatusMap[dateStr];
            
            // Disable dates that don't have data (for advertiser A)
            const isDisabled = advertiser === 'advertiser_a' && !hasStatus;

            let bgClass = '';
            let textClass = 'text-gray-700';
            let roundedClass = 'rounded';
            let cursorClass = isDisabled ? 'cursor-not-allowed opacity-30' : 'cursor-pointer';

            if (isStart || isEnd) {
              bgClass = 'bg-blue-600';
              textClass = 'text-white';
              if (!isSingleDay && tempEnd) {
                roundedClass = isStart ? 'rounded-l rounded-r-none' : 'rounded-r rounded-l-none';
              }
            } else if (inRange) {
              bgClass = 'bg-blue-50';
              roundedClass = 'rounded-none';
            } else if (!isDisabled) {
              bgClass = 'hover:bg-gray-100';
            }

            return (
              <div key={i} className={`relative ${inRange ? 'bg-blue-50' : ''} ${isStart && tempEnd && !isSingleDay ? 'bg-gradient-to-r from-transparent to-blue-50' : ''} ${isEnd && tempStart && !isSingleDay ? 'bg-gradient-to-l from-transparent to-blue-50' : ''}`}>
                <div 
                  className={`text-sm py-1.5 mx-1 flex flex-col items-center justify-center ${bgClass} ${textClass} ${roundedClass} ${cursorClass}`}
                  onClick={() => {
                    if (!isDisabled) {
                      handleDateClick(dateStr);
                    }
                  }}
                >
                  <span>{d}</span>
                  {hasStatus && (
                    <div 
                      className={`w-1 h-1 rounded-full absolute bottom-1 ${isReflowCompleted ? 'bg-green-500' : 'bg-orange-500'}`} 
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        className={`flex items-center space-x-2 px-3 py-1.5 rounded border cursor-pointer ${isOpen ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200 bg-gray-50'}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm text-gray-700">
          {urlStartDate === urlEndDate ? urlStartDate : `${urlStartDate} ~ ${urlEndDate}`}
        </span>
        <CalendarIcon className="w-4 h-4 text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex w-[720px]">
          {/* Left Sidebar */}
          <div className="w-32 border-r border-gray-100 py-2">
            {quickOptions.map(opt => (
              <div 
                key={opt}
                className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSelectQuick(opt)}
              >
                {opt}
              </div>
            ))}
          </div>
          
          {/* Right Calendars */}
          <div className="flex-1 p-6">
            <div className="flex space-x-8">
              {renderCalendar(viewDate.getFullYear(), viewDate.getMonth() + 1, true)}
              {renderCalendar(
                viewDate.getMonth() === 11 ? viewDate.getFullYear() + 1 : viewDate.getFullYear(),
                viewDate.getMonth() === 11 ? 1 : viewDate.getMonth() + 2,
                false
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-sm text-blue-600 flex items-center">
              <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-2 text-xs">⇄</div>
              日期下有该标记，则表示当日切换过ROI目标
            </div>
          </div>
        </div>
      )}
    </div>
  );
};