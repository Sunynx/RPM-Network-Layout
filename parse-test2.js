const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');

const filePath = path.join(__dirname, '../New pdf/Ayuvana+ClinicProject+Report.pdf');

const pdfParser = new PDFParser(this, 1); // 1 = raw text content

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));
pdfParser.on("pdfParser_dataReady", pdfData => {
  const rawText = pdfParser.getRawTextContent();
  console.log(rawText.substring(1000, 3000));
});

pdfParser.loadPDF(filePath);
