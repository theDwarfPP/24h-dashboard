import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from './components/Header';
import { TabsAndFilters } from './components/TabsAndFilters';
import { KeyMetrics } from './components/KeyMetrics';
import { DataGrid } from './components/DataGrid';
import { TrendChart } from './components/TrendChart';
import { DebugModal } from './components/DebugModal';
import { useAppContext } from './context/AppContext';
import advertiserAData from './data/advertiserA.json';

export const Dashboard = () => {
  const { advertiser, setMetrics, customData, defaultDateRange, dataSource } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const startDate = searchParams.get('startDate') || defaultDateRange.start;
  const endDate = searchParams.get('endDate') || defaultDateRange.end;

  // Synchronize Context metrics with URL date range and JSON data
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const sourceData = dataSource === 'custom' ? customData : advertiserAData;
    
    const inRangeData = sourceData.filter((item: any) => {
      if (!item.date) return false;
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end && item.name === advertiser;
    });

    // Debug: log filtering results
    console.log('=== Dashboard Filter Debug ===', {
      dataSource,
      advertiser,
      startDate,
      endDate,
      sourceDataLength: sourceData.length,
      inRangeDataLength: inRangeData.length,
      firstItem: sourceData[0],
      firstInRange: inRangeData[0]
    });

      const sumTotalAmount = inRangeData.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
      const sumSettlement24h = inRangeData.reduce((sum, item) => sum + (item.settlement24h || 0), 0);
      const sumTotalCost = inRangeData.reduce((sum, item) => sum + (item.totalCost || 0), 0);
      
      const allReflowed = inRangeData.length > 0 && inRangeData.every(item => item.isReflowCompleted === true);
      
      // Auto switch dataType based on reflow status
      const currentDataType = searchParams.get('dataType');
      if (allReflowed && currentDataType !== 'real') {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('dataType', 'real');
        setSearchParams(newParams);
      } else if (!allReflowed && currentDataType !== 'estimated') {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('dataType', 'estimated');
        setSearchParams(newParams);
      }
      
      const calcRoi24h = sumTotalCost > 0 ? (sumSettlement24h / sumTotalCost) : 0;
      let avgRoiEst24h = inRangeData.reduce((sum, item) => sum + (item.roiEst24h || 0), 0) / (inRangeData.length || 1);
      
      // 预估综合ROI 24小时 总是稍微小于 综合ROI 24小时，除非全都是0
      if (avgRoiEst24h >= calcRoi24h && calcRoi24h > 0) {
        avgRoiEst24h = calcRoi24h * 0.98; // 稍微小一点点
      }

      // We update the AppContext metrics which drives the KeyMetrics component
      // This way both DataGrid and KeyMetrics share the same dynamic data root
      setMetrics({
        realSettlement: sumSettlement24h,
        estTotalAmount: sumTotalAmount,
        estRefund: sumTotalAmount - sumSettlement24h, // This will be overwritten by KeyMetrics dynamic formula
        cost: sumTotalCost,
        estROI: avgRoiEst24h,
        allReflowed: allReflowed
      });
  }, [advertiser, startDate, endDate, setMetrics, customData, dataSource]);

  return (
    <div className="min-h-screen bg-[#f0f5ff] font-sans pb-8">
      <div className="bg-white">
        <div className="max-w-[1440px] mx-auto">
          <Header />
        </div>
      </div>
      
      <div className="max-w-[1440px] mx-auto px-6 mt-6">
        {/* 视觉整合的统一卡片区域 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <TabsAndFilters />
          <KeyMetrics />
          <DataGrid />
          <TrendChart />
        </div>
      </div>

      <DebugModal />
    </div>
  );
};