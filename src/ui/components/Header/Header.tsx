import { Box, Flex, Group, SegmentedControl } from "@mantine/core";
import { IconMap, IconChecklist } from "@tabler/icons-react";
import { useActivity } from "../../contexts/ActivityContext";
import { useAppView, type AppView } from "../../contexts/AppViewContext";
import {
  buildExerciseUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { SettingsMenu } from "./SettingsMenu";
import { ToursMenu } from "./ToursMenu";

export const Header = ({
  lessonsPanelOpened,
  onToggleLessonsPanel,
}: {
  lessonsPanelOpened: boolean;
  onToggleLessonsPanel: () => void;
}) => {
  const { currentExercise } = useActivity();
  const { view, setView } = useAppView();
  const { navigate, restoreLessonPage } = useWebContentsView();

  const handleViewChange = (value: string) => {
    const nextView = value as AppView;
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
    <Box
      h="100%"
      px="md"
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-3)",
        overflow: "visible",
      }}
    >
      <Flex h="100%" align="center" justify="space-between">
        <Flex h="100%" align="center" gap="sm">
          {view === "tours" && (
            <div className="h-full flex items-center">
              <ToursMenu
                opened={lessonsPanelOpened}
                onToggle={onToggleLessonsPanel}
              />
            </div>
          )}
          <SegmentedControl
            value={view}
            onChange={handleViewChange}
            size="sm"
            radius="xl"
            color="gm-green"
            data={[
              {
                value: "tours",
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconMap size={15} />
                    <span>Lesson Tours</span>
                  </Group>
                ),
              },
              {
                value: "exercises",
                label: (
                  <Group gap={6} wrap="nowrap">
                    <IconChecklist size={15} />
                    <span>Exercises</span>
                  </Group>
                ),
              },
            ]}
          />
        </Flex>
        <SettingsMenu />
      </Flex>
    </Box>
  );
};
