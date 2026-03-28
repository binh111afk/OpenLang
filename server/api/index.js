module.exports = (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      message: "OpenLang server is running",
      method: req.method,
      url: req.url
    })
  );
};
