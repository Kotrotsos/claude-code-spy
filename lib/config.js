const colors = require('./colors');

// Default configuration
const defaultConfig = {
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
function parseArguments(args) {
    const config = { ...defaultConfig };

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

    return config;
}

// Show help message
function showHelp() {
    console.log(`
${colors.bright}Claude Code Spy${colors.reset}

${colors.cyan}USAGE:${colors.reset}
    ${colors.green}claude-code-spy [OPTIONS]${colors.reset}

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
    ${colors.yellow}-w, --watch${colors.reset}        Watch current directory session in real-time (press 'a' for Archer, 's' for Security, 'd' for dependencies, q or Ctrl+C to exit)
    ${colors.yellow}--minutes-since N${colors.reset}  Look back N minutes in the log (use with --watch to include historical context)
    ${colors.yellow}--log-file PATH${colors.reset}    Log watch mode output to a markdown file (use with --watch)
    ${colors.yellow}--archer${colors.reset}           Analyze recent conversations with LLM (requires OPENAI_API_KEY)
    ${colors.yellow}--archer-limit N${colors.reset}   Number of recent commands to analyze (default: 10)
    ${colors.yellow}--nano${colors.reset}             Use gpt-4.1-nano model instead of gpt-4o-mini (faster & cheaper)
    ${colors.yellow}--stats${colors.reset}            Show statistics about your Claude usage

${colors.cyan}EXAMPLES:${colors.reset}
    ${colors.gray}# Show last 10 entries with full conversation${colors.reset}
    claude-code-spy -l 10 -f

    ${colors.gray}# Search for entries about "API" with Claude's responses${colors.reset}
    claude-code-spy -s API -f

    ${colors.gray}# Show only Claude's outputs for a search${colors.reset}
    claude-code-spy -s "function" --output-only

    ${colors.gray}# Show entries from specific project${colors.reset}
    claude-code-spy -p /projects/myapp

    ${colors.gray}# Show entries from today${colors.reset}
    claude-code-spy -a ${new Date().toISOString().split('T')[0]}

    ${colors.gray}# List all sessions for current directory${colors.reset}
    claude-code-spy --current

    ${colors.gray}# Watch current session in real-time${colors.reset}
    claude-code-spy --watch

    ${colors.gray}# Watch session but include last 5 minutes of history${colors.reset}
    claude-code-spy --watch --minutes-since 5

    ${colors.gray}# Analyze last 10 conversations with AI${colors.reset}
    claude-code-spy --archer

    ${colors.gray}# Analyze last 20 conversations${colors.reset}
    claude-code-spy --archer --archer-limit 20

    ${colors.gray}# Analyze with faster (and cheaper) gpt-4.1 nano model${colors.reset}
    claude-code-spy --archer --nano

    ${colors.gray}# Show usage statistics${colors.reset}
    claude-code-spy --stats
`);
}

module.exports = {
    defaultConfig,
    parseArguments,
    showHelp
};
