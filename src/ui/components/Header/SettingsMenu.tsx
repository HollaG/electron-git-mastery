import { ActionIcon, Menu } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import { useLocalStorage } from "@mantine/hooks";

export const SettingsMenu = () => {
  const [, setOnboardingCompleted] = useLocalStorage({
    key: "onboarding-completed",
    defaultValue: false,
  });

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="dark" aria-label="Settings">
          <IconSettings size={20} />
        </ActionIcon>
      </Menu.Target>

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
