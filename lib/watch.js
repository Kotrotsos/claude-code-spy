/**
 * Watch Mode Module - Real-time conversation monitoring
 *
 * This module handles watch mode functionality including:
 * - Polling for new messages
 * - Idle-time tracking for auto-summaries
 * - Token counting for analysis triggers
 * - Auto-triggering Archer analysis
 */

const colors = require('./colors');
const { appendToMarkdownLog } = require('./logger');

/**
 * Calculate tool usage statistics from conversation
 * @param {Array} conversation - Conversation entries
 * @returns {object} {totalTools, toolList, toolTypes}
 */
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

/**
 * Generate initial watch mode stats display
 * @param {Array} conversation - Initial conversation
 * @param {number} startIndex - Starting index for new content
 * @returns {string} Formatted stats display
 */
function generateStatsDisplay(conversation, startIndex = 0) {
    const recentMessages = conversation.slice(startIndex);
    const userMessages = recentMessages.filter(e => e.type === 'user');
    const assistantMessages = recentMessages.filter(e => e.type === 'assistant');

    // Count tokens (rough estimate)
    let totalTokens = 0;
    assistantMessages.forEach(entry => {
        const content = entry.message?.content || [];
        if (Array.isArray(content)) {
            content.forEach(item => {
                if (item.type === 'text') {
                    totalTokens += Math.ceil(item.text.length / 4);
                }
            });
        }
    });

    const { totalTools, toolList } = getToolStats(recentMessages);

    return `${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.bright}${colors.cyan}Watch Mode Active${colors.reset}
${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}
${colors.dim}Messages:${colors.reset} ${userMessages.length} user, ${assistantMessages.length} assistant
${colors.dim}Tokens:${colors.reset} ~${totalTokens}
${colors.dim}Tools used:${colors.reset} ${totalTools > 0 ? toolList : 'none'}
${colors.dim}Press 'h' for help, 'q' to quit${colors.reset}`;
}

/**
 * Count total tokens in conversation (rough estimate: 4 chars per token)
 * @param {Array} conversation - Conversation entries
 * @returns {number} Estimated total tokens
 */
function countConversationTokens(conversation) {
    let totalTokens = 0;
    for (const entry of conversation) {
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
    return totalTokens;
}

/**
 * Handle polling loop for watch mode
 * @param {object} options - Polling options
 */
async function startPolling(options) {
    const {
        sessionFile,
        readConversation,
        displayMessage,
        runArcherAnalysis,
        logFile,
        onExit
    } = options;

    let lastMessageCount = 0;
    let lastMessageTime = Date.now();
    let analysisPending = false;
    let lastAnalysisTokenCount = 0;
    let isExiting = false;

    const apiKey = process.env.OPENAI_API_KEY;

    // Initialize tracking
    try {
        const initialConversation = await readConversation(sessionFile);
        lastMessageCount = initialConversation.length;
        lastAnalysisTokenCount = countConversationTokens(initialConversation);
    } catch (e) {
        // File might not exist yet
    }

    // Poll for changes every 500ms
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
                appendToMarkdownLog(logFile, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                appendToMarkdownLog(logFile, 'New message(s) received!');
                appendToMarkdownLog(logFile, '');

                for (const entry of newMessages) {
                    displayMessage(entry, false);
                    // Log entry to markdown
                    if (entry.type === 'user') {
                        appendToMarkdownLog(logFile, `**User:** ${entry.input || ''}`);
                    } else if (entry.type === 'assistant') {
                        const content = entry.message?.content || [];
                        let text = '';
                        if (Array.isArray(content)) {
                            content.forEach(item => {
                                if (item.type === 'text') {
                                    text += item.text || '';
                                }
                            });
                        }
                        appendToMarkdownLog(logFile, `**Assistant:** ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
                    }
                    appendToMarkdownLog(logFile, '');
                }

                lastMessageCount = currentConversation.length;
                lastMessageTime = Date.now();
                analysisPending = false;
            } else {
                // Check for idle timeout (15 seconds) with minimum token count
                const idleTime = Date.now() - lastMessageTime;
                const totalTokens = countConversationTokens(currentConversation);
                const newTokens = totalTokens - lastAnalysisTokenCount;
                const idleSeconds = Math.floor(idleTime / 1000);

                // Auto-trigger analysis after 15 seconds idle and 1000+ new tokens
                if (idleSeconds >= 15 && newTokens >= 1000 && !analysisPending) {
                    if (!apiKey) {
                        console.log(`\n${colors.yellow}⚠ Auto-summary needs OPENAI_API_KEY${colors.reset}\n`);
                        appendToMarkdownLog(logFile, 'Auto-summary skipped: OPENAI_API_KEY not set');
                    } else {
                        analysisPending = true;
                        lastAnalysisTokenCount = totalTokens;

                        console.log(`\n${colors.dim}Idle for ${idleSeconds}s and ${newTokens} tokens...${colors.reset}\n`);
                        console.log(`${colors.orange}🏹 Archer is contemplating...${colors.reset}\n`);
                        appendToMarkdownLog(logFile, `Idle for ${idleSeconds}s and ${newTokens} tokens`);
                        appendToMarkdownLog(logFile, 'Archer is contemplating...');

                        try {
                            await runArcherAnalysis();
                        } catch (err) {
                            console.error(`${colors.red}Auto-summary error: ${err.message}${colors.reset}`);
                            appendToMarkdownLog(logFile, `Auto-summary error: ${err.message}`);
                        }

                        console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
                        console.log(`${colors.dim}Resuming watch...${colors.reset}\n`);
                        appendToMarkdownLog(logFile, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                        appendToMarkdownLog(logFile, 'Resuming watch...');
                        analysisPending = false;
                    }
                }
            }
        } catch (e) {
            // File might be in the middle of being written, ignore
        }
    }, 500);

    // Return cleanup function
    return () => {
        isExiting = true;
        clearInterval(pollInterval);
    };
}

module.exports = {
    getToolStats,
    generateStatsDisplay,
    countConversationTokens,
    startPolling
};
