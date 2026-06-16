import fs from 'fs';
import path from 'path';

// Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/import \{ ([^}]+) \} from "\.\/features/g, 'import $1 from "./features');
fs.writeFileSync('src/App.tsx', appContent, 'utf8');

const files = [
  'src/features/company/ApplicationDetails.tsx',
  'src/features/company/TenderList.tsx',
  'src/features/vendor/ApplyToTender.tsx',
  'src/features/vendor/ResultDetails.tsx',
  'src/features/vendor/TenderDetails.tsx',
  'src/features/vendor/VendorApplications.tsx',
  'src/features/vendor/VendorDashboard.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix useParams import
  if (content.includes('useParams()') && !content.includes('useParams')) {
    content = content.replace(/import \{([^}]+)\} from "react-router-dom";/, 'import {$1, useParams} from "react-router-dom";');
  }

  // Fix navigate({ to: ..., params: { id: ... } })
  content = content.replace(/navigate\(\{ to: "([^"]+)", params: \{ id: ([^}]+) \} \}\)/g, 'navigate(`$1`.replace(\'\\$id\', $2))');
  content = content.replace(/navigate\(\{ to: '([^']+)', params: \{ id: ([^}]+) \} \}\)/g, 'navigate(`$1`.replace(\'\\$id\', $2))');
  content = content.replace(/navigate\(\{ to: `([^`]+)`, params: \{ id: ([^}]+) \} \}\)/g, 'navigate(`$1`.replace(\'\\$id\', $2))');

  // Fix <Link to="..." params={{ id: ... }}>
  content = content.replace(/<Link ([^>]*?)to="([^"]+)" params=\{\{ id: ([^}]+) \}\}([^>]*?)>/g, '<Link $1to={`$2`.replace(\'\\$id\', $3)}$4>');

  fs.writeFileSync(file, content, 'utf8');
}

// Remove example.functions.ts since it uses start RPC which is no longer applicable
if (fs.existsSync('src/lib/api/example.functions.ts')) {
  fs.unlinkSync('src/lib/api/example.functions.ts');
}

console.log('Fix complete.');
