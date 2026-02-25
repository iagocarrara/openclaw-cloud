import http from "http";

const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OpenClaw está online 🚀");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});