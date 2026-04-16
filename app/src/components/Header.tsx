import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import advertiserAData from '../data/advertiserA.json';

export const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { advertiser, setIsDebugModalOpen } = useAppContext();

  const getPageTitle = () => {
    if (advertiser === 'default') {
      return '双十一大促口红003色号-出价13测试';
    }
    return `${advertiser}-24小时结算产品调研`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-start justify-between px-6 py-4 bg-white">
      <div className="flex flex-col space-y-3">
        <h1 className="text-xl font-medium text-gray-900">{getPageTitle()}</h1>
        <div className="flex items-center space-x-4">
          <span className="px-2 py-0.5 text-xs font-medium text-green-600 bg-green-50 rounded-sm">投放中</span>
          <span className="text-sm text-gray-500">ID: 123123123123123131123</span>
          <span className="text-sm text-gray-500 ml-4">每日预算(元): <span className="text-gray-900 font-medium">1,000.00</span></span>
        </div>
      </div>
      <div className="flex items-center space-x-4 mt-1 relative" ref={dropdownRef}>
        <div className="w-10 h-5 bg-gray-800 rounded-full relative cursor-pointer">
          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
        </div>
        <div 
          className="p-1 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <MoreVertical className="w-5 h-5 text-gray-500" />
        </div>
        
        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
            <div 
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsDebugModalOpen(true);
              }}
            >
              调试数据
            </div>
          </div>
        )}
      </div>
    </div>
  );
};