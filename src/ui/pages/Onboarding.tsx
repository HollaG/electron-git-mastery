import { useState } from "react";
import logo from "../assets/logo.png";
import { useEmbeddedSuppressed } from "../hooks/useEmbeddedSuppressed";
import { FileLocationPanel } from "../components/Setup/FileLocationPanel";
import { SetupChecklist } from "../components/Setup/SetupChecklist";
import { AiKeyPanel } from "../components/Setup/AiKeyPanel";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Stepper } from "../components/ui/Stepper";
import { Tooltip } from "../components/ui/Tooltip";

const STEPS = ["File location", "Setup", "AI features"];

/**
 * First run only. Walks through where exercise files live, the prerequisite
 * tools, then an optional OpenRouter key. All three panels stay available
 * afterwards from the settings menu, so later steps can be left unfinished.
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
  const [aiConfigured, setAiConfigured] = useState(false);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gm-bone">
      <Card className="w-[680px] max-w-[92vw] p-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <img
              src={logo}
              alt="GitMastery logo"
              className="h-12 w-12 shrink-0"
            />
            <h1 className="font-heading text-[1.2rem]/[1.4] font-semibold text-[#333]">
              Welcome to GitMastery
            </h1>
          </div>

          <Stepper
            className="mx-auto w-3/4"
            active={step}
            steps={STEPS}
            onStepClick={setStep}
          />

          {step === 0 && <FileLocationPanel onChange={setFolder} />}
          {step === 1 && (
            <div className="flex flex-col gap-3">
              <SetupChecklist onReadyChange={setToolsReady} />
              <p className="text-[13px] text-neutral-500">
                You can leave anything unfinished and come back to it from
                Settings at any time.
              </p>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-3">
              <AiKeyPanel onConfiguredChange={setAiConfigured} />
            </div>
          )}

          <div className="flex justify-end">
            {step === 0 && (
              <Tooltip
                label="Choose where exercise files should be saved to continue."
                disabled={Boolean(folder)}
                width={280}
              >
                <Button disabled={!folder} onClick={() => setStep(1)}>
                  Continue
                </Button>
              </Tooltip>
            )}
            {step === 1 && (
              <Tooltip
                label="Some required tools were not detected yet. You can come back anytime via Settings to finish installing them."
                disabled={toolsReady}
                width={280}
              >
                <Button onClick={() => setStep(2)}>Continue</Button>
              </Tooltip>
            )}
            {step === 2 && (
              <Tooltip
                label="AI features won't be available until a key is provided. You can add one anytime from Settings."
                disabled={aiConfigured}
                width={280}
              >
                <Button onClick={onCompleteOnboarding}>
                  Start using GitMastery
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
