import { useMemo } from 'react';
import { ChevronUp, HelpCircle, Edit2, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

import advertiserAData from '../data/advertiserA.json';

export const TrendChart = () => {
  const [searchParams] = useSearchParams();
  const { advertiser, selectedMetrics, customData, defaultDateRange, dataSource } = useAppContext();
  const startDate = searchParams.get('startDate') || defaultDateRange.start;
  const endDate = searchParams.get('endDate') || defaultDateRange.end;

  const isSingleDay = startDate === endDate;

  const chartData = useMemo(() => {
    const sourceData = dataSource === 'custom' ? customData : advertiserAData;
    let filteredData = sourceData;
    
    // Filter by current advertiser first
    filteredData = sourceData.filter((item: any) => item.name === advertiser);
    
    // If it's a single day, filter data for that specific day
    if (isSingleDay) {
      filteredData = filteredData.filter((item: any) => item.date === startDate);
    } else {
      // If it's multiple days, we need to aggregate data by day (calculate daily average)
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Filter by date range
      const inRangeData = filteredData.filter((item: any) => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });

        // Group by day
        const groupedByDay: Record<string, any[]> = {};
        inRangeData.forEach((item: any) => {
          if (!groupedByDay[item.date]) groupedByDay[item.date] = [];
          groupedByDay[item.date].push(item);
        });

        // Calculate average for each day
        filteredData = Object.keys(groupedByDay).sort().map(dateStr => {
          const dayItems = groupedByDay[dateStr];
          
          // Rule A: If any hour is 'false' (not reflowed), the whole day is considered 'false'
          // However, we only consider valid hours (roi24h is not undefined/null)
          const validDayItems = dayItems.filter(item => item.roi24h !== undefined && item.roi24h !== null);
          const isReflowCompleted = validDayItems.length > 0 && validDayItems.every((item: any) => item.isReflowCompleted === true);
          
          // Calculate averages for numeric fields
          const avgRoiNet = dayItems.reduce((sum, item) => sum + (item.roiNet || 0), 0) / dayItems.length;
          const avgRoi24h = dayItems.reduce((sum, item) => sum + (item.roi24h || 0), 0) / dayItems.length;
          const avgRoiEst24h = dayItems.reduce((sum, item) => sum + (item.roiEst24h || 0), 0) / dayItems.length;

          return {
            date: dateStr, // In daily view, 'date' field acts as the date label
            hour: '00', // Mock hour
            isReflowCompleted: isReflowCompleted,
            roiNet: avgRoiNet,
            roi24h: avgRoi24h,
            roiEst24h: avgRoiEst24h
          };
        });
      }

      const parsedData = filteredData.map((item: any) => {
        const isReflowCompleted = item.isReflowCompleted;
        // If single day, show 'HH:00', if multiple days, show 'YYYY-MM-DD'
        const timeLabel = isSingleDay ? `${item.hour}:00` : item.date;
        
        return {
          time: timeLabel,
          // 综合 ROI 24 小时：青色的实线
          roi_24h: isReflowCompleted ? item.roi24h : null,
          // 综合 ROI 回流中状态：灰色的虚线
          roi_24h_reflowing: !isReflowCompleted ? item.roi24h : null,
          // 预估综合 ROI 24 小时：蓝色的实线
          roi_est_24h: !isReflowCompleted ? item.roiEst24h : null,
          // 综合 ROI 净成交：紫的实线
          roi_net: item.roiNet,
          // 保留原始状态用于连线计算
          _isReflowCompleted: isReflowCompleted,
          _raw_roi: item.roi24h
        };
      });

      // 跨越状态边界时，将前一个点的值补齐，使 Recharts 能够把两根不同的线连接起来
      for (let i = 0; i < parsedData.length - 1; i++) {
        const curr = parsedData[i];
        const next = parsedData[i + 1];
        
        if (curr._isReflowCompleted && !next._isReflowCompleted) {
          // 从“已回流”过渡到“回流中”：让回流中和预估的线从当前（最后一个已回流点）开始画
          curr.roi_24h_reflowing = curr._raw_roi;
          curr.roi_est_24h = curr._raw_roi;
        } else if (!curr._isReflowCompleted && next._isReflowCompleted) {
          // 从“回流中”过渡到“已回流”：让已回流的线从当前（最后一个回流中点）开始画
          curr.roi_24h = curr._raw_roi;
        }
      }

      return parsedData;
  }, [startDate, endDate, isSingleDay, advertiser, customData, dataSource]);

  const hasData = useMemo(() => {
    return {
      roi_24h: selectedMetrics.includes('综合ROI (24小时)') && chartData.some(d => d.roi_24h !== null),
      roi_est_24h: selectedMetrics.includes('预估综合ROI (24小时)') && chartData.some(d => d.roi_est_24h !== null),
      roi_24h_reflowing: selectedMetrics.includes('综合ROI (24小时)') && chartData.some(d => d.roi_24h_reflowing !== null),
      roi_net: selectedMetrics.includes('综合 ROI (净成交)') && chartData.some(d => d.roi_net !== null),
    };
  }, [chartData, selectedMetrics]);

  const { maxRoi, minRoi, ticks } = useMemo(() => {
    let max = 0;
    let min = Infinity;
    chartData.forEach(d => {
      if (hasData.roi_24h && d.roi_24h !== null && d.roi_24h > max) max = d.roi_24h;
      if (hasData.roi_24h && d.roi_24h !== null && d.roi_24h < min) min = d.roi_24h;
      
      if (hasData.roi_est_24h && d.roi_est_24h !== null && d.roi_est_24h > max) max = d.roi_est_24h;
      if (hasData.roi_est_24h && d.roi_est_24h !== null && d.roi_est_24h < min) min = d.roi_est_24h;
      
      if (hasData.roi_24h_reflowing && d.roi_24h_reflowing !== null && d.roi_24h_reflowing > max) max = d.roi_24h_reflowing;
      if (hasData.roi_24h_reflowing && d.roi_24h_reflowing !== null && d.roi_24h_reflowing < min) min = d.roi_24h_reflowing;
      
      if (hasData.roi_net && d.roi_net !== null && d.roi_net > max) max = d.roi_net;
      if (hasData.roi_net && d.roi_net !== null && d.roi_net < min) min = d.roi_net;
    });

    if (min === Infinity) min = 0;

    // Add some padding to top and bottom to make the chart look better
    const padding = (max - min) * 0.1 || 0.5; // at least 0.5 padding if max == min
    const targetMax = Math.ceil((max + padding) * 10) / 10;
    const targetMin = Math.max(0, Math.floor((min - padding) * 10) / 10);

    // Generate 5 evenly spaced ticks
    const step = (targetMax - targetMin) / 4;
    const generatedTicks = [
      targetMin, 
      targetMin + step, 
      targetMin + step * 2, 
      targetMin + step * 3, 
      targetMax
    ];

    return { maxRoi: targetMax, minRoi: targetMin, ticks: generatedTicks };
  }, [chartData, hasData]);

  return (
    <div className="px-6 py-5 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-base font-medium text-gray-900">趋势对比</h2>
          <div className="w-px h-3 bg-gray-300"></div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
            <span className="text-sm text-gray-600">模拟全域综合指标</span>
            <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
          </label>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span>模拟成本项: 电商技术服务费</span>
            <Edit2 className="w-3.5 h-3.5 text-gray-400 cursor-pointer" />
          </div>
        </div>
        <div className="flex items-center space-x-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700">
          <ChevronUp className="w-4 h-4" />
          <span>收起对比</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
        {hasData.roi_24h && (
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-3 h-0.5 bg-cyan-400"></div>
            <span className="text-sm text-gray-600">综合ROI (24小时)</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
        {hasData.roi_est_24h && (
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-3 h-0.5 bg-blue-600"></div>
            <span className="text-sm text-gray-600">预估综合ROI (24小时)</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
        )}
        {hasData.roi_24h_reflowing && (
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-3 h-0.5 bg-gray-400 border-t border-dashed border-gray-400"></div>
            <span className="text-sm text-gray-600">综合ROI (24小时) - 回流中</span>
          </div>
        )}
        {hasData.roi_net && (
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span className="text-sm text-gray-600">综合ROI (净成交)</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="text-xs text-gray-400 absolute -top-4 left-0">综合ROI</div>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                dy={10}
                interval={isSingleDay ? 0 : 'preserveStartEnd'}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                domain={[minRoi, maxRoi]}
                ticks={ticks}
                type="number"
                scale="linear"
                tickFormatter={(val) => val.toFixed(2)}
              />
              <Tooltip 
                formatter={(value: any, name: any) => {
                  const nameStr = String(name || '');
                  const nameMap: Record<string, string> = {
                    'roi_24h': '综合ROI (24小时)',
                    'roi_est_24h': '预估综合ROI (24小时)',
                    'roi_24h_reflowing': '综合ROI (24小时) - 回流中',
                    'roi_net': '综合ROI (净成交)'
                  };
                  const valNum = typeof value === 'number' ? value : parseFloat(String(value));
                  return [valNum.toFixed(2), nameMap[nameStr] || nameStr];
                }}
              />
              {hasData.roi_24h && <Line type="monotone" dataKey="roi_24h" stroke="#06b6d4" strokeWidth={2} dot={false} connectNulls={true} />}
              {hasData.roi_est_24h && <Line type="monotone" dataKey="roi_est_24h" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls={true} />}
              {hasData.roi_24h_reflowing && <Line type="monotone" dataKey="roi_24h_reflowing" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls={true} />}
              {hasData.roi_net && <Line type="monotone" dataKey="roi_net" stroke="#a855f7" strokeWidth={2} dot={false} connectNulls={true} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="flex items-center mt-4">
        <div className="text-xs text-gray-500 w-12">投放<br/>动作</div>
        <div className="flex-1 border-t border-dashed border-gray-200 ml-2"></div>
      </div>
    </div>
  );
};