import React from 'react';
import { motion } from 'framer-motion';
import { Avatar, Box } from '@mui/material';
const kayTheOwl = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_headerbar.webp';

const containerVariants = {
    animate: {
        transition: {
            staggerChildren: 0.2,
        },
    },
};

const dotVariants = {
    initial: {
        y: '0%',
    },
    animate: {
        y: ['0%', '-100%', '0%'],
        transition: {
            duration: 1.2,
            ease: 'easeInOut',
            repeat: Infinity,
        },
    },
};

function KayThinkingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3 mb-4"
        >
            <Avatar src={kayTheOwl} />
            <Box className="flex-1 pt-1">
                <motion.div
                    className="bg-gray-200 rounded-2xl rounded-bl-none p-3 inline-flex items-end gap-1.5 h-[34px]"
                    variants={containerVariants}
                    initial="initial"
                    animate="animate"
                >
                    <motion.span className="w-2.5 h-2.5 bg-gray-500 rounded-full" variants={dotVariants} />
                    <motion.span className="w-2.5 h-2.5 bg-gray-500 rounded-full" variants={dotVariants} />
                    <motion.span className="w-2.5 h-2.5 bg-gray-500 rounded-full" variants={dotVariants} />
                </motion.div>
            </Box>
        </motion.div>
    );
}

export default KayThinkingIndicator;