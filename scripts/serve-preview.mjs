import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../dist/", import.meta.url));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".ttf": "font/ttf",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let file = path.resolve(root, `.${pathname}`);
      if (file !== path.resolve(root) && !file.startsWith(root)) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (pathname === "/") file = path.join(root, "index.html");
      else if (!path.extname(file)) file += ".html";
      const info = await stat(file);
      if (!info.isFile()) throw new Error("Not a file");
      res.writeHead(200, {
        "Content-Type": mime[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("找不到页面。请打开 http://localhost:4173");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("食刻 MVP 预览: http://localhost:4173"),
  );
