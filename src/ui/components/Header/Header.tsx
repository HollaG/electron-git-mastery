import {
  Box,
  Title,
  Button,
  SimpleGrid,
  Flex,
  Divider,
  Center,
  Burger,
  Group,
} from "@mantine/core";
import { useActivity } from "../../contexts/ActivityContext";
import { Text } from "@mantine/core";
import { SettingsMenu } from "./SettingsMenu";

export const Header = ({
  navbarOpened,
  onToggleNavbar,
}: {
  navbarOpened: boolean;
  onToggleNavbar: () => void;
}) => {
  const { getActivityText, isDoingActivity, endActivity, verifyExercise } =
    useActivity();

  return (
    <SimpleGrid
      cols={3}
      p="md"
      className="flex items-center justify-between h-16"
    >
      <Group gap="sm">
        <Burger opened={navbarOpened} onClick={onToggleNavbar} size="sm" />
        <Title order={4}> GitMastery </Title>
      </Group>
      <Box>
        {isDoingActivity && (
          <Flex
            px="md"
            bg="gm-green"
            w="100%"
            h="100%"
            gap={"lg"}
            className="rounded-3xl py-0.5"
          >
            <Center>
              <Button
                size="sm"
                variant="subtle"
                c="white"
                onClick={() => endActivity()}
              >
                Quit
              </Button>
            </Center>
            <Divider orientation="vertical" />
            <Center>
              <Text c="white">{getActivityText()}</Text>
            </Center>
            <Divider orientation="vertical" />
            <Center>
              <Button
                size="sm"
                variant="transparent"
                c="white"
                onClick={() => {
                  verifyExercise({});
                }}
              >
                Check solution
              </Button>
            </Center>
          </Flex>
        )}
      </Box>
      <Flex justify="flex-end" align="center">
        <SettingsMenu />
      </Flex>
    </SimpleGrid>
  );
};
