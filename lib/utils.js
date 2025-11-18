const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const colors = require('./colors');

// Paths
const historyPath = path.join(os.homedir(), '.claude', 'history.jsonl');
const projectsPath = path.join(os.homedir(), '.claude', 'projects');

// Format timestamp with relative time
function formatTimestamp(ts) {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let relativeTime;
    if (diffDays > 0) {
        relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        relativeTime = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
        relativeTime = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else {
        relativeTime = 'just now';
    }

    return {
        formatted: date.toLocaleString(),
        relative: relativeTime,
        date: date
    };
}

// Format project path for display
function formatProjectPath(projectPath) {
    if (!projectPath) return 'No project';
    const homedir = os.homedir();
    return projectPath.replace(homedir, '~');
}

// Truncate text to max length
function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Encode project path to directory format
function encodeProjectPath(projectPath) {
    const withoutLeadingSlash = projectPath.startsWith('/') ? projectPath.substring(1) : projectPath;
    return '-' + withoutLeadingSlash.replace(/\//g, '-');
}

// Decode project path from directory format
function decodeProjectPath(encodedPath) {
    if (encodedPath.startsWith('-')) {
        return '/' + encodedPath.substring(1).replace(/-/g, '/');
    }
    return '/' + encodedPath.replace(/-/g, '/');
}

// Read history file
async function readHistory() {
    if (!fs.existsSync(historyPath)) {
        console.error(`${colors.red}Error: History file not found at ${historyPath}${colors.reset}`);
        process.exit(1);
    }

    const entries = [];
    const fileStream = fs.createReadStream(historyPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.trim()) {
            try {
                const entry = JSON.parse(line);
                entries.push(entry);
            } catch (e) {
                // Skip malformed lines
            }
        }
    }

    return entries;
}

// Find session file for a project
async function findSessionFile(projectPath, timestamp) {
    if (!projectPath) return null;

    const projectDirName = encodeProjectPath(projectPath);
    const projectDir = path.join(projectsPath, projectDirName);

    if (!fs.existsSync(projectDir)) {
        return null;
    }

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'));

    for (const file of files) {
        const filePath = path.join(projectDir, file);
        const sessionId = path.basename(file, '.jsonl');

        try {
            const firstLine = fs.readFileSync(filePath, 'utf-8').split('\n')[0];
            if (firstLine) {
                const entry = JSON.parse(firstLine);
                return { filePath, sessionId };
            }
        } catch (e) {
            continue;
        }
    }

    return null;
}

// Read conversation from file
async function readConversation(filePath) {
    const conversation = [];
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    for await (const line of rl) {
        if (line.trim()) {
            try {
                const entry = JSON.parse(line);
                if (entry.type === 'user' || entry.type === 'assistant') {
                    conversation.push(entry);
                }
            } catch (e) {
                // Skip malformed lines
            }
        }
    }

    return conversation;
}

// Format tool input
function formatToolInput(input) {
    if (!input) return '';

    const formatted = JSON.stringify(input, null, 2)
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n');

    return `\n${formatted}`;
}

// Format assistant message
function formatAssistantMessage(message) {
    if (!message || !message.content) return 'No response';

    if (typeof message.content === 'string') {
        return message.content;
    }

    if (Array.isArray(message.content)) {
        return message.content.map(item => {
            if (item.type === 'text') {
                return item.text;
            } else if (item.type === 'tool_use') {
                return `${colors.blue}[Tool: ${item.name}]${colors.reset}${formatToolInput(item.input)}`;
            } else if (item.type === 'thinking') {
                return `${colors.dim}[Thinking]${colors.reset}`;
            }
            return '';
        }).join('\n');
    }

    return 'Complex response';
}

module.exports = {
    historyPath,
    projectsPath,
    formatTimestamp,
    formatProjectPath,
    truncateText,
    encodeProjectPath,
    decodeProjectPath,
    readHistory,
    findSessionFile,
    readConversation,
    formatToolInput,
    formatAssistantMessage
};
