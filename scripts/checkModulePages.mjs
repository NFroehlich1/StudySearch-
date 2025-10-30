import fs from 'fs/promises';
import path from 'path';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, '..');
const pdfPath = path.join(projectRoot, 'public', 'course-handbook.pdf');
const modulesFile = path.join(projectRoot, 'public', 'modules_pages.txt');
const PAGE_OFFSET = -2;

function parseModules(text) {
  const entries = [];
  const regex = /([^_]+?)_(\d+)(?:\s+|$)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const page = parseInt(match[2], 10);
    if (name && !Number.isNaN(page)) {
      entries.push({ name, page });
    }
  }
  return entries;
}

async function getPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(' ');
}

function extractEcts(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*ECTS/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

(async () => {
  const modulesRaw = await fs.readFile(modulesFile, 'utf-8');
  const modules = parseModules(modulesRaw);
  console.log(`Parsed ${modules.length} modules`);

  const data = new Uint8Array(await fs.readFile(pdfPath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  const samples = ['Machine Learning - Basic Methods', 'Machine Learning 2', 'Thermal Turbomachines I'];

  for (const sample of samples) {
    const entry = modules.find((m) => m.name === sample);
    if (!entry) {
      console.log(`Module not found: ${sample}`);
      continue;
    }

    const adjustedPage = Math.max(1, entry.page + PAGE_OFFSET);
    const text = await getPageText(pdf, adjustedPage);
    const ects = extractEcts(text);

    console.log(`${sample}: listed=${entry.page}, adjusted=${adjustedPage}, ECTS=${ects}`);
  }
})();
