const fs = require('fs');
const path = require('path');

// Define error mappings
const errorMappings = [
  {
    pattern: /throw new Error\('CAPTCHA detected[^']*'\)/g,
    replacement: `throw new CaptchaDetectedError(linkedin_account_id, page)`
  },
  {
    pattern: /throw new Error\('Session expired[^']*'\)/g,
    replacement: `throw new SessionExpiredError(linkedin_account_id)`
  },
  {
    pattern: /throw new Error\('Two-factor authentication required'\)/g,
    replacement: `throw new TwoFactorRequiredError(linkedin_account_id)`
  },
  {
    pattern: /throw new Error\('Rate limited[^']*'\)/g,
    replacement: `throw new RateLimitError(linkedin_account_id, actionType)`
  },
  {
    pattern: /throw new Error\(`Daily message limit reached[^`]*`\)/g,
    replacement: `throw new DailyLimitReachedError(linkedin_account_id, 'message', account.messages_today, dailyMessageLimit)`
  }
];

// Get all TypeScript files in src
function getAllTsFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !entry.startsWith('.')) {
      files.push(...getAllTsFiles(fullPath));
    } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
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

  // Add import if needed and file contains error throws
  if (content.includes('throw new Error(')) {
    if (!content.includes('from \'../types/errors\'') && !content.includes('from \'../../types/errors\'')) {
      // Determine relative path to errors
      const relativePath = path.relative(path.dirname(filePath), './src/types/errors').replace(/\\/g, '/');
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;

      const importLine = `import { CaptchaDetectedError, SessionExpiredError, TwoFactorRequiredError, RateLimitError, DailyLimitReachedError, SelectorFailedError, InvalidInputError, DatabaseError } from '${importPath}'\n`;

      // Add import after existing imports
      const lastImportMatch = content.match(/^import.*$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        content = content.replace(lastImport, lastImport + '\n' + importLine);
        changed = true;
      }
    }

    // Apply simple replacements
    for (const mapping of errorMappings) {
      const beforeCount = (content.match(mapping.pattern) || []).length;
      content = content.replace(mapping.pattern, mapping.replacement);
      const afterCount = (content.match(mapping.pattern) || []).length;
      if (beforeCount > afterCount) {
        changed = true;
        totalReplacements += (beforeCount - afterCount);
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

console.log(`Total replacements: ${totalReplacements}`);
console.log('Note: Some errors still need manual replacement based on context');