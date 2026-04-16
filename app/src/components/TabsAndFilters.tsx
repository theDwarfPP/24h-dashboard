import { ChevronDown, HelpCircle } from 'lucide-react';
import { DatePicker } from './DatePicker';

export const TabsAndFilters = () => {
  const tabs = ['数据', '商品', '素材', '调控', '详情', '日志'];

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
      <div className="flex space-x-8">
        {tabs.map((tab, index) => (
          <div
            key={tab}
            className={`text-sm font-medium cursor-pointer pb-3 -mb-3 ${
              index === 0 ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </div>
        ))}
      </div>
      
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-gray-800 rounded border-gray-300 cursor-pointer" defaultChecked />
          <span className="text-sm text-gray-700">只看基础数据</span>
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        </label>
        
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded border border-gray-200 cursor-pointer">
          <span className="text-sm text-gray-700">乘方期间数据</span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </div>
        
        <DatePicker />
      </div>
    </div>
  );
};