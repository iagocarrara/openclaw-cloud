import http from "http";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const port = process.env.PORT || 8080;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Diretório seguro onde os arquivos serão criados
const WORKSPACE_DIR = "./workspace";

// Cria a pasta automaticamente se não existir
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR);
}

const server = http.createServer(async (req, res) => {

  if (req.method === "POST" && req.url === "/agent") {
    let body = "";

    req.on("data", chunk => {
      body += chunk.toString();
    });

    req.on("end", async () => {
      try {
        const { task } = JSON.parse(body);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              {
                role: "system",
                content: "Você é o OpenClaw, um agente que executa tarefas de forma prática e objetiva."
              },
              {
                role: "user",
                content: task
              }
            ]
          })
        });

        const data = await response.json();
        const answer = data.choices?.[0]?.message?.content || "Sem resposta";

        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ result: answer }));

      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Erro ao processar tarefa" }));
      }
    });

  } else {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OpenClaw Agent está online 🚀");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});