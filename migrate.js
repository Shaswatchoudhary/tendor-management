import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/Home.tsx',
  'src/features/company/ApplicationDetails.tsx',
  'src/features/company/CreateTender.tsx',
  'src/features/company/TenderList.tsx',
  'src/components/layout/Topbar.tsx',
  'src/features/company/CompanyLayout.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/features/company/CompanyDashboard.tsx',
  'src/features/vendor/ResultDetails.tsx',
  'src/features/vendor/ApplyToTender.tsx',
  'src/features/vendor/TenderDetails.tsx',
  'src/features/vendor/VendorDashboard.tsx',
  'src/features/vendor/VendorApplications.tsx',
  'src/features/vendor/VendorLayout.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace imports
  content = content.replace(/import \{([^}]+)\} from "@tanstack\/react-router";/g, (match, imports) => {
    let newImports = imports.replace(/createFileRoute/g, '').replace(/useRouterState/g, 'useLocation').trim();
    newImports = newImports.split(',').map(s => s.trim()).filter(Boolean).join(', ');
    if (newImports.length > 0) {
      return `import { ${newImports} } from "react-router-dom";`;
    }
    return '';
  });

  // Replace Route = createFileRoute wrappers
  content = content.replace(/export const Route = createFileRoute\([^)]+\)\(\{\n?\s*component: ([\w]+),?\n?\s*\}\);?/g, 'export { $1 as default };');
  // Some files might just be exporting inline component:
  content = content.replace(/export const Route = createFileRoute\([^)]+\)\(\{/g, 'const RouteComponent = {');

  // Replace useRouterState
  content = content.replace(/useRouterState\(\{ select: \(r\) => r\.location\.pathname \}\)/g, 'useLocation().pathname');

  // Replace navigate({ to: "..." })
  content = content.replace(/navigate\(\{ to: "([^"]+)" \}\)/g, 'navigate("$1")');
  content = content.replace(/navigate\(\{ to: `([^`]+)` \}\)/g, 'navigate(`$1`)');
  content = content.replace(/navigate\(\{ to: '([^']+)' \}\)/g, 'navigate(\'$1\')');

  // Replace Route.useParams
  content = content.replace(/Route\.useParams\(\)/g, 'useParams()');

  // Replace export function Component
  content = content.replace(/export function ([A-Za-z0-9_]+)/g, 'export function $1');

  // Any remaining navigate({ to: ... })
  content = content.replace(/navigate\(\{\s*to:\s*([^ }]+)\s*\}\)/g, 'navigate($1)');

  fs.writeFileSync(file, content, 'utf8');
}
console.log('Migration complete.');
