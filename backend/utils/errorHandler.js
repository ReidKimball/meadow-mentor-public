// backend/utils/errorHandler.js

// Centralized function to handle errors within controllers
export const handleControllerError = (
  error,
  res,
  serviceName = "Operation"
) => {
  console.error(`Error during ${serviceName}:`, error);

  // Handle specific error types or messages
  if (
    error.message?.includes("rate limit") ||
    error.message?.includes("quota") ||
    error.status === 429 ||
    error.name === "RateLimitError"
  ) {
    return res.status(429).json({
      error: "API Rate Limit Exceeded",
      details: error.message,
      isRateLimit: true,
    });
  }

  if (
    error.message?.includes("Content generation blocked due to safety concerns")
  ) {
    return res.status(400).json({
      // 400 Bad Request might be more appropriate than 500
      error: "Input violates safety guidelines",
      details: error.message,
    });
  }
  if (error.message?.includes("finished unexpectedly: SAFETY")) {
    return res.status(400).json({
      error: "Output blocked due to safety guidelines",
      details: error.message,
    });
  }

  if (error.name === "ValidationError") {
    // Mongoose validation error
    return res
      .status(400)
      .json({ error: "Validation Error", details: error.message });
  }

  if (error.name === "CastError") {
    // Mongoose invalid ID format
    return res
      .status(400)
      .json({
        error: "Invalid ID Format",
        details: `Field: ${error.path}, Value: ${error.value}`,
      });
  }

  if (
    error.message?.includes("Input prompt exceeds") ||
    error.message?.includes("request payload size exceeds the limit")
  ) {
    return res
      .status(400)
      .json({
        error: "Input Too Large",
        details: "The provided text or file is too large for the AI model.",
      });
  }

  if (error.message?.includes("Invalid file type")) {
    // From multer fileFilter
    return res
      .status(400)
      .json({ error: "Invalid File Type", details: error.message });
  }

  // Default internal server error
  res.status(500).json({
    error: "Internal Server Error",
    // Avoid sending detailed internal error messages to the client in production
    details:
      process.env.NODE_ENV === "development"
        ? error.message
        : "An unexpected error occurred.",
  });
};

// Async wrapper to catch errors in route handlers and pass to error middleware
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next); // Pass errors to Express error handler
};

// Global error handling middleware (register AFTER all routes in server setup)
export const globalErrorHandler = (err, req, res, next) => {
  // Log the error regardless of environment
  console.error("Global Error Handler Caught:", err);

  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Use the centralized handler logic for consistent responses
  // Pass a generic service name or derive from context if possible
  handleControllerError(err, res, req.path || "Unhandled Route");

  // // Set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = process.env.NODE_ENV === 'development' ? err : {};

  // // Send a generic error response
  // res.status(err.status || 500).json({
  //   error: err.message || "Something went wrong!",
  //   // Optionally include stack in development
  //   stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  // });
};
