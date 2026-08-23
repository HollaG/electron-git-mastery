import { IconMap, IconChecklist } from "@tabler/icons-react";
import { useActivity } from "../../contexts/ActivityContext";
import { useAppView, type AppView } from "../../contexts/AppViewContext";
import {
  buildExerciseUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { SegmentedControl } from "../ui/SegmentedControl";
import { SettingsMenu } from "./SettingsMenu";
import { ToursMenu } from "./ToursMenu";

const VIEW_ITEMS = [
  {
    value: "tours" as const,
    label: (
      <span className="flex items-center gap-1.5">
        <IconMap size={15} />
        Lesson Tours
      </span>
    ),
  },
  {
    value: "exercises" as const,
    label: (
      <span className="flex items-center gap-1.5">
        <IconChecklist size={15} />
        Exercises
      </span>
    ),
  },
];

export const Header = ({
  lessonsPanelOpened,
  onOpenLessonsPanel,
}: {
  lessonsPanelOpened: boolean;
  onOpenLessonsPanel: () => void;
}) => {
  const { currentExercise } = useActivity();
  const { view, setView } = useAppView();
  const { navigate, restoreLessonPage } = useWebContentsView();

  const handleViewChange = (nextView: AppView) => {
    setView(nextView);

    if (nextView === "tours") {
      restoreLessonPage();
      return;
    }

    if (nextView === "exercises" && currentExercise) {
      navigate(buildExerciseUrl(currentExercise));
    }
  };

  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex h-full items-center gap-3">
        {view === "tours" && !lessonsPanelOpened && (
          <ToursMenu onOpen={onOpenLessonsPanel} />
        )}
        <SegmentedControl
          value={view}
          onChange={handleViewChange}
          items={VIEW_ITEMS}
        />
      </div>
      <SettingsMenu />
    </div>
  );
};
