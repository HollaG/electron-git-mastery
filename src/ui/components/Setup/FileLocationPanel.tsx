import { useEffect, useRef, useState } from "react";
import { Button, Code, Group, Stack, Text } from "@mantine/core";
import { IconFolder } from "@tabler/icons-react";

/**
 * Lets the user pick the folder that exercise files are written to. This is the
 * one setting GitMastery cannot work without, so it is shown on its own both
 * during first run and from the settings menu.
 */
export const FileLocationPanel = ({
  onChange,
}: {
  onChange?: (path: string | null) => void;
}) => {
  const [folder, setFolder] = useState<string | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    window.electron
      .getDataDirectory()
      .then((dataDirectory) => {
        setFolder(dataDirectory);
        onChange?.(dataDirectory);
      })
      .catch(() => setFolder(null));
  }, [onChange]);

  const pickFolder = async () => {
    setIsPicking(true);
    try {
      const path = await window.electron.selectFolder();
      if (!path) return;
      window.electron.setDataDirectory(path);
      setFolder(path);
      onChange?.(path);
    } finally {
      setIsPicking(false);
    }
  };

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text>
          Practising Git means working with real files on your computer.
          GitMastery creates a folder for each exercise, with the starting files
          already set up for you.
        </Text>
        <Text>
          Pick a folder to keep them in — somewhere you can find easily, like
          your Documents or Desktop. You can move it later, but exercises
          already in progress will need to be downloaded again.
        </Text>
      </Stack>

      <Group gap="sm" align="center" wrap="nowrap">
        <IconFolder size={18} />
        {folder ? (
          <Code style={{ wordBreak: "break-all" }}>{folder}</Code>
        ) : (
          <Text c="dimmed" size="sm">
            No folder chosen yet
          </Text>
        )}
      </Group>

      <Group>
        <Button
          variant={folder ? "default" : "filled"}
          color="gm-green"
          onClick={pickFolder}
          loading={isPicking}
        >
          {folder ? "Change folder" : "Choose folder"}
        </Button>
      </Group>
    </Stack>
  );
};
