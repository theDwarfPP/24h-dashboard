import { useMemo } from 'react';
import { HelpCircle, Settings2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { EditableValue } from './EditableValue';
import advertiserAData from '../data/advertiserA.json';
import { useSearchParams } from 'react-router-dom';

const baseData = [
  { title: '综合ROI (24小时)', value: '3.99', change: '+1.65%', tag: '数据回流中', tagColor: 'gray', selectedBg: 'bg-cyan-50/50' },
  { title: '预估综合ROI (24小时)', value: '2.58', change: '+1.38%', tag: '推荐关注', tagColor: 'blue', selectedBg: 'bg-blue-50/50' },
  { title: '24小时结算金额(元)', value: '3,200.01', change: '+69.65%', selectedBg: 'bg-gray-50' },
  { title: '净成交金额', value: '3,300.99', change: '+69.65%', selectedBg: 'bg-gray-50' },
  { title: '综合 ROI (净成交)', value: '13,118.90', change: '+69.65%', selectedBg: 'bg-purple-50/50' },
  { title: '综合成本(元)', value: '1,162.79', change: '+1.38%', selectedBg: 'bg-gray-50' },
  { title: '24小时内退款率', value: '30.12%', change: '+69.65%', selectedBg: 'bg-gray-50' },
  { title: '整体成交金额(元)', value: '7,710.00', change: '+69.65%', selectedBg: 'bg-gray-50' },
];

const advBData = [
  { title: '综合ROI (24小时)', value: '2.88', change: '-1.65%', tag: '数据回流中', tagColor: 'gray', selectedBg: 'bg-cyan-50/50' },
  { title: '预估综合ROI (24小时)', value: '1.98', change: '-3.38%', tag: '推荐关注', tagColor: 'blue', selectedBg: 'bg-blue-50/50' },
  { title: '24小时结算金额(元)', value: '1,200.01', change: '-9.65%', selectedBg: 'bg-gray-50' },
  { title: '净成交金额', value: '1,300.99', change: '-19.65%', selectedBg: 'bg-gray-50' },
  { title: '综合 ROI (净成交)', value: '23,118.90', change: '+19.65%', selectedBg: 'bg-purple-50/50' },
  { title: '综合成本(元)', value: '862.79', change: '-5.38%', selectedBg: 'bg-gray-50' },
  { title: '24小时内退款率', value: '45.12%', change: '+15.65%', selectedBg: 'bg-gray-50' },
  { title: '整体成交金额(元)', value: '3,710.00', change: '-29.65%', selectedBg: 'bg-gray-50' },
];

export const DataGrid = () => {
  const { advertiser, selectedMetrics, toggleMetricSelection, customData, defaultDateRange } = useAppContext();
  const [searchParams] = useSearchParams();
  
  const startDate = searchParams.get('startDate') || defaultDateRange.start;
  const endDate = searchParams.get('endDate') || defaultDateRange.end;

  const formatNumber = (num: number, digits = 2) => num.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

  const data = useMemo(() => {
    if (advertiser === 'advertiser_a' || advertiser === 'custom') {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const sourceData = advertiser === 'custom' ? customData : advertiserAData;
      
      // Filter data by selected date range
      const inRangeData = sourceData.filter((item: any) => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });

      // Sum up monetary fields
      const sumTotalAmount = inRangeData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const sumSettlement24h = inRangeData.reduce((sum, item) => sum + (item.settlement24h || 0), 0);
      const sumNetAmount = inRangeData.reduce((sum, item) => sum + (item.netAmount || 0), 0);
      const sumTotalCost = inRangeData.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      
      // Averages for ROI (changed to calculate directly from sums to ensure consistency with KeyMetrics formula)
      const calcRoi24h = sumTotalCost > 0 ? (sumSettlement24h / sumTotalCost) : 0;
      
      // Calculate estimated settlement dynamically (Total - (Total - 24h Settlement) => which is just 24h Settlement? 
      // Actually based on Excel data: "预估24小时综合ROI" and "综合ROI（净成交）"
      let avgRoiEst24h = inRangeData.reduce((sum, item) => sum + (item.roiEst24h || 0), 0) / (inRangeData.length || 1);
      
      // 预估综合ROI 24小时 总是稍微小于 综合ROI 24小时
      if (avgRoiEst24h >= calcRoi24h && calcRoi24h > 0) {
        avgRoiEst24h = calcRoi24h * 0.98;
      }
      const avgRoiNet = inRangeData.reduce((sum, item) => sum + (item.roiNet || 0), 0) / (inRangeData.length || 1);

      // Refund rate = (Total Amount - 24h Settlement) / Total Amount
      const refundRate = sumTotalAmount > 0 ? ((sumTotalAmount - sumSettlement24h) / sumTotalAmount) * 100 : 0;
      
      const allReflowed = inRangeData.length > 0 && inRangeData.every(item => item.isReflowCompleted === true);

      return [
        { 
          title: '综合ROI (24小时)', 
          value: formatNumber(calcRoi24h), 
          change: '+12.65%', 
          tag: allReflowed ? '推荐关注' : '数据回流中', 
          tagColor: allReflowed ? 'blue' : 'gray', 
          selectedBg: 'bg-cyan-50/50' 
        },
        { 
          title: '预估综合ROI (24小时)', 
          value: allReflowed ? '--' : formatNumber(avgRoiEst24h), 
          change: allReflowed ? '--' : '+11.38%', 
          tag: allReflowed ? '' : '推荐关注', 
          tagColor: allReflowed ? '' : 'blue', 
          selectedBg: 'bg-blue-50/50' 
        },
        { title: '24小时结算金额(元)', value: formatNumber(sumSettlement24h), change: '+29.65%', selectedBg: 'bg-gray-50' },
        { title: '净成交金额', value: formatNumber(sumNetAmount), change: '+39.65%', selectedBg: 'bg-gray-50' },
        { title: '综合 ROI (净成交)', value: formatNumber(avgRoiNet), change: '-9.65%', selectedBg: 'bg-purple-50/50' },
        { title: '综合成本(元)', value: formatNumber(sumTotalCost), change: '+2.38%', selectedBg: 'bg-gray-50' },
        { title: '24小时内退款率', value: formatNumber(refundRate) + '%', change: '-19.65%', selectedBg: 'bg-gray-50' },
        { title: '整体成交金额(元)', value: formatNumber(sumTotalAmount), change: '+49.65%', selectedBg: 'bg-gray-50' },
      ];
    }
    
    return advertiser === 'advertiser_b' ? advBData : baseData;
  }, [advertiser, startDate, endDate, customData]);

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h2 className="text-base font-medium text-gray-900">数据概览</h2>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <span className="text-sm text-gray-600">只看基础数据</span>
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          </label>
        </div>
        <button className="p-1.5 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100">
          <Settings2 className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data.map((item, index) => {
          const isSelected = selectedMetrics.includes(item.title);
          const bgClass = isSelected ? item.selectedBg : 'bg-gray-50';
          
          return (
            <div 
              key={index} 
              onClick={() => toggleMetricSelection(item.title)}
              className={`${bgClass} rounded-lg p-4 cursor-pointer transition-all duration-200 border-2 border-transparent hover:brightness-95`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-gray-700">{item.title}</span>
                {item.tag && (
                  <span className={`text-[10px] px-1 rounded border ${
                    item.tagColor === 'blue' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-gray-500 border-gray-200 bg-white'
                  }`}>
                    {item.tag}
                  </span>
                )}
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-semibold text-gray-900">
                  <EditableValue initialValue={item.value} />
                </span>
                <span className="text-sm text-red-500">
                  <EditableValue initialValue={item.change} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};