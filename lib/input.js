const readline = require('readline');
const { execFileSync } = require('child_process');
const colors = require('./colors');

// Setup keyboard input handling for watch mode
function setupKeyboardInput(options) {
    const {
        onExit,
        onAnalyzer,
        onSecurity,
        onDependencies,
        onBash,
        onFiles,
        onHelp,
        onTime,
        readConversation,
        sessionFile,
        sessionStartTime,
        watchStartIndex
    } = options;

    if (!process.stdin.isTTY) {
        return;
    }

    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', async (str, key) => {
        // Exit
        if (key && (key.name === 'q' || (key.ctrl && key.name === 'c'))) {
            onExit();
            return;
        }

        // Security analysis (s key)
        if (key && key.name === 's') {
            const conversation = await readConversation(sessionFile);
            await onSecurity(conversation, watchStartIndex);
            return;
        }

        // Archer analysis (a key)
        if (key && key.name === 'a') {
            const conversation = await readConversation(sessionFile);
            await onAnalyzer(conversation, watchStartIndex);
            return;
        }

        // Dependencies (d key)
        if (key && key.name === 'd') {
            const conversation = await readConversation(sessionFile);
            await onDependencies(conversation, sessionStartTime, watchStartIndex);
            return;
        }

        // Bash history (b key)
        if (key && key.name === 'b') {
            const conversation = await readConversation(sessionFile);
            await onBash(conversation, watchStartIndex);
            return;
        }

        // File views (f key - cycles through tracker, summary, sizes)
        if (key && key.name === 'f') {
            const conversation = await readConversation(sessionFile);
            await onFiles(conversation, watchStartIndex);
            return;
        }

        // Help (h key)
        if (key && key.name === 'h') {
            await onHelp();
            return;
        }

        // Time statistics (t key)
        if (key && key.name === 't') {
            const conversation = await readConversation(sessionFile);
            await onTime(conversation, watchStartIndex, sessionStartTime);
            return;
        }
    });

    // Handle Ctrl+C globally
    process.on('SIGINT', () => {
        onExit();
    });
}

// Clean up keyboard input
function cleanupKeyboardInput() {
    if (process.stdin.setRawMode) {
        process.stdin.setRawMode(false);
    }
}

// Get keyboard shortcuts help text
function getKeyboardShortcuts() {
    return `${colors.bright}${colors.cyan}Keyboard Shortcuts:${colors.reset}
${colors.yellow}a${colors.reset}  - Run Archer (AI conversation analysis)
${colors.yellow}s${colors.reset}  - Run Security Analysis
${colors.yellow}d${colors.reset}  - Show dependency graph & recent commits
${colors.yellow}b${colors.reset}  - Show bash command history
${colors.yellow}f${colors.reset}  - Cycle through file views (tracker → summary → sizes)
${colors.yellow}t${colors.reset}  - Show time statistics
${colors.yellow}h${colors.reset}  - Show this help
${colors.yellow}q${colors.reset}  - Quit`;
}

module.exports = {
    setupKeyboardInput,
    cleanupKeyboardInput,
    getKeyboardShortcuts
};
