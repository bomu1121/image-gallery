// Starts Vite on a fixed port, waits until it's up, then launches Electron
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");

const PORT = process.env.VITE_PORT || 5173;
const DEV_URL = `http://localhost:${PORT}`;

function log(prefix, data) {
  process.stdout.write(`[${prefix}] ${data}`);
}

function startVite() {
  const projectRoot = process.cwd();
  const viteCmdWin = path.join(projectRoot, "node_modules", ".bin", "vite.cmd");
  const viteCmdNix = path.join(projectRoot, "node_modules", ".bin", "vite");

  let command;
  let args;
  let useShell = false;

  if (process.platform === "win32" && fs.existsSync(viteCmdWin)) {
    command = process.env.comspec || "C\\Windows\\System32\\cmd.exe";
    args = ["/d", "/s", "/c", `${viteCmdWin} --port ${String(PORT)}`];
    useShell = false;
  } else if (process.platform !== "win32" && fs.existsSync(viteCmdNix)) {
    command = viteCmdNix;
    args = ["--port", String(PORT)];
  } else {
    if (process.platform === "win32") {
      command = process.env.comspec || "C\\Windows\\System32\\cmd.exe";
      args = ["/d", "/s", "/c", `npx vite --port ${String(PORT)}`];
      useShell = false;
    } else {
      command = "npx";
      args = ["vite", "--port", String(PORT)];
    }
  }

  const vite = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: "inherit",
    shell: useShell,
  });

  vite.on("exit", (code) => {
    log("vite", `exited with code ${code}\n`);
    process.exit(code || 0);
  });

  return vite;
}

function isServerUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(url, retries = 60, intervalMs = 500) {
  for (let i = 0; i < retries; i++) {
    const ok = await isServerUp(url);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function startElectron() {
  const env = {
    ...process.env,
    NODE_ENV: "development",
    VITE_DEV_SERVER_URL: DEV_URL,
  };
  const electronPath =
    process.platform === "win32"
      ? path.join(process.cwd(), "node_modules", ".bin", "electron.cmd")
      : "./node_modules/.bin/electron";
  let eleCommand = electronPath;
  let eleArgs = ["./src/main/electron.cjs"];
  let eleShell = false;
  if (process.platform === "win32") {
    eleCommand = process.env.comspec || "C\\Windows\\System32\\cmd.exe";
    eleArgs = ["/d", "/s", "/c", `${electronPath} ./src/main/electron.cjs`];
  }
  const ele = spawn(eleCommand, eleArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    env,
    shell: eleShell,
  });
  ele.on("exit", (code) => process.exit(code || 0));
}

(async function run() {
  startVite();
  log("wait", `Waiting for ${DEV_URL} ...\n`);
  const up = await waitForServer(DEV_URL);
  if (!up) {
    log("wait", `Dev server not reachable: ${DEV_URL}\n`);
    process.exit(1);
  }
  log("wait", `Dev server is up: ${DEV_URL}\n`);
  await startElectron();
})();
