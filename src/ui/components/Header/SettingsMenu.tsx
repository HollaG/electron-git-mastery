import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useLocalStorage } from "@mantine/hooks";

export const SettingsMenu = () => {
  const [, setOnboardingCompleted] = useLocalStorage({
    key: "onboarding-completed",
    defaultValue: false,
  });

  return (
    <Menu shadow="md" width={220} position="bottom-end">
      <Tooltip label="Settings" position="bottom">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            radius="xl"
            aria-label="Settings"
          >
            <IconSettings size={18} />
          </ActionIcon>
        </Menu.Target>
      </Tooltip>

      <Menu.Dropdown>
        <Menu.Label>Setup</Menu.Label>
        <Menu.Item
          leftSection={<IconSettings size={14} />}
          onClick={() => setOnboardingCompleted(false)}
        >
          Setup GitMastery
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
