import { useCallback, useMemo, useState } from "react";
import {
  IconDownload,
  IconFolder,
  IconPlayerPlay,
  IconSearch,
} from "@tabler/icons-react";
import type { Exercise } from "../../types/Exercise";
import { useExercises } from "../hooks/query/useExercises";
import { useLocalExercises } from "../hooks/query/useLocalExercises";
import { useActivity } from "../contexts/ActivityContext";
import { useToast } from "../contexts/ToastContext";
import {
  buildExerciseUrl,
  useWebContentsView,
} from "../contexts/WebContentsViewContext";
import {
  formatExerciseTitle,
  formatTourName,
  getExerciseLessonTitle,
  getExerciseTourName,
} from "../utils/format";
import { useElectronStream } from "../hooks/useElectronStream";
import { Button } from "../components/ui/Button";
import { SearchInput } from "../components/ui/SearchInput";
import { SectionTitle } from "../components/ui/SectionTitle";
import { StatusPill, type StatusTone } from "../components/ui/StatusPill";
import { Tabs } from "../components/ui/Tabs";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";

type ExerciseFilter = "all" | "downloaded";

const isDownloadCommand = (cmd: string) => cmd.startsWith("download");
const noop = () => {};

const STATUS_STYLES: Record<
  ProgressState,
  { label: string; tone: StatusTone }
> = {
  correct: { label: "Completed", tone: "success" },
  incorrect: { label: "Needs work", tone: "danger" },
  "in-progress": { label: "In progress", tone: "warning" },
  "not-started": { label: "Not started", tone: "neutral" },
};

/** A status read off disk may be something this build does not know about. */
const statusStyleFor = (status?: ProgressState) => {
  if (!status) return null;
  return STATUS_STYLES[status] ?? { label: status, tone: "neutral" as const };
};

export const ExercisesPage = () => {
  const { query: exercisesQuery } = useExercises();
  const { downloadedExerciseData } = useLocalExercises();
  const { currentExercise, startExercise } = useActivity();
  const { navigate } = useWebContentsView();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ExerciseFilter>("all");
  const [pendingDownloads, setPendingDownloads] = useState<Set<string>>(
    () => new Set(),
  );

  const clearPending = useCallback((exerciseIdentifier: string) => {
    setPendingDownloads((prev) => {
      if (!prev.has(exerciseIdentifier)) return prev;
      const next = new Set(prev);
      next.delete(exerciseIdentifier);
      return next;
    });
  }, []);

  const allExercises = useMemo(() => {
    return Object.values(exercisesQuery.data || {}).filter(
      (exercise) => !exercise.wip,
    );
  }, [exercisesQuery.data]);

  const downloadedIds = useMemo(() => {
    return new Set(Object.keys(downloadedExerciseData || {}));
  }, [downloadedExerciseData]);

  const matchesSearch = (exercise: Exercise, query: string) => {
    if (!query) return true;
    const haystack = [
      formatExerciseTitle(exercise),
      exercise.identifier,
      getExerciseLessonTitle(exercise),
      formatTourName(getExerciseTourName(exercise)),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  };

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      if (filter === "downloaded" && !downloadedIds.has(exercise.identifier)) {
        return false;
      }
      return matchesSearch(exercise, query);
    });
  }, [allExercises, downloadedIds, filter, search]);

  const downloadedCount = useMemo(() => {
    return allExercises.filter((exercise) =>
      downloadedIds.has(exercise.identifier),
    ).length;
  }, [allExercises, downloadedIds]);

  const groupedExercises = useMemo(() => {
    const groups = new Map<string, Exercise[]>();
    for (const exercise of filteredExercises) {
      const tourName = getExerciseTourName(exercise);
      const list = groups.get(tourName) || [];
      list.push(exercise);
      groups.set(tourName, list);
    }
    return Array.from(groups.entries());
  }, [filteredExercises]);

  const openExercise = (exercise: Exercise) => {
    startExercise(exercise);
    navigate(buildExerciseUrl(exercise));
  };

  const downloadExercise = async (exercise: Exercise) => {
    const { dataDirectory } = await window.electron.checkExerciseFolder();
    if (!dataDirectory) {
      showToast({
        title: "No save location yet",
        message:
          "Open Settings and choose where exercise files should live, then download again.",
        tone: "warning",
        icon: <IconFolder size={18} className="text-[#b54708]" />,
        autoClose: 8000,
      });
      return;
    }

    setPendingDownloads((prev) => new Set(prev).add(exercise.identifier));
    try {
      await window.electron.startGitMasteryTask(
        `download ${exercise.identifier}`,
      );
    } catch {
      clearPending(exercise.identifier);
      showToast({
        title: "Could not start the download",
        message: "Check the Setup checklist in Settings and try again.",
        tone: "danger",
        icon: <IconFolder size={18} className="text-[#b42318]" />,
        autoClose: 8000,
      });
    }
  };

  const onDownloadSettled = useCallback(
    (originalCommand: string) => {
      clearPending(originalCommand.replace(/^download\s+/, ""));
    },
    [clearPending],
  );

  useElectronStream({
    condition: isDownloadCommand,
    onData: noop,
    onSuccessExit: onDownloadSettled,
    onFailedExit: onDownloadSettled,
  });

  const handleSelect = (exercise: Exercise) => {
    if (downloadedIds.has(exercise.identifier)) {
      openExercise(exercise);
      return;
    }
    void downloadExercise(exercise);
  };

  if (exercisesQuery.isLoading) {
    return <LoadingState message="Loading exercises..." />;
  }

  if (exercisesQuery.isError) {
    return (
      <ErrorState
        message="Could not load the exercise catalog. Check your connection and try again."
        onRetry={() => void exercisesQuery.refetch()}
      />
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
      <div className="max-w-[820px] px-7 py-6">
        <h1 className="font-heading text-[2.05rem]/[1.3] font-semibold text-[#333]">
          Git-Mastery: Exercises
        </h1>
        <p className="mt-2 mb-6 text-base text-neutral-500">
          Practice Git with hands-on exercises. Browse the full catalog, or
          continue one you have already downloaded.
        </p>

        <div className="mb-6 flex flex-wrap items-end gap-4">
          <SearchInput
            placeholder="Search exercises, lessons, or tours"
            aria-label="Search exercises"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <Tabs
            value={filter}
            onChange={setFilter}
            items={[
              { value: "all", label: "All", count: allExercises.length },
              {
                value: "downloaded",
                label: "Downloaded",
                count: downloadedCount,
              },
            ]}
          />
        </div>

        {filteredExercises.length === 0 ? (
          filter === "downloaded" ? (
            <EmptyState
              icon={<IconDownload size={24} />}
              title="No downloaded exercises yet"
              hint="Switch to All to browse the catalog and download your first exercise."
            />
          ) : (
            <EmptyState
              icon={<IconSearch size={24} />}
              title="No exercises match your search"
              hint="Try a different exercise, lesson, or tour name."
            />
          )
        ) : (
          <div className="flex flex-col gap-7">
            {groupedExercises.map(([tourName, exercises]) => (
              <div key={tourName}>
                <SectionTitle>{formatTourName(tourName)}</SectionTitle>
                <div className="flex flex-col">
                  {exercises.map((exercise) => (
                    <ExerciseRow
                      key={exercise.identifier}
                      exercise={exercise}
                      status={
                        downloadedExerciseData?.[exercise.identifier]?.status
                      }
                      isActive={
                        currentExercise?.identifier === exercise.identifier
                      }
                      isDownloading={
                        pendingDownloads.has(exercise.identifier) &&
                        !downloadedIds.has(exercise.identifier)
                      }
                      isDownloaded={downloadedIds.has(exercise.identifier)}
                      onSelect={() => handleSelect(exercise)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ExerciseRow = ({
  exercise,
  status,
  isActive,
  isDownloading,
  isDownloaded,
  onSelect,
}: {
  exercise: Exercise;
  status?: ProgressState;
  isActive: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  onSelect: () => void;
}) => {
  const statusStyle = statusStyleFor(status);
  const lessonTitle = getExerciseLessonTitle(exercise);

  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-neutral-200 py-3 ${
        isActive ? "-mx-2 bg-brand-600/[0.06] px-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left focus-visible:outline-none"
      >
        <span className="block truncate text-base font-semibold text-brand-700 hover:underline">
          {formatExerciseTitle(exercise)}
        </span>
        <span className="mt-1 flex items-center gap-2 text-[13px] text-neutral-500">
          {/* min-w-0 lets the label shrink so the pills stay on the meta row
              instead of wrapping onto a line of their own. */}
          <span className="min-w-0 truncate">
            {lessonTitle}
            {exercise.detour ? " · Detour" : ""}
          </span>
          {statusStyle && (
            <StatusPill tone={statusStyle.tone} className="shrink-0">
              {statusStyle.label}
            </StatusPill>
          )}
          {isDownloading && (
            <StatusPill tone="info" className="shrink-0">
              Downloading
            </StatusPill>
          )}
          {isActive && <span className="shrink-0 text-brand-700">Active</span>}
        </span>
      </button>
      <Button
        size="sm"
        variant={isDownloaded ? "outline" : "primary"}
        loading={isDownloading}
        leftIcon={
          isDownloaded ? (
            <IconPlayerPlay size={14} />
          ) : (
            <IconDownload size={14} />
          )
        }
        onClick={onSelect}
      >
        {isDownloaded ? "Continue" : "Download"}
      </Button>
    </div>
  );
};
