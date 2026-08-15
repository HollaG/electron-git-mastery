export type TourData = {
  [folder: string]: Tour
}

export type Tour = {
  folder: string, // tour key
  title: string,
  lessons: {
    [lessonKey: string]: Lesson,
  }
}

export type Lesson = {
  title: string,
  tour_name: string,
  lesson_name: string,
}
