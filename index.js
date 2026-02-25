import http from "http";

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OpenClaw está online 🚀");
});

server.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});