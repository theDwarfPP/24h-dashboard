import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { EditableValue } from './EditableValue';

export const KeyMetrics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dataType = searchParams.get('dataType') || 'estimated';
  const isRealData = dataType === 'real';
  const { metrics, setMetrics } = useAppContext();

  // Helper functions for parsing and formatting numbers
  const parseNumber = (str: string) => parseFloat(str.replace(/,/g, '')) || 0;
  const formatNumber = (num: number) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calculate Tech Fee: 3% of total amount
  const calculatedTechFee = metrics.estTotalAmount * 0.03;

  // Calculate dynamic ROI
  // Changed calculatedRealROI formula to accurately reflect: 24h Settlement / Total Cost
  const calculatedRealROI = metrics.cost > 0 ? (metrics.realSettlement / metrics.cost) : 0;
  
  // 限制预估综合 ROI 24小时 不能大于 真实综合 ROI 24小时
  const effectiveEstROI = Math.min(metrics.estROI, calculatedRealROI);
  
  // Calculate estimated settlement and refund based on DataGrid values
  const calculatedEstSettlement = metrics.cost * effectiveEstROI;
  const calculatedEstRefund = metrics.estTotalAmount - calculatedEstSettlement;
  
  // Calculate estimated settlement rate: (Estimated Settlement / Total Amount) * 100
  const calculatedEstSettlementRate = metrics.estTotalAmount > 0 ? (calculatedEstSettlement / metrics.estTotalAmount) * 100 : 0;

  const handleMetricChange = (key: keyof typeof metrics, valueStr: string) => {
    const value = parseNumber(valueStr);
    setMetrics(prev => ({ ...prev, [key]: value }));
  };

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [calculationScheme, setCalculationScheme] = useState<'subtraction' | 'multiplication'>('subtraction');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (type: 'estimated' | 'real') => {
    setSearchParams({ dataType: type });
    setIsDropdownOpen(false);
  };

  return (
    <div className="px-6 py-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-base font-medium text-gray-900">重点数据概览</h2>
          <div className="w-px h-3 bg-gray-300 mx-2"></div>
          
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center space-x-1 cursor-pointer hover:bg-gray-50 px-1.5 py-1 rounded"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-sm text-gray-800">{isRealData ? '真实数据' : '预估数据'}</span>
              {!isRealData && (
                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">推荐关注</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10 py-1">
                <div 
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${!isRealData ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                  onClick={() => handleSelect('estimated')}
                >
                  预估数据
                </div>
                <div 
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${isRealData ? 'text-blue-600 bg-blue-50/50' : 'text-gray-700'}`}
                  onClick={() => handleSelect('real')}
                >
                  真实数据
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <div className="w-5 h-5 rounded-full bg-yellow-400 text-white flex items-center justify-center text-xs mr-2 shadow-sm">¥</div>
          统计周期内，预估可减免电商技术服务费 <span className="text-orange-500 font-medium ml-1 text-base">{formatNumber(calculatedTechFee)} 元</span>
        </div>
      </div>

      <div className="flex items-stretch gap-6">
        {/* Left Card */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="bg-[#f8f9fe] px-4 py-2.5 border-b border-gray-100 flex items-center">
            <span className="text-sm font-medium text-gray-800 border-b border-dashed border-gray-400 pb-0.5">
              {isRealData ? '综合ROI (24小时)' : '预估综合ROI (24小时)'}
            </span>
          </div>
          <div className="p-4 flex items-center space-x-2 flex-1">
            {isRealData ? (
              <>
                <span className="text-2xl font-semibold text-gray-900">
                  <EditableValue 
                    value={formatNumber(calculatedRealROI)} 
                    renderCustom={(val) => {
                      const [int, dec] = val.split('.');
                      return <>{int}<span className="text-lg">{dec ? `.${dec}` : ''}</span></>;
                    }}
                  />
                </span>
                <span className="text-sm text-red-500"><EditableValue initialValue="+9.65%" /></span>
              </>
            ) : (
              <>
                <span className="text-2xl font-semibold text-gray-900">
                  <EditableValue 
                    value={formatNumber(effectiveEstROI)} 
                    onChange={(v) => handleMetricChange('estROI', v)}
                    renderCustom={(val) => {
                      const [int, dec] = val.split('.');
                      return <>{int}<span className="text-lg">{dec ? `.${dec}` : ''}</span></>;
                    }}
                  />
                </span>
                <span className="text-sm text-red-500"><EditableValue initialValue="+5.89%" /></span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-sm self-center">
          =
        </div>

        {/* Middle Card */}
        {isRealData ? (
          <div className="flex-[2.5] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
            <div className="bg-[#f8f9fe] px-4 py-2.5 border-b border-gray-100 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-800 border-b border-dashed border-gray-400 pb-0.5">24小时结算金额</span>
              <span className="text-xs text-gray-400 ml-2">真实数据，部分退款未发生，数据虚高</span>
            </div>
            <div className="p-4 flex items-center flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-semibold text-gray-900">
                  <EditableValue 
                    value={formatNumber(metrics.realSettlement)}
                    onChange={(v) => handleMetricChange('realSettlement', v)}
                    renderCustom={(val) => {
                      const [int, dec] = val.split('.');
                      return <>{int}<span className="text-lg">{dec ? `.${dec}` : ''}</span></>;
                    }}
                  />
                </span>
                <span className="text-sm text-red-500"><EditableValue initialValue="+1.38%" /></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-[2.5] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
            <div className="bg-[#f8f9fe] px-4 py-2.5 border-b border-gray-100 flex items-center space-x-2">
              <span 
                className="text-sm font-medium text-gray-800 border-b border-dashed border-gray-400 pb-0.5 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => setCalculationScheme(prev => prev === 'subtraction' ? 'multiplication' : 'subtraction')}
                title="点击切换计算方案"
              >
                预估24小时结算金额(元)
              </span>
              <span className="text-xs text-gray-400 ml-2">根据历史情况，剔除24小时预计退款</span>
              <div className="flex items-center text-xs text-blue-500 cursor-pointer ml-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                  <g clipPath="url(#clip0_1456_300252)">
                    <mask id="mask0_1456_300252" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                      <rect width="24" height="24" fill="#D9D9D9"></rect>
                    </mask>
                    <g mask="url(#mask0_1456_300252)"></g>
                    <path d="M9.1311 14.303H8.92757C8.29539 14.303 7.7804 13.791 7.7804 13.1558V10.8399C7.7804 10.2077 8.29231 9.69269 8.92757 9.69269H9.1311C9.76327 9.69269 10.2783 10.2046 10.2783 10.8399V13.1558C10.2752 13.791 9.76327 14.303 9.1311 14.303Z" fill="#43466C"></path>
                    <path d="M14.7501 14.303H14.5158C13.8805 14.303 13.3624 13.788 13.3624 13.1496V10.846C13.3624 10.2108 13.8774 9.69269 14.5158 9.69269H14.7501C15.3854 9.69269 15.9035 10.2077 15.9035 10.846V13.1496C15.9035 13.788 15.3885 14.303 14.7501 14.303Z" fill="#43466C"></path>
                    <path d="M17.9872 9.19007C19.2423 12.4651 17.9471 14.9352 16.766 16.3568C20.1273 15.0709 21.9499 11.1113 21.0895 7.51557C20.1489 3.60841 16.1955 1.43742 12.35 1.78897C8.64021 2.1251 5.79696 3.91679 5.50708 4.32693C9.15829 4.31459 15.9858 3.96613 17.9872 9.19007Z" fill="url(#paint0_radial_1456_300252)"></path>
                    <path d="M5.46072 14.6699C4.25187 11.5645 5.69509 8.63487 6.64798 7.67273C3.28664 8.95559 1.60906 12.5729 2.46944 16.1686C3.40691 20.0757 7.34183 22.3948 11.1842 22.0154C15.7297 21.5683 17.2655 19.8321 17.7558 19.351C13.8579 19.7519 7.29866 19.3881 5.46072 14.6699Z" fill="url(#paint1_radial_1456_300252)"></path>
                    <path d="M22.4711 11.102C22.3909 10.0011 21.9992 8.34204 21.4164 7.18253C20.4943 5.35385 18.7181 3.52824 18.015 3.19519C20.1058 4.99304 20.8151 7.76537 20.556 9.49229C19.4304 16.9921 9.39886 16.7731 7.63493 19.5331C7.08293 20.3966 7.14153 21.2785 7.44991 22.0248C7.69661 22.62 8.46756 23.2676 9.08123 23.4249C11.3231 24.0015 15.2982 22.4134 17.2594 21.1398C20.6516 18.9256 22.7794 15.3669 22.4711 11.102Z" fill="url(#paint2_linear_1456_300252)"></path>
                    <path d="M1.24214 12.7269C1.32232 13.8278 1.71396 15.4869 2.2968 16.6464C3.21577 18.4782 4.99203 20.3007 5.69822 20.6338C3.60741 18.8359 2.89814 16.0636 3.15717 14.3367C4.28276 6.83688 14.3143 7.05583 16.0783 4.29584C16.6303 3.43237 16.5717 2.55041 16.2633 1.80413C16.0166 1.20896 15.2456 0.561364 14.632 0.404091C12.39 -0.172579 8.41504 1.41557 6.45375 2.68918C3.06158 4.90334 0.930676 8.46512 1.24214 12.7269Z" fill="url(#paint3_linear_1456_300252)"></path>
                  </g>
                  <defs>
                    <radialGradient id="paint0_radial_1456_300252" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(7.31063 1.07294) scale(22.9394)">
                      <stop offset="0.2312" stopColor="#FF84B4"></stop>
                      <stop offset="0.3249" stopColor="#FC81B2"></stop>
                      <stop offset="0.4075" stopColor="#F476AC"></stop>
                      <stop offset="0.4858" stopColor="#E764A3"></stop>
                      <stop offset="0.5615" stopColor="#D34A95"></stop>
                      <stop offset="0.6353" stopColor="#BB2A84"></stop>
                      <stop offset="0.7068" stopColor="#9D026F"></stop>
                      <stop offset="0.7102" stopColor="#9B006E"></stop>
                    </radialGradient>
                    <radialGradient id="paint1_radial_1456_300252" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(10.9028 22.0075) scale(13.6939)">
                      <stop offset="0.000245127" stopColor="#4B80EA"></stop>
                      <stop offset="0.2509" stopColor="#467CE5"></stop>
                      <stop offset="0.5378" stopColor="#396FD7"></stop>
                      <stop offset="0.8415" stopColor="#2359C1"></stop>
                      <stop offset="0.8596" stopColor="#2158BF"></stop>
                    </radialGradient>
                    <linearGradient id="paint2_linear_1456_300252" x1="5.34232" y1="22.2139" x2="30.4258" y2="1.80918" gradientUnits="userSpaceOnUse">
                      <stop offset="0.083" stopColor="#FFE696"></stop>
                      <stop offset="0.377" stopColor="#F27389"></stop>
                      <stop offset="0.4626" stopColor="#ED708F"></stop>
                      <stop offset="0.5819" stopColor="#DE66A1"></stop>
                      <stop offset="0.7203" stopColor="#C657BF"></stop>
                      <stop offset="0.8564" stopColor="#A845E3"></stop>
                    </linearGradient>
                    <linearGradient id="paint3_linear_1456_300252" x1="2.81188" y1="14.2726" x2="17.4073" y2="2.39271" gradientUnits="userSpaceOnUse">
                      <stop offset="0.275" stopColor="#4D80F4"></stop>
                      <stop offset="0.5617" stopColor="#6BC4FF"></stop>
                      <stop offset="0.6527" stopColor="#71CAFD"></stop>
                      <stop offset="0.7747" stopColor="#80DBF7"></stop>
                      <stop offset="0.9137" stopColor="#9AF7EE"></stop>
                      <stop offset="0.9484" stopColor="#A1FFEB"></stop>
                    </linearGradient>
                    <clipPath id="clip0_1456_300252">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
                什么是预估数据
              </div>
            </div>
            
            <div className="p-4 flex items-center flex-1">
              <div className="flex items-center space-x-2 shrink-0 pr-2">
                <span className="text-2xl font-semibold text-gray-900">
                  <EditableValue 
                    value={formatNumber(calculatedEstSettlement)}
                    renderCustom={(val) => {
                      const [int, dec] = val.split('.');
                      return <>{int}<span className="text-lg">{dec ? `.${dec}` : ''}</span></>;
                    }}
                  />
                </span>
                <span className="text-sm text-red-500 whitespace-nowrap"><EditableValue initialValue="+2.32%" /></span>
              </div>
              <div className="text-gray-400 font-medium mx-2 shrink-0">=</div>
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className="flex flex-col">
                  <div className="inline-block border-b border-dashed border-gray-400 pb-0.5 mb-1">
                    <span className="text-xs text-gray-600">整体成交金额(元)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      <EditableValue 
                        value={formatNumber(metrics.estTotalAmount)}
                        onChange={(v) => handleMetricChange('estTotalAmount', v)}
                        renderCustom={(val) => {
                          const [int, dec] = val.split('.');
                          return <>{int}<span className="text-sm">{dec ? `.${dec}` : ''}</span></>;
                        }}
                      />
                    </span>
                    <span className="text-xs text-green-500"><EditableValue initialValue="-1.22%" /></span>
                  </div>
                </div>
                <div className="text-gray-400 font-medium">{calculationScheme === 'subtraction' ? '-' : '×'}</div>
                <div className="flex flex-col">
                  <div className="inline-block border-b border-dashed border-gray-400 pb-0.5 mb-1">
                    <span className="text-xs text-gray-600">{calculationScheme === 'subtraction' ? '预估24小时退款(元)' : '预估结算率'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {calculationScheme === 'subtraction' ? (
                        <EditableValue 
                          value={formatNumber(calculatedEstRefund)}
                          renderCustom={(val) => {
                            const [int, dec] = val.split('.');
                            return <>{int}<span className="text-sm">{dec ? `.${dec}` : ''}</span></>;
                          }}
                        />
                      ) : (
                        <EditableValue 
                          value={formatNumber(calculatedEstSettlementRate) + '%'}
                          renderCustom={(val) => {
                            const [int, dec] = val.replace('%', '').split('.');
                            return <>{int}<span className="text-sm">{dec ? `.${dec}` : ''}%</span></>;
                          }}
                        />
                      )}
                    </span>
                    <span className="text-xs text-red-500"><EditableValue initialValue="+2.32%" /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-600 font-bold text-sm self-center">
          ÷
        </div>

        {/* Right Card */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm">
          <div className="bg-[#f8f9fe] px-4 py-2.5 border-b border-gray-100 flex items-center">
            <span className="text-sm font-medium text-gray-800 border-b border-dashed border-gray-400 pb-0.5">
              综合成本(元)
            </span>
          </div>
          <div className="p-4 flex items-center space-x-2 flex-1">
            <span className="text-2xl font-semibold text-gray-900">
              <EditableValue 
                value={formatNumber(metrics.cost)}
                onChange={(v) => handleMetricChange('cost', v)}
                renderCustom={(val) => {
                  const [int, dec] = val.split('.');
                  return <>{int}<span className="text-lg">{dec ? `.${dec}` : ''}</span></>;
                }}
              />
            </span>
            <span className="text-sm text-red-500"><EditableValue initialValue="+1.38%" /></span>
          </div>
        </div>
      </div>
    </div>
  );
};