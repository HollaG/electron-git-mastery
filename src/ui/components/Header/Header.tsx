import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  SegmentedControl,
  Text,
} from "@mantine/core";
import {
  IconMap,
  IconChecklist,
  IconPlayerStop,
  IconCircleCheck,
} from "@tabler/icons-react";
import { useActivity } from "../../contexts/ActivityContext";
import { useAppView, type AppView } from "../../contexts/AppViewContext";
import { SettingsMenu } from "./SettingsMenu";
import { ToursMenu } from "./ToursMenu";

export const Header = ({
  lessonsPanelOpened,
  onToggleLessonsPanel,
}: {
  lessonsPanelOpened: boolean;
  onToggleLessonsPanel: () => void;
}) => {
  const { getActivityText, isDoingActivity, endActivity, verifyExercise } =
    useActivity();
  const { view, setView } = useAppView();

  return (
    <Box
      pos="relative"
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
            onChange={(value) => setView(value as AppView)}
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

      {isDoingActivity && (
        <Center pos="absolute" inset={0} style={{ pointerEvents: "none" }}>
          <Flex
            px="sm"
            bg="gm-green"
            align="center"
            gap="sm"
            className="rounded-full py-1 min-w-0 max-w-[min(520px,42vw)] shadow-sm"
            style={{ pointerEvents: "auto" }}
          >
            <Button
              size="compact-sm"
              variant="subtle"
              c="white"
              leftSection={<IconPlayerStop size={14} />}
              onClick={() => endActivity()}
            >
              Quit
            </Button>
            <Divider orientation="vertical" color="rgba(255,255,255,0.35)" />
            <Text c="white" size="sm" fw={500} truncate className="min-w-0">
              {getActivityText()}
            </Text>
            <Divider orientation="vertical" color="rgba(255,255,255,0.35)" />
            <Button
              size="compact-sm"
              variant="white"
              color="gm-green"
              leftSection={<IconCircleCheck size={14} />}
              onClick={() => {
                verifyExercise({});
              }}
            >
              Check solution
            </Button>
          </Flex>
        </Center>
      )}
    </Box>
  );
};
