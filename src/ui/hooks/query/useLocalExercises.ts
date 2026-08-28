import { useQueryClient } from "@tanstack/react-query";
import { useCustomQuery } from "./useCustomQuery";

export const DOWNLOADED_EXERCISES_QUERY_KEY = ["downloaded-exercises"] as const;

// Gets a list of the progress of the locally downloaded exercises.
// Computed once from CLI progress.json + exercise folders, then patched in
// memory (download / verify) so we never re-walk the filesystem.
export const useLocalExercises = () => {
  const queryClient = useQueryClient();

  const { data: downloadedExerciseData } = useCustomQuery({
    queryKey: DOWNLOADED_EXERCISES_QUERY_KEY,
    queryFn: () => window.electron.getDownloadedExercises(),
    options: {
      staleTime: Infinity,
      gcTime: Infinity,
    },
  });

  const patchExerciseStatus = (
    exerciseIdentifier: string,
    status: ProgressState,
  ) => {
    queryClient.setQueryData<ProgressData>(
      DOWNLOADED_EXERCISES_QUERY_KEY,
      (previous) => ({
        ...(previous ?? {}),
        [exerciseIdentifier]: { status },
      }),
    );
  };

  return {
    downloadedExerciseData,
    patchExerciseStatus,
  };
};
