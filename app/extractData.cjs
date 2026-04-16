const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('../客户数据上传.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const rawData = xlsx.utils.sheet_to_json(worksheet);

const parsedData = rawData.map(item => {
  const [datePart, hourPart] = item.hour.split(' ');
  return {
    name: item['name'], // Added advertiser name from Excel
    date: datePart,
    hour: hourPart,
    isReflowCompleted: item['是否回流完'] === '是',
    roiNet: item['综合ROI（净成交）'],
    roi24h: item['24小时综合ROI'],
    roiEst24h: item['预估24小时综合ROI'],
    // New monetary fields
    totalAmount: item['整体成交金额'],
    settlement24h: item['24小时结算金额'],
    netAmount: item['净成交金额'],
    totalCost: item['综合成本']
  };
});

fs.writeFileSync('./src/data/advertiserA.json', JSON.stringify(parsedData, null, 2));
console.log('Data successfully extracted and parsed to src/data/advertiserA.json with new monetary fields');