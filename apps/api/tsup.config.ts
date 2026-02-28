import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "api",
  format: ["esm"],
  target: "node20",
  clean: true,
  noExternal: [/.*/],
});
