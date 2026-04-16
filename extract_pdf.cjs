const fs = require('fs');
const pdf = require('pdf-parse');

console.log('pdf object:', pdf);
console.log('pdf type:', typeof pdf);

let dataBuffer = fs.readFileSync('Comprehensive Personality Assessment-Tom_Knoesen.pdf');

const parsePdf = typeof pdf === 'function' ? pdf : (pdf.default || pdf);

if (typeof parsePdf !== 'function') {
    console.error('parsePdf is not a function after check');
    process.exit(1);
}

parsePdf(dataBuffer).then(function(data) {
    fs.writeFileSync('extracted_pdf_text.txt', data.text);
    console.log('Text extracted successfully to extracted_pdf_text.txt');
}).catch(err => {
    console.error('Error extracting PDF:', err);
});
