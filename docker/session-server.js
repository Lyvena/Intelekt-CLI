/**
 * Intelekt-CLI Session WebSocket Server
 *
 * Bridges the CLI's native streaming-json output to the relay-gateway over
 * WebSocket. Does NOT intercept or reimplement the CLI agent loop.
 *
 * Protocol:
 *   Inbound:  { action: "send_prompt", prompt, planMode, sessionId }
 *             { action: "cancel" }
 *   Outbound: { event: "data", data: "<streaming-json line>" }
 *             { event: "complete", code }
 *             { event: "error", message }
 */

const http = require("http");
const { WebSocketServer } = require("ws");
const { spawn } = require("child_process");

const PORT = process.env.PORT || 8080;
const SESSION_ID = process.env.INTELEKT_SESSION_ID || "unknown";

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Intelekt-CLI session service\n");
});

const wss = new WebSocketServer({ server });

let currentSession = null;

wss.on("connection", (ws) => {
  console.log("Relay connected for session", SESSION_ID);

  ws.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.action === "send_prompt") {
      const prompt = msg.prompt || "";
      const planMode = msg.planMode || false;
      const resumeId = msg.sessionId || null;

      const args = [
        "-p", prompt,
        "--output-format", "streaming-json",
        "--cwd", "/workspace",
      ];

      if (resumeId) {
        args.push("--resume", resumeId);
      }

      if (planMode) {
        args.push("--plan");
      }

      console.log("Starting CLI with args:", args.join(" "));

      const proc = spawn("intelekt", args, {
        env: { ...process.env },
        cwd: "/workspace",
      });

      currentSession = proc;

      proc.stdout.on("data", (chunk) => {
        const lines = chunk.toString().split("\n").filter(Boolean);
        for (const line of lines) {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ event: "data", data: line }));
          }
        }
      });

      proc.stderr.on("data", (chunk) => {
        console.error("CLI stderr:", chunk.toString());
      });

      proc.on("close", (code) => {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ event: "complete", code }));
        }
        currentSession = null;
      });

      proc.on("error", (err) => {
        console.error("CLI process error:", err.message);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ event: "error", message: err.message }));
        }
        currentSession = null;
      });
    }

    if (msg.action === "cancel" && currentSession) {
      currentSession.kill("SIGTERM");
    }
  });

  ws.on("close", () => {
    if (currentSession) {
      currentSession.kill("SIGTERM");
      currentSession = null;
    }
    console.log("Relay disconnected for session", SESSION_ID);
  });
});

server.listen(PORT, () => {
  console.log("Session service listening on port", PORT);
});
