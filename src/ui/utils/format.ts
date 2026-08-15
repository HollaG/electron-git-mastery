import type { Exercise } from "../../types/Exercise";

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
