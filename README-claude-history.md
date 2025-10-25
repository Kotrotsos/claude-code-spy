# Claude Code Spy

A CLI tool to spy on your Claude Code conversations in real-time. View history in readable format showing **both your inputs AND Claude's responses**. Monitor sessions with automatic AI-powered summaries and full tool visibility.

## Features

- **Watch Mode** - Live monitoring of current Claude session with session stats and manual analysis controls
- **🏹 Archer Analysis** - AI-powered conversation analysis (Intent, Security Tasks, Quality Assessment)
- **🔒 Security Analysis** - Manual security-focused evaluation of implementations and bad practices
- **📊 Tool Dependency Graph** - Visual ASCII tree showing tool usage patterns and workflows
- **Session Stats** - Real-time metrics: message counts, token usage, tool breakdown, message rate
- **Full Tool Call Visibility** - See exact input parameters and output for every tool Claude uses
- **Session Management** - List, search, and filter conversations across projects
- **Search & Filter** - Find conversations by keywords, dates, or project
- **Usage Statistics** - View analytics of your Claude Code usage
- **Color-coded Output** - Terminal-optimized formatting for readability

## Requirements

- Node.js installed on your system
- Claude Code installed (history stored in `~/.claude/history.jsonl` and `~/.claude/projects/`)
- (Optional) OpenAI API key for Archer analysis and watch mode summaries

## Installation

1. Make scripts executable:
```bash
chmod +x claude-history
chmod +x claude-history-cli.js
```

2. Test the tool:
```bash
./claude-history --help
```

3. (Optional) Add to PATH for global access:
```bash
export PATH="$PATH:/Users/marcokotrotsos/projects/james"
```

---

## Quick Start

### 1. Watch Current Session (Live Mode)
```bash
cd /path/to/your/project
export OPENAI_API_KEY='sk-...'  # Optional: for analysis features
./claude-history --watch
```
**Features:**
- Shows splash screen and session stats at startup
- Displays new messages in real-time as they arrive
- Clean, minimal display - no periodic updates
- Press `q` or `Ctrl+C` to exit

**Keyboard Controls:**
- **'a'** - Run Archer analysis (AI conversation review)
- **'s'** - Run Security analysis (evaluate secure implementations)
- **'d'** - Show tool dependency graph (visualize tool usage patterns)
- **'q' or Ctrl+C** - Exit watch mode

### 2. View All Sessions
```bash
cd /path/to/your/project
./claude-history --current
```
Shows session list with timestamps and message counts.

### 3. View Full Conversation
```bash
./claude-history --session <session-id>
```
Shows complete conversation with all tool calls and results.

### 4. Search History
```bash
./claude-history -s "keyword" -l 10 -f
```
Search for keyword in last 10 entries, showing full responses.

---

## Complete Command Reference

### Core Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `--help`, `-h` | Show help message | `./claude-history --help` |
| `--current`, `-c` | List all sessions for current directory | `./claude-history --current` |
| `--watch`, `-w` | Watch session in real-time with keyboard controls | `./claude-history --watch` |
| `--session ID` | View specific session by ID | `./claude-history --session abc123` |
| `--archer` | AI analysis of recent conversations | `./claude-history --archer` |
| `--stats` | Show usage statistics | `./claude-history --stats` |

### Filtering & Search

| Command | Purpose | Example |
|---------|---------|---------|
| `--limit N`, `-l N` | Limit to last N entries | `./claude-history -l 20` |
| `--search TERM`, `-s TERM` | Search for entries containing TERM | `./claude-history -s "API"` |
| `--project PATH`, `-p PATH` | Filter by project (partial match) | `./claude-history -p myapp` |
| `--after DATE`, `-a DATE` | Show entries after DATE (YYYY-MM-DD) | `./claude-history -a 2025-10-25` |
| `--before DATE`, `-b DATE` | Show entries before DATE | `./claude-history -b 2025-10-26` |
| `--reverse`, `-r` | Show oldest entries first | `./claude-history -r` |

### Display Options

| Command | Purpose | Example |
|---------|---------|---------|
| `--full`, `-f` | Show full conversation with Claude's responses | `./claude-history -l 5 -f` |
| `--output-only` | Show only Claude's responses (no user input) | `./claude-history -s "error" --output-only` |

### Archer Analysis Options

| Command | Purpose | Example |
|---------|---------|---------|
| `--archer` | Run AI analysis on recent interactions | `./claude-history --archer` |
| `--archer-limit N` | Analyze last N interactions (default: 10) | `./claude-history --archer --archer-limit 20` |
| `--nano` | Use gpt-4-turbo instead of gpt-4o-mini | `./claude-history --archer --nano` |

---

## Usage Examples

### Example 1: Basic History View
```bash
# Show last 10 entries (user input only)
./claude-history -l 10

# Show last 10 entries with Claude's full responses
./claude-history -l 10 -f
```

### Example 2: Search for Specific Topics
```bash
# Search for conversations about "database"
./claude-history -s database -f

# Search for errors and show only Claude's responses
./claude-history -s "Error\|error" --output-only
```

### Example 3: Filter by Project
```bash
# View history for current project only
./claude-history --current

# Search within a specific project
./claude-history -p myapp -s "authentication" -f

# Search across all projects for a keyword
./claude-history -s "bug fix" -l 20
```

### Example 4: Date Filtering
```bash
# Show all entries from today
./claude-history -a 2025-10-25

# Show entries from specific date range
./claude-history -a 2025-10-20 -b 2025-10-23

# Show last 7 days of activity
./claude-history -a 2025-10-18
```

### Example 5: Combining Filters
```bash
# Search for "API" in last 5 entries with full responses
./claude-history -s API -l 5 -f

# Search for "deploy" in specific project, last 3 weeks
./claude-history -s deploy -p production -a 2025-10-04
```

---

## Watch Mode (Real-Time Monitoring)

### Basic Usage
```bash
cd /path/to/your/project
export OPENAI_API_KEY='sk-...'  # Optional: for analysis features
./claude-history --watch
```

### What You See
- **Splash screen** with app name and version
- **Session stats** at startup showing: message count, tokens, tools used, message rate
- **Real-time messages** - Only Claude responses **since watch started** appear as they arrive (no historical messages)
- **Clean display** - No periodic updates or status spam
- **Analysis is session-aware** - When you press 's' or 'a', only messages from watch start are analyzed

### Keyboard Controls in Watch Mode

| Key | Action |
|-----|--------|
| **'a'** | Run Archer analysis on recent conversation |
| **'s'** | Run Security analysis (manual security review) |
| **'d'** | Show tool dependency graph with git commits |
| **'b'** | Show bash command history |
| **'f'** | Show file changes tracker with LOC count |
| **'t'** | Show time statistics (wall time, latency, timings) |
| **'h'** | Show keyboard shortcuts help |
| **'q' or Ctrl+C** | Exit watch mode |

### Example Output
```
claude-code-spy v2.0.17 • 🕵️  Real-time monitoring

┌─ Session Stats
│ Messages: 42 (15 user, 27 assistant)
│ Tokens: 8234 (196/msg) • Rate: 0 msg/min
│ Tools:
  • Bash(12) • Edit(8) • Read(5) • Write(2)
└

[Claude messages appear here in real-time]

[Press 'a' for Archer, 's' for Security, 'd' for dependencies, 'q' to exit]
```

### Watch Mode with Options
```bash
# Use faster model for analysis
./claude-history --watch --nano

# Analyze more interactions (default: 10)
./claude-history --watch --archer-limit 20

# Watch with historical context (last 5 minutes)
./claude-history --watch --minutes-since 5

# Combine options
./claude-history --watch --nano --archer-limit 15 --minutes-since 10
```

### Looking Back in Time with --minutes-since

The `--minutes-since` flag lets you expand the watch window to include historical messages from the conversation log. It looks back **in log time**, not real time—so it travels backwards from the last message recorded:

```bash
# Watch with last 5 minutes of log history
./claude-history --watch --minutes-since 5

# Watch with last 30 minutes of log history
./claude-history --watch --minutes-since 30

# Watch with last hour of log history
./claude-history --watch --minutes-since 60
```

**What it does:**
- Normally, watch mode only shows tool calls and activity **since the spy started**
- With `--minutes-since 5`, the spy travels back 5 minutes **in the log** from the last message and starts watching from there
- All analyses (tool dependency graph, bash history, file changes, time statistics) will include this historical context
- The stats display will show metrics for this expanded time window
- **Key insight:** If no activity occurred for an hour, using `--minutes-since 10` shows the work from 50 minutes ago onwards (10 minutes before the last message)
- **Use case:** Join an ongoing session and catch up on what Claude has been doing

**Examples:**
```bash
# You're watching a project. Claude's last activity was 30 minutes ago.
# Start the spy now, but see the last 10 minutes of work (from 20 minutes ago):
./claude-history --watch --minutes-since 10

# Then press 'd' to see dependency graph from the last 10 minutes of the log
# Press 'b' to see bash commands from the last 10 minutes of the log
# Press 'f' to see file changes from the last 10 minutes of the log
```

### Quick Help

Press **'h'** anytime during watch mode to see a quick reference of all keyboard shortcuts!

---

### Setup for Analysis Features
```bash
# Get your OpenAI API key from https://platform.openai.com/api-keys

# Set temporarily
export OPENAI_API_KEY='sk-...'

# Or add to shell profile for persistence
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.zshrc  # or ~/.bashrc
```

---

## 🏹 Archer Analysis (AI-Powered Review)

### What It Does
Analyzes recent conversations with Claude to evaluate quality:

1. **Intent Summary** - What were you trying to accomplish?
2. **Response Alignment** - Did Claude properly address your intent?
3. **Security Tasks** - Potential security improvements or concerns
4. **Potential Misalignments** - Any gaps or misunderstandings?
5. **Overall Assessment** - Quality verdict and helpfulness rating

### Basic Usage
```bash
cd /path/to/your/project
export OPENAI_API_KEY='sk-...'
./claude-history --archer
```

### Advanced Usage
```bash
# Analyze more interactions (default: 10)
./claude-history --archer --archer-limit 20

# Use faster model (gpt-4-turbo instead of gpt-4o-mini)
./claude-history --archer --nano

# Combine options
./claude-history --archer --archer-limit 30 --nano
```

### Model Comparison

| Model | Speed | Accuracy | Cost | Use Case |
|-------|-------|----------|------|----------|
| `gpt-4o-mini` (default) | Fast | High | Low | Default choice |
| `gpt-4-turbo` (--nano) | Very Fast | Very High | Very Low | Quick reviews |

### Example Output
```
🏹 Archer Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing session: df369f5e-71a0-44af-8cba-f934a34c7b9b
Analyzing last 10 interactions...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ARCHER ANALYSIS

Intent Summary: You asked Claude to refactor a React component...
Response Alignment: Claude understood the request and provided...
Security Tasks: Consider adding input validation and error handling...
Potential Misalignments: One suggestion could be improved...
Overall Assessment: Very helpful conversation with minor notes...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: gpt-4o-mini | Tokens used: 234
```

---

## 🔒 Security Analysis (Manual Review)

### What It Does
Manual security-focused evaluation of Claude's implementations to identify:

- **CRITICAL** issues - Security vulnerabilities, unsafe patterns, data exposure risks
- **WARNING** issues - Best practice violations, potential edge cases, hardening opportunities
- Code quality and security patterns
- Potential improvements for production use

### Basic Usage
Press **'s'** during watch mode to run security analysis:

```bash
cd /path/to/your/project
./claude-history --watch
# Press 's' to trigger security analysis
```

### How It Works
- Manual trigger (not automatic like Archer)
- Analyzes recent conversation context
- Returns severity-coded findings (CRITICAL in red, WARNING in yellow)
- Helps identify security gaps in AI-suggested code

### Example Output
```
🔒 Security Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyzing recent interactions...

CRITICAL: Missing input validation on user-facing API endpoint
WARNING: Error messages may leak sensitive information
WARNING: Consider adding rate limiting for production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 💻 Bash Command History (View All Commands)

### What It Does
Shows every bash command executed during the session in order:

```
Press 'b' during watch mode

Bash Command History
5 commands executed

1. git add .
2. git commit -m "feat: add feature"
3. npm version patch
4. npm publish
5. git push && git push --tags
```

This helps you quickly copy/review commands or understand your workflow.

---

## 📁 File Changes Tracker (Monitor File Growth)

### What It Does
Tracks all file edits with line count estimates and warns about large changes. Press **'f'** to toggle between two views:

#### View 1: Detailed File Tracker (First Press of 'f')
Shows all modified files with edit count and LOC for the last edit:

```
Press 'f' during watch mode

File Changes Tracker
3 files modified

claude-history-cli.js (5 edits, ~120 LOC)
README-claude-history.md (3 edits, ~45 LOC)
package.json (1 edit, ~2 LOC) ⚠ HIGH

Press 'f' again to see top 10 files by total LOC
```

- **LOC** = Lines of Code in the last edit to that file
- **⚠ HIGH** = Warning if any edit exceeds 500 lines
- Helps prevent accidentally introducing huge changes

#### View 2: Top 10 Files Summary (Second Press of 'f')
Shows the top 10 files by total lines added, with edit counts and visual bars:

```
Press 'f' again in the tracker view

Top 10 Files by Total LOC
3 files edited in total

1. claude-history-cli.js
   5x edits  •  1240 LOC  ████████████████████

2. README-claude-history.md
   3x edits  •  450 LOC  ██████████

3. package.json
   1x edits  •  25 LOC  █

Press 'f' again to see detailed tracker
```

- **Total LOC** = Sum of all lines added across all edits to that file
- **Edit count** = Number of times the file was edited
- **Visual bar** = Quick visual representation of file size (50 LOC per block)
- Useful for seeing which files got the most changes overall

---

## ⏱️ Time Statistics (Session Metrics)

### What It Does
Displays comprehensive timing metrics for your session including wall time, response latency, and tool execution estimates:

```
Press 't' during watch mode

Time Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session Duration
  Wall Time: 5m 23s
  Responses: 12
  Avg Latency: 3.45s

Tool Execution Time
  Edit: 5x (~0.100s each)
  Read: 3x (~0.100s each)
  Bash: 2x (~0.100s each)
  Total: 1.00s

Response Latency Breakdown
  Fastest: 1.23s
  Slowest: 5.67s
  Average: 3.45s
```

### Metrics Explained

- **Wall Time** - Total time elapsed since watch mode started
- **Responses** - Number of Claude responses received during the session
- **Avg Latency** - Average response time from your message to Claude's reply
- **Tool Execution** - Estimated time spent executing each tool type
- **Latency Breakdown** - Min/max/average response times to understand performance

Useful for understanding:
- How long your session has been running
- Whether Claude is responding quickly or slowly
- Which tools take the most time to execute
- Overall session performance metrics

---

## 📊 Tool Dependency Graph (Visual Workflow)

### What It Does
Shows the complete sequence of tools used **since watch started** as a visual ASCII tree:

- Displays all tool calls in chronological order (only from watch start)
- Shows exact tool names and full bash commands
- **Shows file names for Read and Edit operations**
- **Highlights failed tool calls with [ERROR] tags**
- **Shows related git commits from the session date**
- Displays session start datetime, token count, and error count
- Fresh start each time you run the spy

### Basic Usage
Press **'d'** during watch mode to view the dependency graph:

```bash
cd /path/to/your/project
./claude-history --watch
# Press 'd' to show tool dependency graph
```

### Example Output
```
Started: 2025-10-25 14:32:15 • Tokens: 2,567 • Errors: 1

┌─ Tool Flow
│
├─ Read: package.json
│  ↓
├─ Bash: git add . && git commit -m "update"
│  ↓
├─ Edit: claude-history-cli.js [ERROR]
│  ↓
├─ Bash: npm version patch
│  ↓
└─ Write: README.md

Recent commits:
  a1b2c3d feat: add feature
  d4e5f6g fix: bug fix
```

Shows the complete sequence of tool calls **since watch started** in the order they were executed. Features:
- For **Bash commands**, the full command is displayed (truncated to 60 chars if needed)
- For **Read/Edit operations**, file names are shown (e.g., `Read: package.json`)
- **[ERROR]** tags highlight failed tool calls
- Session start time and token count shown at the top
- Error count displayed in header
- Recent git commits from the session date shown below the graph

---

## Session Viewing Workflow

### Step 1: List Available Sessions
```bash
cd /path/to/your/project
./claude-history --current
```

Shows all sessions with:
- Session IDs (unique identifier)
- Last updated timestamp
- Message count
- Preview of first message

### Step 2: View Full Session
```bash
./claude-history --session <session-id>
```

Shows complete conversation with:
- User messages
- Claude's text responses
- Tool calls (name and parameters)
- Tool results (output)
- Timestamps for each message

### Example Tool Display
```
Claude:
  [Tool: Grep]
    {
      "pattern": "category|LLM",
      "output_mode": "files_with_matches",
      "glob": "*.py"
    }

Tool Result:
  Found 4 files matching pattern
  /path/to/main.py
  /path/to/classifier.py
```

---

## Statistics & Analytics

### View Usage Stats
```bash
./claude-history --stats
```

Shows:
- Total commands executed
- Date range of history
- Commands by project (top 10)
- Recent daily activity
- Most common keywords

### Filter Stats by Date
```bash
# Stats for current month
./claude-history --stats -a 2025-10-01

# Stats for specific date range
./claude-history --stats -a 2025-10-15 -b 2025-10-25
```

---

## Technical Details

### How It Works

Claude Code stores history in two locations:

1. **`~/.claude/history.jsonl`**
   - User inputs with timestamps
   - Project paths
   - Session metadata

2. **`~/.claude/projects/<encoded-path>/*.jsonl`**
   - Full conversation transcripts
   - Tool calls and results
   - Complete message history

### Path Encoding

Project paths are encoded in the projects directory:
```
/Users/name/projects/app → ~/.claude/projects/-Users-name-projects-app/
```

Pattern: `-` + path segments joined with `-`

### Token Counting

Watch mode estimates tokens burned during your session:
- Rough estimate: ~4 characters per token
- Counts text content from assistant messages
- Shown in the dependency graph and session stats

---

## Color Guide

- **Cyan** - Headers, dividers, timestamps
- **Green** - User messages, positive indicators
- **Blue** - Claude's responses, tool references
- **Yellow** - Session IDs, highlights
- **Orange** - Archer analysis output
- **Red** - Errors, warnings
- **Magenta** - Tool results
- **Gray** - Metadata, timestamps

---

## Troubleshooting

### Watch Mode Issues

**Issue: No sessions found**
- Make sure you're in a Claude Code project directory
- Run: `./claude-history --current` to see available sessions
- Check `~/.claude/projects/` exists

### Search Issues

**Issue: Search not finding results**
- Search is case-sensitive
- Use regex patterns: `-s "pattern|Pattern"`
- Combine with date filters: `-s term -a 2025-10-25`

### API Issues

**Issue: Archer analysis fails**
- Verify OpenAI API key: `echo $OPENAI_API_KEY`
- Check key is valid at https://platform.openai.com/api-keys
- Ensure account has API credits

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `q` | Exit watch mode |
| `Ctrl+C` | Exit any command |

---

## Files

- `claude-history-cli.js` - Main CLI application
- `claude-history` - Shell wrapper script for convenience

---

## Limitations

- The `-f` flag tries to match user inputs to transcripts (may not always find exact response)
- For best results, use `--session` to view complete conversations
- Requires Node.js to run
- Token estimation is approximate (~4 chars/token)

---

## Tips & Best Practices

1. **Regular cleanup** - Archive old sessions to manage file growth
2. **Bookmark important sessions** - Note session IDs for quick reference
3. **Use descriptive searches** - Be specific with keywords for better results
4. **Set API key in profile** - Add to `~/.zshrc` or `~/.bashrc` for persistence
5. **Check stats regularly** - Use `--stats` to track Claude usage patterns
6. **Combine filters** - Mix search, date, and project filters for precise results

---

## Version

v2.0.17 - Watch mode with real-time monitoring, Archer analysis, Security analysis, Tool dependency graph, and full tool visibility
