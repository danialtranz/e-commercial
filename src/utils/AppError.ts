class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational: boolean = true,
    stack: string = ""
  ) {
    super(message);

    // Ensure the `name` property is set to the class name
    this.name = this.constructor.name;

    // Set the custom properties
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Set the stack trace
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default AppError;
