import { Flex, Stack } from "@mantine/core";
import { TourList } from "./TourList";
import { ExerciseList } from "./ExerciseList";

export const LeftBarWrapper = () => {
  return (
    <Stack h="100%" className="overflow-y-scroll">
      <TourList />
      <Flex flex={1}>
        <ExerciseList />
      </Flex>
    </Stack>
  );
};
