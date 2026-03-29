import http from "node:http";
import { createRequire } from "node:module";
import { URL } from "node:url";

const require = createRequire(import.meta.url);
const flashcardsHandler = require("../api/flashcards.js");
const flashcardImagesHandler = require("../api/flashcard-images.js");
const libraryHandler = require("../api/library.js");

const port = process.env.PORT || 3001;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  req.query = Object.fromEntries(requestUrl.searchParams.entries());

  if (requestUrl.pathname === "/api/flashcards") {
    return flashcardsHandler(req, res);
  }

  if (requestUrl.pathname === "/api/flashcard-images") {
    return flashcardImagesHandler(req, res);
  }

  if (requestUrl.pathname === "/api/library") {
    return libraryHandler(req, res);
  }

  return sendJson(res, 200, {
    message: "OpenLang server is running",
    method: req.method,
    url: req.url,
    routes: ["/api/library", "/api/flashcards", "/api/flashcard-images"],
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
