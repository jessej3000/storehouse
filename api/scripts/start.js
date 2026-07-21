// #!/usr/bin/env node
// const { execSync } = require('child_process');

// if (process.env.MIGRATE === 'true') {
//   console.log('MIGRATE=true — running prisma migrate deploy...');
//   execSync('npx prisma migrate deploy', { stdio: 'inherit' });
// }

// execSync('node dist/main.js', { stdio: 'inherit' });
#!/usr/bin/env node
const { execSync } = require('child_process');

if (process.env.MIGRATE === 'true') {
  console.log('MIGRATE=true — running prisma migrate deploy...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
}

console.log('--- Contents of dist/ ---');
execSync('ls -la dist/', { stdio: 'inherit' });

execSync('node dist/main.js', { stdio: 'inherit' });