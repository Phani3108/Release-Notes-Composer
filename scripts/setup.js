#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up AI Tools Suite...\n');

// Create necessary directories
const directories = [
  'src/components',
  'src/pages',
  'src/mvp',
  'src/mvp/release-notes',
  'src/mvp/incident-bot',
  'src/mvp/api-gatekeeper',
  'src/mvp/cost-pings',
  'src/mvp/agent-auditor',
  'src/mvp/issue-sentinel',
  'src/mvp/risk-manager',
  'src/mvp/build-advisor',
  'src/utils',
  'src/types',
  'logs',
  'docs',
  'tests',
  'tests/unit',
  'tests/integration',
  'tests/e2e'
];

console.log('📁 Creating project directories...');
directories.forEach(dir => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`  ✅ Created: ${dir}`);
  } else {
    console.log(`  ℹ️  Exists: ${dir}`);
  }
});

// Create logs directory with .gitkeep
const logsPath = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsPath)) {
  fs.mkdirSync(logsPath, { recursive: true });
}
const gitkeepPath = path.join(logsPath, '.gitkeep');
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, '');
}

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.log('\n⚠️  No .env file found!');
  console.log('📝 Please copy env.template to .env and configure your API keys:');
  console.log('   cp env.template .env');
  console.log('   # Then edit .env with your actual credentials\n');
} else {
  console.log('\n✅ .env file found');
}

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '18.0.0';
const versionCheck = require('semver').gte(nodeVersion, requiredVersion);

if (versionCheck) {
  console.log(`✅ Node.js version ${nodeVersion} meets requirement (>=${requiredVersion})`);
} else {
  console.log(`❌ Node.js version ${nodeVersion} is below required version ${requiredVersion}`);
  process.exit(1);
}

// Check if dependencies are installed
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const nodeModulesExists = fs.existsSync(path.join(process.cwd(), 'node_modules'));
  
  if (nodeModulesExists) {
    console.log('✅ Dependencies are installed');
  } else {
    console.log('📥 Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('❌ Error checking dependencies:', error.message);
}

// Create basic configuration test
console.log('\n🔧 Testing configuration...');
try {
  // Test if config can be loaded (this will validate env vars)
  const config = require('../src/lib/config');
  
  if (config.isFullyConfigured()) {
    console.log('✅ Configuration is valid');
    console.log('\n📊 Configuration Summary:');
    const summary = config.getSummary();
    Object.entries(summary).forEach(([key, value]) => {
      const status = value.configured ? '✅' : '❌';
      console.log(`  ${status} ${key}: ${JSON.stringify(value)}`);
    });
  } else {
    console.log('❌ Configuration is incomplete');
  }
} catch (error) {
  console.log('❌ Configuration test failed:', error.message);
  console.log('   Make sure you have configured your .env file properly');
}

// Create basic test files
console.log('\n🧪 Setting up test infrastructure...');

const testSetupPath = path.join(process.cwd(), 'tests', 'setup.js');
if (!fs.existsSync(testSetupPath)) {
  const testSetupContent = `// Test setup file
const path = require('path');

// Set up test environment
process.env.NODE_ENV = 'test';

// Add any global test setup here
global.testTimeout = 10000;

console.log('🧪 Test environment configured');
`;

  fs.writeFileSync(testSetupPath, testSetupContent);
  console.log('  ✅ Created: tests/setup.js');
}

// Create Jest configuration
const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
if (!fs.existsSync(jestConfigPath)) {
  const jestConfigContent = `module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/src/**/*.test.js',
    '**/src/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000
};
`;

  fs.writeFileSync(jestConfigPath, jestConfigContent);
  console.log('  ✅ Created: jest.config.js');
}

// Create ESLint configuration
const eslintConfigPath = path.join(process.cwd(), '.eslintrc.js');
if (!fs.existsSync(eslintConfigPath)) {
  const eslintConfigContent = `module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
`;

  fs.writeFileSync(eslintConfigPath, eslintConfigContent);
  console.log('  ✅ Created: .eslintrc.js');
}

// Create basic documentation
console.log('\n📚 Setting up documentation...');

const docsIndexPath = path.join(process.cwd(), 'docs', 'README.md');
if (!fs.existsSync(docsIndexPath)) {
  const docsIndexContent = `# AI Tools Suite Documentation

This directory contains documentation for each MVP in the AI Tools Suite.

## MVP Documentation

- [Release Notes Composer](./release-notes.md)
- [Incident Explainer Bot](./incident-bot.md)
- [API Contract Gatekeeper](./api-gatekeeper.md)
- [Cost Drift Pings](./cost-pings.md)
- [Agent Auditor & Hardener](./agent-auditor.md)
- [Customer Issue Sentinel](./issue-sentinel.md)
- [AI Release Risk Manager](./risk-manager.md)
- [Build-vs-Buy Advisor](./build-advisor.md)

## Development Guidelines

- Follow the Truth Policy strictly
- Ensure all code is complete and tested
- Update documentation for any changes
- Follow the established coding standards
`;

  fs.writeFileSync(docsIndexPath, docsIndexContent);
  console.log('  ✅ Created: docs/README.md');
}

// Create .gitignore if it doesn't exist
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build / generate output
.nuxt
dist

# Storybook build outputs
.out
.storybook-out

# Temporary folders
tmp/
temp/

# Editor directories and files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`;

  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('  ✅ Created: .gitignore');
}

console.log('\n🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Configure your .env file with API keys');
console.log('2. Run tests: npm test');
console.log('3. Start development: npm run dev');
console.log('4. Begin with MVP 1: Release Notes Composer');
console.log('\n🚀 Happy coding!');
