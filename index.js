import http from "http";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const port = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const WORKSPACE_DIR = "./workspace";

if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR);
}

async function callLLM(messages, tools = null) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
   body: JSON.stringify({
  model: "llama-3.1-8b-instant",
  messages,
  tools
})
  });

  return response.json();
}

function createFile(filename, content) {
  const safeName = path.basename(filename);
  const filePath = path.join(WORKSPACE_DIR, safeName);

  fs.writeFileSync(filePath, content);

  return `Arquivo ${safeName} criado com sucesso.`;
}

const server = http.createServer(async (req, res) => {

  // 🔥 CORS (ESSENCIAL para funcionar no Hoppscotch/ReqBin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/agent") {

    let body = "";
    req.on("data", chunk => body += chunk.toString());

    req.on("end", async () => {
      try {
        const { task } = JSON.parse(body);

        const tools = [
          {
            type: "function",
            function: {
              name: "create_file",
              description: "Cria um arquivo dentro do workspace",
              parameters: {
                type: "object",
                properties: {
                  filename: { type: "string" },
                  content: { type: "string" }
                },
                required: ["filename", "content"]
              }
            }
          }
        ];

        const messages = [
          {
            role: "system",
            content: "Você é o OpenClaw, um agente que pode executar ferramentas quando necessário."
          },
          {
            role: "user",
            content: task
          }
        ];

        const llmResponse = await callLLM(messages, tools);

console.log("LLM RESPONSE:", JSON.stringify(llmResponse, null, 2));

const choice = llmResponse.choices?.[0];
        if (choice?.message?.tool_calls) {
          const toolCall = choice.message.tool_calls[0];
          const args = JSON.parse(toolCall.function.arguments);

          if (toolCall.function.name === "create_file") {
            const result = createFile(args.filename, args.content);

            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ result }));
            return;
          }
        }

        const answer = choice?.message?.content || "Sem resposta";

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: answer }));

      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });

  } else {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OpenClaw Agent Executor 🚀");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});