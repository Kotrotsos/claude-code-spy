#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');
const os = require('os');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
    red: '\x1b[31m',
    orange: '\x1b[38;5;208m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const historyPath = path.join(os.homedir(), '.claude', 'history.jsonl');
const projectsPath = path.join(os.homedir(), '.claude', 'projects');

// Configuration
let config = {
    limit: null,
    project: null,
    search: null,
    after: null,
    before: null,
    reverse: false,
    showHelp: false,
    showStats: false,
    showFull: false,
    outputOnly: false,
    sessionId: null,
    showCurrent: false,
    watchMode: false,
    archerMode: false,
    archerLimit: 10,
    nanoMode: false
};

// Parse arguments
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
        case '-h':
        case '--help':
            config.showHelp = true;
            break;
        case '-l':
        case '--limit':
            config.limit = parseInt(args[++i]);
            break;
        case '-p':
        case '--project':
            config.project = args[++i];
            break;
        case '-s':
        case '--search':
            config.search = args[++i];
            break;
        case '-a':
        case '--after':
            config.after = new Date(args[++i]);
            break;
        case '-b':
        case '--before':
            config.before = new Date(args[++i]);
            break;
        case '-r':
        case '--reverse':
            config.reverse = true;
            break;
        case '--stats':
            config.showStats = true;
            break;
        case '-f':
        case '--full':
            config.showFull = true;
            break;
        case '--output-only':
            config.outputOnly = true;
            break;
        case '--session':
            config.sessionId = args[++i];
            break;
        case '-c':
        case '--current':
            config.showCurrent = true;
            break;
        case '-w':
        case '--watch':
            config.watchMode = true;
            break;
        case '--archer':
            config.archerMode = true;
            break;
        case '--archer-limit':
            config.archerLimit = parseInt(args[++i]);
            break;
        case '--nano':
            config.nanoMode = true;
            break;
    }
}

function showHelp() {
    console.log(`
${colors.bright}Claude Code Spy${colors.reset}

${colors.cyan}USAGE:${colors.reset}
    ${colors.green}node claude-history-cli.js [OPTIONS]${colors.reset}

${colors.cyan}OPTIONS:${colors.reset}
    ${colors.yellow}-h, --help${colors.reset}         Show this help message
    ${colors.yellow}-l, --limit N${colors.reset}      Limit output to last N entries
    ${colors.yellow}-p, --project PATH${colors.reset} Filter by project path (supports partial match)
    ${colors.yellow}-s, --search TERM${colors.reset}  Search for entries containing TERM
    ${colors.yellow}-a, --after DATE${colors.reset}   Show entries after DATE (YYYY-MM-DD)
    ${colors.yellow}-b, --before DATE${colors.reset}  Show entries before DATE (YYYY-MM-DD)
    ${colors.yellow}-r, --reverse${colors.reset}      Show oldest entries first
    ${colors.yellow}-f, --full${colors.reset}         Show full conversation with Claude's responses
    ${colors.yellow}--output-only${colors.reset}      Show only Claude's responses (no user input)
    ${colors.yellow}--session ID${colors.reset}       Show specific session by ID
    ${colors.yellow}-c, --current${colors.reset}      List all sessions for current directory
    ${colors.yellow}-w, --watch${colors.reset}        Watch current directory session in real-time (15s idle + 1000+ tokens triggers auto-summary, press q or Ctrl+C to exit)
    ${colors.yellow}--archer${colors.reset}           Analyze recent conversations with LLM (requires OPENAI_API_KEY)
    ${colors.yellow}--archer-limit N${colors.reset}   Number of recent commands to analyze (default: 10)
    ${colors.yellow}--nano${colors.reset}             Use faster gpt-3.5-turbo model instead of gpt-4o-mini (faster & cheaper)
    ${colors.yellow}--stats${colors.reset}            Show statistics about your Claude usage

${colors.cyan}EXAMPLES:${colors.reset}
    ${colors.gray}# Show last 10 entries with full conversation${colors.reset}
    node claude-history-cli.js -l 10 -f

    ${colors.gray}# Search for entries about "API" with Claude's responses${colors.reset}
    node claude-history-cli.js -s API -f

    ${colors.gray}# Show only Claude's outputs for a search${colors.reset}
    node claude-history-cli.js -s "function" --output-only

    ${colors.gray}# Show entries from specific project${colors.reset}
    node claude-history-cli.js -p /projects/myapp

    ${colors.gray}# Show entries from today${colors.reset}
    node claude-history-cli.js -a ${new Date().toISOString().split('T')[0]}

    ${colors.gray}# List all sessions for current directory${colors.reset}
    node claude-history-cli.js --current

    ${colors.gray}# Watch current session in real-time${colors.reset}
    node claude-history-cli.js --watch

    ${colors.gray}# Analyze last 10 conversations with AI${colors.reset}
    node claude-history-cli.js --archer

    ${colors.gray}# Analyze last 20 conversations${colors.reset}
    node claude-history-cli.js --archer --archer-limit 20

    ${colors.gray}# Analyze with faster (and cheaper) gpt-4.1 nano model${colors.reset}
    node claude-history-cli.js --archer --nano

    ${colors.gray}# Show usage statistics${colors.reset}
    node claude-history-cli.js --stats
`);
}

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

function formatProjectPath(projectPath) {
    if (!projectPath) return 'No project';
    const homedir = os.homedir();
    return projectPath.replace(homedir, '~');
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

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

async function findSessionFile(projectPath, timestamp) {
    if (!projectPath) return null;

    // Convert project path to directory name format (leading dash + segments joined with dashes)
    // Example: /Users/name/projects/app -> -Users-name-projects-app
    const projectDirName = '-' + projectPath.replace(/\//g, '-');
    const projectDir = path.join(projectsPath, projectDirName);

    if (!fs.existsSync(projectDir)) {
        return null;
    }

    // Find the most likely session file based on timestamp
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    // Find the session file that contains entries around the same time
    for (const file of files) {
        const filePath = path.join(projectDir, file);
        const sessionId = path.basename(file, '.jsonl');

        // Check if this file has entries near our timestamp
        try {
            const firstLine = fs.readFileSync(filePath, 'utf-8').split('\n')[0];
            if (firstLine) {
                const entry = JSON.parse(firstLine);
                // Simple heuristic: if file exists, it might contain our conversation
                return { filePath, sessionId };
            }
        } catch (e) {
            continue;
        }
    }

    return null;
}

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

async function findConversationForEntry(entry) {
    const sessionInfo = await findSessionFile(entry.project, entry.timestamp);
    if (!sessionInfo) return null;

    const conversation = await readConversation(sessionInfo.filePath);

    // Find the user message that matches our entry
    const entryTime = new Date(entry.timestamp);
    let closestMatch = null;
    let minDiff = Infinity;

    for (let i = 0; i < conversation.length; i++) {
        const conv = conversation[i];
        if (conv.type === 'user' && conv.message?.content) {
            const convTime = new Date(conv.timestamp);
            const diff = Math.abs(entryTime - convTime);

            // Check if content matches (partial match due to possible truncation)
            const userContent = typeof conv.message.content === 'string'
                ? conv.message.content
                : conv.message.content[0]?.text || '';

            const entryText = entry.display.substring(0, 100);
            const convText = userContent.substring(0, 100);

            if (diff < minDiff && (diff < 60000 || convText.includes(entryText.substring(0, 50)) || entryText.includes(convText.substring(0, 50)))) {
                minDiff = diff;
                closestMatch = i;
            }
        }
    }

    if (closestMatch !== null) {
        // Return the user message and the following assistant response
        const result = [conversation[closestMatch]];
        if (closestMatch + 1 < conversation.length && conversation[closestMatch + 1].type === 'assistant') {
            result.push(conversation[closestMatch + 1]);
        }
        return result;
    }

    return null;
}

function filterEntries(entries) {
    let filtered = entries;

    // Filter by project
    if (config.project) {
        filtered = filtered.filter(e =>
            e.project && e.project.toLowerCase().includes(config.project.toLowerCase())
        );
    }

    // Filter by search term
    if (config.search) {
        filtered = filtered.filter(e =>
            e.display && e.display.toLowerCase().includes(config.search.toLowerCase())
        );
    }

    // Filter by date range
    if (config.after) {
        filtered = filtered.filter(e => new Date(e.timestamp) > config.after);
    }
    if (config.before) {
        filtered = filtered.filter(e => new Date(e.timestamp) < config.before);
    }

    // Sort order
    if (!config.reverse) {
        filtered = filtered.reverse(); // Show newest first by default
    }

    // Limit
    if (config.limit) {
        filtered = filtered.slice(0, config.limit);
    }

    return filtered;
}

function formatToolInput(input) {
    if (!input) return '';

    // Format the input object nicely
    const formatted = JSON.stringify(input, null, 2)
        .split('\n')
        .map(line => `    ${line}`)
        .join('\n');

    return `\n${formatted}`;
}

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

async function displayEntry(entry, index, total) {
    const time = formatTimestamp(entry.timestamp);
    const project = formatProjectPath(entry.project);

    if (!config.outputOnly) {
        console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}Entry #${total - index}${colors.reset} ${colors.gray}(${time.relative})${colors.reset}`);
        console.log(`${colors.yellow}Time:${colors.reset} ${time.formatted}`);
        console.log(`${colors.magenta}Project:${colors.reset} ${project}`);
        console.log(`${colors.green}Input:${colors.reset}`);

        // Display the user input with proper formatting
        const lines = entry.display.split('\n');
        lines.forEach(line => {
            console.log(`  ${colors.white}${line}${colors.reset}`);
        });
    }

    // If full conversation requested, try to get Claude's response
    if (config.showFull || config.outputOnly) {
        const conversation = await findConversationForEntry(entry);

        if (conversation && conversation.length > 1) {
            const assistant = conversation[1];

            if (!config.outputOnly) {
                console.log(`\n${colors.blue}Claude's Response:${colors.reset}`);
            } else {
                console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.gray}Response to: "${truncateText(entry.display, 80)}"${colors.reset}`);
            }

            const response = formatAssistantMessage(assistant.message);
            const responseLines = response.split('\n');

            // Limit response display to avoid overwhelming output
            const maxLines = 50;
            const displayLines = responseLines.slice(0, maxLines);

            displayLines.forEach(line => {
                console.log(`  ${colors.gray}${line}${colors.reset}`);
            });

            if (responseLines.length > maxLines) {
                console.log(`  ${colors.dim}... (${responseLines.length - maxLines} more lines)${colors.reset}`);
            }

            if (assistant.message?.usage) {
                console.log(`  ${colors.dim}[Tokens: ${assistant.message.usage.input_tokens} in, ${assistant.message.usage.output_tokens} out]${colors.reset}`);
            }
        } else if (config.showFull) {
            console.log(`\n${colors.gray}(Claude's response not found or not available)${colors.reset}`);
        }
    }

    // If there's pasted content, show it
    if (!config.outputOnly && entry.pastedContents && Object.keys(entry.pastedContents).length > 0) {
        console.log(`${colors.blue}Attachments:${colors.reset}`);
        Object.entries(entry.pastedContents).forEach(([key, value]) => {
            console.log(`  ${colors.gray}• ${key}: ${truncateText(value.toString())}${colors.reset}`);
        });
    }
}

function encodeProjectPath(projectPath) {
    // Convert /path/to/proj -> -path-to-proj
    // Remove leading slash if present, then replace all slashes with dashes, then prepend dash
    const withoutLeadingSlash = projectPath.startsWith('/') ? projectPath.substring(1) : projectPath;
    return '-' + withoutLeadingSlash.replace(/\//g, '-');
}

function decodeProjectPath(encodedPath) {
    // Convert -path-to-proj -> /path/to/proj
    if (encodedPath.startsWith('-')) {
        return encodedPath.substring(1).replace(/-/g, '/');
    }
    return encodedPath.replace(/-/g, '/');
}

async function listCurrentProjectSessions() {
    const currentPath = process.cwd();
    const encodedPath = encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    console.log(`${colors.bright}${colors.cyan}Current Directory:${colors.reset} ${currentPath}`);
    console.log(`${colors.dim}Looking for: ${projectDir}${colors.reset}\n`);

    if (!fs.existsSync(projectDir)) {
        console.error(`${colors.red}No Claude project found for path: ${currentPath}${colors.reset}`);
        console.log(`${colors.yellow}Expected directory: ${projectDir}${colors.reset}`);
        console.log(`\n${colors.dim}Available projects:${colors.reset}`);

        const allDirs = fs.readdirSync(projectsPath);
        allDirs.slice(0, 10).forEach(dir => {
            const decoded = decodeProjectPath(dir);
            console.log(`  ${colors.gray}${decoded}${colors.reset}`);
        });

        return;
    }

    // List all .jsonl files (session transcripts)
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        console.log(`${colors.yellow}No conversation sessions found in this project${colors.reset}`);
        return;
    }

    console.log(`${colors.green}Found ${files.length} conversation session(s):${colors.reset}\n`);

    // Get file stats and sort by modification time
    const fileStats = files.map(file => {
        const filePath = path.join(projectDir, file);
        const stats = fs.statSync(filePath);
        const sessionId = path.basename(file, '.jsonl');
        return { sessionId, file, mtime: stats.mtime, filePath };
    }).sort((a, b) => b.mtime - a.mtime); // Newest first

    for (const fileInfo of fileStats) {
        const time = formatTimestamp(fileInfo.mtime);

        // Try to read first few lines to get context
        let messageCount = 0;
        let firstUserMessage = '';

        try {
            const content = fs.readFileSync(fileInfo.filePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            messageCount = lines.filter(line => {
                try {
                    const entry = JSON.parse(line);
                    return entry.type === 'user' || entry.type === 'assistant';
                } catch (e) {
                    return false;
                }
            }).length;

            // Get first user message
            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);
                    if (entry.type === 'user' && entry.message?.content) {
                        const content = typeof entry.message.content === 'string'
                            ? entry.message.content
                            : entry.message.content[0]?.text || '';
                        firstUserMessage = content.split('\n')[0];
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            // Ignore read errors
        }

        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}Session ID:${colors.reset} ${colors.yellow}${fileInfo.sessionId}${colors.reset}`);
        console.log(`${colors.bright}Last Updated:${colors.reset} ${time.formatted} ${colors.gray}(${time.relative})${colors.reset}`);
        console.log(`${colors.bright}Messages:${colors.reset} ${messageCount}`);
        if (firstUserMessage) {
            console.log(`${colors.bright}Started with:${colors.reset} ${colors.white}${truncateText(firstUserMessage, 80)}${colors.reset}`);
        }
        console.log(`\n${colors.dim}To view: ${colors.reset}${colors.green}claude-history --session ${fileInfo.sessionId}${colors.reset}\n`);
    }
}

function formatToolResult(result) {
    if (!result || !result.content) return 'No result';

    const content = result.content;

    // If it's a simple string, show it (truncated if too long)
    if (typeof content === 'string') {
        const lines = content.split('\n');
        const maxLines = 20;

        if (lines.length <= maxLines) {
            return content;
        }

        const preview = lines.slice(0, maxLines).join('\n');
        return `${preview}\n${colors.dim}... (${lines.length - maxLines} more lines)${colors.reset}`;
    }

    return JSON.stringify(content, null, 2);
}

function displayMessage(entry, truncate = false) {
    if (entry.type === 'user') {
        const time = formatTimestamp(entry.timestamp);
        const content = entry.message?.content || '';

        // Check if this is a tool result message
        if (Array.isArray(content) && content.length > 0 && content[0].type === 'tool_result') {
            // This is a tool result - display it differently
            console.log(`\n${colors.bright}${colors.magenta}Tool Result:${colors.reset}`);

            content.forEach(item => {
                if (item.type === 'tool_result') {
                    const result = formatToolResult(item);
                    const resultLines = result.split('\n');

                    resultLines.forEach(line => {
                        console.log(`  ${colors.dim}${line}${colors.reset}`);
                    });
                }
            });
        } else {
            // Regular user message
            console.log(`\n${colors.bright}${colors.green}User (${time.relative}):${colors.reset}`);
            const text = typeof content === 'string' ? content : content[0]?.text || '';
            console.log(`  ${colors.white}${text}${colors.reset}`);
        }
    } else if (entry.type === 'assistant') {
        console.log(`\n${colors.bright}${colors.blue}Claude:${colors.reset}`);
        const response = formatAssistantMessage(entry.message);
        const lines = response.split('\n');
        const maxLines = truncate ? 50 : lines.length;
        const displayLines = lines.slice(0, maxLines);

        displayLines.forEach(line => {
            console.log(`  ${colors.gray}${line}${colors.reset}`);
        });

        if (truncate && lines.length > maxLines) {
            console.log(`  ${colors.dim}... (${lines.length - maxLines} more lines)${colors.reset}`);
        }
    }
}

async function showSpecificSession(sessionId) {
    // Find the session file
    const projectDirs = fs.readdirSync(projectsPath);
    let sessionFile = null;

    for (const dir of projectDirs) {
        const possibleFile = path.join(projectsPath, dir, `${sessionId}.jsonl`);
        if (fs.existsSync(possibleFile)) {
            sessionFile = possibleFile;
            break;
        }
    }

    if (!sessionFile) {
        console.error(`${colors.red}Session ${sessionId} not found${colors.reset}`);
        return;
    }

    const conversation = await readConversation(sessionFile);
    console.log(`${colors.green}Found ${conversation.length} messages in session${colors.reset}`);

    for (const entry of conversation) {
        displayMessage(entry, true);
    }
}

async function watchCurrentSession() {
    const currentPath = process.cwd();
    const encodedPath = encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    console.log(`${colors.bright}${colors.cyan}Watch Mode - Current Directory:${colors.reset} ${currentPath}`);

    if (!fs.existsSync(projectDir)) {
        console.error(`${colors.red}No Claude project found for path: ${currentPath}${colors.reset}`);
        return;
    }

    // Find the most recent session file
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        console.log(`${colors.yellow}No conversation sessions found. Waiting for new session...${colors.reset}`);
        console.log(`${colors.dim}Press 'q' or Ctrl+C to exit${colors.reset}\n`);

        // Watch for new files
        let watchInterval = setInterval(() => {
            const newFiles = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));
            if (newFiles.length > 0) {
                clearInterval(watchInterval);
                watchCurrentSession(); // Restart with new session
            }
        }, 1000);

        return;
    }

    // Get most recent file
    const fileStats = files.map(file => {
        const filePath = path.join(projectDir, file);
        const stats = fs.statSync(filePath);
        return { file, filePath, mtime: stats.mtime };
    }).sort((a, b) => b.mtime - a.mtime);

    const sessionFile = fileStats[0].filePath;
    const sessionId = path.basename(fileStats[0].file, '.jsonl');

    console.log(`${colors.bright}Watching session:${colors.reset} ${colors.yellow}${sessionId}${colors.reset}`);
    console.log(`${colors.dim}Press 'q' or Ctrl+C to exit${colors.reset}\n`);

    let lastMessageCount = 0;
    let isExiting = false;

    // Setup keyboard input
    if (process.stdin.isTTY) {
        const readline = require('readline');
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
        }

        process.stdin.on('keypress', async (str, key) => {
            if (key && (key.name === 'q' || (key.ctrl && key.name === 'c'))) {
                isExiting = true;
                if (countdownInterval) clearInterval(countdownInterval);
                console.log(`\n${colors.yellow}Exiting watch mode...${colors.reset}`);
                if (process.stdin.setRawMode) {
                    process.stdin.setRawMode(false);
                }
                process.exit(0);
            }
            // Press 's' to manually run Security analysis
            if (key && key.name === 's') {
                if (analysisPending) {
                    console.log(`\n${colors.yellow}Analysis already running...${colors.reset}`);
                    return;
                }
                analysisPending = true;
                if (countdownInterval) clearInterval(countdownInterval);
                console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.dim}Running Security Analysis (manual trigger)...${colors.reset}\n`);
                const currentConversation = await readConversation(sessionFile);
                let totalTokens = 0;
                for (const entry of currentConversation) {
                    if (entry.type === 'assistant') {
                        const content = entry.message?.content || [];
                        if (Array.isArray(content)) {
                            content.forEach(item => {
                                if (item.type === 'text') {
                                    totalTokens += Math.ceil(item.text.length / 4);
                                }
                            });
                        }
                    }
                }
                await runSecurityAnalysisInline(sessionFile);
                lastAnalysisTokenCount = totalTokens;
                console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.dim}Resuming watch... (${lastMessageCount} messages so far)${colors.reset}\n`);
                analysisPending = false;
            }
            // Press 'a' to manually run Archer
            if (key && key.name === 'a') {
                if (analysisPending) {
                    console.log(`\n${colors.yellow}Analysis already running...${colors.reset}`);
                    return;
                }
                analysisPending = true;
                if (countdownInterval) clearInterval(countdownInterval);
                console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.dim}Running Archer (manual trigger)...${colors.reset}\n`);
                const currentConversation = await readConversation(sessionFile);
                let totalTokens = 0;
                for (const entry of currentConversation) {
                    if (entry.type === 'assistant') {
                        const content = entry.message?.content || [];
                        if (Array.isArray(content)) {
                            content.forEach(item => {
                                if (item.type === 'text') {
                                    totalTokens += Math.ceil(item.text.length / 4);
                                }
                            });
                        }
                    }
                }
                await runArcherAnalysisInline(sessionFile);
                lastAnalysisTokenCount = totalTokens;
                console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.dim}Resuming watch... (${lastMessageCount} messages so far)${colors.reset}\n`);
                analysisPending = false;
            }
        });
    }

    // Handle Ctrl+C
    process.on('SIGINT', () => {
        if (!isExiting) {
            isExiting = true;
            console.log(`\n${colors.yellow}Exiting watch mode...${colors.reset}`);
            if (process.stdin.setRawMode) {
                process.stdin.setRawMode(false);
            }
            process.exit(0);
        }
    });

    // Initial read
    const initialConversation = await readConversation(sessionFile);
    for (const entry of initialConversation) {
        displayMessage(entry, false);
    }
    lastMessageCount = initialConversation.length;

    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    console.log(`${colors.dim}Watching for new messages... (${lastMessageCount} messages so far)${colors.reset}`);
    console.log(`${colors.dim}💡 Tips: Press 'a' to manually run Archer, or wait 15s idle + 1000+ tokens${colors.reset}\n`);

    // Track idle time for auto-summary
    let lastMessageTime = Date.now();
    let analysisPending = false;
    let lastAnalysisTokenCount = 0;
    let countdownInterval = null;

    // Poll for changes
    const pollInterval = setInterval(async () => {
        if (isExiting) {
            clearInterval(pollInterval);
            return;
        }

        try {
            const currentConversation = await readConversation(sessionFile);

            if (currentConversation.length > lastMessageCount) {
                // New messages arrived
                const newMessages = currentConversation.slice(lastMessageCount);

                console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.green}New message(s) received!${colors.reset}\n`);

                for (const entry of newMessages) {
                    displayMessage(entry, false);
                }

                lastMessageCount = currentConversation.length;
                lastMessageTime = Date.now();
                analysisPending = false;
                console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.dim}Watching for new messages... (${lastMessageCount} messages so far)${colors.reset}`);
            } else {
                // Check for idle timeout (15 seconds) with minimum token count
                const idleTime = Date.now() - lastMessageTime;

                // Count tokens in assistant messages
                let totalTokens = 0;
                for (const entry of currentConversation) {
                    if (entry.type === 'assistant') {
                        const content = entry.message?.content || [];
                        if (Array.isArray(content)) {
                            content.forEach(item => {
                                if (item.type === 'text') {
                                    // Rough estimate: ~4 characters per token
                                    totalTokens += Math.ceil(item.text.length / 4);
                                }
                            });
                        }
                    }
                }

                const newTokens = totalTokens - lastAnalysisTokenCount;
                const idleSeconds = Math.floor(idleTime / 1000);

                // Show countdown/status if idle but conditions not met
                if (idleTime > 3000 && !analysisPending && lastMessageCount > 0 && (newTokens < 1000 || idleSeconds < 15)) {
                    if (!countdownInterval) {
                        countdownInterval = setInterval(() => {
                            const currentIdleTime = Date.now() - lastMessageTime;
                            const currentIdleSeconds = Math.floor(currentIdleTime / 1000);
                            let statusLine;

                            // Recalculate tokens for this interval
                            let checkTokens = 0;
                            for (const entry of currentConversation) {
                                if (entry.type === 'assistant') {
                                    const content = entry.message?.content || [];
                                    if (Array.isArray(content)) {
                                        content.forEach(item => {
                                            if (item.type === 'text') {
                                                checkTokens += Math.ceil(item.text.length / 4);
                                            }
                                        });
                                    }
                                }
                            }
                            const checkNewTokens = checkTokens - lastAnalysisTokenCount;

                            // Show stats after 5 seconds of idle
                            if (currentIdleSeconds === 5) {
                                process.stdout.write('\r' + ' '.repeat(120) + '\r');
                                const stats = getToolStats(currentConversation);
                                console.log(`\n${colors.dim}Stats: ${stats.totalTools} tool calls (${stats.toolList}) | ${checkNewTokens} tokens${colors.reset}`);
                                return;
                            }

                            // Stop showing timer after 15 seconds
                            if (currentIdleSeconds >= 15) {
                                clearInterval(countdownInterval);
                                countdownInterval = null;
                                process.stdout.write('\r' + ' '.repeat(120) + '\r');
                                return;
                            }

                            if (currentIdleSeconds >= 15 && checkNewTokens >= 1000) {
                                statusLine = `${colors.green}✓ Ready to summarize! (Idle: ${currentIdleSeconds}s | Tokens: ${checkNewTokens}) | Press 'a' now or wait for auto-summary${colors.reset}`;
                            } else if (currentIdleSeconds < 5) {
                                const remainingSeconds = Math.max(0, 15 - currentIdleSeconds);
                                const remainingTokens = Math.max(0, 1000 - checkNewTokens);
                                statusLine = `${colors.dim}Idle: ${currentIdleSeconds}s/15s | Tokens: ${checkNewTokens}/1000 (need ${remainingTokens} more) | Press 'a' for summary, 's' for security check${colors.reset}`;
                                process.stdout.write(`\r${statusLine}`);
                            }
                        }, 1000);
                    }
                } else if (countdownInterval && (idleTime <= 3000 || analysisPending || (newTokens >= 1000 && idleSeconds >= 15))) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                    process.stdout.write('\r' + ' '.repeat(120) + '\r'); // Clear the line
                }

                if (idleTime > 15000 && !analysisPending && lastMessageCount > 0 && newTokens >= 1000) {
                    // Claude has been idle for 15 seconds with 1000+ new tokens, run analysis
                    analysisPending = true;
                    if (countdownInterval) clearInterval(countdownInterval);
                    process.stdout.write('\r' + ' '.repeat(100) + '\r'); // Clear the line
                    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                    console.log(`${colors.dim}Claude idle for 15 seconds (${newTokens} new tokens), generating summary...${colors.reset}\n`);
                    await runArcherAnalysisInline(sessionFile);
                    lastAnalysisTokenCount = totalTokens;
                    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                    console.log(`${colors.dim}Resuming watch... (${lastMessageCount} messages so far)${colors.reset}\n`);
                    analysisPending = false;
                }
            }
        } catch (e) {
            // File might be in the middle of being written, ignore
        }
    }, 500); // Poll every 500ms
}

function getToolStats(conversation) {
    const toolCounts = {};
    const toolTypes = new Set();

    for (const entry of conversation) {
        if (entry.type === 'assistant') {
            const content = entry.message?.content || [];
            if (Array.isArray(content)) {
                content.forEach(item => {
                    if (item.type === 'tool_use') {
                        const toolName = item.name || 'unknown';
                        toolCounts[toolName] = (toolCounts[toolName] || 0) + 1;
                        toolTypes.add(toolName);
                    }
                });
            }
        }
    }

    const totalTools = Object.values(toolCounts).reduce((a, b) => a + b, 0);
    const toolList = Object.entries(toolCounts)
        .map(([name, count]) => `${name}(${count})`)
        .join(', ');

    return { totalTools, toolList, toolTypes: Array.from(toolTypes) };
}

async function runArcherAnalysisInline(sessionFile) {
    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.log(`${colors.red}⚠ Archer Analysis requires OPENAI_API_KEY${colors.reset}`);
        return;
    }

    try {
        // Read conversation
        const conversation = await readConversation(sessionFile);

        // Get last N user/assistant pairs
        const interactions = [];
        let currentInteraction = null;

        for (const entry of conversation) {
            if (entry.type === 'user') {
                const content = entry.message?.content || '';
                if (Array.isArray(content) && content.length > 0 && content[0].type === 'tool_result') {
                    continue;
                }

                if (currentInteraction) {
                    interactions.push(currentInteraction);
                }
                currentInteraction = {
                    user: typeof content === 'string' ? content : content[0]?.text || '',
                    assistant: '',
                    tools: []
                };
            } else if (entry.type === 'assistant' && currentInteraction) {
                const content = entry.message?.content || [];

                if (Array.isArray(content)) {
                    content.forEach(item => {
                        if (item.type === 'text') {
                            currentInteraction.assistant += item.text + '\n';
                        } else if (item.type === 'tool_use') {
                            currentInteraction.tools.push({
                                name: item.name,
                                input: item.input
                            });
                        }
                    });
                } else if (typeof content === 'string') {
                    currentInteraction.assistant = content;
                }
            }
        }

        if (currentInteraction) {
            interactions.push(currentInteraction);
        }

        // Get last N interactions
        const recentInteractions = interactions.slice(-config.archerLimit);

        if (recentInteractions.length === 0) {
            console.log(`${colors.yellow}No interactions to analyze${colors.reset}`);
            return;
        }

        // Format for LLM
        const conversationText = recentInteractions.map((interaction, idx) => {
            let text = `\n## Interaction ${idx + 1}\n\n`;
            text += `**User Input:**\n${interaction.user}\n\n`;

            if (interaction.tools.length > 0) {
                text += `**Tools Used:**\n`;
                interaction.tools.forEach(tool => {
                    text += `- ${tool.name}: ${JSON.stringify(tool.input, null, 2)}\n`;
                });
                text += `\n`;
            }

            text += `**Claude's Response:**\n${interaction.assistant}\n`;
            return text;
        }).join('\n---\n');

        // Select model based on nano flag
        const model = config.nanoMode ? 'gpt-4-turbo' : 'gpt-4o-mini';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are Archer, an AI conversation analyzer. Analyze the conversation between a developer and Claude Code (an AI coding assistant).

Your analysis should cover:
1. **Intent Summary**: What was the developer trying to accomplish?
2. **Security Tasks**: Any security-related tasks, implementations, or concerns identified?
3. **Potential Issues**: Any gaps, misunderstandings, or areas that could be improved?
4. **Overall Assessment**: Brief verdict on conversation quality and helpfulness.

Format with empty lines between sections. Be concise and pragmatic.`
                    },
                    {
                        role: 'user',
                        content: `Analyze this conversation:\n\n${conversationText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`${colors.red}OpenAI API Error: ${response.status}${colors.reset}`);
            return;
        }

        const data = await response.json();
        const analysis = data.choices[0].message.content;

        // Display analysis in orange (inline format with proper spacing)
        console.log(`${colors.bright}${colors.orange}🏹 ARCHER SUMMARY${colors.reset}\n`);

        // Display analysis with proper paragraph spacing
        const paragraphs = analysis.split('\n\n');
        paragraphs.forEach((para, idx) => {
            const lines = para.split('\n');
            lines.forEach(line => {
                if (line.trim()) {
                    console.log(`${colors.orange}${line}${colors.reset}`);
                }
            });
            if (idx < paragraphs.length - 1) {
                console.log(''); // Empty line between paragraphs
            }
        });

        console.log(`\n${colors.dim}Model: ${model}${config.nanoMode ? ' (nano/fast)' : ''} | Tokens: ${data.usage.total_tokens}${colors.reset}`);

    } catch (error) {
        console.error(`\n${colors.red}Error generating summary: ${error.message}${colors.reset}`);

        if (error.message.includes('fetch')) {
            console.log(`${colors.yellow}Network error - check:${colors.reset}`);
            console.log(`  1. Internet connection`);
            console.log(`  2. OpenAI API key: ${apiKey ? '✓ Set' : '✗ Not set'}`);
            console.log(`  3. API rate limits: https://platform.openai.com/usage`);
        }
    }
}

async function runSecurityAnalysisInline(sessionFile) {
    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.log(`${colors.red}⚠ Security Analysis requires OPENAI_API_KEY${colors.reset}`);
        return;
    }

    try {
        // Read conversation
        const conversation = await readConversation(sessionFile);

        // Get last N user/assistant pairs
        const interactions = [];
        let currentInteraction = null;

        for (const entry of conversation) {
            if (entry.type === 'user') {
                const content = entry.message?.content || '';
                if (Array.isArray(content) && content.length > 0 && content[0].type === 'tool_result') {
                    continue;
                }

                if (currentInteraction) {
                    interactions.push(currentInteraction);
                }
                currentInteraction = {
                    user: typeof content === 'string' ? content : content[0]?.text || '',
                    assistant: '',
                    tools: []
                };
            } else if (entry.type === 'assistant' && currentInteraction) {
                const content = entry.message?.content || [];

                if (Array.isArray(content)) {
                    content.forEach(item => {
                        if (item.type === 'text') {
                            currentInteraction.assistant += item.text + '\n';
                        } else if (item.type === 'tool_use') {
                            currentInteraction.tools.push({
                                name: item.name,
                                input: item.input
                            });
                        }
                    });
                } else if (typeof content === 'string') {
                    currentInteraction.assistant = content;
                }
            }
        }

        if (currentInteraction) {
            interactions.push(currentInteraction);
        }

        // Get last N interactions
        const recentInteractions = interactions.slice(-config.archerLimit);

        if (recentInteractions.length === 0) {
            console.log(`${colors.yellow}No interactions to analyze${colors.reset}`);
            return;
        }

        // Format for LLM
        const conversationText = recentInteractions.map((interaction, idx) => {
            let text = `\n## Interaction ${idx + 1}\n\n`;
            text += `**User Input:**\n${interaction.user}\n\n`;

            if (interaction.tools.length > 0) {
                text += `**Tools Used:**\n`;
                interaction.tools.forEach(tool => {
                    text += `- ${tool.name}: ${JSON.stringify(tool.input, null, 2)}\n`;
                });
                text += `\n`;
            }

            text += `**Claude's Response:**\n${interaction.assistant}\n`;
            return text;
        }).join('\n---\n');

        // Select model based on nano flag
        const model = config.nanoMode ? 'gpt-4-turbo' : 'gpt-4o-mini';

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                signal: controller.signal,
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: `You are a security expert analyzing Claude Code conversations. Evaluate the conversation for:
1. **Secure Implementations**: Identify proper security practices, secure coding patterns, and safe implementations.
2. **Security Bad Practices**: Flag any security anti-patterns, vulnerabilities, or risky behaviors (e.g., hardcoded credentials, insecure APIs, improper authentication, SQL injection risks, etc).
3. **Data Protection**: Assess handling of sensitive data, credentials, keys, and PII.
4. **Recommendations**: Suggest security improvements or best practices.

Be direct and specific. Use clear severity levels: CRITICAL, WARNING, INFO.`
                        },
                        {
                            role: 'user',
                            content: `Analyze this conversation for security:\n\n${conversationText}`
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 1200
                })
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.text();
                console.error(`${colors.red}OpenAI API Error: ${response.status}${colors.reset}`);
                if (response.status === 401) {
                    console.log(`${colors.yellow}Invalid API key - check your OPENAI_API_KEY${colors.reset}`);
                } else if (response.status === 429) {
                    console.log(`${colors.yellow}Rate limited - wait a moment and try again${colors.reset}`);
                }
                return;
            }
        } catch (fetchError) {
            clearTimeout(timeout);
            if (fetchError.name === 'AbortError') {
                throw new Error('API request timeout (30s) - network may be slow');
            }
            throw fetchError;
        }

        const data = await response.json();
        const analysis = data.choices[0].message.content;

        // Display analysis in red/yellow for security warnings
        console.log(`${colors.bright}${colors.red}🔒 SECURITY ANALYSIS${colors.reset}\n`);

        // Display analysis with proper paragraph spacing
        const paragraphs = analysis.split('\n\n');
        paragraphs.forEach((para, idx) => {
            const lines = para.split('\n');
            lines.forEach(line => {
                // Highlight CRITICAL, WARNING in red/yellow
                if (line.includes('CRITICAL')) {
                    console.log(`${colors.red}${line}${colors.reset}`);
                } else if (line.includes('WARNING')) {
                    console.log(`${colors.yellow}${line}${colors.reset}`);
                } else if (line.trim()) {
                    console.log(`${colors.white}${line}${colors.reset}`);
                }
            });
            if (idx < paragraphs.length - 1) {
                console.log(''); // Empty line between paragraphs
            }
        });

        console.log(`\n${colors.dim}Model: ${model}${config.nanoMode ? ' (nano/fast)' : ''} | Tokens: ${data.usage.total_tokens}${colors.reset}`);

    } catch (error) {
        console.error(`\n${colors.red}Error generating security analysis: ${error.message}${colors.reset}`);

        if (error.message.includes('fetch')) {
            console.log(`${colors.yellow}Network error - check:${colors.reset}`);
            console.log(`  1. Internet connection`);
            console.log(`  2. OpenAI API key: ${apiKey ? '✓ Set' : '✗ Not set'}`);
            console.log(`  3. API rate limits: https://platform.openai.com/usage`);
        }
    }
}

async function runArcherAnalysis() {
    const currentPath = process.cwd();
    const encodedPath = encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    console.log(`${colors.bright}${colors.orange}🏹 Archer Analysis${colors.reset}`);
    console.log(`${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error(`${colors.red}Error: OPENAI_API_KEY environment variable not set${colors.reset}`);
        console.log(`${colors.yellow}Please set your OpenAI API key:${colors.reset}`);
        console.log(`${colors.dim}export OPENAI_API_KEY='your-api-key-here'${colors.reset}\n`);
        return;
    }

    if (!fs.existsSync(projectDir)) {
        console.error(`${colors.red}No Claude project found for path: ${currentPath}${colors.reset}`);
        return;
    }

    // Find the most recent session file
    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        console.log(`${colors.yellow}No conversation sessions found in this project${colors.reset}`);
        return;
    }

    // Get most recent file
    const fileStats = files.map(file => {
        const filePath = path.join(projectDir, file);
        const stats = fs.statSync(filePath);
        return { file, filePath, mtime: stats.mtime };
    }).sort((a, b) => b.mtime - a.mtime);

    const sessionFile = fileStats[0].filePath;
    const sessionId = path.basename(fileStats[0].file, '.jsonl');

    console.log(`${colors.orange}Analyzing session: ${colors.bright}${sessionId}${colors.reset}`);
    console.log(`${colors.dim}Analyzing last ${config.archerLimit} interactions...${colors.reset}\n`);

    // Read conversation
    const conversation = await readConversation(sessionFile);

    // Get last N user/assistant pairs
    const interactions = [];
    let currentInteraction = null;

    for (const entry of conversation) {
        if (entry.type === 'user') {
            // Check if it's a tool result
            const content = entry.message?.content || '';
            if (Array.isArray(content) && content.length > 0 && content[0].type === 'tool_result') {
                // Skip tool results for archer analysis
                continue;
            }

            if (currentInteraction) {
                interactions.push(currentInteraction);
            }
            currentInteraction = {
                user: typeof content === 'string' ? content : content[0]?.text || '',
                assistant: '',
                tools: []
            };
        } else if (entry.type === 'assistant' && currentInteraction) {
            const content = entry.message?.content || [];

            if (Array.isArray(content)) {
                content.forEach(item => {
                    if (item.type === 'text') {
                        currentInteraction.assistant += item.text + '\n';
                    } else if (item.type === 'tool_use') {
                        currentInteraction.tools.push({
                            name: item.name,
                            input: item.input
                        });
                    }
                });
            } else if (typeof content === 'string') {
                currentInteraction.assistant = content;
            }
        }
    }

    if (currentInteraction) {
        interactions.push(currentInteraction);
    }

    // Get last N interactions
    const recentInteractions = interactions.slice(-config.archerLimit);

    if (recentInteractions.length === 0) {
        console.log(`${colors.yellow}No interactions found to analyze${colors.reset}`);
        return;
    }

    // Format for LLM
    const conversationText = recentInteractions.map((interaction, idx) => {
        let text = `\n## Interaction ${idx + 1}\n\n`;
        text += `**User Input:**\n${interaction.user}\n\n`;

        if (interaction.tools.length > 0) {
            text += `**Tools Used:**\n`;
            interaction.tools.forEach(tool => {
                text += `- ${tool.name}: ${JSON.stringify(tool.input, null, 2)}\n`;
            });
            text += `\n`;
        }

        text += `**Claude's Response:**\n${interaction.assistant}\n`;
        return text;
    }).join('\n---\n');

    // Select model based on nano flag
    const model = config.nanoMode ? 'gpt-4.1-nano' : 'gpt-4o-mini';
    console.log(`${colors.dim}Calling OpenAI API for analysis (${model})...${colors.reset}\n`);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    {
                        role: 'system',
                        content: `You are Archer, an AI conversation analyzer. Analyze the conversation between a developer and Claude Code (an AI coding assistant).

Your analysis should cover:
1. **Intent Summary**: What was the developer trying to accomplish?
2. **Security Tasks**: Any security-related tasks, implementations, or concerns identified?
3. **Potential Issues**: Any gaps, misunderstandings, or areas that could be improved?
4. **Overall Assessment**: Brief verdict on conversation quality and helpfulness.

Format with empty lines between sections. Be concise and pragmatic.`
                    },
                    {
                        role: 'user',
                        content: `Analyze this conversation:\n\n${conversationText}`
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`${colors.red}OpenAI API Error: ${response.status}${colors.reset}`);
            console.error(`${colors.dim}${errorData}${colors.reset}`);
            return;
        }

        const data = await response.json();
        const analysis = data.choices[0].message.content;

        // Display analysis in orange
        console.log(`${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}${colors.orange}ARCHER ANALYSIS${colors.reset}\n`);

        // Split into lines and display in orange
        const analysisLines = analysis.split('\n');
        analysisLines.forEach(line => {
            console.log(`${colors.orange}${line}${colors.reset}`);
        });

        console.log(`\n${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.dim}Analysis based on last ${recentInteractions.length} interactions${colors.reset}`);
        console.log(`${colors.dim}Model: ${model}${config.nanoMode ? ' (nano/fast)' : ''} | Tokens used: ${data.usage.total_tokens}${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}Error calling OpenAI API: ${error.message}${colors.reset}`);
    }
}

function showStatistics(entries) {
    console.log(`\n${colors.bright}${colors.cyan}Claude Code Usage Statistics${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    // Total entries
    console.log(`${colors.yellow}Total Commands:${colors.reset} ${entries.length}`);

    // Date range
    if (entries.length > 0) {
        const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
        const first = formatTimestamp(sorted[0].timestamp);
        const last = formatTimestamp(sorted[sorted.length - 1].timestamp);
        console.log(`${colors.yellow}First Entry:${colors.reset} ${first.formatted}`);
        console.log(`${colors.yellow}Last Entry:${colors.reset} ${last.formatted}`);
    }

    // Project statistics
    const projectCounts = {};
    entries.forEach(e => {
        const project = formatProjectPath(e.project) || 'No project';
        projectCounts[project] = (projectCounts[project] || 0) + 1;
    });

    console.log(`\n${colors.yellow}Commands by Project:${colors.reset}`);
    const sortedProjects = Object.entries(projectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    sortedProjects.forEach(([project, count]) => {
        const bar = '█'.repeat(Math.floor(count / entries.length * 50));
        console.log(`  ${colors.white}${project.padEnd(50)}${colors.reset} ${colors.green}${bar}${colors.reset} ${count}`);
    });

    // Daily activity
    const dailyActivity = {};
    entries.forEach(e => {
        const date = new Date(e.timestamp).toISOString().split('T')[0];
        dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    console.log(`\n${colors.yellow}Recent Daily Activity:${colors.reset}`);
    const recentDays = Object.entries(dailyActivity)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 7);

    recentDays.forEach(([date, count]) => {
        const bar = '█'.repeat(count);
        console.log(`  ${colors.white}${date}${colors.reset} ${colors.blue}${bar}${colors.reset} ${count}`);
    });

    // Common command patterns
    const wordFreq = {};
    entries.forEach(e => {
        const words = e.display.toLowerCase().split(/\s+/);
        words.forEach(word => {
            if (word.length > 4) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
    });

    console.log(`\n${colors.yellow}Most Common Keywords:${colors.reset}`);
    const topWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    topWords.forEach(([word, count]) => {
        console.log(`  ${colors.white}${word.padEnd(20)}${colors.reset} ${colors.gray}${count}${colors.reset}`);
    });
}

async function main() {
    if (config.showHelp) {
        showHelp();
        return;
    }

    if (config.archerMode) {
        await runArcherAnalysis();
        return;
    }

    if (config.watchMode) {
        await watchCurrentSession();
        return;
    }

    if (config.showCurrent) {
        await listCurrentProjectSessions();
        return;
    }

    if (config.sessionId) {
        await showSpecificSession(config.sessionId);
        return;
    }

    console.log(`${colors.bright}${colors.cyan}Loading Claude Code history...${colors.reset}`);

    try {
        const entries = await readHistory();
        const filtered = filterEntries(entries);

        if (config.showStats) {
            showStatistics(entries);
            return;
        }

        if (filtered.length === 0) {
            console.log(`${colors.yellow}No entries found matching your criteria.${colors.reset}`);
            return;
        }

        console.log(`${colors.green}Found ${filtered.length} entries${colors.reset}`);

        if (config.showFull || config.outputOnly) {
            console.log(`${colors.gray}(Fetching Claude's responses - this may take a moment...)${colors.reset}`);
        }

        for (let i = 0; i < filtered.length; i++) {
            await displayEntry(filtered[i], i, filtered.length);
        }

        console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.green}End of history (${filtered.length} entries shown)${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}Error reading history: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

main();