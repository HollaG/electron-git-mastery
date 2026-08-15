# git-mastery.org URL construction

The desktop app does not store full website URLs. It fetches the public catalogs and builds page URLs from `lesson_name` (and the exercise `identifier`).

## Catalogs

| Catalog         | URL                                                          | Hook                           |
| --------------- | ------------------------------------------------------------ | ------------------------------ |
| Lessons / tours | `https://git-mastery.org/lessons/lessons.json`               | `useCustomQuery` in `TourList` |
| Exercises       | `https://git-mastery.org/exercises-directory/exercises.json` | `useExercises`                 |

Each lesson object in both catalogs looks like:

```json
{
  "title": "T1L2. Preparing to Use Git",
  "tour_name": "recordingFolderHistory",
  "lesson_name": "gitPrep"
}
```

The catalogs used to ship a `path` field (e.g. `"path": "lessons/gitPrep"`). That field was removed. URL builders must use `lesson_name` instead.

## Built URLs

Helpers live in `src/ui/context/useWebContentsView.tsx`:

| Page      | Builder            | Example                                                        |
| --------- | ------------------ | -------------------------------------------------------------- |
| Lesson    | `buildLessonUrl`   | `https://git-mastery.org/lessons/gitPrep/`                     |
| Exercise  | `buildExerciseUrl` | `https://git-mastery.org/lessons/init/exercise-under-control`  |
| Tour home | `buildTourHomeUrl` | `https://git-mastery.org/lessons/trail/recordingFolderHistory` |

`buildExerciseUrl` reads `lesson_name` from `exercise.lesson`, or from `exercise.detour.lesson` when the exercise is detour-only.

`TourList` and `ExerciseList` call these helpers, then `navigate(url)`, which loads the page in the Electron WebContentsView.
