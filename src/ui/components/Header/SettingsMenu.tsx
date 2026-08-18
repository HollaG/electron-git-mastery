import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { useModals } from "@mantine/modals";
import { IconChecklist, IconFolder, IconSettings } from "@tabler/icons-react";
import { FileLocationPanel } from "../Setup/FileLocationPanel";
import { SetupChecklist } from "../Setup/SetupChecklist";

export const SettingsMenu = () => {
  const { openModal } = useModals();

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
          leftSection={<IconFolder size={14} />}
          onClick={() =>
            openModal({
              title: "Configure file location",
              size: "lg",
              children: <FileLocationPanel />,
            })
          }
        >
          Configure file location
        </Menu.Item>
        <Menu.Item
          leftSection={<IconChecklist size={14} />}
          onClick={() =>
            openModal({
              title: "Setup",
              size: "lg",
              children: <SetupChecklist />,
            })
          }
        >
          Setup
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
};
