/**
 * useKYCData Hook
 * Custom hook for fetching and managing KYC data
 */

import useSWR from "swr";
import { KYCData, KYCApiResponse } from "../types/kyc";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UseKYCDataOptions {
  entityId: string | null;
  refreshInterval?: number;
  revalidateOnFocus?: boolean;
}

interface UseKYCDataReturn {
  kycData: KYCData | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  refresh: () => void;
}

/**
 * Hook to fetch KYC data for a specific entity
 * 
 * @param options - Configuration options
 * @returns KYC data, loading state, error state, and refresh function
 * 
 * @example
 * ```typescript
 * const { kycData, isLoading, refresh } = useKYCData({ 
 *   entityId: "ent-123" 
 * });
 * ```
 */
export function useKYCData({
  entityId,
  refreshInterval = 0,
  revalidateOnFocus = false,
}: UseKYCDataOptions): UseKYCDataReturn {
  const { data, error, isLoading, mutate } = useSWR<KYCApiResponse>(
    entityId ? `/api/kyc?entityId=${entityId}` : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus,
      dedupingInterval: 5000, // Prevent duplicate requests within 5s
    }
  );

  return {
    kycData: data?.data,
    isLoading,
    isError: !!error,
    error,
    refresh: mutate,
  };
}

/**
 * Hook to fetch KYC data for multiple entities
 * 
 * @param entityIds - Array of entity IDs
 * @returns Array of KYC data results
 */
export function useMultipleKYCData(entityIds: string[]) {
  const results = entityIds.map((entityId) =>
    useKYCData({ entityId })
  );

  return {
    data: results.map((r) => r.kycData),
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refresh: () => results.forEach((r) => r.refresh()),
  };
}
