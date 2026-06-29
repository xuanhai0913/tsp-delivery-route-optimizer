// import type { ErrorRequestHandler, RequestHandler } from "express";

// type HttpError = Error & {
//   status?: number;
//   statusCode?: number;
// };

// export const notFoundHandler: RequestHandler = (request, response) => {
//   response.status(404).json({
//     error: "Route not found.",
//     path: request.originalUrl
//   });
// };

// export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
//   const message = error instanceof Error ? error.message : "Unexpected server error.";
//   const httpError = error as HttpError;
//   const statusCode = httpError.status ?? httpError.statusCode ?? 500;

//   response.status(statusCode).json({
//     error: statusCode >= 500 ? "Internal server error." : "Bad request.",
//     message: process.env.NODE_ENV === "production" && statusCode >= 500 ? "Unexpected server error." : message
//   });
// };
import type { ErrorRequestHandler, RequestHandler } from "express";

type HttpError = Error & {
  status?: number;
  statusCode?: number;
};

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: "Route not found.",
    path: request.originalUrl
  });
};

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message =
    error instanceof Error ? error.message : "Unexpected server error.";

  const httpError = error as HttpError;
  const statusCode = httpError.status ?? httpError.statusCode ?? 500;

  response.status(statusCode).json({
    error:
      statusCode >= 500
        ? "Internal server error."
        : message
  });
};