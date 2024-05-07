import esbuild from 'esbuild';
import esbuildPluginTsc from  "esbuild-plugin-tsc";

const buildForUmd = async () => await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: 'browser',
  outfile: "dist/_umd/index.js",
  define: {
    process: "{}",
    'process.env': "{}",
    'process.env.NODE_ENV': '\"production\"',
    'process.env.BICONOMY_SDK_DEBUG': '\"\"',
    'process.env.REACT_APP_BICONOMY_SDK_DEBUG': '\"\"',
    'process.env.NEXT_PUBLIC_BICONOMY_SDK_DEBUG': '\"\"',
  },
  globalName: "Biconomy",
  target: "es2020",
  plugins: [
    esbuildPluginTsc({ force: true }),
  ],
})

(async () => {
  await buildForUmd();
  console.log("done")
})();
