import type { ErrorRequestHandler } from "express";
import { ODCError } from "../proxy/odc-client.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("[Error]", err.message);

  if (err instanceof ODCError) {
    res.status(err.status).json({
      error: err.message,
      details: err.body,
    });
    return;
  }

  res.status(500).json({
    error: err.message || "Internal server error",
  });
};
