const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

async function run() {
  const filePath = path.join(__dirname, '../MarinaWIFIProject+Report.pdf');
  const dataBuffer = fs.readFileSync(filePath);
  
  try {
    const data = await pdf(dataBuffer);
    const text = data.text;
    console.log("PDF TEXT PREVIEW:");
    console.log(text.substring(0, 1500));
  } catch(e) {
    console.error(e);
  }
}

run();
