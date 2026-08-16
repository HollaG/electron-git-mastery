import {
  ActionIcon,
  Box,
  Button,
  Collapse,
  Flex,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconChevronDown,
  IconChevronLeft,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";
import type { Lesson, Tour, TourData } from "../../../types/Tour";
import {
  buildLessonUrl,
  buildTourHomeUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { useCustomQuery } from "../../hooks/query/useCustomQuery";
import { useAppView } from "../../contexts/AppViewContext";

export const ToursMenu = ({
  opened,
  onToggle,
}: {
  opened: boolean;
  onToggle: () => void;
}) => {
  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      radius="xl"
      aria-label={opened ? "Minimize lessons panel" : "Open lessons panel"}
      aria-expanded={opened}
      onClick={onToggle}
    >
      {opened ? <IconX size={18} /> : <IconMenu2 size={18} />}
    </ActionIcon>
  );
};

export const ToursPanel = ({ onMinimize }: { onMinimize: () => void }) => {
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
    <Flex direction="column" h="100%" bg="white">
      <Flex
        align="center"
        justify="space-between"
        px="md"
        h={54}
        className="shrink-0 border-b border-gray-200"
      >
        <Text fw={600}>Lessons</Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Minimize lessons panel"
          onClick={onMinimize}
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
      </Flex>
      <ScrollArea className="min-h-0 flex-1">
        <Stack gap={4} p="sm">
          <Text size="sm" fw={600} c="dimmed">
            Tours
          </Text>
          {isLoading && (
            <Text size="sm" c="dimmed">
              Loading…
            </Text>
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
        </Stack>
      </ScrollArea>
    </Flex>
  );
};

const nestedLinkStyles = {
  root: {
    height: "auto",
    paddingTop: 10,
    paddingBottom: 10,
    lineHeight: 1.5,
  },
};

const TourItem = ({
  tour,
  onNavigate,
}: {
  tour: Tour;
  onNavigate: (url: string) => void;
}) => {
  const [opened, { toggle }] = useDisclosure(false);

  return (
    <Flex direction="column">
      <Button
        onClick={toggle}
        variant="subtle"
        color="dark"
        w="100%"
        styles={{
          label: {
            textAlign: "left",
            width: "100%",
          },
          root: {
            height: "auto",
            padding: "8px",
            lineHeight: "1.5em",
          },
        }}
      >
        <Flex gap={4} align="center">
          <Box className="shrink-0">
            <IconChevronDown
              className={`transition-all duration-150 ease-in-out ${opened ? "rotate-180" : ""}`}
              size={12}
            />
          </Box>
          {tour.title}
        </Flex>
      </Button>
      <Collapse in={opened} pl="sm">
        <Button
          variant="subtle"
          color="dark"
          fullWidth
          justify="flex-start"
          size="compact-sm"
          styles={nestedLinkStyles}
          onClick={() => onNavigate(buildTourHomeUrl(tour))}
        >
          Tour Home
        </Button>
        {Object.values(tour.lessons).map((lesson) => (
          <LessonItem
            key={lesson.lesson_name}
            lesson={lesson}
            onNavigate={onNavigate}
          />
        ))}
      </Collapse>
    </Flex>
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
    <Button
      variant="subtle"
      color="dark"
      fullWidth
      justify="flex-start"
      size="compact-sm"
      styles={nestedLinkStyles}
      onClick={() => onNavigate(buildLessonUrl(lesson))}
    >
      {lesson.title}
    </Button>
  );
};
