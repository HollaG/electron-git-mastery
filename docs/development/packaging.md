# Packaging assets

electron-builder reads packaging-only files from `resources/` (`directories.buildResources` in `electron-builder.json`). These files are used while building installers; they are not bundled into the React UI.

## App icon

`resources/icon.png` is the Dock / `.exe` / installer icon for macOS, Windows, and Linux. It is referenced as `"icon": "icon.png"` in `electron-builder.json`.

To replace it, overwrite `resources/icon.png` (a square PNG, ideally 1024×1024). electron-builder converts it to `.icns` / `.ico` during `npm run dist:mac`, `dist:win`, and `dist:linux`.

## Where images belong

| Kind of image | Location |
|---|---|
| Packaged app icon (Dock, installer, `.exe`) | `resources/` |
| Images shown in the React UI | `src/ui/assets/` |

Do not put the app icon in `src/ui/assets/` or a Vite `public/` folder — those paths ship into the renderer bundle, and the icon is only needed at package time.
