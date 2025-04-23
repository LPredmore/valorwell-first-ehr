
export const getDefaultQueryOptions = (queryKey: unknown[]) => ({
  queryKey,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 30 * 60 * 1000, // 30 minutes
  retry: 2,
  refetchOnWindowFocus: false,
});

export const getPaginatedQueryOptions = (
  queryKey: unknown[],
  page = 1,
  limit = 10
) => ({
  ...getDefaultQueryOptions(queryKey),
  keepPreviousData: true,
  queryKey: [...queryKey, page, limit],
});
