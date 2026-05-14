/**
 * @file ChatInput.jsx
 * @module components/features/ai/AskKay/ChatInput
 * @description A controlled component for the chat input field. It includes the text area,
 * a send button, and a button to open the chat history. It also handles the typing animation
 * for pre-selected questions.
 * @requires react
 * @requires prop-types
 * @requires @mui/material
 * @requires lucide-react
 * @requires framer-motion
 * @requires ../../../CreditBalanceBadge.jsx
 */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@mui/material';
import { History, SendHorizontal, Maximize, Minimize, Paperclip, X } from 'lucide-react';
import { motion } from 'framer-motion';
import CreditBalanceBadge from '../../../CreditBalanceBadge.jsx';

/**
 * @function ChatInput
 * @description A controlled component for the chat input field. It includes the text area,
 * a send button, a file attachment button (UI only), and a button to open the chat history.
 * It also handles the typing animation for pre-selected questions.
 * @param {object} props - The component props.
 * @param {Function} props.onSend - Callback function to send a message.
 * @param {boolean} props.isLoading - Flag indicating if a message is currently being sent.
 * @param {Function} props.onOpenHistory - Callback to open the chat history modal.
 * @param {string} props.questionToType - A pre-selected question to be typed into the input.
 * @param {Function} props.setQuestionToType - Function to clear the pre-selected question.
 * @param {boolean} props.isTyping - State indicating if the typing animation is active.
 * @param {Function} props.setIsTyping - Function to set the typing animation state.
 * @param {boolean} props.disabled - Flag to disable the input field.
 * @returns {JSX.Element} The rendered chat input form.
 */
function ChatInput({ onSend, isLoading, onOpenHistory, questionToType, setQuestionToType, isTyping, setIsTyping, disabled }) {
    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isAnimatingSendButton, setIsAnimatingSendButton] = useState(false);
    const fileRef = useRef(null);
    const typingIntervalRef = useRef(null); // To hold interval ID
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef(null);
    const prevIsLoadingRef = useRef(isLoading);

    useEffect(() => {
        // Cleanup previous interval if a new question is selected while another is still typing
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        if (questionToType) {
            setText(''); // Clear existing text immediately
            setIsTyping(true);
            setIsAnimatingSendButton(false);

            let i = 0;
            typingIntervalRef.current = setInterval(() => {
                i++;
                if (i <= questionToType.length) {
                    // Build string from scratch each time instead of using prev state
                    setText(questionToType.substring(0, i));
                } else {
                    clearInterval(typingIntervalRef.current);
                    setIsTyping(false);
                    setIsAnimatingSendButton(true);
                    setQuestionToType(''); // Reset the trigger
                }
            }, 50); // Typing speed: 50ms per character
        }
    }, [questionToType, setQuestionToType, setIsTyping]);

    // Auto-resize textarea height based on content
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [text]);

    useEffect(() => {
        const wasLoading = prevIsLoadingRef.current;
        prevIsLoadingRef.current = isLoading;

        if (wasLoading && !isLoading && !isTyping && !disabled) {
            textareaRef.current?.focus();
        }
    }, [isLoading, isTyping, disabled]);

    // Clean up blob URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleTextChange = (e) => {
        setText(e.target.value);
        // If user types, stop the send button animation
        if (isAnimatingSendButton) {
            setIsAnimatingSendButton(false);
        }
    };

    const handleTriggerFileSelect = () => {
        fileRef.current.click();
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        // The button's disabled state already prevents submission when loading or no content.
        // This check is for the Enter key submission.
        if (isLoading || isTyping || (!text.trim() && !selectedFile)) return;

        // Use the file from the component's state, not the ref.
        onSend(text.trim(), selectedFile);
        setText('');
        setIsAnimatingSendButton(false); // Stop animation on send
        handleRemoveFile();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        if (fileRef.current) fileRef.current.value = '';

    };

    const handleKeyDown = (e) => {
        // Submit on Enter, allow new line on Shift+Enter
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="fixed bottom-[84px] left-0 right-0 bg-transparent p-4 z-10">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 bg-white/60 backdrop-blur-sm border rounded-2xl border-[#013D1D]/20 p-2 shadow-lg max-w-4xl mx-auto">
                {/* Image Preview Area */}
                {previewUrl && (
                    <div style={{ position: 'relative', width: '96px', height: '96px', marginLeft: '8px', marginBottom: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(1, 61, 29, 0.2)' }}>
                        <img src={previewUrl} alt="Selected preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton
                            onClick={handleRemoveFile}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                color: 'white',
                                padding: '2px',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                },
                            }}
                        >
                            <X size={14} />
                        </IconButton>
                    </div>
                )}
                {/* Top Row: Text Input and Expand/Collapse Button in separate columns */}
                <div className="flex items-start w-full gap-1">
                    <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} accept="image/*" disabled={isLoading || isTyping || disabled} />
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        className={`flex-1 bg-transparent px-2 py-1 text-sm focus:outline-none resize-none overflow-y-auto transition-all duration-300 ${isExpanded ? 'max-h-[calc(80vh-200px)]' : 'max-h-60'
                            }`}
                        placeholder="Ask Kay..."
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || isTyping || disabled}
                    />
                    <div className="flex-shrink-0 pt-1">
                        <IconButton
                            onClick={() => setIsExpanded(!isExpanded)}
                            size="small"
                            sx={{
                                padding: '2px',
                                color: 'grey.500',
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                    color: 'grey.700',
                                },
                            }}
                        >
                            {isExpanded ? <Minimize size={16} /> : <Maximize size={16} />}
                        </IconButton>
                    </div>
                </div>

                {/* Bottom Row: Buttons and Badge */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                        <IconButton onClick={onOpenHistory} className="p-2 text-gray-500 hover:text-gray-700 rounded-full disabled:opacity-50" disabled={isLoading || isTyping || disabled}>
                            <History size={20} />
                        </IconButton>

                        {/* TODO: Add file attachment and AI analysis - Feb 26, 2026 */}
                        {/* <IconButton onClick={handleTriggerFileSelect} className="p-2 text-gray-500 hover:text-gray-700 rounded-full disabled:opacity-50" disabled={isLoading || isTyping || disabled}>
                            <Paperclip size={20} />
                        </IconButton> */}
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{
                                scale: isAnimatingSendButton ? [1, 1.15, 1] : 1,
                            }}
                            transition={{
                                duration: 0.8,
                                ease: "easeInOut",
                                repeat: isAnimatingSendButton ? Infinity : 0,
                            }}
                        >
                            <IconButton
                                type="submit"
                                className="p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                                sx={{
                                    color: (!text.trim() && !selectedFile) ? 'grey.500' : '#013D1D',
                                    '&:hover': { color: '#047857' }
                                }}
                                // Disable send if loading, or if there's no text AND no file
                                disabled={isLoading || isTyping || disabled || (!text.trim() && !selectedFile)}
                            >
                                <SendHorizontal size={20} />
                            </IconButton>
                        </motion.div>
                        <CreditBalanceBadge size="small" />
                    </div>
                </div>
            </form>
        </div>
    );
}

ChatInput.propTypes = {
    onSend: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    onOpenHistory: PropTypes.func.isRequired,
    questionToType: PropTypes.string.isRequired,
    setQuestionToType: PropTypes.func.isRequired,
    isTyping: PropTypes.bool.isRequired,
    setIsTyping: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
};

export default ChatInput;
