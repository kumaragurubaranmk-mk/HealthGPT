import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = __dirname;
const stagingDir = path.join(projectRoot, 'temp_package', 'VitaCare-AI-HealthGPT');
const zipOutputApp = path.join(projectRoot, 'VitaCare-AI-HealthGPT.zip');

const userHome = process.env.USERPROFILE || 'C:\\Users\\GIRIVASU';
const downloadsDir = path.join(userHome, 'Downloads');
const zipOutputDownloads = path.join(downloadsDir, 'VitaCare-AI-HealthGPT.zip');

console.log('📦 Starting project packaging for VitaCare...');

// 1. Clean previous staging
if (fs.existsSync(path.join(projectRoot, 'temp_package'))) {
  fs.rmSync(path.join(projectRoot, 'temp_package'), { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

function copyFiltered(src, dest, ignoreDirs = ['node_modules', '.git', 'temp_package', 'dist']) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    const base = path.basename(src);
    if (ignoreDirs.includes(base)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyFiltered(path.join(src, child), path.join(dest, child), ignoreDirs);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy directories
console.log('📁 Copying client source code...');
copyFiltered(path.join(projectRoot, 'client'), path.join(stagingDir, 'client'));

console.log('📁 Copying server source code...');
copyFiltered(path.join(projectRoot, 'server'), path.join(stagingDir, 'server'));

// Copy root configuration files
const rootFiles = ['.env', '.env.example', 'package.json', 'package-lock.json', 'README.md'];
for (const rf of rootFiles) {
  const p = path.join(projectRoot, rf);
  if (fs.existsSync(p)) {
    fs.copyFileSync(p, path.join(stagingDir, rf));
  }
}

console.log('🗜️ Compressing project into ZIP archive...');

// Remove existing zips
if (fs.existsSync(zipOutputApp)) fs.unlinkSync(zipOutputApp);
if (fs.existsSync(zipOutputDownloads)) fs.unlinkSync(zipOutputDownloads);

// Use PowerShell Compress-Archive
const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutputApp}' -CompressionLevel Optimal -Force"`;
execSync(psCmd, { stdio: 'inherit' });

// Also copy to Downloads directory for easy user access
if (fs.existsSync(downloadsDir)) {
  fs.copyFileSync(zipOutputApp, zipOutputDownloads);
  console.log(`✓ Copied to Downloads: ${zipOutputDownloads}`);
}

// Clean staging directory
fs.rmSync(path.join(projectRoot, 'temp_package'), { recursive: true, force: true });

const stats = fs.statSync(zipOutputApp);
const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

console.log(`\n🎉 Project successfully packaged!`);
console.log(`📦 Size: ${sizeMB} MB`);
console.log(`📍 Location 1: ${zipOutputApp}`);
console.log(`📍 Location 2 (Downloads): ${zipOutputDownloads}`);
