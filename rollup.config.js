import typescript from "@rollup/plugin-typescript";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { string } from "rollup-plugin-string";

// Main bundle configuration
const mainConfig = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
    }),
    terser(),
  ],
};

const workerConfig = {
  input: "src/worker/index.ts",
  output: [
    {
      file: "dist/datasitter.worker.js",
      format: "iife",
      name: "Worker",
      sourcemap: true,
      globals: {
        pyodide: "loadPyodide",
      },
    },
  ],
  external: ["pyodide"],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
    }),
    string({
      include: ["**/*.py"],
    }),
    terser(),
  ],
};

export default [mainConfig, workerConfig];
