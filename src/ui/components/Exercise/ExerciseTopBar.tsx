import { ActionIcon, Box, Tooltip } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useActivity } from "../../contexts/ActivityContext";

/**
 * Row reserved above the embedded exercise page. It cannot be an overlay: the
 * exercise page is a native view that always paints above the React DOM, so the
 * only way to keep controls visible is to leave space for them.
 */
export const ExerciseTopBar = () => {
  const { endActivity } = useActivity();

  return (
    <Box
      px="sm"
      py={6}
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Tooltip label="Back to exercises" position="right" withArrow>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Back to exercises"
          onClick={() => endActivity()}
        >
          <IconArrowLeft size={20} />
        </ActionIcon>
      </Tooltip>
    </Box>
  );
};
