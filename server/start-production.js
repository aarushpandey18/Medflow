import { spawn } from "node:child_process";

const processes = [
  {
    name: "api",
    command: "node",
    args: ["server/index.js"],
    env: {
      API_PORT: process.env.API_PORT ?? "4000",
      HOST: process.env.HOST ?? "0.0.0.0",
    },
  },
  {
    name: "web",
    command: "node",
    args: [
      "node_modules/next/dist/bin/next",
      "start",
      "-H",
      "0.0.0.0",
      "-p",
      process.env.PORT ?? "3000",
    ],
  },
];

let shuttingDown = false;
const children = processes.map(({ name, command, args, env = {} }) => {
  const child = spawn(command, args, {
    env: {
      ...process.env,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(`${name} exited with ${signal ?? code}`);
    stopChildren();
    process.exit(code ?? 1);
  });

  return child;
});

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

process.on("SIGINT", () => {
  shuttingDown = true;
  stopChildren();
});

process.on("SIGTERM", () => {
  shuttingDown = true;
  stopChildren();
});
