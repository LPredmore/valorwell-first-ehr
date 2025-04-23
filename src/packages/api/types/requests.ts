
export interface PaginationRequest {
  page: number;
  limit: number;
}

export interface ClientFilterRequest extends PaginationRequest {
  status?: string;
  searchTerm?: string;
}
