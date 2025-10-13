import { defineApp } from "convex/server";
import betterAuth from "../lib/component/convex.config";


const app = defineApp();
app.use(betterAuth);

export default app;
