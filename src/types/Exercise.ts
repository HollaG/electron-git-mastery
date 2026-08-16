import type { Lesson } from "./Tour";

export type Exercises = {
  [key: string]: Exercise;
};

export type Exercise = {
  lesson?: Lesson;
  detour?: {
    lesson: Lesson;
    title: string;
  };
  identifier: string;
  wip?: number;
};
