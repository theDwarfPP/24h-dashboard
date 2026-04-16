import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface MetricsState {
  realSettlement: number;
  estTotalAmount: number;
  estRefund: number;
  cost: number;
  estROI: number; // 预估综合ROI (24小时)
  allReflowed?: boolean; // 选定周期内数据是否已全部回流
}

interface AppContextType {
  dataSource: 'builtin' | 'custom';
  setDataSource: (source: 'builtin' | 'custom') => void;
  advertiser: string;
  setAdvertiser: (adv: string) => void;
  isDebugModalOpen: boolean;
  setIsDebugModalOpen: (isOpen: boolean) => void;
  metrics: MetricsState;
  setMetrics: (metrics: MetricsState | ((prev: MetricsState) => MetricsState)) => void;
  selectedMetrics: string[];
  toggleMetricSelection: (metricTitle: string) => void;
  customData: any[];
  setCustomData: (data: any[]) => void;
  defaultDateRange: {start: string, end: string};
  setDefaultDateRange: (range: {start: string, end: string}) => void;
}

import advertiserAData from '../data/advertiserA.json';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [dataSource, setDataSource] = useState<'builtin' | 'custom'>('builtin');
  const [advertiser, setAdvertiser] = useState<string>(advertiserAData[0]?.name || 'Ufeel家居旗舰店');
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>({
    realSettlement: 0,
    estTotalAmount: 0,
    estRefund: 0,
    cost: 0,
    estROI: 0
  });
  const [customData, setCustomData] = useState<any[]>([]);
  const [defaultDateRange, setDefaultDateRange] = useState<{start: string, end: string}>({
    start: '2026-04-01',
    end: '2026-04-03'
  });
  // 默认选中需要展示趋势图的几项指标
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    '综合ROI (24小时)', 
    '预估综合ROI (24小时)',
    '综合 ROI (净成交)'
  ]);

  const toggleMetricSelection = (metricTitle: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricTitle) 
        ? prev.filter(m => m !== metricTitle)
        : [...prev, metricTitle]
    );
  };

  return (
    <AppContext.Provider value={{ 
      dataSource,
      setDataSource,
      advertiser, 
      setAdvertiser, 
      isDebugModalOpen, 
      setIsDebugModalOpen,
      metrics,
      setMetrics,
      selectedMetrics,
      toggleMetricSelection,
      customData,
      setCustomData,
      defaultDateRange,
      setDefaultDateRange
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
