const esbuildPluginTsc = require("esbuild-plugin-tsc");
const esbuild = require("esbuild");
const { dependencies, peerDependencies = {} } = require("./package.json");
const { Generator } = require("npm-dts");

const COMMON_SETTINGS = {
  entryPoints: ["src/index.ts"],
  minify: true,
  bundle: true,
  external: Object.keys(dependencies).concat(Object.keys(peerDependencies)),
  plugins: [esbuildPluginTsc({ force: true })],
};

const ESM_SETTINGS = {
  ...COMMON_SETTINGS,
  outfile: "dist/esm/index.js",
  platform: "neutral",
};
const buildForESM = async () => await esbuild.build(ESM_SETTINGS);

const CJS_SETTINGS = {
  ...COMMON_SETTINGS,
  format: "cjs",
  outfile: "dist/src/index.js",
  sourcemap: true,
  platform: "node",
};

const watchForCJS = async () => {
  let ctx = await esbuild.context(CJS_SETTINGS);
  await ctx.watch();
  await ctx.serve({ servedir: "dist/src" });
  console.log("watching...");
};

const buildForCJS = async () => await esbuild.build(CJS_SETTINGS);
const buildForTYP = async () => await new Generator({ entry: "src/index.ts", output: "dist/src/index.d.ts" }).generate();

(async () => {
  const buildType = process.argv.slice(2)[0];
  const shouldWatch = process.argv.slice(3)[0] === "--watch";
  if (!buildType) {
    console.log("No build type provided");
    process.exit(1);
  }
  console.log(`Building for ${buildType}`);
  if (buildType === "ESM") {
    await buildForESM();
  } else if (buildType === "CJS") {
    console.log("watching? " + shouldWatch);
    await (shouldWatch ? watchForCJS : buildForCJS)();
  } else if (buildType === "TYP") {
    await buildForTYP();
  }
})();
