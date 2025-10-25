const fs = require('fs');
const colors = require('./colors');

// Strip ANSI color codes from text
function stripAnsiCodes(text) {
    return text.replace(/\x1b\[[0-9;]*m/g, '');
}

// Append text to markdown log file
function appendToMarkdownLog(logFile, text) {
    if (!logFile) return;

    try {
        const cleanText = stripAnsiCodes(text);
        fs.appendFileSync(logFile, cleanText + '\n', 'utf8');
    } catch (err) {
        console.error(`${colors.red}Error writing to log file: ${err.message}${colors.reset}`);
    }
}

// Initialize markdown log file with header
function initializeMarkdownLog(logFile) {
    if (!logFile) return;

    try {
        const header = `# Claude Code Spy Watch Log\n\nStarted: ${new Date().toISOString()}\n\n`;
        fs.writeFileSync(logFile, header, 'utf8');
    } catch (err) {
        console.error(`${colors.red}Error initializing log file: ${err.message}${colors.reset}`);
    }
}

module.exports = {
    stripAnsiCodes,
    appendToMarkdownLog,
    initializeMarkdownLog
};
