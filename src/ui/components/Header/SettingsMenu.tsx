import { useState } from "react";
import { ActionIcon, Menu, Modal, Tooltip } from "@mantine/core";
import { IconChecklist, IconFolder, IconSettings } from "@tabler/icons-react";
import { useEmbeddedSuppressed } from "../../hooks/useEmbeddedSuppressed";
import { FileLocationPanel } from "../Setup/FileLocationPanel";
import { SetupChecklist } from "../Setup/SetupChecklist";

type SettingsPanel = "file-location" | "setup";

const PANEL_TITLES: Record<SettingsPanel, string> = {
  "file-location": "Configure file location",
  setup: "Setup",
};

export const SettingsMenu = () => {
  const [panel, setPanel] = useState<SettingsPanel | null>(null);
  const opened = panel !== null;

  // The panels are rendered here rather than handed to ModalsProvider, which
  // mounts its modal outside this app's providers — panels that read app
  // context (SetupChecklist listens to the task stream) cannot open there.
  useEmbeddedSuppressed(opened);

  return (
    <>
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
            onClick={() => setPanel("file-location")}
          >
            {PANEL_TITLES["file-location"]}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconChecklist size={14} />}
            onClick={() => setPanel("setup")}
          >
            {PANEL_TITLES.setup}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={opened}
        onClose={() => setPanel(null)}
        title={panel ? PANEL_TITLES[panel] : undefined}
        size="lg"
        // The native view is shown again the moment the modal closes and cannot
        // fade with the DOM, so animating the modal only makes it flicker.
        transitionProps={{ duration: 0 }}
      >
        {panel === "file-location" && <FileLocationPanel />}
        {panel === "setup" && <SetupChecklist />}
      </Modal>
    </>
  );
};
