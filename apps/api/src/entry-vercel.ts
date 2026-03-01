import app from "./hono-app.js";

console.log("[entry-vercel] typeof app:", typeof app);
console.log("[entry-vercel] app.fetch?:", typeof app?.fetch);

export default app;
