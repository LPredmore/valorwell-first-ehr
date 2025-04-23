
import { QueryKey } from '@tanstack/react-query';

export const getDefaultQueryOptions = <T>(key: QueryKey) => ({
  queryKey: key,
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 15, // 15 minutes
});

export const defaultQueryOptions = {
  staleTime: 1000 * 60 * 5, // 5 minutes
  gcTime: 1000 * 60 * 15, // 15 minutes
};
