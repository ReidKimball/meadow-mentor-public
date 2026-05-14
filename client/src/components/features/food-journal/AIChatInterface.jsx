import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, CircularProgress, Chip, Alert, IconButton, Tooltip,
    useTheme, alpha, Card, Fade
} from '@mui/material';
import { Send, Lock, BrainCircuit, MessageSquare, Bot, User, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIChatInterface({
    chatHistory,
    onSendMessage,
    isLoading,
    error,
    isSubscriber,
    handleLockedFeatureClick,
    isUserLoading,
}) {
    const [messageInput, setMessageInput] = useState('');
    const chatEndRef = useRef(null);
    const theme = useTheme();

    const handleInputChange = (event) => {
        setMessageInput(event.target.value);
    };

    const handleSend = () => {
        if (messageInput.trim() && !isLoading && isSubscriber) {
            onSendMessage(messageInput.trim());
            setMessageInput('');
        } else if (!isSubscriber) {
            handleLockedFeatureClick('AI Meal History Chat');
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory]);

    const chatDisabled = isLoading || isUserLoading || !isSubscriber;

    return (
        <Paper 
            elevation={2} 
            sx={{ 
                p: 0, 
                mt: 3, 
                display: 'flex', 
                flexDirection: 'column', 
                height: 'auto', 
                minHeight: '500px', 
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden'
            }}
        >
            {/* Header */}
            <Box 
                sx={{ 
                    p: 2.5, 
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <BrainCircuit 
                    size={20} 
                    color={theme.palette.primary.main}
                    style={{ marginRight: '10px' }}
                />
                <Typography 
                    variant='h6'
                    sx={{ 
                        fontWeight: 500,
                        flex: 1
                    }}
                >
                    AI Analysis Chat
                </Typography>
                {isLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ mr: 1 }}
                        >
                            Thinking...
                        </Typography>
                        <RefreshCw size={16} className="animate-spin" />
                    </Box>
                )}
            </Box>

            {/* Chat Message Display Area */}
            <Box 
                sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    '&::-webkit-scrollbar': {
                        width: '6px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-track': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: '3px',
                    },
                }}
            >
                {chatHistory.length === 0 && !isLoading && !error && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            height: '100%',
                            minHeight: '300px',
                            color: 'text.secondary'
                        }}
                    >
                        <MessageSquare 
                            size={40} 
                            style={{ opacity: 0.5, marginBottom: '16px' }}
                        />
                        <Typography variant="body1" gutterBottom>
                            Click "Analyze" above to start the analysis
                        </Typography>
                        <Typography variant="body2">
                            or ask a follow-up question about your meal history.
                        </Typography>
                    </Box>
                )}

                {chatHistory.map((msg, index) => (
                    <Fade 
                        in={true} 
                        key={index} 
                        timeout={300}
                        style={{ 
                            transitionDelay: `${index * 50}ms`,
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                            position: 'relative'
                        }}>
                            {msg.sender === 'ai' && (
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        mr: 1,
                                        mt: 0.5
                                    }}
                                >
                                    <Bot size={16} color={theme.palette.primary.main} />
                                </Box>
                            )}
                            
                            <Card
                                elevation={0}
                                sx={{
                                    p: 2,
                                    maxWidth: '85%',
                                    borderRadius: msg.sender === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                    bgcolor: msg.sender === 'user' 
                                        ? alpha(theme.palette.primary.main, 0.9)
                                        : alpha(theme.palette.background.paper, 0.6),
                                    color: msg.sender === 'user' 
                                        ? theme.palette.primary.contrastText 
                                        : theme.palette.text.primary,
                                    borderColor: msg.sender === 'user'
                                        ? 'transparent'
                                        : alpha(theme.palette.divider, 0.1),
                                    boxShadow: theme.shadows[1],
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                }}
                            >
                                {msg.sender === 'ai' ? (
                                    <Box className="prose prose-sm sm:prose-base max-w-none prose-headings:font-semibold prose-p:my-1 prose-ul:list-disc prose-ol:list-decimal prose-li:my-0.5">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]} 
                                            components={{
                                                a: ({ node, ...props }) => (
                                                    <a 
                                                        {...props} 
                                                        style={{ 
                                                            color: theme.palette.primary.main,
                                                            textDecoration: 'underline' 
                                                        }} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                    />
                                                ),
                                                h1: ({ node, ...props }) => (
                                                    <Typography variant="h5" {...props} sx={{ mt: 2, mb: 1, fontWeight: 600 }} />
                                                ),
                                                h2: ({ node, ...props }) => (
                                                    <Typography variant="h6" {...props} sx={{ mt: 2, mb: 1, fontWeight: 600 }} />
                                                ),
                                                h3: ({ node, ...props }) => (
                                                    <Typography variant="subtitle1" {...props} sx={{ mt: 1.5, mb: 0.5, fontWeight: 600 }} />
                                                ),
                                                p: ({ node, ...props }) => (
                                                    <Typography variant="body2" {...props} sx={{ my: 0.5 }} />
                                                ),
                                                ul: ({ node, ...props }) => (
                                                    <Box component="ul" sx={{ pl: 2, my: 0.5 }} {...props} />
                                                ),
                                                ol: ({ node, ...props }) => (
                                                    <Box component="ol" sx={{ pl: 2, my: 0.5 }} {...props} />
                                                ),
                                                li: ({ node, ...props }) => (
                                                    <Typography component="li" variant="body2" sx={{ my: 0.25 }} {...props} />
                                                ),
                                            }}
                                        >
                                            {msg.message}
                                        </ReactMarkdown>
                                    </Box>
                                ) : (
                                    <Typography variant="body2">
                                        {msg.message}
                                    </Typography>
                                )}
                            </Card>
                            
                            {msg.sender === 'user' && (
                                <Box
                                    sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        bgcolor: alpha(theme.palette.primary.dark, 0.2),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ml: 1,
                                        mt: 0.5
                                    }}
                                >
                                    <User size={16} color={theme.palette.primary.dark} />
                                </Box>
                            )}
                        </Box>
                    </Fade>
                ))}

                {/* Loading Indicator */}
                {isLoading && chatHistory.length > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, ml: 5 }}>
                        <CircularProgress size={16} thickness={5} sx={{ mr: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                            Analyzing your meal history...
                        </Typography>
                    </Box>
                )}

                {/* Error Display */}
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            my: 1, 
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                                alignItems: 'center'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Add ref to the last element to scroll to */}
                <div ref={chatEndRef} />
            </Box>

            {/* Input Area */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    p: 2,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                    backgroundColor: theme.palette.background.paper,
                    position: 'relative',
                    zIndex: 1
                }}
            >
                <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder={chatDisabled && !isUserLoading ? "Upgrade to Premium to chat..." : "Ask a follow-up question..."}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    disabled={chatDisabled}
                    multiline
                    maxRows={4}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.background.paper, 0.8),
                            transition: theme.transitions.create(['box-shadow']),
                            '&.Mui-focused': {
                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`
                            }
                        }
                    }}
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSend}
                    disabled={chatDisabled || !messageInput.trim()}
                    sx={{ 
                        minWidth: 'auto', 
                        p: '10px',
                        borderRadius: 2,
                        height: 40
                    }}
                >
                    {chatDisabled && !isSubscriber && !isUserLoading ? (
                        <Lock size={18} />
                    ) : (
                        <Send size={18} />
                    )}
                </Button>

                {/* Premium Lock Overlay */}
                {!isSubscriber && !isUserLoading && (
                    <Tooltip title="Upgrade to Premium for AI Chat about your meal history" placement="top" arrow>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgcolor: 'rgba(255, 255, 255, 0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 1,
                                cursor: 'pointer',
                                textAlign: 'center',
                                zIndex: 2,
                            }}
                            onClick={() => handleLockedFeatureClick('AI Chat')}
                        >
                            <Lock size={24} style={{ marginBottom: '8px', color: theme.palette.text.secondary }} />
                            <Typography variant="body2" color="text.secondary">
                                Chat requires Premium
                            </Typography>
                        </Box>
                    </Tooltip>
                )}
            </Box>
        </Paper>
    );
}
