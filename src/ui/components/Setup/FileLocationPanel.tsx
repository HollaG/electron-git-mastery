import { useEffect, useRef, useState } from "react";
import { IconFolder } from "@tabler/icons-react";
import { Button } from "../ui/Button";

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
    <div className="flex flex-col gap-4 text-sm text-[#333]">
      <div className="flex flex-col gap-2">
        <p>
          Practising Git means working with real files on your computer.
          GitMastery creates a folder for each exercise, with the starting files
          already set up for you.
        </p>
        <p>
          Pick a folder to keep them in — somewhere you can find easily, like
          your Documents or Desktop. You can move it later, but exercises
          already in progress will need to be downloaded again.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <IconFolder size={18} className="shrink-0 text-neutral-500" />
        {folder ? (
          <code className="rounded-md bg-neutral-100 px-2 py-1 font-mono text-[13px] break-all text-[#333]">
            {folder}
          </code>
        ) : (
          <span className="text-[13px] text-neutral-500">
            No folder chosen yet
          </span>
        )}
      </div>

      <div className="flex">
        <Button
          variant={folder ? "secondary" : "primary"}
          onClick={pickFolder}
          loading={isPicking}
        >
          {folder ? "Change folder" : "Choose folder"}
        </Button>
      </div>
    </div>
  );
};
