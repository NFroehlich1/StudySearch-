import fs from 'fs/promises';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, '..');
const pdfPath = path.join(projectRoot, 'public', 'course-handbook.pdf');
const modulesFile = path.join(projectRoot, 'public', 'modules_pages.txt');
const outputFile = path.join(projectRoot, 'public', 'modules_metadata.json');

function parseModules(text) {
  const cleaned = text.replace(/^Modules\s*/i, '');
  const entries = [];
  const regex = /([^_]+?)_(\d+)(?:\s+|$)/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    const name = match[1].trim();
    const page = parseInt(match[2], 10);
    if (name && !Number.isNaN(page)) {
      entries.push({ name, listedPage: page });
    }
  }
  return entries;
}

async function getPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(' ');
}

function extractCredits(text) {
  const ectsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ECTS|CP)/i);
  if (ectsMatch) {
    const value = parseFloat(ectsMatch[1]);
    if (!Number.isNaN(value)) {
      return value;
    }
  }
  return null;
}

(async () => {
  const modulesRaw = await fs.readFile(modulesFile, 'utf-8');
  const modules = parseModules(modulesRaw);
  console.log(`Parsed ${modules.length} modules from list.`);

  const data = new Uint8Array(await fs.readFile(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  console.log(`Loaded PDF with ${pdf.numPages} pages.`);

  const metadata = [];
  let missingCount = 0;

  for (const module of modules) {
    let foundPage = null;
    let pageText = '';

    const minPage = Math.max(1, module.listedPage - 15);
    const maxPage = Math.min(pdf.numPages, module.listedPage + 15);
    for (let pageNumber = minPage; pageNumber <= maxPage; pageNumber += 1) {
      const text = await getPageText(pdf, pageNumber);
      if (text.toLowerCase().includes(module.name.toLowerCase())) {
        foundPage = pageNumber;
        pageText = text;
        break;
      }
    }

    if (!foundPage) {
      missingCount += 1;
      metadata.push({ name: module.name, listedPage: module.listedPage, actualPage: null, ects: null });
      console.warn(`Could not locate module page for "${module.name}" (listed page ${module.listedPage}).`);
      continue;
    }

    const ects = extractCredits(pageText);

    metadata.push({
      name: module.name,
      listedPage: module.listedPage,
      actualPage: foundPage,
      ects,
    });
  }

  await fs.writeFile(outputFile, JSON.stringify({ generatedAt: new Date().toISOString(), modules: metadata }, null, 2));
  console.log(`Saved metadata for ${metadata.length} modules to ${outputFile}. Missing pages: ${missingCount}`);
})();
