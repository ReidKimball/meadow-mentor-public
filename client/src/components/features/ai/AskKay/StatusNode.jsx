/**
 * @file StatusNode.jsx
 * @module components/features/ai/AskKay/StatusNode
 * @description Renders a single status update line with an appropriate icon (spinner, check, or X).
 * @requires react
 * @requires prop-types
 * @requires @mui/material
 * @requires lucide-react
 * @requires framer-motion
 */
import PropTypes from 'prop-types';
import { Box, CircularProgress, Typography } from '@mui/material';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * @function StatusNode
 * @description Renders a single status update line with an appropriate icon (spinner, check, or X).
 * @param {object} props - The component props.
 * @param {object} props.status - The status object.
 * @returns {JSX.Element}
 */
function StatusNode({ status }) {
    const getIcon = () => {
        switch (status.state) {
            case 'in_progress':
                return <CircularProgress size={18} sx={{ color: 'text.secondary' }} />;
            case 'success':
                return <CheckCircle size={18} className="text-green-500" />;
            case 'failure':
                return <XCircle size={18} className="text-red-500" />;
            default:
                return <Box sx={{ width: 18 }} />; // Placeholder for alignment
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2 pl-12" // Indented like an assistant message
        >
            <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {getIcon()}
            </Box>
            <Typography variant="body2" color="text.secondary">
                {status.message}
            </Typography>
        </motion.div>
    );
}

StatusNode.propTypes = {
    status: PropTypes.shape({
        type: PropTypes.string,
        message: PropTypes.string,
        phase: PropTypes.string,
        state: PropTypes.string,
    }).isRequired,
};

export default StatusNode;