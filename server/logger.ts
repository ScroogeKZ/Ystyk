import { type Request } from "express";
import { log } from "./vite";

export interface ErrorLogContext {
  method: string;
  path: string;
  statusCode: number;
  userId?: string;
  username?: string;
  userRole?: string;
  ip?: string;
  userAgent?: string;
  params?: any;
  query?: any;
  body?: any;
}

export function logError(error: Error, context: ErrorLogContext) {
  const isDev = process.env.NODE_ENV === "development";
  
  const errorSummary = `ERROR ${context.method} ${context.path} ${context.statusCode}: ${error.message}`;
  const userContext = context.userId ? ` [User: ${context.username || context.userId}]` : "";
  
  log(`${errorSummary}${userContext}`, "express");

  if (isDev) {
    console.error("\n--- Detailed Error Context ---");
    console.error(`Error Type: ${error.name}`);
    console.error(`Message: ${error.message}`);
    
    if (context.userId) {
      console.error(`User: ${context.username} (${context.userId}) - Role: ${context.userRole}`);
    }
    
    if (context.ip) {
      console.error(`IP: ${context.ip}`);
    }

    if (Object.keys(context.params || {}).length > 0) {
      console.error(`Params:`, context.params);
    }

    if (Object.keys(context.query || {}).length > 0) {
      console.error(`Query:`, context.query);
    }

    if (context.body && Object.keys(context.body).length > 0) {
      const sanitized = deepSanitize(context.body);
      console.error(`Body (sanitized):`, sanitized);
    }

    if (error.stack) {
      console.error(`Stack:\n${error.stack}`);
    }
    console.error("--- End Error Context ---\n");
  } else {
    console.error(`${error.name}: ${error.message} at ${context.method} ${context.path}`);
  }
}

function deepSanitize(obj: any, depth = 0): any {
  const MAX_DEPTH = 10;
  if (depth > MAX_DEPTH || obj === null || obj === undefined) {
    return obj;
  }

  const sensitiveFields = [
    "password", "passwd", "pwd",
    "token", "accessToken", "refreshToken", "access_token", "refresh_token",
    "secret", "apiKey", "api_key", "privateKey", "private_key",
    "sessionId", "session_id", "cookie", "authorization",
    "creditCard", "credit_card", "ssn", "cvv"
  ];

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const key in obj) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveFields.some(field => 
        lowerKey.includes(field.toLowerCase())
      );
      
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof obj[key] === "object") {
        sanitized[key] = deepSanitize(obj[key], depth + 1);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  }

  return obj;
}

export function extractErrorContext(req: Request, statusCode: number): ErrorLogContext {
  const user = req.user as any;
  const isDev = process.env.NODE_ENV === "development";
  
  return {
    method: req.method,
    path: req.path,
    statusCode,
    userId: user?.id,
    username: user?.username,
    userRole: user?.role,
    ip: isDev ? (req.ip || req.socket.remoteAddress) : undefined,
    userAgent: isDev ? req.get("user-agent") : undefined,
    params: isDev ? req.params : undefined,
    query: isDev ? req.query : undefined,
    body: isDev ? req.body : undefined,
  };
}
