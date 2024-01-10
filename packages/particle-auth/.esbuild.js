const esbuildPluginTsc = require("esbuild-plugin-tsc");
const esbuild = require("esbuild");
const { dependencies, peerDependencies = {} } = require('./package.json')
const { Generator } = require('npm-dts');

const COMMON_SETTINGS = {
  entryPoints: ["src/index.ts"],
  minify: true,
  bundle: true,
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
}

const buildForESM = async () =>
  await esbuild.build({
    ...COMMON_SETTINGS,
    outfile: "dist/esm/index.js",
    platform: "neutral",
    plugins: [
      esbuildPluginTsc({
        force: true,
      }),
    ]
  });

const buildForCJS = async () =>
  await esbuild.build({
    ...COMMON_SETTINGS,
    format: 'cjs',
    outfile: "dist/src/index.js",
    sourcemap: true,
    platform: "node",
    plugins: [
      esbuildPluginTsc({
        force: true,
      }),
    ],
  });

const buildForTYP = async () => new Generator({
  entry: 'src/index.ts',
  output: 'dist/src/index.d.ts',
}).generate();

(async () => {
  const buildType = process.argv.slice(2)[0];
  if (!buildType) {
    console.log("No build type provided");
    process.exit(1);
  }
  console.log(`Building for ${buildType}`);
  if (buildType === "ESM") {
    await buildForESM();
  } else if (buildType === "CJS") {
    await buildForCJS();
  } else if (buildType === "TYP") {
    await buildForTYP();
  }
})();
