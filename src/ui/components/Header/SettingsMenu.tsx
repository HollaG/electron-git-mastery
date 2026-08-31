import { useState } from "react";
import {
  IconChecklist,
  IconFolder,
  IconSettings,
  IconSparkles,
} from "@tabler/icons-react";
import { FileLocationPanel } from "../Setup/FileLocationPanel";
import { SetupChecklist } from "../Setup/SetupChecklist";
import { AiKeyPanel } from "../Setup/AiKeyPanel";
import { IconButton } from "../ui/IconButton";
import { Menu, MenuItem, MenuLabel } from "../ui/Menu";
import { Modal } from "../ui/Modal";

type SettingsPanel = "file-location" | "setup" | "ai";

const PANEL_TITLES: Record<SettingsPanel, string> = {
  "file-location": "Configure file location",
  setup: "Setup dependencies",
  ai: "Set up AI features",
};

export const SettingsMenu = () => {
  const [panel, setPanel] = useState<SettingsPanel | null>(null);
  const opened = panel !== null;

  return (
    <>
      <Menu
        trigger={(props) => (
          <IconButton aria-label="Settings" {...props}>
            <IconSettings size={18} />
          </IconButton>
        )}
      >
        <MenuLabel>Setup</MenuLabel>
        <MenuItem
          icon={<IconFolder size={14} />}
          onClick={() => setPanel("file-location")}
        >
          {PANEL_TITLES["file-location"]}
        </MenuItem>
        <MenuItem
          icon={<IconChecklist size={14} />}
          onClick={() => setPanel("setup")}
        >
          {PANEL_TITLES.setup}
        </MenuItem>
        <MenuItem
          icon={<IconSparkles size={14} />}
          onClick={() => setPanel("ai")}
        >
          {PANEL_TITLES.ai}
        </MenuItem>
      </Menu>
      <Modal
        opened={opened}
        onClose={() => setPanel(null)}
        title={panel ? PANEL_TITLES[panel] : undefined}
        size="lg"
      >
        {panel === "file-location" && <FileLocationPanel />}
        {panel === "setup" && <SetupChecklist />}
        {panel === "ai" && <AiKeyPanel />}
      </Modal>
    </>
  );
};
