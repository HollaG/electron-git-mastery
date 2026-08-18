import { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Group,
  Image,
  Paper,
  Stack,
  Stepper,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import logo from "../assets/logo.png";
import { useEmbeddedSuppressed } from "../hooks/useEmbeddedSuppressed";
import { FileLocationPanel } from "../components/Setup/FileLocationPanel";
import { SetupChecklist } from "../components/Setup/SetupChecklist";

/**
 * First run only. Walks through the two things that need attention before the
 * app is usable: where exercise files live, then the prerequisite tools. Both
 * panels stay available afterwards from the settings menu, so the second step
 * can be left unfinished.
 */
export const Onboarding = ({
  onCompleteOnboarding,
}: {
  onCompleteOnboarding: () => void;
}) => {
  // The webcontentsview showing the GitMastery webpage is a native view that
  // paints above this React app, so it has to stay collapsed while onboarding
  // is on screen.
  useEmbeddedSuppressed(true);

  const [step, setStep] = useState(0);
  const [folder, setFolder] = useState<string | null>(null);
  const [toolsReady, setToolsReady] = useState(false);

  return (
    <Flex bg="gm-bone" className="h-screen w-full items-center justify-center">
      <Paper
        withBorder
        radius="md"
        p="xl"
        bg="white"
        className="w-[680px] max-w-[92vw]"
      >
        <Stack gap="lg">
          <Group gap="md" align="center">
            <Box w={48} h={48}>
              <Image src={logo} alt="GitMastery logo" w={48} h={48} />
            </Box>
            <Title order={3}>Welcome to GitMastery</Title>
          </Group>

          {/* Two steps stretched across the card look lopsided, so the
              separator is kept short and the pair centred. */}
          <Box w="50%" mx="auto">
            <Stepper
              active={step}
              onStepClick={setStep}
              allowNextStepsSelect={false}
              color="gm-green"
              size="sm"
              iconSize={30}
            >
              <Stepper.Step label="File location" />
              <Stepper.Step label="Setup" />
            </Stepper>
          </Box>

          {step === 0 ? (
            <FileLocationPanel onChange={setFolder} />
          ) : (
            <Stack gap="sm">
              <SetupChecklist onReadyChange={setToolsReady} />
              <Text size="sm" c="dimmed">
                You can leave anything unfinished and come back to it from
                Settings at any time.
              </Text>
            </Stack>
          )}

          <Group justify="flex-end">
            {step === 0 ? (
              <Button
                color="gm-green"
                disabled={!folder}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            ) : (
              <Tooltip
                label="Some required tools were not detected yet. You can come back anytime via Settings to finish installing them."
                disabled={toolsReady}
                withArrow
                multiline
                w={280}
              >
                <Button color="gm-green" onClick={onCompleteOnboarding}>
                  Start using GitMastery
                </Button>
              </Tooltip>
            )}
          </Group>
        </Stack>
      </Paper>
    </Flex>
  );
};
