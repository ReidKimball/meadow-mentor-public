'use client';

/**
 * @file Defines the ChefChat component for public recipe detail pages.
 * @description Presents an AI chat assistant anchored to recipe data, including PostHog analytics for icon and send interactions.
 * @requires module:react - Core React hooks for state management and lifecycle events.
 * @requires module:framer-motion - Provides animation primitives for the floating chat UI.
 * @requires module:@mui/material - Supplies layout and input components for the chat window.
 * @requires module:react-markdown - Renders markdown responses from the assistant.
 * @requires module:posthog-js - Captures analytics for chat usage.
 * @requires module:@/lib/api - Contains the backend API base URLs used for chat requests.
 * @author Cascade
 * @version 1.0.0
 * @date 2025-12-21
 */

// React & animation libraries
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// UI components
import { Box, TextField, IconButton, Paper, Typography, CircularProgress } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

// Markdown rendering
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Analytics & configuration
import posthog from 'posthog-js';
import { API_BASE_URL, APP_BASE_URL } from '@/lib/api';

// Internal components
import PublicGeneratedRecipeSummaryCard, { type PublicRecipeCardRecipe } from '@/components/PublicGeneratedRecipeSummaryCard';

const CHEF_AVATAR = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    kind?: 'text' | 'recipeCard';
    recipe?: PublicRecipeCardRecipe;
    anonSessionId?: string;
}

interface ChefChatProps {
    recipeSlug: string;
    recipeTitle?: string;
    recipeId?: string;
}

/**
 * @component ChefChat
 * @description Floating AI assistant that contextualizes recipe data and captures PostHog analytics for key interactions.
 * @param {ChefChatProps} props - Component props containing recipe identifiers used for chat context and analytics.
 * @returns {JSX.Element} Rendered chat launcher and window.
 */
export default function ChefChat({ recipeSlug, recipeTitle, recipeId }: ChefChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showGreeting, setShowGreeting] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const latestRecipeCardId = (() => {
        for (let i = messages.length - 1; i >= 0; i -= 1) {
            const m = messages[i];
            if ((m.kind || 'text') === 'recipeCard' && m.recipe?._id) return m.recipe._id;
        }
        return null;
    })();

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom('smooth');
        }
    }, [messages, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        scrollToBottom('auto');
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, [isOpen]);

    // Show greeting bubble after delay
    useEffect(() => {
        if (isOpen) return;

        const timer = setTimeout(() => {
            setShowGreeting(true);
        }, 3000);

        return () => clearTimeout(timer);
    }, [isOpen]);

    // Initialize session and fetch history
    useEffect(() => {
        const initSession = async () => {
            const savedSessionId = localStorage.getItem(`chef_chat_session_${recipeSlug}`);
            if (savedSessionId) {
                setSessionId(savedSessionId);

                // Fetch history from backend
                try {
                    const response = await fetch(`${API_BASE_URL}/api/public-recipe-chat/session/${savedSessionId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.history) {
                            const textMessages: Message[] = (data.history || []).map((m: any) => ({ ...m, kind: 'text' }));
                            const adaptedRecipeCards: Message[] = Array.isArray(data.adaptedRecipes)
                                ? (data.adaptedRecipes as PublicRecipeCardRecipe[])
                                    .filter((r) => r && (r as any)._id && (r as any).recipeTitle)
                                    .map((recipe) => ({
                                        id: `recipeCard-history-${String((recipe as any)._id)}`,
                                        role: 'assistant',
                                        content: '',
                                        kind: 'recipeCard',
                                        recipe: {
                                            ...recipe,
                                            shouldGenerateImage: false
                                        },
                                        anonSessionId: savedSessionId,
                                    }))
                                : [];

                            setMessages([...textMessages, ...adaptedRecipeCards]);
                        }
                    } else if (response.status === 404) {
                        // Session expired or deleted on server, clear local
                        localStorage.removeItem(`chef_chat_session_${recipeSlug}`);
                        setSessionId(null);
                    }
                } catch (error) {
                    console.error('Failed to fetch chat history:', error);
                }
            }
        };

        initSession();
    }, [recipeSlug]);

    // Custom Markdown components to handle external/app links
    const markdownComponents = {
        a: ({ href, children, ...props }: any) => {
            const isSignup = href === '/signup' || href?.endsWith('/signup');
            const finalHref = (() => {
                if (!isSignup) return href;

                const url = new URL(`${APP_BASE_URL}/signup`);

                if (latestRecipeCardId) {
                    url.searchParams.set('saveRecipe', latestRecipeCardId);
                }

                if (sessionId) {
                    url.searchParams.set('anonSessionId', sessionId);
                }

                return url.toString();
            })();
            return (
                <a href={finalHref} target={isSignup ? "_blank" : "_self"} rel="noopener noreferrer" {...props}>
                    {children}
                </a>
            );
        }
    };

    const sendMessage = useCallback(async (content: string, trigger: string = 'manual') => {
        if (!content.trim() || isLoading) return;

        posthog.capture('public_recipe_chefchat_send_clicked', {
            recipeId,
            recipeSlug,
            recipeTitle,
            trigger,
        });

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            kind: 'text',
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        const assistantMessageId = `assistant-${Date.now()}`;
        let assistantContent = '';

        try {
            console.log(`[ChefChat] Sending message to ${API_BASE_URL}/api/public-recipe-chat`);
            const response = await fetch(`${API_BASE_URL}/api/public-recipe-chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    recipeSlug,
                    sessionId: sessionId,
                    chatHistory: messages
                        .filter((m) => (m.kind || 'text') === 'text')
                        .map(m => ({ role: m.role, content: m.content }))
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            // Handle session ID from header
            const newSessionId = response.headers.get('X-Session-ID');
            if (newSessionId && newSessionId !== sessionId) {
                setSessionId(newSessionId);
                localStorage.setItem(`chef_chat_session_${recipeSlug}`, newSessionId);
            }

            const activeSessionId = newSessionId || sessionId;

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader found');

            setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '', kind: 'text' }]);

            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'chunk') {
                                assistantContent += data.content;
                                setMessages(prev => prev.map(m =>
                                    m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                                ));
                            } else if (data.type === 'recipeCard') {
                                const recipe = data?.recipe as PublicRecipeCardRecipe | undefined;
                                if (recipe && recipe._id && recipe.recipeTitle) {
                                    setMessages(prev => [...prev, { id: `recipeCard-${Date.now()}`, role: 'assistant', content: '', kind: 'recipeCard', recipe, anonSessionId: activeSessionId || undefined }]);
                                }
                            } else if (data.type === 'complete') {
                                // Finalize
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE chunk', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting right now. Please try again or sign up for full access!",
                kind: 'text',
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, recipeId, recipeSlug, recipeTitle, sessionId]);

    const handleSend = async () => {
        const content = input.trim();
        if (!content || isLoading) return;
        setInput('');
        await sendMessage(content, 'manual');
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handler = (event: Event) => {
            const customEvent = event as CustomEvent;
            const detail = customEvent?.detail || {};

            if (detail?.recipeSlug && detail.recipeSlug !== recipeSlug) return;

            setIsOpen(true);
            setShowGreeting(false);

            const initialMessage = typeof detail?.initialMessage === 'string' ? detail.initialMessage.trim() : '';
            if (initialMessage) {
                setTimeout(() => {
                    sendMessage(initialMessage, detail?.trigger || 'external');
                }, 0);
            }
        };

        window.addEventListener('chef_chat_open', handler as EventListener);
        return () => window.removeEventListener('chef_chat_open', handler as EventListener);
    }, [recipeSlug, sendMessage]);

    const handleAvatarClick = () => {
        posthog.capture('public_recipe_chefchat_icon_clicked', {
            recipeId,
            recipeSlug,
            recipeTitle,
        });
        setIsOpen(prev => !prev);
        setShowGreeting(false);
    };

    return (
        <>
            {/* Dimming Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            zIndex: 1190,
                            cursor: 'pointer',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Chat Container */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1200,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 1.5,
                }}
            >
                {/* Greeting Bubble */}
                <AnimatePresence>
                    {showGreeting && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9, x: 10 }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            style={{
                                cursor: 'pointer',
                                zIndex: 1201,
                            }}
                            onClick={handleAvatarClick}
                        >
                            <Paper
                                elevation={6}
                                sx={{
                                    px: 2.5,
                                    py: 1.5,
                                    borderRadius: '20px 20px 4px 20px',
                                    bgcolor: '#DCFCE7', // Soft Mint
                                    border: '1px solid #013D1D20',
                                    boxShadow: '0 8px 24px rgba(1, 61, 29, 0.15)',
                                    maxWidth: '220px',
                                    position: 'relative',
                                    '&:after': {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: -8,
                                        right: 12,
                                        width: 0,
                                        height: 0,
                                        borderLeft: '10px solid transparent',
                                        borderRight: '10px solid transparent',
                                        borderTop: '10px solid #DCFCE7',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: '#013D1D',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-heading, Montserrat)',
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        Ask me about substitutions!
                                    </Typography>
                                    <CloseIcon
                                        sx={{ fontSize: 14, color: '#013D1D80', cursor: 'pointer', '&:hover': { color: '#013D1D' } }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowGreeting(false);
                                        }}
                                    />
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        >
                            <Paper
                                elevation={12}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    width: { xs: 'calc(100vw - 48px)', sm: '480px' },
                                    height: '560px',
                                    borderRadius: 4,
                                    bgcolor: 'white',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Header */}
                                <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            component="img"
                                            src={CHEF_AVATAR}
                                            sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                                        />
                                        <Box>
                                            <Typography variant="subtitle2" fontWeight="700" color="#013D1D" lineHeight={1}>
                                                Chef Kay
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Gut Health Personal Chef
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <IconButton size="small" onClick={() => setIsOpen(false)}>
                                        <CloseIcon fontSize="small" />
                                    </IconButton>
                                </Box>

                                {/* Messages Area */}
                                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {messages.length === 0 && (
                                        <Box sx={{ textAlign: 'center', mt: 4, px: 2 }}>
                                            <Box sx={{ color: 'text.secondary', fontStyle: 'italic', mb: 2, '& p': { m: 0 } }}>
                                                <ReactMarkdown components={markdownComponents}>
                                                    {`"Hello! I'm Chef Kay. I've analyzed this **${recipeTitle || 'recipe'}** and can help you understand how it fits into your gut health journey. What would you like to know?"`}
                                                </ReactMarkdown>
                                            </Box>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                                                {['Which diet is this for?', 'Can you substitute ingredients?', 'What are the nutritional benefits?'].map(q => (
                                                    <Paper
                                                        key={q}
                                                        elevation={0}
                                                        onClick={() => sendMessage(q, 'suggestion_click')}
                                                        sx={{
                                                            px: 1.5, py: 0.75, borderRadius: 2, bgcolor: '#DCFCE7', cursor: 'pointer',
                                                            '&:hover': { bgcolor: '#c3f9d4' }
                                                        }}
                                                    >
                                                        <Typography variant="caption" fontWeight="600" color="#013D1D">{q}</Typography>
                                                    </Paper>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                    {messages.map((m) => (
                                        <Box
                                            key={m.id}
                                            sx={{
                                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                                maxWidth: '92%',
                                            }}
                                        >
                                            {(m.kind || 'text') === 'recipeCard' && m.role === 'assistant' && m.recipe ? (
                                                <PublicGeneratedRecipeSummaryCard recipe={m.recipe} anonSessionId={m.anonSessionId} />
                                            ) : (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        bgcolor: m.role === 'user' ? '#013D1D' : '#f0f2f5',
                                                        color: m.role === 'user' ? 'white' : 'text.primary',
                                                        '& p': { m: 0, mb: m.role === 'assistant' ? 2 : 0 },
                                                        '& p:last-child': { mb: 0 },
                                                        '& ul, & ol': {
                                                            m: 0,
                                                            mb: 2,
                                                            pl: 3,
                                                            '& li': {
                                                                mb: 1,
                                                                '&:last-child': { mb: 0 }
                                                            }
                                                        },
                                                        '& a': {
                                                            color: m.role === 'user' ? '#DCFCE7' : '#013D1D',
                                                            fontWeight: 600,
                                                            textDecoration: 'underline',
                                                            '&:hover': { textDecoration: 'none' }
                                                        }
                                                    }}
                                                >
                                                    {m.role === 'assistant' ? (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                                            {m.content}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                            {m.content}
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            )}
                                        </Box>
                                    ))}
                                    {isLoading && !messages.some(m => m.role === 'assistant' && m.id.startsWith(Date.now().toString())) && (
                                        <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <CircularProgress size={16} sx={{ color: '#013D1D' }} />
                                            <Typography variant="caption" color="text.secondary">Chef Kay is thinking...</Typography>
                                        </Box>
                                    )}
                                    <div ref={messagesEndRef} />
                                </Box>

                                {/* Input Area */}
                                <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Ask about ingredients, substitutions..."
                                            size="small"
                                            variant="outlined"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            inputRef={inputRef}
                                            disabled={isLoading}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 3,
                                                    bgcolor: '#f8f9fa',
                                                }
                                            }}
                                        />
                                        <IconButton
                                            onClick={handleSend}
                                            disabled={isLoading || !input.trim()}
                                            sx={{
                                                bgcolor: '#013D1D',
                                                color: 'white',
                                                '&:hover': { bgcolor: '#012a14' },
                                                '&.Mui-disabled': { bgcolor: '#e0e0e0', color: '#9e9e9e' }
                                            }}
                                        >
                                            <SendIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                                        Sign up for full access.
                                    </Typography>
                                </Box>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Avatar Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAvatarClick}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        border: '2px solid #FFF8E5',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        cursor: 'pointer',
                        padding: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#013D1D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                    }}
                >
                    <motion.div
                        animate={{
                            boxShadow: isOpen ? "0 0 0 0px rgba(1, 61, 29, 0)" : [
                                "0 0 0 0px rgba(1, 61, 29, 0.2)",
                                "0 0 0 15px rgba(1, 61, 29, 0)",
                                "0 0 0 0px rgba(1, 61, 29, 0)"
                            ]
                        }}
                        transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut"
                        }}
                        style={{
                            position: 'absolute',
                            inset: -4,
                            borderRadius: '50%',
                            pointerEvents: 'none',
                        }}
                    />
                    <img
                        src={CHEF_AVATAR}
                        alt="Chef Kay"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%',
                        }}
                    />
                </motion.button>
            </Box>
        </>
    );
}

