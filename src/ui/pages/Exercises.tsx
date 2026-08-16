import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Center,
  Flex,
  Loader,
  Stack,
  Tabs,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { IconDownload, IconPlayerPlay, IconSearch } from "@tabler/icons-react";
import type { Exercise } from "../../types/Exercise";
import { useExercises } from "../hooks/query/useExercises";
import { useLocalExercises } from "../hooks/query/useLocalExercises";
import { useActivity } from "../contexts/ActivityContext";
import { useAppView } from "../contexts/AppViewContext";
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

type ExerciseFilter = "all" | "downloaded";

const isDownloadCommand = (cmd: string) => cmd.startsWith("download");
const noop = () => {};

const STATUS_STYLES: Record<ProgressState, { label: string; color: string }> = {
  correct: { label: "Completed", color: "var(--color-gm-green)" },
  incorrect: { label: "Needs work", color: "#b42318" },
  "in-progress": { label: "In progress", color: "#b54708" },
  "not-started": { label: "Not started", color: "#667085" },
};

export const ExercisesPage = () => {
  const { query: exercisesQuery } = useExercises();
  const { downloadedExerciseData } = useLocalExercises();
  const { currentExercise, startExercise } = useActivity();
  const { setView } = useAppView();
  const { navigate } = useWebContentsView();

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

  useEffect(() => {
    for (const id of downloadedIds) {
      clearPending(id);
    }
  }, [clearPending, downloadedIds]);

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
    navigate(buildExerciseUrl(exercise));
    startExercise(exercise);
    setView("tours");
  };

  const downloadExercise = (exercise: Exercise) => {
    setPendingDownloads((prev) => new Set(prev).add(exercise.identifier));
    window.electron.startGitMasteryTask(`download ${exercise.identifier}`);
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
    downloadExercise(exercise);
  };

  if (exercisesQuery.isLoading) {
    return (
      <Center h="100%" w="100%">
        <Stack align="center" gap="sm">
          <Loader color="gm-green" />
          <Text c="dimmed" size="sm">
            Loading exercises...
          </Text>
        </Stack>
      </Center>
    );
  }

  if (exercisesQuery.isError) {
    return (
      <Center h="100%" w="100%">
        <Text c="red">Could not load the exercise catalog.</Text>
      </Center>
    );
  }

  return (
    <Box h="100%" w="100%" className="overflow-y-auto bg-white">
      <Box px={28} py={22} maw={820}>
        <Title order={1} c="#333" fw={600}>
          Git-Mastery: Exercises
        </Title>
        <Text mt={8} mb="lg" c="#555" style={{ fontSize: "1.02rem" }}>
          Practice Git with hands-on exercises. Browse the full catalog, or
          continue one you have already downloaded.
        </Text>

        <Flex gap="md" wrap="wrap" align="flex-end" mb="lg">
          <TextInput
            placeholder="Search exercises, lessons, or tours"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            className="min-w-[240px] flex-1"
            variant="default"
          />
          <Tabs
            value={filter}
            onChange={(value) => {
              if (value) setFilter(value as ExerciseFilter);
            }}
            color="gm-green"
          >
            <Tabs.List>
              <Tabs.Tab value="all">All ({allExercises.length})</Tabs.Tab>
              <Tabs.Tab value="downloaded">
                Downloaded ({downloadedCount})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Flex>

        {filteredExercises.length === 0 ? (
          <Text c="#667085" fs="italic">
            {filter === "downloaded"
              ? "No downloaded exercises yet. Switch to All to download one."
              : "No exercises match your search."}
          </Text>
        ) : (
          <Stack gap={28}>
            {groupedExercises.map(([tourName, exercises]) => (
              <Box key={tourName}>
                <Title
                  order={2}
                  c="#333"
                  mb={6}
                  style={{
                    borderBottom: "1px solid #e6e6e6",
                    paddingBottom: 8,
                  }}
                >
                  {formatTourName(tourName)}
                </Title>
                <Stack gap={0}>
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
                      isDownloading={pendingDownloads.has(exercise.identifier)}
                      isDownloaded={downloadedIds.has(exercise.identifier)}
                      onSelect={() => handleSelect(exercise)}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
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
  const statusStyle = status ? STATUS_STYLES[status] : null;
  const lessonTitle = getExerciseLessonTitle(exercise);

  return (
    <Flex
      align="center"
      justify="space-between"
      gap="md"
      py={12}
      style={{
        borderBottom: "1px solid #eee",
        background: isActive ? "rgba(45, 134, 78, 0.06)" : undefined,
        marginLeft: isActive ? -8 : 0,
        marginRight: isActive ? -8 : 0,
        paddingLeft: isActive ? 8 : 0,
        paddingRight: isActive ? 8 : 0,
      }}
    >
      <UnstyledButton onClick={onSelect} className="min-w-0 flex-1 text-left">
        <Text
          c="gm-green"
          fw={600}
          style={{ fontSize: "1.02rem" }}
          className="hover:underline"
        >
          → {formatExerciseTitle(exercise)}
        </Text>
        <Text size="sm" c="#666" mt={2}>
          {lessonTitle}
          {exercise.detour ? " · Detour" : ""}
          {statusStyle ? ` · ${statusStyle.label}` : ""}
          {isActive ? " · Active" : ""}
        </Text>
      </UnstyledButton>
      <Button
        size="xs"
        radius="sm"
        variant={isDownloaded ? "outline" : "filled"}
        color="gm-green"
        loading={isDownloading}
        leftSection={
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
    </Flex>
  );
};
