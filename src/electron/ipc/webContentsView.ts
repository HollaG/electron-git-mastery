import { WebContentsView, BrowserWindow, screen } from "electron";
import { ipcMainOn } from "../utils/util.js";
import { getWcvPreloadPath } from "../pathResolver.js";
import { _download, _verify } from "./gitmastery.js";
import { getMainWindow } from "../main.js";
import { sendToRenderer } from "./ipcUtils.js";

const EMBED_CSS = `
  header .navbar,
  header nav.navbar,
  footer {
    display: none !important;
  }
  #flex-body > #site-nav,
  #page-nav,
  .toggle-page-nav-button {
    display: none !important;
  }
  .fixed-header-padding {
    padding-top: 50px !important;
  }
  .lower-navbar-container {
    display: block !important;
    height: 50px !important;
    border: none !important;
    background: transparent !important;
    overflow: visible !important;
  }
  .nav-menu-open {
    width: min(320px, calc(100vw - 16px)) !important;
    height: auto !important;
    max-height: min(70vh, 640px) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border: 1px solid #ddd;
    border-radius: 0 0 8px 8px;
    z-index: 1000;
  }
  .nav-menu-open .mb-mobile-nav,
  .nav-menu-open #site-nav {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    max-height: none !important;
    border: none !important;
  }
  .site-nav-list li:has(a[href*="/lessons/trail/all.html"]) {
    display: none !important;
  }
`;

let wcv: WebContentsView | null = null;

let isHidden = true;
let isLoading = false;
let bounds = { x: 0, y: 0, width: 0, height: 0 };

function applyBounds() {
  if (!wcv) return;
  if (isHidden || isLoading) {
    wcv.setBounds({ x: 0, y: 0, width: 0, height: 0 });
    return;
  }
  wcv.setBounds(bounds);
}

function setLoading(mainWindow: BrowserWindow, loading: boolean) {
  isLoading = loading;
  applyBounds();
  sendToRenderer(mainWindow, "wcv-loading", { loading });
}

function getOrCreateWcv(mainWindow: BrowserWindow): WebContentsView {
  if (!wcv) {
    wcv = new WebContentsView({
      webPreferences: {
        // Loads a minimal preload that exposes window.wcvBridge.send()
        // so injected JS can fire IPC events back to the main process.
        // See: src/electron/wcv-preload.cts
        preload: getWcvPreloadPath(),
      },
    });

    mainWindow.contentView.addChildView(wcv);
    wcv.setBackgroundColor("#ffffff");

    wcv.webContents.on("did-start-navigation", (details) => {
      if (!details.isMainFrame || details.isSameDocument) return;
      setLoading(mainWindow, true);
    });
    wcv.webContents.on("dom-ready", () => {
      void wcv!.webContents.insertCSS(EMBED_CSS);
      void wcv!.webContents.executeJavaScript(`
        (() => {
          if (window.__gmTourMenu) return;
          window.__gmTourMenu = true;
          const descriptor = Object.getOwnPropertyDescriptor(Window.prototype, "innerWidth");
          if (!descriptor || !descriptor.get) return;
          const getInnerWidth = descriptor.get;
          Object.defineProperty(window, "innerWidth", {
            configurable: true,
            enumerable: true,
            get() { return Math.min(getInnerWidth.call(this), 991); }
          });
          window.dispatchEvent(new Event("resize"));
        })()
      `);
    });
    wcv.webContents.on("did-finish-load", async () => {
      await wcv!.webContents.insertCSS(EMBED_CSS).catch(() => {});
      setLoading(mainWindow, false);
    });

    injectDownloadExercise(mainWindow);
    injectVerifyExercise(mainWindow);
  }
  return wcv;
}

/**
 * Injects a "Start Exercise" button into the WCV page, replacing the
 * matching download-info div. When clicked, the button uses window.wcvBridge
 * (exposed by wcv-preload.cts) to fire an IPC event back to the main process.
 *
 * Returns a cleanup function that removes the dom-ready listener.
 */
function injectDownloadExercise(mainWindow: BrowserWindow) {
  const wcv = getOrCreateWcv(mainWindow);

  // Listen for IPC messages sent from the WCV page via window.wcvBridge.send()
  wcv.webContents.on("ipc-message", (_event, channel, ...args) => {
    if (channel === "wcv-start-exercise") {
      const { exerciseId } = args[0] as { exerciseId: string };
      console.log("[wcv] start exercise clicked:", exerciseId);
      // onStartExercise(exerciseId);

      // call gitmastery download ${exerciseIdentifier}
      _download(mainWindow, `${exerciseId}`);
    }
  });

  const handler = async () => {
    // All DOM manipulation must live inside the executeJavaScript string —
    // DOM nodes cannot cross the process boundary.
    // window.wcvBridge is available because wcv-preload.cts is loaded.
    console.log("now executing javascript to replace button for download");
    await wcv.webContents.executeJavaScript(`
      (function() {
        /**
         * Replaces all ex-download-info-XX divs with a "Start Exercise" button.
         * Safe to call multiple times: already-replaced elements won't match
         * the querySelector since they are no longer divs with that id.
         */
        function replaceDownloadDivs() {
          const els = document.querySelectorAll('div[id^="ex-download-info-"]');
          els.forEach((el) => {
            const id = el.id.replace("ex-download-info-", "");
            const btn = document.createElement("button");
            btn.textContent = "Start Exercise";
            btn.style.cssText = "padding:8px 16px; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer;";
            btn.addEventListener("click", () => {
              window.wcvBridge.send("wcv-start-exercise", { exerciseId: id });
            });
            el.replaceWith(btn);
            console.log("replaced div: ", el.id);
          });
        }

        // Run immediately for any divs already present on dom-ready
        replaceDownloadDivs();

        // Watch every .card-collapse for internal DOM changes (e.g. expanding
        // a collapsed section that injects new ex-download-info- divs).
        const cardCollapses = document.querySelectorAll('.card-collapse');
        cardCollapses.forEach((cardCollapse) => {
          const observer = new MutationObserver(() => {
            replaceDownloadDivs();
          });
          observer.observe(cardCollapse, { childList: true, subtree: true });
        });
      })()
    `);
  };

  wcv.webContents.addListener("dom-ready", handler);
  return () => wcv.webContents.removeListener("dom-ready", handler);
}

function injectVerifyExercise(mainWindow: BrowserWindow) {
  const wcv = getOrCreateWcv(mainWindow);

  // Listen for IPC messages sent from the WCV page via window.wcvBridge.send()
  wcv.webContents.on("ipc-message", (_event, channel, ...args) => {
    if (channel === "wcv-verify-exercise") {
      const { exerciseId } = args[0] as { exerciseId: string };
      console.log("[wcv] verify exercise clicked:", exerciseId);
      // onStartExercise(exerciseId);

      // call gitmastery download ${exerciseIdentifier}
      _verify(mainWindow, exerciseId);
    }
  });

  const handler = async () => {
    // All DOM manipulation must live inside the executeJavaScript string —
    // DOM nodes cannot cross the process boundary.
    // window.wcvBridge is available because wcv-preload.cts is loaded.
    console.log("now executing javascript to replace button for verify");
    await wcv.webContents.executeJavaScript(`
      (function() {
        /**
         * Replaces all ex-verify-info-XX divs with a "Start Exercise" button.
         * Safe to call multiple times: already-replaced elements won't match
         * the querySelector since they are no longer divs with that id.
         */
        function replaceVerifyDivs() {
          const els = document.querySelectorAll('div[id^="ex-verify-info-"]');
          els.forEach((el) => {
            const id = el.id.replace("ex-verify-info-", "");
            const btn = document.createElement("button");
            btn.textContent = "Verify Solution";
            btn.style.cssText = "padding:8px 16px; background:#6366f1; color:white; border:none; border-radius:6px; cursor:pointer;";
            btn.addEventListener("click", () => {
              window.wcvBridge.send("wcv-verify-exercise", { exerciseId: id });
            });
            el.replaceWith(btn);
            console.log("replaced div: ", el.id);
          });
        }

        // Run immediately for any divs already present on dom-ready
        replaceVerifyDivs();

        // Watch every .card-collapse for internal DOM changes (e.g. expanding
        // a collapsed section that injects new ex-download-info- divs).
        const cardCollapses = document.querySelectorAll('.card-collapse');
        cardCollapses.forEach((cardCollapse) => {
          const observer = new MutationObserver(() => {
            replaceVerifyDivs();
          });
          observer.observe(cardCollapse, { childList: true, subtree: true });
        });
      })()
    `);
  };

  wcv.webContents.addListener("dom-ready", handler);
  return () => wcv.webContents.removeListener("dom-ready", handler);
}
export function setupWebContentsViewIpc(mainWindow: BrowserWindow) {
  ipcMainOn(
    "wcv-size",
    ({
      x,
      y,
      width,
      height,
    }: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      console.log("[info] wcv-size event received");
      getOrCreateWcv(mainWindow);

      /**
       * Note: Issue with Electron apps & scaling for web contents view.
       * We need to account for the display scaling.
       *
       * If the user only has one display, then it's easy -- screen.getDisplayNearestPoint always returns the same display.
       * But if the user has two displays with different scale factor, then we base off the mouse position when deciding which display to
       * find the scaling factor of.
       *
       * Consider that when the screen size changes, the
       */

      const mainWindowBounds = getMainWindow().getContentBounds();
      const centerPt = {
        x: mainWindowBounds.x + mainWindowBounds.width / 2,
        y: mainWindowBounds.y + mainWindowBounds.height / 2,
      };

      const display = screen.getDisplayNearestPoint(centerPt);
      const scalingFactor = display.scaleFactor;
      console.log({ scalingFactor });

      // screen.screenToDipPoint is Windows-only. On macOS/Linux, Electron already
      // works in DIP (logical pixel) space, so raw x/y values need no conversion.
      const dipX = x;
      const dipY = y;
      bounds = {
        x: dipX / scalingFactor,
        y: dipY / scalingFactor,
        width: width / scalingFactor,
        height: height / scalingFactor,
      };

      if (!isHidden && !isLoading) {
        getOrCreateWcv(mainWindow).setBounds(bounds);
      }
    },
  );

  ipcMainOn("wcv-show", () => {
    console.log("[info] wcv-show event received");
    getOrCreateWcv(mainWindow);
    isHidden = false;
    applyBounds();
  });

  ipcMainOn("wcv-navigate", ({ url }: { url: string }) => {
    console.log("[info] wcv-navigate event received");
    setLoading(mainWindow, true);
    getOrCreateWcv(mainWindow).webContents.loadURL(url);
  });

  // Temporarily hide the wcv, whenever we need to display a full screen modal.
  ipcMainOn("wcv-hide", () => {
    isHidden = true;
    applyBounds();
  });

  // Clean up when the window is closed
  mainWindow.on("closed", () => {
    wcv = null;
  });
}
