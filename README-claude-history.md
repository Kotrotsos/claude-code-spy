# Claude Code History Viewer

A CLI tool to view your Claude Code conversation history in a readable format, showing **both your inputs AND Claude's responses**. Monitor sessions in real-time with automatic AI-powered summaries.

## Features

- **Watch Mode** - Live monitoring of current Claude session with auto-summaries
- **🏹 Archer Analysis** - AI-powered conversation analysis (Intent, Response Alignment, Quality Assessment)
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
export OPENAI_API_KEY='sk-...'  # Optional: for auto-summaries
./claude-history --watch
```
- Displays messages in real-time
- Auto-generates summaries after 15 seconds idle + 1000+ new tokens
- Press `q` or `Ctrl+C` to exit

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
| `--watch`, `-w` | Watch session in real-time (15s idle + 1000+ tokens = auto-summary) | `./claude-history --watch` |
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
./claude-history --watch
```

### Features
- **Real-time message display** - See Claude's responses as they arrive
- **Auto-summary trigger** - After 15 seconds idle + 1000+ new tokens:
  - Generates AI analysis of recent conversation
  - Shows in orange inline with watch output
  - Includes Intent, Response Alignment, Assessment
- **Live monitoring** - Perfect for long-running tasks
- **Easy exit** - Press `q` or `Ctrl+C` to quit

### Auto-Summary Details

The auto-summary triggers when BOTH conditions are met:

1. **Claude is idle for 15 seconds** - No new messages
2. **1000+ new tokens generated** - Enough content to analyze

Example output:
```
Watch Mode - Current Directory: /Users/name/projects/app
Watching session: abc123def456
💡 Tip: If Claude is idle for 15 seconds with 1000+ new tokens, auto-generates summary

[User message and Claude's response displayed in real-time]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Claude idle for 15 seconds (1247 new tokens), generating summary...

🏹 ARCHER SUMMARY

Intent Summary: You asked Claude to implement a new feature...
Response Alignment: Claude properly understood the requirement...
Logical Steps: Claude took appropriate steps...
Potential Misalignments: None identified
Overall Assessment: High quality conversation...

Model: gpt-4o-mini | Tokens: 342
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Resuming watch... (12 messages so far)
```

### Watch Mode with Options
```bash
# Use faster model for summaries
./claude-history --watch --nano

# Analyze more interactions per summary
./claude-history --watch --archer-limit 20

# Combine options
./claude-history --watch --nano --archer-limit 15
```

### Requirements for Auto-Summary
- `OPENAI_API_KEY` environment variable set
- If missing, watch continues without summaries

### Setup Auto-Summary
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
3. **Logical Steps** - Were Claude's steps appropriate?
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
Logical Steps: The refactoring steps were well-reasoned...
Potential Misalignments: One suggestion could be improved...
Overall Assessment: Very helpful conversation with minor notes...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: gpt-4o-mini | Tokens used: 234
```

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

Watch mode estimates tokens for auto-summary:
- Rough estimate: ~4 characters per token
- Only counts text content from assistant messages
- Resets after each summary

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

**Issue: Auto-summary not triggering**
- Check `OPENAI_API_KEY` is set: `echo $OPENAI_API_KEY`
- Verify 1000+ tokens have been generated
- Confirm Claude is idle for 15+ seconds

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

v2.0 - Watch mode with auto-summaries, full tool visibility, Archer analysis
