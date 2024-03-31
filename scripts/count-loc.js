const fs = require('fs');
const path = require('path');

const TARGET_LOC = 200000;
const excludeDirs = new Set(['node_modules', '.git', 'build', 'dist', '.tempmediaStorage', '.system_generated', '.agents']);
const excludeFiles = new Set(['package-lock.json', 'yarn.lock']);
const sourceExts = new Set(['.js', '.jsx', '.css', '.html', '.ts', '.tsx', '.py']);
const textExts = new Set(['.js', '.jsx', '.css', '.html', '.ts', '.tsx', '.py', '.json', '.md', '.env', '.gitignore', '.txt']);

const breakdown = {
  backend: { files: 0, lines: 0, byExt: {} },
  frontend: { files: 0, lines: 0, byExt: {} },
  root: { files: 0, lines: 0, byExt: {} }
};

let totalSourceFiles = 0;
let totalSourceLines = 0;
let grandTotalFiles = 0;
let grandTotalLines = 0;

function getSection(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  if (norm.startsWith('backend/')) return 'backend';
  if (norm.startsWith('frontend/')) return 'frontend';
  return 'root';
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (excludeDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative('.', fullPath);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile()) {
      if (excludeFiles.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase() || entry.name;
      if (!textExts.has(ext)) continue;

      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n').length;
      const sec = getSection(rel);

      grandTotalFiles++;
      grandTotalLines += lines;

      if (!breakdown[sec].byExt[ext]) breakdown[sec].byExt[ext] = { files: 0, lines: 0 };
      breakdown[sec].byExt[ext].files++;
      breakdown[sec].byExt[ext].lines += lines;
      breakdown[sec].files++;
      breakdown[sec].lines += lines;

      if (sourceExts.has(ext)) {
        totalSourceFiles++;
        totalSourceLines += lines;
      }
    }
  }
}

walk('.');

const percent = ((totalSourceLines / TARGET_LOC) * 100).toFixed(2);
const remaining = TARGET_LOC - totalSourceLines;
const barLength = 30;
const filledLength = Math.min(barLength, Math.round((totalSourceLines / TARGET_LOC) * barLength));
const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

console.log('\n=============================================================');
console.log('       🌾 AGRILY CODEBASE & SPRINT LOC TRACKER (200K)        ');
console.log('=============================================================\n');
console.log(`🎯 TARGET LOC:           ${TARGET_LOC.toLocaleString()} Lines`);
console.log(`📊 CURRENT SOURCE SLOC:   ${totalSourceLines.toLocaleString()} Lines (${totalSourceFiles} source files)`);
console.log(`📦 TOTAL REPO LINES:      ${grandTotalLines.toLocaleString()} Lines (${grandTotalFiles} total files)`);
console.log(`⏳ REMAINING TO GOAL:     ${remaining.toLocaleString()} Lines`);
console.log(`📈 OVERALL PROGRESS:      [${bar}] ${percent}%\n`);

console.log('--- SUBSYSTEM BREAKDOWN ---');
console.log(`Backend Source:  ${breakdown.backend.lines.toLocaleString()} lines across ${breakdown.backend.files} files`);
console.log(`Frontend Source: ${breakdown.frontend.lines.toLocaleString()} lines across ${breakdown.frontend.files} files`);
console.log(`Root / Docs:     ${breakdown.root.lines.toLocaleString()} lines across ${breakdown.root.files} files`);

console.log('\n--- BY FILE EXTENSION ---');
const extMap = {};
for (const sec of Object.values(breakdown)) {
  for (const [ext, data] of Object.entries(sec.byExt)) {
    if (!extMap[ext]) extMap[ext] = { files: 0, lines: 0 };
    extMap[ext].files += data.files;
    extMap[ext].lines += data.lines;
  }
}

Object.entries(extMap)
  .sort((a, b) => b[1].lines - a[1].lines)
  .forEach(([ext, data]) => {
    console.log(`  ${ext.padEnd(12)} : ${data.lines.toString().padStart(6)} lines  (${data.files} files)`);
  });

console.log('\n=============================================================\n');
