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

// Insert the function right before the useEffect that starts around line 400
const insertPoint = content.indexOf('  useEffect(() => {\n    setLoadingPayments(true);');
if (insertPoint === -1) {
  console.log('Insert point not found!');
  process.exit(1);
}

// Ensure proper spacing and indentation
const formattedFunction = functionContent.replace(/^    /gm, '  ');

content = content.substring(0, insertPoint) + formattedFunction + '\n' + content.substring(insertPoint);

fs.writeFileSync(file, content);
console.log('Successfully moved generatePerPersonBookingItems!');
