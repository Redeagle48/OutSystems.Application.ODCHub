const { execSync } = require("child_process");

const ports = [3001, 5173, 5174];

for (const port of ports) {
  try {
    const output = execSync(`netstat -ano`, { encoding: "utf-8" });
    const line = output
      .split("\n")
      .find((l) => l.includes(`:${port} `) && l.includes("LISTENING"));
    if (line) {
      const pid = line.trim().split(/\s+/).pop();
      console.log(`Killing PID ${pid} on port ${port}`);
      execSync(`taskkill /PID ${pid} /F`, { stdio: "inherit" });
    } else {
      console.log(`Nothing on port ${port}`);
    }
  } catch (e) {
    console.error(`Error checking port ${port}: ${e.message}`);
  }
}
