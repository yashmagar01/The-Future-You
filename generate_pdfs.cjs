const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const files = [
    { input: 'privacy-policy.html', output: 'privacy-policy.pdf' },
    { input: 'terms.html', output: 'terms.pdf' }
  ];

  for (const file of files) {
    const inputPath = path.join(__dirname, 'docs', file.input);
    const outputPath = path.join(__dirname, 'docs', file.output);

    if (fs.existsSync(inputPath)) {
      console.log(`Generating ${file.output}...`);
      const fileUrl = `file://${inputPath}`;
      await page.goto(fileUrl, { waitUntil: 'networkidle0' });
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      console.log(`Generated ${outputPath}`);
    } else {
      console.warn(`Input file not found: ${inputPath}`);
    }
  }

  await browser.close();
})();
