// Quick script to extract student data from seating_plan.html
const fs = require('fs');

const html = fs.readFileSync('seating_plan.html',  'utf8');
const startMarker = 'const studentsData = ';
const startIndex = html.indexOf(startMarker) + startMarker.length;
const endIndex = html.indexOf('];', startIndex) + 1;

const jsonData = html.substring(startIndex, endIndex);
fs.writeFileSync('data/students.json', jsonData, 'utf8');

console.log('Extracted student data to data/students.json');
console.log(`File size: ${(jsonData.length / 1024 / 1024).toFixed(2)} MB`);
