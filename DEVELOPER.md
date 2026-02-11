# Developer Documentation

## Adding Interactive Commands with Stdin Input

Some commands require user input via stdin (e.g., `gitmastery setup` prompts for a directory name). This app supports interactive commands using a special syntax.

### How It Works

**Frontend (renderer.ts):**
1. Show a modal to collect user input
2. Concatenate command and input with a colon: `command:input`
3. Send to backend via `executeCommand()`

**Backend (main.ts):**
1. Check if command is in the `interactiveCommands` whitelist
2. If yes, split on the first colon to separate command and input
3. Execute command and write input to stdin when process starts

### Adding a New Interactive Command

#### Step 1: Add to Whitelist (main.ts)

Find the `interactiveCommands` array in the `execute-command` IPC handler:

```typescript
// List of commands that expect stdin input
const interactiveCommands = ['gitmastery setup'];
```

Add your new command:

```typescript
const interactiveCommands = [
  'gitmastery setup',
  'gitmastery your-new-command'  // Add here
];
```

#### Step 2: Add Button Handler (renderer.ts)

Add a button click handler that shows the input modal:

```typescript
button.addEventListener('click', async () => {
  const userInput = await showInputModal(
    'Modal Title',
    'Prompt text for user',
    'default-value'
  );

  if (userInput === null) {
    return; // User cancelled
  }

  // Execute with input
  await executeCommandWithInput('gitmastery your-new-command', userInput, button);
});
```

#### Step 3: Add Button to HTML (index.html)

Add the button to the UI:

```html
<button class="cmd-button" data-command="gitmastery your-new-command">
  <svg><!-- icon --></svg>
  <span>Your Command</span>
</button>
```

### Important Notes

⚠️ **Why the Whitelist?**

The colon (`:`) is used as a separator between command and input. Without a whitelist, commands containing colons (like URLs) would break:

```bash
# Without whitelist - BROKEN:
git remote add origin https://github.com/user/repo.git
# Would be parsed as: command="git remote add origin https" input="//github.com/user/repo.git"

# With whitelist - WORKS:
git remote add origin https://github.com/user/repo.git
# Not in whitelist, so colon is preserved in the command
```

⚠️ **Only add commands that truly need stdin input**

Don't add commands to the whitelist unless they specifically prompt for user input via stdin. Regular commands with arguments should NOT be in this list.

### Example: gitmastery setup

**User clicks "Setup" button:**
1. Modal appears asking for directory name
2. User enters: `gitmastery-exercises`
3. Frontend sends: `gitmastery setup:gitmastery-exercises`
4. Backend:
   - Recognizes `gitmastery setup` is in whitelist
   - Splits to: command=`gitmastery setup`, input=`gitmastery-exercises`
   - Runs `gitmastery setup`
   - Writes `gitmastery-exercises\n` to stdin
   - Closes stdin

**Result:** Command receives the input as if user typed it interactively.
