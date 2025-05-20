import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (this is cacheTime in v4, renamed to gcTime in v5)
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export default queryClient; 