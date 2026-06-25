import fs from 'fs';

let main = fs.readFileSync('src/main.tsx', 'utf8');
main = main.replace('import App from "./App";', 'import { App } from "./App";');
fs.writeFileSync('src/main.tsx', main);

const files = [
  'src/features/company/ApplicationDetails.tsx',
  'src/features/vendor/ApplyToTender.tsx',
  'src/features/vendor/ResultDetails.tsx',
  'src/features/vendor/TenderDetails.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('const { id } = useParams();', 'const { id } = useParams() as { id: string };');
  fs.writeFileSync(file, content);
}
