# Git-Mastery Desktop

Companion app for [git-mastery.org](https://git-mastery.org). Electron-based, cross-platform client for [GitMastery](https://github.com/git-mastery).

Linux support is still in development.

## Download

Grab the latest release from [GitHub Releases](https://github.com/HollaG/electron-git-mastery/releases).

**Windows:** run the `.exe`.

**macOS:** install the `.dmg`, then clear the quarantine flag (required for unsigned builds):

```bash
xattr -rc /Applications/git-mastery.app
```

Without this, macOS reports that the app can't be opened.

**Linux:** not officially supported.

## Development

```bash
git clone https://github.com/HollaG/electron-git-mastery.git
cd electron-git-mastery
npm install
npm run dev
```

`npm run dev` starts the React frontend and Electron backend together.

### Packaging

Builds take a while. The Dock / installer / `.exe` icon is `resources/icon.png` — see [packaging.md](docs/development/packaging.md).

| Platform | Command              | Output                                                                      |
| -------- | -------------------- | --------------------------------------------------------------------------- |
| Windows  | `npm run dist:win`   | `.exe` installer                                                            |
| macOS    | `npm run dist:mac`   | `dist/git-mastery-{version}-arm64.dmg` and `dist/mac-arm64/git-mastery.app` |
| Linux    | `npm run dist:linux` | AppImage / dist artifacts                                                   |

macOS users of an unsigned build still need the `xattr` command above after installing.

#### Windows build tools

`node-pty` needs native compilation. If the build fails:

1. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with **Desktop development with C++**, including MSVC v143, the Windows 10/11 SDK, and C++ CMake tools.
2. If you see `MSB8040` (Spectre-mitigated libraries required), add those libraries from the Visual Studio Installer → Individual components.
3. Restart the terminal and retry.
