
export interface PaginationRequest {
  page: number;
  limit: number;
}

export interface FilterRequest extends PaginationRequest {
  status?: string;
  searchTerm?: string;
}

export interface DateRangeRequest {
  startDate: Date;
  endDate: Date;
}
