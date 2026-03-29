import http from "node:http";
import { createRequire } from "node:module";
import { URL } from "node:url";

const require = createRequire(import.meta.url);
const aiGenerateDeckHandler = require("../api/ai-generate-deck.js");
const aiSuggestCardHandler = require("../api/ai-suggest-card.js");
const flashcardsHandler = require("../api/flashcards.js");
const flashcardImagesHandler = require("../api/flashcard-images.js");
const libraryHandler = require("../api/library.js");
const userProgressHandler = require("../api/user-progress.js");
const authLoginHandler = require("../api/auth-login.js");

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

  if (requestUrl.pathname === "/api/ai-generate-deck") {
    return aiGenerateDeckHandler(req, res);
  }

  if (requestUrl.pathname === "/api/ai-suggest-card") {
    return aiSuggestCardHandler(req, res);
  }

  if (requestUrl.pathname === "/api/flashcard-images") {
    return flashcardImagesHandler(req, res);
  }

  if (requestUrl.pathname === "/api/library") {
    return libraryHandler(req, res);
  }

  if (requestUrl.pathname === "/api/user-progress") {
    return userProgressHandler(req, res);
  }

  if (requestUrl.pathname === "/api/auth-login") {
    return authLoginHandler(req, res);
  }

  return sendJson(res, 200, {
    message: "OpenLang server is running",
    method: req.method,
    url: req.url,
    routes: ["/api/library", "/api/flashcards", "/api/flashcard-images", "/api/user-progress", "/api/auth-login", "/api/ai-generate-deck", "/api/ai-suggest-card"],
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
