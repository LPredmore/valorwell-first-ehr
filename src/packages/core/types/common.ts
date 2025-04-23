
export interface ErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SelectOption {
  label: string;
  value: string;
}
