const fs = require('fs');
const path = require('path');

// Mapping of process.env usage to config properties
const configMappings = [
  { pattern: /process\.env\.WORKER_CONCURRENCY/g, replacement: 'config.workerConcurrency' },
  { pattern: /process\.env\.NODE_ENV/g, replacement: 'config.nodeEnv' },
  { pattern: /process\.env\.LOG_LEVEL/g, replacement: 'config.logLevel' },
  { pattern: /process\.env\.API_PORT/g, replacement: 'config.port' },
  { pattern: /process\.env\.REDIS_HOST/g, replacement: 'config.redis.host' },
  { pattern: /process\.env\.REDIS_PORT/g, replacement: 'config.redis.port' },
  { pattern: /process\.env\.PROXY_LIST/g, replacement: 'config.proxyList' }
];

// Get all TypeScript files in src except config.ts itself
function getAllTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.') && !entry.includes('__tests__')) {
      files.push(...getAllTsFiles(fullPath));
    } else if ((entry.endsWith('.ts') || entry.endsWith('.tsx'))
               && !entry.includes('.test.')
               && !entry.includes('config.ts')) {
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

  // Check if file contains process.env usage (excluding config file)
  if (/process\.env\./.test(content) && !filePath.includes('config.ts')) {

    // Add config import if needed
    if (!content.includes('from \'../utils/config\'') && !content.includes('from \'../../utils/config\'')) {
      // Determine relative path to config
      const relativePath = path.relative(path.dirname(filePath), './src/utils/config').replace(/\\/g, '/');
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

      const importLine = `import { config } from '${importPath}'\n`;

      // Add import after existing imports
      const lastImportMatch = content.match(/^import.*$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(lastImport, lastImport + '\n' + importLine);
        changed = true;
      }
    }

    // Apply config replacements
    for (const mapping of configMappings) {
      const beforeCount = (content.match(mapping.pattern) || []).length;
      content = content.replace(mapping.pattern, mapping.replacement);
      const afterCount = (content.match(mapping.pattern) || []).length;
      if (beforeCount > afterCount) {
        changed = true;
        totalReplacements += (beforeCount - afterCount);
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  }
}

console.log(`Total process.env replacements: ${totalReplacements}`);
console.log('Note: Some process.env usage might need manual review');