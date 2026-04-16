import { X, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import advertiserAData from '../data/advertiserA.json';
import * as XLSX from 'xlsx';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export const DebugModal = () => {
  const { isDebugModalOpen, setIsDebugModalOpen, advertiser, setAdvertiser, dataSource, setDataSource, setCustomData, customData } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [searchParams, setSearchParams] = useSearchParams();

  if (!isDebugModalOpen) return null;
  
  const builtinAdvertisers = Array.from(new Set(advertiserAData.map(d => d.name).filter(Boolean)));
  const customAdvertisers = Array.from(new Set(customData.map(d => d.name).filter(Boolean)));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Debug: log the first row's keys to identify column names
        if (data.length > 0) {
          console.log('=== Excel Column Keys ===', Object.keys(data[0] as object));
          console.log('=== First Row Sample ===', data[0]);
        }

        const parsedData = data.map((row: any) => {
          // Extract date from 'hour' field (format: '2026-04-01 00') or '日期' field
          let dateStr = '';
          let hourStr = '00';
          
          const hourVal = row['hour'];
          if (hourVal && typeof hourVal === 'string' && hourVal.includes(' ')) {
            const parts = hourVal.split(' ');
            dateStr = parts[0];
            hourStr = parts[1] ? parts[1].padStart(2, '0') : '00';
          } else if (hourVal && typeof hourVal === 'number') {
            dateStr = String(hourVal).substring(0, 10);
            hourStr = String(hourVal).substring(11, 13).padStart(2, '0') || '00';
          } else {
            dateStr = row['日期'];
            if (typeof dateStr === 'number') {
              const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
              dateStr = date.toISOString().split('T')[0];
            }
            hourStr = String(row['hour'] || '0').padStart(2, '0');
          }

          return {
            name: row['name'] || file.name.replace('.xlsx', ''),
            date: dateStr,
            hour: hourStr,
            isReflowed: row['是否回流完'],
            isReflowCompleted: row['是否回流完'] === '是',
            roiNet: parseFloat(row['综合ROI（净成交）']) || parseFloat(row['综合 ROI（净成交）']) || parseFloat(row['综合 ROI (净成交)']) || 0,
            roi24h: parseFloat(row['24小时综合ROI']) || parseFloat(row['24小时综合 ROI']) || 0,
            roiEst24h: parseFloat(row['预估24小时综合ROI']) || parseFloat(row['预估综合ROI (24小时)']) || 0,
            totalAmount: parseFloat(row['整体成交金额']) || 0,
            settlement24h: parseFloat(row['24小时结算金额']) || 0,
            netAmount: parseFloat(row['净成交金额']) || 0,
            totalCost: parseFloat(row['综合成本']) || 0
          };
        });

        setCustomData(parsedData);
        
        // Debug: log parsed data sample
        if (parsedData.length > 0) {
          console.log('=== Parsed Data Sample ===', parsedData[0]);
          console.log('=== Parsed Data Total Rows ===', parsedData.length);
        }
        
        const uploadedNames = Array.from(new Set(parsedData.map((d: any) => d.name).filter(Boolean)));
        if (uploadedNames.length > 0) {
          const defaultAdv = uploadedNames[0] as string;
          setDataSource('custom');
          setAdvertiser(defaultAdv);
          
          // Auto select the latest date range for the new advertiser
          const advData = parsedData.filter((d: any) => d.name === defaultAdv);
          if (advData.length > 0) {
            const dates = Array.from(new Set(advData.map((d: any) => d.date).filter(Boolean))).sort();
            if (dates.length > 0) {
              const latestDate = dates[dates.length - 1];
              const newParams = new URLSearchParams(searchParams);
              newParams.set('startDate', latestDate as string);
              newParams.set('endDate', latestDate as string);
              setSearchParams(newParams);
            }
          }
        }
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('解析 Excel 文件失败，请检查格式');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAdvertiserChange = (source: 'builtin' | 'custom', name: string) => {
    setDataSource(source);
    setAdvertiser(name);

    // Auto select the latest date range for the new advertiser
    const dataList = source === 'builtin' ? advertiserAData : customData;
    const advData = dataList.filter((d: any) => d.name === name);
    if (advData.length > 0) {
      const dates = Array.from(new Set(advData.map((d: any) => d.date).filter(Boolean))).sort();
      if (dates.length > 0) {
        const latestDate = dates[dates.length - 1];
        const newParams = new URLSearchParams(searchParams);
        newParams.set('startDate', latestDate as string);
        newParams.set('endDate', latestDate as string);
        setSearchParams(newParams);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-[400px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">调试数据设置</h3>
          <button 
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={() => setIsDebugModalOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择广告主预设数据
            </label>
            <div className="space-y-3">
              {builtinAdvertisers.map(name => (
                <label key={name as string} className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name="advertiser" 
                    value={name as string}
                    checked={dataSource === 'builtin' && advertiser === name}
                    onChange={() => handleAdvertiserChange('builtin', name as string)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{name as string}</span>
                </label>
              ))}

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="advertiser" 
                    value="custom"
                    checked={dataSource === 'custom'}
                    onChange={() => setDataSource('custom')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-900 font-medium">上传自定义 Excel 数据</span>
                    
                    {dataSource === 'custom' && customAdvertisers.length > 0 && (
                      <div className="mt-3 pl-2 space-y-2 border-l-2 border-blue-100">
                        {customAdvertisers.map(name => (
                          <label key={`custom-${name}`} className="flex items-center space-x-3 cursor-pointer">
                            <input 
                              type="radio" 
                              name="customAdvertiser" 
                              value={name as string}
                              checked={advertiser === name}
                              onChange={() => handleAdvertiserChange('custom', name as string)}
                              className="w-4 h-4 text-blue-400 focus:ring-blue-500 border-gray-300"
                            />
                            <span className="text-sm text-gray-700">{name as string}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    <div 
                      className={`mt-3 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors ${
                        dataSource === 'custom' ? 'border-blue-400 bg-blue-50/30' : 'border-gray-300 bg-gray-50 group-hover:bg-gray-100'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className={`w-5 h-5 mb-1 ${dataSource === 'custom' ? 'text-blue-500' : 'text-gray-400'}`} />
                      <span className="text-xs text-gray-500 text-center">
                        {fileName ? (
                          <span className="text-blue-600 font-medium break-all line-clamp-1">{fileName}</span>
                        ) : (
                          "点击上传 Excel 文件 (.xlsx)"
                        )}
                      </span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 text-blue-700 text-xs p-3 rounded mt-6">
            切换广告主后，页面的核心指标、数据表格和趋势图将会更新为对应的模拟数据。
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
            onClick={() => setIsDebugModalOpen(false)}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
};
