import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Divider,
  Group,
  Loader,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCircleCheck,
  IconCircleX,
  IconDownload,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";
import { useElectronStream } from "../../hooks/useElectronStream";

type CheckResult = { ok: boolean; detail: string };

type SetupItem = {
  key: string;
  label: string;
  /** Shown until the check has something more specific to report. */
  description: string;
  check: () => Promise<CheckResult>;
  /** Fixes the item from inside the app. */
  install?: { label: string; run: () => Promise<unknown> };
  /** Opens an external page for items we cannot install ourselves. */
  link?: { label: string; url: string };
};

type RowState = {
  status: "checking" | "ok" | "missing";
  detail?: string;
  busy?: boolean;
};

const isSetupCommand = (cmd: string) => cmd.startsWith("setup");
const noop = () => {};

/**
 * The prerequisites GitMastery needs, as a checklist that reports its own
 * progress inline. Deliberately notification-free: each row owns its spinner,
 * result and retry, so it can be shown during first run or from settings.
 */
export const SetupChecklist = ({
  onReadyChange,
}: {
  /** Called whenever every item is, or stops being, satisfied. */
  onReadyChange?: (ready: boolean) => void;
}) => {
  const [rows, setRows] = useState<Record<string, RowState>>({});

  // `gitmastery setup` reports completion over the task stream rather than from
  // its invoke call, so the row waits on this resolver before re-checking.
  const setupDoneRef = useRef<(() => void) | null>(null);

  const settleSetup = useCallback(() => {
    const resolve = setupDoneRef.current;
    setupDoneRef.current = null;
    resolve?.();
  }, []);

  useElectronStream({
    condition: isSetupCommand,
    onData: noop,
    onSuccessExit: settleSetup,
    onFailedExit: settleSetup,
  });

  const createExerciseFolder = useCallback(
    () =>
      new Promise<void>((resolve) => {
        setupDoneRef.current = resolve;
        window.electron.startGitMasteryTask("setup").catch(() => {
          setupDoneRef.current = null;
          resolve();
        });
      }),
    [],
  );

  const items = useMemo<SetupItem[]>(
    () => [
      {
        key: "git",
        label: "Git",
        description: "The version control system the exercises are built on.",
        check: async () => {
          const installed = await window.electron.checkGit();
          return {
            ok: installed,
            detail: installed ? "Installed" : "Not found on this computer",
          };
        },
        link: { label: "Download Git", url: "https://git-scm.com/install/" },
      },
      {
        key: "github-cli",
        label: "GitHub CLI",
        description: "Lets exercises interact with your GitHub account.",
        check: async () => {
          const installed = await window.electron.checkGithubCli();
          return {
            ok: installed,
            detail: installed ? "Installed" : "Not found on this computer",
          };
        },
        link: {
          label: "Download GitHub CLI",
          url: "https://github.com/cli/cli/releases",
        },
      },
      {
        key: "gitmastery-cli",
        label: "GitMastery CLI",
        description: "Downloads exercises and checks your solutions.",
        check: async () => {
          const { version, latest } =
            await window.electron.getGitMasteryVersion();
          if (!version) {
            return { ok: false, detail: "Not downloaded yet" };
          }
          return {
            ok: true,
            detail:
              latest && latest !== version
                ? `Version ${version} installed, ${latest} available`
                : `Version ${version}`,
          };
        },
        install: {
          label: "Download GitMastery CLI",
          run: () => window.electron.downloadGitMasteryApp(),
        },
      },
      {
        key: "exercise-folder",
        label: "Exercise folder",
        description: "Where your exercise files are created.",
        check: async () => {
          const status = await window.electron.checkExerciseFolder();
          if (!status.dataDirectory) {
            return { ok: false, detail: "Choose a save location first" };
          }
          return {
            ok: status.ready,
            detail: status.ready
              ? status.exercisesPath!
              : "Not created yet in your save location",
          };
        },
        install: { label: "Create folder", run: createExerciseFolder },
      },
    ],
    [createExerciseFolder],
  );

  const patchRow = useCallback((key: string, patch: Partial<RowState>) => {
    setRows((prev) => {
      const current: RowState = prev[key] ?? { status: "checking" };
      return { ...prev, [key]: { ...current, ...patch } };
    });
  }, []);

  const runCheck = useCallback(
    async (item: SetupItem) => {
      patchRow(item.key, { status: "checking" });
      try {
        const { ok, detail } = await item.check();
        patchRow(item.key, { status: ok ? "ok" : "missing", detail });
      } catch (error) {
        patchRow(item.key, {
          status: "missing",
          detail: error instanceof Error ? error.message : "Check failed",
        });
      }
    },
    [patchRow],
  );

  const checkAll = useCallback(() => {
    items.forEach((item) => void runCheck(item));
  }, [items, runCheck]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  const allReady = items.every((item) => rows[item.key]?.status === "ok");
  useEffect(() => {
    onReadyChange?.(allReady);
  }, [allReady, onReadyChange]);

  const runInstall = async (item: SetupItem) => {
    if (!item.install) return;
    patchRow(item.key, { busy: true });
    try {
      await item.install.run();
      await runCheck(item);
    } finally {
      patchRow(item.key, { busy: false });
    }
  };

  return (
    <Stack gap="xs">
      <Text>
        GitMastery runs real Git commands on your machine, so it needs these
        tools installed. An item marked with a cross was not detected on your
        machine — use its download button, then check that item again.
      </Text>

      <Stack gap={0} mt="xs">
        {items.map((item, index) => {
          const state = rows[item.key];
          const status = state?.status ?? "checking";

          return (
            <div key={item.key}>
              {index > 0 && <Divider />}
              <Group
                justify="space-between"
                wrap="nowrap"
                align="center"
                py="sm"
              >
                <Group gap="sm" wrap="nowrap" align="center" miw={0}>
                  <StatusIcon status={status} />
                  <Stack gap={0} miw={0}>
                    <Text fw={500}>{item.label}</Text>
                    <Text
                      size="sm"
                      c="dimmed"
                      style={{ wordBreak: "break-all" }}
                    >
                      {state?.detail ?? item.description}
                    </Text>
                  </Stack>
                </Group>

                <Group gap={4} wrap="nowrap">
                  {item.install && status !== "ok" && (
                    <Tooltip label={item.install.label} withArrow>
                      <ActionIcon
                        variant="light"
                        color="gm-green"
                        aria-label={item.install.label}
                        loading={state?.busy}
                        disabled={status === "checking"}
                        onClick={() => void runInstall(item)}
                      >
                        <IconDownload size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {item.link && status !== "ok" && (
                    <Tooltip label={item.link.label} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        aria-label={item.link.label}
                        disabled={status === "checking"}
                        onClick={() =>
                          window.electron.openExternal(item.link!.url)
                        }
                      >
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                  <Tooltip label="Check again" withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label={`Check ${item.label} again`}
                      disabled={status === "checking" || state?.busy}
                      onClick={() => void runCheck(item)}
                    >
                      <IconRefresh size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </div>
          );
        })}
      </Stack>
    </Stack>
  );
};

const StatusIcon = ({ status }: { status: RowState["status"] }) => {
  if (status === "checking") return <Loader size={16} color="gray" />;
  if (status === "ok") return <IconCircleCheck size={20} color="green" />;
  return <IconCircleX size={20} color="red" />;
};
