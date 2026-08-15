import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export function useCustomQuery<TData = unknown, TError = Error>(
  params: UseCustomQueryParams<TData, TError>,
) {
  if ("queryUrl" in params) {
    const { queryKey, queryUrl, options } = params;
    return useQuery<TData, TError>({
      queryKey,
      queryFn: () => fetch(queryUrl).then((r) => r.json()),
      staleTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      ...options,
    });
  } else {
    const { queryKey, queryFn, options } = params;
    return useQuery<TData, TError>({
      queryKey,
      queryFn,
      staleTime: 1000 * 60 * 60, // 1 hour
      retry: 2,
      ...options,
    });
  }
}

type UseCustomQueryParams<TData = unknown, TError = Error> =
  | {
      queryKey: UseQueryOptions<TData, TError>["queryKey"];
      queryUrl: string;
      options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
    }
  | {
      queryKey: UseQueryOptions<TData, TError>["queryKey"];
      queryFn: () => Promise<TData>;
      options?: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn">;
    };
