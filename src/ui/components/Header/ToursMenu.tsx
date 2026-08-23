import { useState } from "react";
import { IconChevronDown, IconMenu2, IconX } from "@tabler/icons-react";
import type { Lesson, Tour, TourData } from "../../../types/Tour";
import {
  buildLessonUrl,
  buildTourHomeUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { useCustomQuery } from "../../hooks/query/useCustomQuery";
import { useAppView } from "../../contexts/AppViewContext";
import { IconButton } from "../ui/IconButton";

export const ToursMenu = ({ onOpen }: { onOpen: () => void }) => {
  return (
    <IconButton aria-label="Open lessons panel" onClick={onOpen}>
      <IconMenu2 size={18} />
    </IconButton>
  );
};

export const ToursPanel = ({ onClose }: { onClose: () => void }) => {
  const { data: tourList, isLoading } = useCustomQuery<TourData>({
    queryKey: ["tour_list"],
    queryUrl: "https://git-mastery.org/lessons/lessons.json",
  });
  const { navigate } = useWebContentsView();
  const { setView } = useAppView();

  const tours = tourList
    ? Object.values(tourList).filter((tour) => tour.folder !== "all")
    : [];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
        <span className="text-sm font-semibold text-[#333]">Lessons</span>
        <IconButton
          aria-label="Close lessons panel"
          size="sm"
          onClick={onClose}
        >
          <IconX size={18} />
        </IconButton>
      </div>
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
              onNavigate={(url) => {
                setView("tours");
                navigate(url);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const listItemClasses =
  "w-full rounded-lg px-2 py-2 text-left text-sm leading-normal text-[#333] hover:bg-neutral-100 focus-visible:bg-neutral-100 focus-visible:outline-none";

const TourItem = ({
  tour,
  onNavigate,
}: {
  tour: Tour;
  onNavigate: (url: string) => void;
}) => {
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        aria-expanded={opened}
        onClick={() => setOpened((value) => !value)}
        className={listItemClasses}
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
          <button
            type="button"
            className={listItemClasses}
            onClick={() => onNavigate(buildTourHomeUrl(tour))}
          >
            Tour Home
          </button>
          {Object.values(tour.lessons).map((lesson) => (
            <LessonItem
              key={lesson.lesson_name}
              lesson={lesson}
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
  onNavigate,
}: {
  lesson: Lesson;
  onNavigate: (url: string) => void;
}) => {
  return (
    <button
      type="button"
      className={listItemClasses}
      onClick={() => onNavigate(buildLessonUrl(lesson))}
    >
      {lesson.title}
    </button>
  );
};
