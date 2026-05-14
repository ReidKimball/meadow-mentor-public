import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import dynamic from 'next/dynamic';

// Dynamically import react-confetti to avoid SSR issues
const ReactConfetti = dynamic(() => import('react-confetti'), {
  ssr: false
});

const ConfettiModal = ({ open, onClose, onConfirm, title, description, confirmText = 'Continue' }) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isExploding, setIsExploding] = useState(false);
  const modalRef = useRef(null);

  // Set dimensions when modal opens
  useEffect(() => {
    if (open && modalRef.current) {
      setDimensions({
        width: modalRef.current.offsetWidth,
        height: window.innerHeight,
      });
      // Trigger confetti after a small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        setIsExploding(true);
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setIsExploding(false);
    }
  }, [open]);

  // Handle window resize
  const handleResize = useCallback(() => {
    if (modalRef.current) {
      setDimensions({
        width: modalRef.current.offsetWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    // Only call onClose if it's a function
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confetti-modal-title"
      aria-describedby="confetti-modal-description"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box ref={modalRef} sx={{ position: 'relative', outline: 'none' }}>
        {/* Confetti Component */}
        {isExploding && (
          <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1300,
            pointerEvents: 'none',
          }}>
            <ReactConfetti
              width={dimensions.width}
              height={dimensions.height}
              recycle={false}
              numberOfPieces={500}
              gravity={0.2}
              initialVelocityY={15}
              tweenDuration={10000}
              onConfettiComplete={() => setIsExploding(false)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />
          </Box>
        )}

        {/* Modal Content */}
        <Paper 
          elevation={10}
          sx={{
            position: 'relative',
            zIndex: 1400,
            p: 4,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper',
            mx: 'auto',
          }}
        >
          <CheckCircleOutlineIcon 
            sx={{ 
              fontSize: 60, 
              color: 'success.main',
              mb: 2,
            }} 
          />
          <Typography 
            id="confetti-modal-title" 
            variant="h5" 
            component="h2"
            sx={{ 
              fontWeight: 'bold',
              mb: 2,
            }}
          >
            {title}
          </Typography>
          <Typography 
            id="confetti-modal-description" 
            sx={{ 
              mb: 3,
              color: 'text.secondary',
            }}
          >
            {description}
          </Typography>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="primary"
            size="large"
            sx={{
              mt: 2,
              px: 4,
              py: 1.5,
              fontWeight: 'bold',
              textTransform: 'none',
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0 6px 20px 0 rgba(0, 0, 0, 0.15)',
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            {confirmText}
          </Button>
        </Paper>
      </Box>
    </Modal>
  );
};

export default ConfettiModal;