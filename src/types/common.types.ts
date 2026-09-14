/** Every backend success response goes through ResponseInterceptor. */
export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

/** Paginated responses spread `total/page/limit/totalPages` next to `data`. */
export interface ApiPaginatedEnvelope<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** HttpExceptionFilter — `error` is an array when class-validator rejects a body. */
export interface ApiErrorEnvelope {
  success: false;
  error: string | string[];
  statusCode: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
