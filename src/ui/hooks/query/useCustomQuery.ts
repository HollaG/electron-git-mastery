import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

export function useCustomQuery<TData = unknown, TError = Error>(
  params: UseCustomQueryParams<TData, TError>,
) {
  const { queryKey, options } = params;
  const queryFn =
    "queryUrl" in params
      ? () => fetchJson<TData>(params.queryUrl)
      : params.queryFn;

  return useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 2,
    ...options,
  });
}

async function fetchJson<TData>(url: string): Promise<TData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with ${response.status}`);
  }
  return (await response.json()) as TData;
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
