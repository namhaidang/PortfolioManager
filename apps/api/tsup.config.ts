import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/entry-vercel.ts" },
  outDir: "api",
  format: ["esm"],
  target: "node20",
  clean: true,
  noExternal: [/.*/],
});
