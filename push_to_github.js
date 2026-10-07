import { execSync } from 'child_process';

const GIT_EXE = 'C:\\Users\\GIRIVASU\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\\cmd\\git.exe';

const remoteUrl = process.argv[2];

if (!remoteUrl) {
  console.log('Usage: node push_to_github.js <github-repo-url>');
  console.log('Example: node push_to_github.js https://github.com/username/vitacare-ai.git');
  process.exit(1);
}

try {
  try {
    execSync(`"${GIT_EXE}" remote remove origin`, { stdio: 'ignore' });
  } catch (e) {}
  console.log(`> Adding remote origin: ${remoteUrl}`);
  execSync(`"${GIT_EXE}" remote add origin "${remoteUrl}"`, { stdio: 'inherit' });
  console.log('> Pushing branch main to GitHub...');
  execSync(`"${GIT_EXE}" push -u origin main`, { stdio: 'inherit' });
  console.log('\n🎉 Successfully pushed all files to GitHub!');
} catch (err) {
  console.error('\n❌ Push failed:', err.message);
  console.log('\nTip: If authentication is required, make sure your GitHub token has "repo" permissions, or run:');
  console.log('node push_to_github.js https://<TOKEN>@github.com/<USERNAME>/<REPO>.git');
}
