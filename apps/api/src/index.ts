import "hono";
import mod from "../.build/index.js";
console.log("[shim src/index.ts] typeof mod:", typeof mod);
console.log("[shim src/index.ts] mod.fetch?:", typeof mod?.fetch);
console.log("[shim src/index.ts] mod.request?:", typeof mod?.request);
export default mod;
