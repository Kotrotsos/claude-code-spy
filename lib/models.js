/**
 * Models Module - OpenAI API and Analysis Functions
 *
 * This module handles all LLM interactions and analysis operations.
 * Functions: Archer analysis, Security analysis, Dependency analysis
 *
 * Note: Analysis functions (runArcherAnalysisInline, runSecurityAnalysisInline)
 * are currently exported from main CLI file but will be extracted here
 * as part of ongoing refactoring. This module provides the interface
 * and helper functions for AI-powered analysis.
 */

const colors = require('./colors');
const { appendToMarkdownLog } = require('./logger');

/**
 * Extract interactions from conversation for analysis
 * @param {Array} conversation - Conversation entries from session
 * @param {number} startIndex - Start index for filtering
 * @param {number} limit - Max interactions to return
 * @returns {Array} Array of interaction objects
 */
function extractInteractions(conversation, startIndex = 0, limit = 10) {
    const interactions = [];
    let currentInteraction = null;

    for (let i = startIndex; i < conversation.length; i++) {
        const entry = conversation[i];

        if (entry.type === 'user') {
            const content = entry.message?.content || '';

            // Skip tool results
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

    return interactions.slice(-limit);
}

/**
 * Format interactions for LLM input
 * @param {Array} interactions - Interaction objects
 * @returns {string} Formatted conversation text
 */
function formatConversationForLLM(interactions) {
    return interactions.map((interaction, idx) => {
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
}

/**
 * Display analysis results with proper formatting
 * @param {string} analysis - Analysis text from LLM
 * @param {object} options - Display options
 */
function displayAnalysis(analysis, options = {}) {
    const {
        title = '🏹 ANALYSIS',
        titleColor = colors.orange,
        highlightTerms = [],
        logFile = null
    } = options;

    console.log(`${colors.bright}${titleColor}${title}${colors.reset}\n`);
    if (logFile) appendToMarkdownLog(logFile, `## ${title}\n`);

    const paragraphs = analysis.split('\n\n');
    paragraphs.forEach((para, idx) => {
        const lines = para.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                let displayLine = line;
                let lineColor = titleColor;

                // Apply highlight colors for specific terms
                highlightTerms.forEach(({ term, color }) => {
                    if (line.includes(term)) {
                        lineColor = color;
                    }
                });

                console.log(`${lineColor}${displayLine}${colors.reset}`);
                if (logFile) appendToMarkdownLog(logFile, line);
            }
        });
        if (idx < paragraphs.length - 1) {
            console.log('');
            if (logFile) appendToMarkdownLog(logFile, '');
        }
    });
}

/**
 * Call OpenAI API with retry and error handling
 * @param {object} options - API options
 * @returns {Promise<string>} Analysis result
 */
async function callOpenAIAPI(options) {
    const {
        systemPrompt,
        userMessage,
        model = 'gpt-4o-mini',
        apiKey = process.env.OPENAI_API_KEY,
        timeout = 30000
    } = options;

    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable not set');
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            signal: controller.signal,
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.3,
                max_tokens: 1200
            })
        });

        clearTimeout(timeoutHandle);

        if (!response.ok) {
            const error = new Error(`OpenAI API Error: ${response.status}`);
            error.status = response.status;
            throw error;
        }

        const data = await response.json();
        return {
            analysis: data.choices[0].message.content,
            tokens: data.usage.total_tokens,
            model
        };
    } catch (err) {
        clearTimeout(timeoutHandle);
        if (err.name === 'AbortError') {
            throw new Error('API request timeout');
        }
        throw err;
    }
}

module.exports = {
    extractInteractions,
    formatConversationForLLM,
    displayAnalysis,
    callOpenAIAPI
};
