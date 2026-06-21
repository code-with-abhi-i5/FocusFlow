const fs = require('fs');

const fixes = [
  { file: 'src/hooks/useAnalytics.ts', type: 'TimeEntry', from: '../types' },
  { file: 'src/hooks/useGoals.ts', type: 'Goal', from: '../types' },
  { file: 'src/hooks/useStreaks.ts', type: 'Streak', from: '../types' },
  { file: 'src/hooks/useTimeData.ts', type: 'TimeEntry', from: '../types' },
  { file: 'src/pages/SettingsPage.tsx', type: 'CustomCategories, ProductivityCategory', from: '../types' },
  { file: 'src/services/aiCoach.ts', type: 'Insight', from: '../types' },
  { file: 'src/services/firebase/categoryService.ts', type: 'CustomCategories', from: '../../types' },
  { file: 'src/services/firebase/goalService.ts', type: 'Goal', from: '../../types' },
  { file: 'src/services/firebase/streakService.ts', type: 'Streak', from: '../../types' },
  { file: 'src/services/firebase/timeEntryService.ts', type: 'TimeEntry', from: '../../types' }
];

fixes.forEach(({ file, type, from }) => {
  const filePath = `c:/Users/ghosh/OneDrive/Desktop/Chrome Extension/dashboard/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  // replace broken import `import type {  } from '';` or similar broken lines
  // The regex used by PowerShell was: import type {  } from 'types'; or similar. Let's just look at the exact diff.
  // user diff: -import { Streak } from '../types'; \n +import type {  } from '';
  
  content = content.replace(/import\s+type\s*\{\s*\}\s*from\s*'';/, `import type { ${type} } from '${from}';`);
  // also handle cases where it might just be a partial match due to my regex
  content = content.replace(/import\s+type\s*\{\s*\}\s*from\s*'types';/, `import type { ${type} } from '${from}';`);
  
  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed files');
