/**
 * @file WelcomeMessage.jsx
 * @module components/AskKay/WelcomeMessage
 * @description A component that displays a welcome message and suggested questions in the Ask Kay chat interface.
 * This component is shown when a new chat is started and there are no messages.
 * It dynamically displays questions based on the 'topic' URL search parameter.
 * @requires react
 * @requires @mui/material
 * @requires framer-motion
 * @requires react-router-dom
 * @requires module:config/askKayQuestions
 */

import { Box, Typography, Button } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
const kayTheOwl = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp';
import { useSearchParams } from 'react-router';
import { ASK_KAY_QUESTIONS } from '../../../../config/askKayQuestions';

/**
 * @function WelcomeMessage
 * @description Renders the initial welcome screen for the Ask Kay chat.
 * It displays a friendly message, an image of the AI assistant Kay, and a list of
 * clickable, predefined questions to help the user start the conversation.
 * @param {object} props - The component props.
 * @param {Function} props.onQuestionSelect - Callback function to execute when a user clicks a predefined question.
 * @param {boolean} props.isTyping - A boolean flag to disable question buttons, typically while the system is "typing" a response.
 * @returns {JSX.Element} The rendered welcome message component.
 */
function WelcomeMessage({ onQuestionSelect, isTyping }) {
    const [searchParams] = useSearchParams();
    const topic = searchParams.get('topic');

    const predefinedQuestions = ASK_KAY_QUESTIONS[topic] || ASK_KAY_QUESTIONS.default;

    return (
        <motion.div
            key="welcome-message"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex-grow flex flex-col items-center justify-center" // Use Tailwind classes for flex layout
        >
            <Box
                className="flex flex-col items-center justify-center text-center p-4"
                sx={{
                    width: { xs: '90%', sm: '80%', md: '600px' },
                    color: '#1a1a1a',
                }}
            >
                <img
                    src={kayTheOwl}
                    alt="Chef Kay"
                    className="rounded-full mb-4"
                    style={{
                        width: '180px',
                        height: '180px',
                        objectFit: 'cover',
                        //boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
                        filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))',
                    }}
                />

                <Typography variant="h4" component="h1" sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#013D1D', mb: 2 }}>
                    Welcome to the meadow!
                </Typography>
                <Typography variant="h6" component="p" sx={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
                    I'm Chef Kay, your guide on your healing journey.
                </Typography>
                <Typography variant="body1" component="p" sx={{ fontFamily: '"Source Sans Pro", sans-serif', mt: 2 }}>
                    Ask about Meadow Mentor features, your diet, and your health condition.
                </Typography>

                <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 1.5, width: '100%' }}>
                    {predefinedQuestions.map((q, index) => (
                        <Button
                            key={index}
                            variant="outlined"
                            onClick={() => onQuestionSelect(q)}
                            disabled={isTyping}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '12px',
                                borderColor: '#013D1D',
                                color: '#013D1D',
                                fontFamily: '"Source Sans Pro", sans-serif',
                                '&:hover': {
                                    backgroundColor: 'rgba(1, 61, 29, 0.04)',
                                    borderColor: '#047857',
                                },
                            }}
                        >{q}</Button>
                    ))}
                </Box>
            </Box>
        </motion.div>
    );
}

export default WelcomeMessage;