import http from "node:http";

const port = process.env.PORT || 3001;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({
    message: "OpenLang server is running",
    method: req.method,
    url: req.url
  }));
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
