const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');

const SCRIPT_DIR = path.join(__dirname, 'scripts');
const OUTPUT_DIR = path.join(__dirname, 'dist');

// Find all TypeScript and JavaScript files recursively
const entryPoints = glob.sync(path.join(SCRIPT_DIR, '**/*.{ts,js}')).filter(file => {
  // Exclude type definition files
  return !file.endsWith('.d.ts');
});

// Build options
const options = {
  entryPoints,
  outdir: OUTPUT_DIR,
  bundle: true,
  platform: 'neutral',
  format: 'esm',
  sourcemap: true,
  target: 'es2015',
  minify: false,
  external: [
    'k6',
    'k6/*',
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  logLevel: 'info',
};

// Perform the build
async function build() {
  try {
    console.log(`Building ${entryPoints.length} scripts...`);
    await esbuild.build(options);
    console.log(`Build completed! Files written to ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 
