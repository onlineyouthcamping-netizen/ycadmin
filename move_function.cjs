const fs = require('fs');
const file = '/Users/parthpatel/Documents/youthcamping_os/ycadmin/src/components/admin/BookingDetailsView.tsx';
let content = fs.readFileSync(file, 'utf8');

const functionStart = '    const generatePerPersonBookingItems = (bookingObj: any, personsList: any[], resObj: any): any[] => {';
const functionEnd = '      return items;\n    };\n';

const startIndex = content.indexOf(functionStart);
if (startIndex === -1) {
  console.log('Function not found!');
  process.exit(1);
}

const endIndex = content.indexOf(functionEnd, startIndex) + functionEnd.length;
const functionContent = content.substring(startIndex, endIndex);

// Remove the function from its current location
content = content.substring(0, startIndex) + content.substring(endIndex);

// Find insert point
const insertStr = '  useEffect(() => {\n    setLoadingPayments(true);';
const insertPoint = content.indexOf(insertStr);
if (insertPoint === -1) {
    // Try to find the start of the useEffect by `setLoadingPayments(true);`
    const p2 = content.indexOf('setLoadingPayments(true);');
    const p3 = content.lastIndexOf('useEffect(() => {', p2);
    if (p3 === -1) {
        console.log('Fallback Insert point not found!');
        process.exit(1);
    }
    
    const formattedFunction = functionContent.replace(/^    /gm, '  ');
    content = content.substring(0, p3) + formattedFunction + '\n' + content.substring(p3);
} else {
    const formattedFunction = functionContent.replace(/^    /gm, '  ');
    content = content.substring(0, insertPoint) + formattedFunction + '\n' + content.substring(insertPoint);
}


fs.writeFileSync(file, content);
console.log('Successfully moved generatePerPersonBookingItems!');
