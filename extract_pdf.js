import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('Comprehensive Personality Assessment-Tom_Knoesen.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('extracted_pdf_text.txt', data.text);
    console.log('Text extracted successfully to extracted_pdf_text.txt');
}).catch(err => {
    console.error('Error extracting PDF:', err);
});
