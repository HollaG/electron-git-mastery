import type { Exercise } from "../../types/Exercise";

export const formatBreadcrumb = (s: string) => {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

export const formatExerciseTitle = (exercise: Exercise) => {
  if (exercise.detour) {
    return exercise.detour.title;
  }
  if (exercise.lesson) {
    return exercise.identifier.replace(/^T\d+L\d+\. /, "");
  }

  return exercise.identifier
    .split("-")
    .map((s) => s.toUpperCase())
    .join(" ");
};
