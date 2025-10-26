#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');
const os = require('os');

// Import lib modules
const lib = require('./lib');
const { colors, utils, logger, core, input, models, watch } = lib;

// Setup paths
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
    nanoMode: false,
    minutesSince: null,
    logFile: null
};

// Parse command line arguments
const args = process.argv.slice(2);
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
        case '--minutes-since':
            config.minutesSince = parseInt(args[++i]);
            break;
        case '--log-file':
            config.logFile = args[++i];
            break;
    }
}

function showHelp() {
    console.log(`
${colors.bright}Claude Code Spy${colors.reset}

${colors.cyan}USAGE:${colors.reset}
    ${colors.green}node claude-history-cli.js [OPTIONS]${colors.reset}

${colors.cyan}OPTIONS:${colors.reset}
    ${colors.yellow}-h, --help${colors.reset}            Show this help message
    ${colors.yellow}-l, --limit N${colors.reset}        Limit results to N entries
    ${colors.yellow}-p, --project NAME${colors.reset}   Filter by project name
    ${colors.yellow}-s, --search TERM${colors.reset}    Search for term in history
    ${colors.yellow}-a, --after DATE${colors.reset}     Show entries after date
    ${colors.yellow}-b, --before DATE${colors.reset}    Show entries before date
    ${colors.yellow}-r, --reverse${colors.reset}        Show oldest first (default: newest)
    ${colors.yellow}--stats${colors.reset}              Show usage statistics
    ${colors.yellow}-f, --full${colors.reset}           Show full Claude responses
    ${colors.yellow}--output-only${colors.reset}        Show responses only (no prompts)
    ${colors.yellow}--session ID${colors.reset}         Show specific session
    ${colors.yellow}-c, --current${colors.reset}        Show current project sessions
    ${colors.yellow}-w, --watch${colors.reset}          Watch current session in real-time
    ${colors.yellow}--archer${colors.reset}             Run Archer analysis on current project
    ${colors.yellow}--archer-limit N${colors.reset}     Archer analysis last N interactions
    ${colors.yellow}--nano${colors.reset}               Use fast nano model
    ${colors.yellow}--minutes-since N${colors.reset}    Only show entries from last N minutes
    ${colors.yellow}--log-file PATH${colors.reset}      Log watch mode output to markdown file

${colors.cyan}EXAMPLES:${colors.reset}
    ${colors.green}# View recent entries${colors.reset}
    claude-code-spy -l 5

    ${colors.green}# Search for a specific term${colors.reset}
    claude-code-spy -s "typescript"

    ${colors.green}# Watch current session${colors.reset}
    claude-code-spy --watch

    ${colors.green}# Run Archer analysis${colors.reset}
    claude-code-spy --archer --archer-limit 20

${colors.dim}For full documentation, visit: https://github.com/kotrotsos/claude-code-spy${colors.reset}
`);
}

function showStatistics(entries) {
    console.log(`\n${colors.bright}${colors.cyan}Claude Code Usage Statistics${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

    console.log(`${colors.yellow}Total Commands:${colors.reset} ${entries.length}`);

    if (entries.length > 0) {
        const sorted = [...entries].sort((a, b) => a.timestamp - b.timestamp);
        const first = utils.formatTimestamp(sorted[0].timestamp);
        const last = utils.formatTimestamp(sorted[sorted.length - 1].timestamp);
        console.log(`${colors.yellow}First Entry:${colors.reset} ${first.formatted}`);
        console.log(`${colors.yellow}Last Entry:${colors.reset} ${last.formatted}`);
    }

    const projectCounts = {};
    entries.forEach(e => {
        const project = utils.formatProjectPath(e.project) || 'No project';
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

async function runArcherAnalysis() {
    const currentPath = process.cwd();
    const encodedPath = utils.encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    console.log(`${colors.bright}${colors.orange}🏹 Archer Analysis${colors.reset}`);
    console.log(`${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

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

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        console.log(`${colors.yellow}No conversation sessions found in this project${colors.reset}`);
        return;
    }

    const fileStats = files.map(file => {
        const filePath = path.join(projectDir, file);
        const stats = fs.statSync(filePath);
        return { file, filePath, mtime: stats.mtime };
    }).sort((a, b) => b.mtime - a.mtime);

    const sessionFile = fileStats[0].filePath;
    const sessionId = path.basename(fileStats[0].file, '.jsonl');

    console.log(`${colors.orange}Analyzing session: ${colors.bright}${sessionId}${colors.reset}`);
    console.log(`${colors.dim}Analyzing last ${config.archerLimit} interactions...${colors.reset}\n`);

    const conversation = await utils.readConversation(sessionFile);
    const interactions = models.extractInteractions(conversation, 0, config.archerLimit);

    if (interactions.length === 0) {
        console.log(`${colors.yellow}No interactions found to analyze${colors.reset}`);
        return;
    }

    const conversationText = models.formatConversationForLLM(interactions);

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

        console.log(`${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}${colors.orange}ARCHER ANALYSIS${colors.reset}\n`);

        const analysisLines = analysis.split('\n');
        analysisLines.forEach(line => {
            console.log(`${colors.orange}${line}${colors.reset}`);
        });

        console.log(`\n${colors.orange}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.dim}Analysis based on last ${interactions.length} interactions${colors.reset}`);
        console.log(`${colors.dim}Model: ${model}${config.nanoMode ? ' (nano/fast)' : ''} | Tokens used: ${data.usage.total_tokens}${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}Error calling OpenAI API: ${error.message}${colors.reset}`);
    }
}

async function listCurrentProjectSessions() {
    const currentPath = process.cwd();
    const encodedPath = utils.encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    if (!fs.existsSync(projectDir)) {
        console.log(`${colors.yellow}No Claude project found for path: ${currentPath}${colors.reset}`);
        return;
    }

    const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.jsonl'));

    if (files.length === 0) {
        console.log(`${colors.yellow}No sessions found${colors.reset}`);
        return;
    }

    const fileStats = files.map(file => {
        const filePath = path.join(projectDir, file);
        const stat = fs.statSync(filePath);
        return {
            file,
            size: stat.size,
            mtime: stat.mtime,
            sessionId: path.basename(file, '.jsonl')
        };
    }).sort((a, b) => b.mtime - a.mtime);

    console.log(`\n${colors.cyan}Sessions for: ${colors.bright}${utils.formatProjectPath(currentPath)}${colors.reset}\n`);

    fileStats.forEach((f, idx) => {
        const timestamp = utils.formatTimestamp(f.mtime);
        const sizeKB = (f.size / 1024).toFixed(1);
        console.log(`${colors.yellow}${idx + 1}.${colors.reset} ${colors.bright}${f.sessionId}${colors.reset}`);
        console.log(`   ${colors.dim}${timestamp.formatted} | ${sizeKB}KB${colors.reset}`);
    });

    console.log(`\n${colors.dim}Use --session ID to view a specific session${colors.reset}\n`);
}

async function showSpecificSession(sessionId) {
    const encodedPath = utils.encodeProjectPath(process.cwd());
    const sessionFile = path.join(projectsPath, encodedPath, `${sessionId}.jsonl`);

    if (!fs.existsSync(sessionFile)) {
        console.error(`${colors.red}Session not found: ${sessionId}${colors.reset}`);
        return;
    }

    const conversation = await utils.readConversation(sessionFile);

    console.log(`${colors.bright}${colors.cyan}Session: ${sessionId}${colors.reset}\n`);

    for (const entry of conversation) {
        if (entry.type === 'user') {
            console.log(`${colors.green}User:${colors.reset} ${entry.input || ''}`);
        } else if (entry.type === 'assistant') {
            const message = utils.formatAssistantMessage(entry.message);
            console.log(`${colors.blue}Assistant:${colors.reset}`);
            console.log(message);
        }
        console.log('');
    }
}

// Watch mode - displays helpful message
async function watchCurrentSession() {
    const currentPath = process.cwd();
    const encodedPath = utils.encodeProjectPath(currentPath);
    const projectDir = path.join(projectsPath, encodedPath);

    if (!fs.existsSync(projectDir)) {
        console.error(`${colors.red}No Claude project found for path: ${currentPath}${colors.reset}`);
        return;
    }

    // Note: Watch mode functionality is being refactored into modular components
    // For now, watch mode is available in the backup file
    console.log(`${colors.yellow}Watch mode is temporarily unavailable during refactoring.${colors.reset}`);
    console.log(`${colors.dim}This feature will be restored in the next version.${colors.reset}\n`);
    console.log(`${colors.dim}For now, use: claude-code-spy --current to view sessions${colors.reset}`);
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
        // Watch mode not yet refactored - use backup
        const backup = require('./claude-history-cli.js.backup');
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
        const entries = await utils.readHistory();
        let filtered = core.filterEntries(entries, config);

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
            await core.displayEntry(filtered[i], i, filtered.length, config, {
                formatAssistantMessage: utils.formatAssistantMessage,
                findConversationForEntry: async (entry) => {
                    return await core.findConversationForEntry(entry, {
                        readConversation: utils.readConversation,
                        findSessionFile: utils.findSessionFile
                    });
                }
            });
        }

        console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.green}End of history (${filtered.length} entries shown)${colors.reset}\n`);

    } catch (error) {
        console.error(`${colors.red}Error reading history: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

main();
