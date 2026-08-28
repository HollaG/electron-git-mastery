import { useMemo, useState } from "react";
import { IconChevronDown, IconMenu2 } from "@tabler/icons-react";
import type { Exercise } from "../../../types/Exercise";
import type { Lesson, Tour, TourData } from "../../../types/Tour";
import {
  buildExerciseUrl,
  buildLessonUrl,
  buildTourHomeUrl,
  isLessonUrlActive,
  isTourUrlActive,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { useCustomQuery } from "../../hooks/query/useCustomQuery";
import { useExercises } from "../../hooks/query/useExercises";
import { IconButton } from "../ui/IconButton";
import { StatusPill } from "../ui/StatusPill";
import { formatExerciseTitle, getExerciseLessonName } from "../../utils/format";
import { useLocalExercises } from "../../hooks/query/useLocalExercises";

export const ToursMenu = ({
  opened,
  onToggle,
}: {
  opened: boolean;
  onToggle: () => void;
}) => {
  return (
    <IconButton
      aria-label={opened ? "Close lessons panel" : "Open lessons panel"}
      onClick={onToggle}
    >
      <IconMenu2 size={18} />
    </IconButton>
  );
};

export const ToursPanel = () => {
  const { data: tourList, isLoading } = useCustomQuery<TourData>({
    queryKey: ["tour_list"],
    queryUrl: "https://git-mastery.org/lessons/lessons.json",
  });
  const { query: exercisesQuery } = useExercises();
  const { downloadedExerciseData } = useLocalExercises();
  const { navigate, currentUrl } = useWebContentsView();

  const tours = tourList
    ? Object.values(tourList).filter((tour) => tour.folder !== "all")
    : [];

  const exercisesByLesson = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const exercise of Object.values(exercisesQuery.data || {})) {
      if (exercise.wip) continue;
      const lessonName = getExerciseLessonName(exercise);
      if (!lessonName) continue;
      const list = map.get(lessonName) ?? [];
      list.push(exercise);
      map.set(lessonName, list);
    }
    return map;
  }, [exercisesQuery.data]);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-1 p-3">
          <span className="px-2 py-1.5 text-[11px] font-medium tracking-[0.06em] text-neutral-400 uppercase">
            Tours
          </span>
          {isLoading && (
            <span className="px-2 text-[13px] text-neutral-500">Loading…</span>
          )}
          {tours.map((tour) => (
            <TourItem
              key={tour.folder}
              tour={tour}
              currentUrl={currentUrl}
              exercisesByLesson={exercisesByLesson}
              downloadedExerciseData={downloadedExerciseData}
              onNavigate={navigate}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const listItemClasses =
  "w-full rounded-lg px-2 py-2 text-left text-sm leading-normal text-[#333] hover:cursor-pointer hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

const activeItemClasses = "bg-brand-600/[0.06] text-brand-700 font-medium";

const TourItem = ({
  tour,
  currentUrl,
  exercisesByLesson,
  downloadedExerciseData,
  onNavigate,
}: {
  tour: Tour;
  currentUrl: string | null;
  exercisesByLesson: Map<string, Exercise[]>;
  downloadedExerciseData: ProgressData | undefined;
  onNavigate: (url: string) => void;
}) => {
  const isActive = isTourUrlActive(tour, currentUrl);
  const [opened, setOpened] = useState(isActive);
  const [wasActive, setWasActive] = useState(isActive);

  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) setOpened(true);
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={opened}
        onClick={() => {
          if (!isActive) onNavigate(buildTourHomeUrl(tour));
          setOpened((value) => !value);
        }}
        className={`${listItemClasses} ${isActive ? activeItemClasses : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <IconChevronDown
            size={12}
            className={`shrink-0 text-neutral-500 transition-transform duration-150 ease-in-out ${opened ? "rotate-180" : ""}`}
          />
          {tour.title}
        </span>
      </button>
      {opened && (
        <div className="pl-3">
          {Object.values(tour.lessons).map((lesson) => (
            <LessonItem
              key={lesson.lesson_name}
              lesson={lesson}
              currentUrl={currentUrl}
              exercises={exercisesByLesson.get(lesson.lesson_name) ?? []}
              downloadedExerciseData={downloadedExerciseData}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LessonItem = ({
  lesson,
  currentUrl,
  exercises,
  downloadedExerciseData,
  onNavigate,
}: {
  lesson: Lesson;
  currentUrl: string | null;
  exercises: Exercise[];
  downloadedExerciseData: ProgressData | undefined;
  onNavigate: (url: string) => void;
}) => {
  const hasExercises = exercises.length > 0;
  const isActive = isLessonUrlActive(lesson, currentUrl);
  const [opened, setOpened] = useState(isActive);
  const [wasActive, setWasActive] = useState(isActive);

  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) setOpened(true);
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={opened}
        onClick={() => {
          if (!isActive) onNavigate(buildLessonUrl(lesson));
          setOpened((value) => !value);
        }}
        className={`${listItemClasses} ${isActive ? activeItemClasses : ""}`}
      >
        <span className="flex items-center gap-1.5">
          <IconChevronDown
            size={12}
            className={`shrink-0 text-neutral-500 transition-transform duration-150 ease-in-out ${opened ? "rotate-180" : ""}`}
          />
          {lesson.title}
        </span>
      </button>
      {opened && (
        <div className="pl-3">
          {hasExercises ? (
            exercises.map((exercise) => {
              const status =
                downloadedExerciseData?.[exercise.identifier]?.status;
              return (
                <button
                  key={exercise.identifier}
                  type="button"
                  className={listItemClasses}
                  onClick={() => onNavigate(buildExerciseUrl(exercise))}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate">
                      Exercise: {formatExerciseTitle(exercise)}
                    </span>
                    {status && <StatusPill status={status} />}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="block px-2 py-1.5 text-[13px] text-neutral-400">
              No exercises
            </span>
          )}
        </div>
      )}
    </div>
  );
};
