import { useEffect } from "react";
import { useWebContentsView } from "../contexts/WebContentsViewContext";

/**
 * Keeps the embedded site collapsed while `active` is true, releasing the claim
 * on unmount.
 *
 * The embedded site lives in a native WebContentsView that paints above the
 * React DOM, so anything rendered in the DOM that needs to be seen has to claim
 * a suppression for as long as it is on screen.
 */
export function useEmbeddedSuppressed(active: boolean) {
  const { suppressEmbedded } = useWebContentsView();

  useEffect(() => {
    if (!active) return;
    return suppressEmbedded();
  }, [active, suppressEmbedded]);
}
