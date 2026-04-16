import { createContext, useContext, useState, ReactNode } from 'react';

type AdvertiserType = 'default' | 'advertiser_a' | 'advertiser_b' | 'custom';

export interface MetricsState {
  realSettlement: number;
  estTotalAmount: number;
  estRefund: number;
  cost: number;
  estROI: number; // 预估综合ROI (24小时)
  allReflowed?: boolean; // 选定周期内数据是否已全部回流
}

const defaultMetrics: Record<AdvertiserType, MetricsState> = {
  default: {
    realSettlement: 3300.99,
    estTotalAmount: 3300.99,
    estRefund: 300.98,
    cost: 1162.79,
    estROI: 2.58
  },
  advertiser_a: {
    realSettlement: 18300.99,
    estTotalAmount: 18300.99,
    estRefund: 1300.98,
    cost: 3162.79,
    estROI: 4.50
  },
  advertiser_b: {
    realSettlement: 1300.99,
    estTotalAmount: 1300.99,
    estRefund: 300.98,
    cost: 862.79,
    estROI: 1.98
  },
  custom: {
    realSettlement: 0,
    estTotalAmount: 0,
    estRefund: 0,
    cost: 0,
    estROI: 0
  }
};

interface AppContextType {
  advertiser: AdvertiserType;
  setAdvertiser: (adv: AdvertiserType) => void;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [advertiser, setAdvertiser] = useState<AdvertiserType>('advertiser_a');
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>(defaultMetrics['advertiser_a']);
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

  const handleSetAdvertiser = (adv: AdvertiserType) => {
    setAdvertiser(adv);
    setMetrics(defaultMetrics[adv]);
  };

  const toggleMetricSelection = (metricTitle: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricTitle) 
        ? prev.filter(m => m !== metricTitle)
        : [...prev, metricTitle]
    );
  };

  return (
    <AppContext.Provider value={{ 
      advertiser, 
      setAdvertiser: handleSetAdvertiser, 
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
