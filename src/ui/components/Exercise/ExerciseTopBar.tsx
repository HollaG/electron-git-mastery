import { IconArrowLeft } from "@tabler/icons-react";
import { useActivity } from "../../contexts/ActivityContext";
import { IconButton } from "../ui/IconButton";
import { Tooltip } from "../ui/Tooltip";

/**
 * Row reserved above the embedded exercise page. It cannot be an overlay: the
 * exercise page is a native view that always paints above the React DOM, so the
 * only way to keep controls visible is to leave space for them.
 */
export const ExerciseTopBar = () => {
  const { endActivity } = useActivity();

  return (
    <div className="shrink-0 border-b border-neutral-200 px-3 py-1.5">
      {/* Anchored to the right of the button for the same reason: a tooltip
          below it would land on the native view and never be seen. */}
      <Tooltip label="Back to exercises" position="right">
        <IconButton
          aria-label="Back to exercises"
          onClick={() => endActivity()}
        >
          <IconArrowLeft size={20} />
        </IconButton>
      </Tooltip>
    </div>
  );
};
