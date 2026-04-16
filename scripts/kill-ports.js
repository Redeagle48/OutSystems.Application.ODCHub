const { execSync } = require("child_process");

const ports = [3001, 5173, 5174];
const isWindows = process.platform === "win32";

function findPids(port) {
  if (isWindows) {
    const output = execSync("netstat -ano", { encoding: "utf-8" });
    return output
      .split("\n")
      .filter((l) => l.includes(`:${port} `) && l.includes("LISTENING"))
      .map((l) => l.trim().split(/\s+/).pop())
      .filter(Boolean);
  }
  try {
    const output = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, {
      encoding: "utf-8",
    });
    return output.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (isWindows) {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
  } else {
    execSync(`kill -9 ${pid}`, { stdio: "inherit" });
  }
}

for (const port of ports) {
  try {
    const pids = findPids(port);
    if (pids.length === 0) {
      console.log(`Nothing on port ${port}`);
      continue;
    }
    for (const pid of pids) {
      console.log(`Killing PID ${pid} on port ${port}`);
      killPid(pid);
    }
  } catch (e) {
    console.error(`Error checking port ${port}: ${e.message}`);
  }
}
