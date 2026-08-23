import { spawn } from "node:child_process";
import process from "node:process";
import electron from "electron";
import { createServer } from "vite";

const server = await createServer({
  configFile: "vite.config.js"
});

await server.listen();
server.printUrls();

const child = spawn(electron, ["."], {
  stdio: "inherit",
  env: {
    ...process.env,
    ELECTRON_START_URL: "http://127.0.0.1:5173"
  }
});

const shutdown = async () => {
  child.kill();
  await server.close();
  process.exit(0);
};

child.on("exit", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
