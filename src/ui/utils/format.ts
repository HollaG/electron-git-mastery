import type { Exercise } from "../../types/Exercise";

const TOUR_TITLES: Record<string, string> = {
  recordingFolderHistory: "Tour 1: Recording the History of a Folder",
  backingUpOnCloud: "Tour 2: Backing up a Repo on the Cloud",
  workingWithRemotes: "Tour 3: Working With an Existing Remote Repo",
  usingRevisionHistory: "Tour 4: Using the Revision History of a Repo",
  branchingLocally: "Tour 6: Branching Locally",
  remoteBranches: "Tour 8: Working with Remote Branches",
  workingWithPrs: "Tour 9: Working with Pull Requests",
};

export const formatExerciseTitle = (exercise: Exercise) => {
  if (exercise.detour) {
    return exercise.detour.title;
  }

  return exercise.identifier
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
};

export const getExerciseTourName = (exercise: Exercise) => {
  return (
    exercise.lesson?.tour_name ?? exercise.detour?.lesson?.tour_name ?? "other"
  );
};

export const getExerciseLessonTitle = (exercise: Exercise) => {
  return exercise.lesson?.title ?? exercise.detour?.lesson?.title ?? "";
};

export const formatTourName = (tourName: string) => {
  if (TOUR_TITLES[tourName]) {
    return TOUR_TITLES[tourName];
  }

  return tourName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};
