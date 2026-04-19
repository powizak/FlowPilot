export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export function errorResponse(code: string, message: string): ErrorResponse {
  return {
    error: {
      code,
      message,
    },
  };
}
