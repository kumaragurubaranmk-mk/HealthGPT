import { execSync } from 'child_process';

const GIT_EXE = 'C:\\Users\\GIRIVASU\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\\cmd\\git.exe';

function runGit(args) {
  const cmd = `"${GIT_EXE}" ${args}`;
  console.log(`> git ${args}`);
  return execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
}

try {
  runGit('config user.name "GIRIVASU"');
  runGit('config user.email "girivasu@vitacare.ai"');
  runGit('add .');
  runGit('commit -m "Initial commit: Complete VitaCare AI - Personal Health Copilot application"');
  runGit('branch -M main');
  runGit('status');
  console.log('\n✓ All files committed to local Git repository on branch main!');
} catch (err) {
  console.error('Git error:', err.message);
}
