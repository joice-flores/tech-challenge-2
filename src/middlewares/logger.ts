import { Request, Response, NextFunction } from "express";

// Middleware de logging de requisições
export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  // Capturar informações da requisição
  const { method, originalUrl, ip } = req;
  const userAgent = req.get("user-agent") || "Unknown";

  // Log quando a requisição chega
  console.log(`⬇️  [${new Date().toISOString()}] ${method} ${originalUrl}`);

  // Capturar quando a resposta é enviada
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    // Escolher emoji baseado no status
    let emoji = "✅";
    if (statusCode >= 500) emoji = "❌";
    else if (statusCode >= 400) emoji = "⚠️";
    else if (statusCode >= 300) emoji = "↩️";

    console.log(
      `${emoji} [${new Date().toISOString()}] ${method} ${originalUrl} - Status: ${statusCode} - ${duration}ms`
    );
  });

  next();
}

// Middleware de logging detalhado (para debug)
export function detailedLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  console.log("\n" + "=".repeat(60));
  console.log(`📥 Nova Requisição - ${new Date().toISOString()}`);
  console.log("=".repeat(60));
  console.log(`Método:      ${req.method}`);
  console.log(`URL:         ${req.originalUrl}`);
  console.log(`IP:          ${req.ip}`);
  console.log(`User-Agent:  ${req.get("user-agent") || "Unknown"}`);

  if (Object.keys(req.params).length > 0) {
    console.log(`Params:      ${JSON.stringify(req.params)}`);
  }

  if (Object.keys(req.query).length > 0) {
    console.log(`Query:       ${JSON.stringify(req.query)}`);
  }

  if (Object.keys(req.body).length > 0) {
    console.log(`Body:        ${JSON.stringify(req.body, null, 2)}`);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log("-".repeat(60));
    console.log(`Status:      ${res.statusCode}`);
    console.log(`Duração:     ${duration}ms`);
    console.log("=".repeat(60) + "\n");
  });

  next();
}
