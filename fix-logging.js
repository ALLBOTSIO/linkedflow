const fs = require('fs');
const path = require('path');

// Get all TypeScript files in src
function getAllTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && !entry.includes('__tests__')) {
      files.push(...getAllTsFiles(fullPath));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.includes('.test.')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = getAllTsFiles('./src');
let totalReplacements = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Check if file contains console logging
  if (/console\.(log|error|warn|info)/.test(content)) {
    // Add pino import if needed
    if (!content.includes('from \'pino\'') && !content.includes('pino')) {
      // Add pino import
      const importLine = `import { pino } from 'pino'\n`;

      // Add logger constant
      const loggerLine = `const logger = pino({ name: '${path.basename(filePath, path.extname(filePath))}' })\n\n`;

      // Find the first non-import line to insert logger
      const lines = content.split('\n');
      let insertIndex = 0;

      // Find last import line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('import ') || lines[i].startsWith('export ') && lines[i].includes('import')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' || lines[i].startsWith('//') || lines[i].startsWith('/*')) {
          // Skip empty lines and comments
          continue;
        } else {
          break;
        }
      }

      lines.splice(insertIndex, 0, importLine, loggerLine);
      content = lines.join('\n');
      changed = true;
    }

    // Replace console.log with logger.info
    const beforeLog = (content.match(/console\.log\(/g) || []).length;
    content = content.replace(/console\.log\(/g, 'logger.info(');
    totalReplacements += beforeLog - (content.match(/console\.log\(/g) || []).length;

    // Replace console.error with logger.error
    const beforeError = (content.match(/console\.error\(/g) || []).length;
    content = content.replace(/console\.error\(/g, 'logger.error(');
    totalReplacements += beforeError - (content.match(/console\.error\(/g) || []).length;

    // Replace console.warn with logger.warn
    const beforeWarn = (content.match(/console\.warn\(/g) || []).length;
    content = content.replace(/console\.warn\(/g, 'logger.warn(');
    totalReplacements += beforeWarn - (content.match(/console\.warn\(/g) || []).length;

    // Replace console.info with logger.info
    const beforeInfo = (content.match(/console\.info\(/g) || []).length;
    content = content.replace(/console\.info\(/g, 'logger.info(');
    totalReplacements += beforeInfo - (content.match(/console\.info\(/g) || []).length;

    if (changed || beforeLog + beforeError + beforeWarn + beforeInfo > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}

console.log(`Total console.* replacements: ${totalReplacements}`);