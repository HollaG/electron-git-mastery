import { SettingsMenu } from "./SettingsMenu";
import { ToursMenu } from "./ToursMenu";

export const Header = ({
  lessonsPanelOpened,
  onToggleLessonsPanel,
}: {
  lessonsPanelOpened: boolean;
  onToggleLessonsPanel: () => void;
}) => {
  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex h-full items-center gap-3">
        <ToursMenu
          opened={lessonsPanelOpened}
          onToggle={onToggleLessonsPanel}
        />
      </div>
      <SettingsMenu />
    </div>
  );
};
