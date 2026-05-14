/**
 * @file Message.jsx
 * @module components/features/ai/AskKay/Message
 * @description Renders a single chat message. It distinguishes between user messages,
 * assistant text responses, and special recipe card messages. It applies different styling
 * and animations for user and assistant messages.
 * @requires react
 * @requires prop-types
 * @requires react-router-dom
 * @requires @mui/material
 * @requires react-markdown
 * @requires remark-gfm
 * @requires https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp
 * @requires ../../recipes/GeneratedRecipeSummaryCard.jsx
 * @requires ./IngredientAnalysisDisplay.jsx
 * @requires ./parseIngredientAnalysis.js
 */
import PropTypes from 'prop-types';
import { Link as RouterLink } from 'react-router';
import { Avatar, Box, Paper, Typography } from "@mui/material";
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const kayTheOwl = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

import GeneratedRecipeSummaryCard from '../../recipes/GeneratedRecipeSummaryCard.jsx';
import IngredientAnalysisDisplay from './IngredientAnalysisDisplay.jsx';
import { parseIngredientAnalysis, isIngredientAnalysis } from './parseIngredientAnalysis.js';

/**
 * @function Message
 * @description Renders a single chat message. It distinguishes between user messages,
 * assistant text responses, and special recipe card messages. It applies different styling
{{ ... }}
 * @param {object} props - The component props.
 * @param {object} props.message - The message object to display.
 * @param {string} props.message.role - The role of the message sender ('user', 'assistant', 'recipe').
 * @param {string|object|Array<object>} props.message.content - The content of the message.
 * @param {boolean} [props.showSaveButton=true] - Whether to show the save button on recipe cards.
 * @returns {JSX.Element} The rendered message component.
 */
function Message({ message, showSaveButton = true }) {
    const isUser = message.role === 'user';

    // If the message is a recipe, render the GeneratedRecipeSummaryCard within the assistant message layout.
    if (message.role === 'recipe') {
        const { role, tempId, ...recipeData } = message;
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-start gap-3 mb-4"
            >
                <Avatar src={kayTheOwl} />
                <Box className="flex-1 pt-1">
                    <GeneratedRecipeSummaryCard recipe={recipeData} showSaveButton={showSaveButton} />
                </Box>
            </motion.div>
        );
    }

    // Regular expression to find the recipe JSON in the message content.
    // This is kept for backward compatibility with non-streaming or older message formats.
    const recipeJsonRegex = /<recipe_json>([\s\S]*?)<\/recipe_json>/;
    const analysisJsonRegex = /<sys_prompt_analysis>[\s\S]*?<\/sys_prompt_analysis>/;

    if (isUser) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex justify-end mb-4"
            >
                <Paper elevation={2} className="rounded-2xl rounded-br-none max-w-2xl p-3" sx={{ backgroundColor: '#013D1D', color: '#ffffff' }}>
                    {/* Render text content if it exists */}
                    {message.content && <Typography variant="body1">{message.content}</Typography>}

                    {/* Render image attachment if it exists */}
                    {message.attachment?.type === 'image' && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                            <img src={message.attachment.url} alt="User attachment" className="max-w-xs max-h-64 object-contain" />
                        </div>
                    )}
                </Paper>
            </motion.div>
        );
    }

    // --- Structured Content Rendering for Assistant Messages ---
    // This handles both live-streamed structured content and parsed historical content.
    if (Array.isArray(message.content)) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex items-start gap-3 mb-4"
            >
                <Avatar src={kayTheOwl} />
                <Box className="flex-1 pt-1">
                    {message.content.map((part, index) => {
                        if (part.type === 'text') {
                            // Check if this text contains ingredient analysis
                            if (isIngredientAnalysis(part.content)) {
                                console.log('[Message] Detected ingredient analysis, parsing...');
                                const analysisData = parseIngredientAnalysis(part.content);
                                if (analysisData) {
                                    return (
                                        <Box key={index} sx={{ mt: 2, mb: 2 }}>
                                            <IngredientAnalysisDisplay analysisData={analysisData} />
                                        </Box>
                                    );
                                }
                            }
                            
                            return (
                                <div key={index} className="streaming-markdown-content">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        className="max-w-none text-base leading-relaxed"
                                        components={{
                                            a: ({ children, href, ...props }) => {
                                                const isInternal = href && (href.startsWith('/') || href.startsWith(window.location.origin));
                                                if (isInternal) {
                                                    return <RouterLink to={href} style={{ color: '#013D1D', fontWeight: 600 }} className="hover:opacity-80 underline">{children}</RouterLink>;
                                                }
                                                return <a href={href} {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#013D1D', fontWeight: 600 }} className="hover:opacity-80 underline">{children}</a>;
                                            },
                                            p: ({ children, node }) => {
                                                // Check if the paragraph is inside a list item
                                                const inList = node?.position?.parent?.type === 'listItem';
                                                // If in a list, don't add margin-bottom. Otherwise, do.
                                                const className = inList
                                                    ? "text-xl leading-relaxed"
                                                    : "mb-3 text-xl leading-relaxed";
                                                return <p className={className}>{children}</p>;
                                            },
                                            ul: ({ children }) => (
                                                <ul className="ml-4 text-xl space-y-0">{children}</ul>
                                            ),
                                            ol: ({ children }) => (
                                                <ol className="ml-4 text-xl space-y-0 list-decimal">{children}</ol>
                                            ),
                                            li: ({ children }) => (
                                                <li className="text-xl list-disc border-none outline-none border-l-0 before:border-none after:border-none">{children}</li>
                                            ),
                                            h1: ({ children }) => (
                                                <h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
                                            ),
                                            h3: ({ children }) => (
                                                <h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
                                            ),
                                            strong: ({ children }) => (
                                                <strong className="font-semibold">{children}</strong>
                                            ),
                                        }}
                                        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                                    >
                                        {part.content}
                                    </ReactMarkdown>
                                </div>
                            );
                        } else if (part.type === 'recipe') {
                            return (
                                <Box key={index} sx={{ mt: 2, mb: 2 }}>
                                    <GeneratedRecipeSummaryCard recipe={part.data} showSaveButton={showSaveButton} />
                                </Box>
                            );
                        }
                        return null;
                    })}
                </Box>
            </motion.div>
        );
    }

    // --- Fallback and Parsing for Historical String-based Content ---
    if (typeof message.content === 'string') {
        let processedContent = message.content.replace(analysisJsonRegex, '').trim();
        const recipeMatch = processedContent.match(recipeJsonRegex);

        const structuredContent = [];

        if (recipeMatch && recipeMatch[1]) {
            try {
                const recipeData = JSON.parse(recipeMatch[1]);
                const parts = processedContent.split(recipeJsonRegex);

                if (parts[0] && parts[0].trim()) {
                    structuredContent.push({ type: 'text', content: parts[0].trim() });
                }

                structuredContent.push({ type: 'recipe', data: recipeData });

                if (parts[2] && parts[2].trim()) {
                    structuredContent.push({ type: 'text', content: parts[2].trim() });
                }

            } catch (error) {
                console.error('Failed to parse recipe from historical message:', error);
                // If parsing fails, just add the raw text
                structuredContent.push({ type: 'text', content: processedContent });
            }
        } else {
            // No recipe found, just text
            structuredContent.push({ type: 'text', content: processedContent });
        }

        // Render the newly structured content
        return <Message message={{ ...message, content: structuredContent }} showSaveButton={showSaveButton} />;
    }

    // Final fallback for any other case (should not be reached)
    return null;
}

Message.propTypes = {
    message: PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.oneOfType([PropTypes.string, PropTypes.object, PropTypes.array]),
    }).isRequired,
    showSaveButton: PropTypes.bool,
};

export default Message;