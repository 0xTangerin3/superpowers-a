const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function assertDirectory(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert(fs.existsSync(fullPath), `${relativePath} must exist`);
  assert(fs.statSync(fullPath).isDirectory(), `${relativePath} must be a directory`);
}

function assertFile(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert(fs.existsSync(fullPath), `${relativePath} must exist`);
  assert(fs.statSync(fullPath).isFile(), `${relativePath} must be a file`);
}

function listFiles(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['.git', '.omx', 'node_modules'].includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      listFiles(fullPath, results);
    } else if (entry.isFile()) {
      results.push(fullPath);
    }
  }
  return results;
}

const packageJson = readJson('package.json');
const claudePlugin = readJson('.claude-plugin/plugin.json');
const codexPlugin = readJson('.codex-plugin/plugin.json');

assert.strictEqual(claudePlugin.name, packageJson.name, 'Claude plugin name must match package name');
assert.strictEqual(claudePlugin.version, packageJson.version, 'Claude plugin version must match package version');
assert.strictEqual(claudePlugin.license, packageJson.license, 'Claude plugin license must match package license');
assert.strictEqual(claudePlugin.skills, './skills/', 'Claude plugin must expose the shared skills directory');

assert.strictEqual(codexPlugin.name, packageJson.name, 'Codex plugin name must match package name');
assert.strictEqual(codexPlugin.version, packageJson.version, 'Codex plugin version must match package version');
assert.strictEqual(codexPlugin.license, packageJson.license, 'Codex plugin license must match package license');
assert.strictEqual(codexPlugin.skills, './skills/', 'Codex plugin must expose the shared skills directory');

assertDirectory('skills');
for (const skillName of ['planning-depth-gate', 'using-superpowers']) {
  const skillPath = `skills/${skillName}/SKILL.md`;
  assertFile(skillPath);

  const skill = fs.readFileSync(path.join(root, skillPath), 'utf8');
  assert(skill.startsWith('---\n'), `${skillPath} must start with YAML frontmatter`);
  assert(skill.includes(`name: ${skillName}`), `${skillPath} must declare its skill name`);
  assert(skill.includes('description:'), `${skillPath} must declare a description`);
}

const oldOwner = ['calvin', 'ytt'].join('');
const oldRepoUrl = ['github.com/', oldOwner].join('');

for (const file of listFiles(root)) {
  const contents = fs.readFileSync(file, 'utf8');
  assert(!contents.includes(oldOwner), `${path.relative(root, file)} must not mention old owner`);
  assert(!contents.includes(oldRepoUrl), `${path.relative(root, file)} must not mention old repository URL`);
}

console.log('plugin manifests: Claude Code and Codex metadata passed');
