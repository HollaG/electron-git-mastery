import {
  Box,
  Button,
  Collapse,
  Flex,
  ActionIcon,
  Popover,
  ScrollArea,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconChevronDown, IconMenu2, IconX } from "@tabler/icons-react";
import { useState } from "react";
import type { Lesson, Tour, TourData } from "../../../types/Tour";
import {
  buildLessonUrl,
  buildTourHomeUrl,
  useWebContentsView,
} from "../../contexts/WebContentsViewContext";
import { useCustomQuery } from "../../hooks/query/useCustomQuery";
import { useAppView } from "../../contexts/AppViewContext";

export const ToursMenu = () => {
  const [opened, setOpened] = useState(false);
  const { data: tourList, isLoading } = useCustomQuery<TourData>({
    queryKey: ["tour_list"],
    queryUrl: "https://git-mastery.org/lessons/lessons.json",
  });
  const { navigate, hide, show } = useWebContentsView();
  const { setView } = useAppView();

  const setOpen = (next: boolean) => {
    if (next) {
      hide();
      setOpened(true);
      return;
    }
    setOpened(false);
    show();
  };

  const tours = tourList
    ? Object.values(tourList).filter((tour) => tour.folder !== "all")
    : [];

  return (
    <Popover
      opened={opened}
      onChange={setOpen}
      position="bottom-start"
      shadow="md"
      width={300}
      withinPortal
      zIndex={10000}
      closeOnClickOutside
      closeOnEscape
    >
      <Popover.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          radius="xl"
          aria-label="Tours"
          aria-expanded={opened}
        >
          {opened ? <IconX size={18} /> : <IconMenu2 size={18} />}
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <ScrollArea.Autosize mah={420}>
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
                  setOpen(false);
                  navigate(url);
                }}
              />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
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
      onClick={() => onNavigate(buildLessonUrl(lesson))}
    >
      {lesson.title}
    </Button>
  );
};
