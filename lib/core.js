const fs = require('fs');
const path = require('path');
const colors = require('./colors');
const { formatTimestamp, formatProjectPath, truncateText } = require('./utils');

// Filter entries based on config criteria
function filterEntries(entries, config) {
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

// Find conversation for an entry
async function findConversationForEntry(entry, { readConversation, findSessionFile }) {
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
        const result = [conversation[closestMatch]];
        if (closestMatch + 1 < conversation.length && conversation[closestMatch + 1].type === 'assistant') {
            result.push(conversation[closestMatch + 1]);
        }
        return result;
    }

    return null;
}

// Display a single entry
async function displayEntry(entry, index, total, config, helpers) {
    const time = formatTimestamp(entry.timestamp);
    const project = formatProjectPath(entry.project);

    if (!config.outputOnly) {
        console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
        console.log(`${colors.bright}Entry #${total - index}${colors.reset} ${colors.gray}(${time.relative})${colors.reset}`);
        console.log(`${colors.yellow}Time:${colors.reset} ${time.formatted}`);
        console.log(`${colors.magenta}Project:${colors.reset} ${project}`);
        console.log(`${colors.green}Input:${colors.reset}`);

        const lines = entry.display.split('\n');
        lines.forEach(line => {
            console.log(`  ${colors.white}${line}${colors.reset}`);
        });
    }

    // If full conversation requested, try to get Claude's response
    if (config.showFull || config.outputOnly) {
        const conversation = await findConversationForEntry(entry, helpers);

        if (conversation && conversation.length > 1) {
            const assistant = conversation[1];

            if (!config.outputOnly) {
                console.log(`\n${colors.blue}Claude's Response:${colors.reset}`);
            } else {
                console.log(`\n${colors.bright}${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                console.log(`${colors.gray}Response to: "${truncateText(entry.display, 80)}"${colors.reset}`);
            }

            const response = helpers.formatAssistantMessage(assistant.message);
            const responseLines = response.split('\n');

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

module.exports = {
    filterEntries,
    findConversationForEntry,
    displayEntry
};
