import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, List, ListItem, ListItemButton, ListItemText, CircularProgress, Divider, IconButton } from '@mui/material';
import { Plus } from 'lucide-react';
import DeleteIcon from '@mui/icons-material/Delete';
import { getChatSessions, deleteChatSession, setActiveChatSession, clearActiveChatSession } from '../../../../services/langchainService.js';
import { useUser } from '../../../../context/UserContext.jsx';
import Swal from 'sweetalert2';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: '16px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '80vh',
};

function ChatHistoryModal({ open, onClose, onSelectChat, onNewChat }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getFreshIdToken, setUser } = useUser();

  useEffect(() => {
    if (open) {
      const fetchSessions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedSessions = await getChatSessions(getFreshIdToken);
          setSessions(fetchedSessions);
        } catch (err) {
          setError('Failed to load chat history. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSessions();
    }
  }, [open, getFreshIdToken]);

  const handleSelect = async (sessionId) => {
    try {
      await setActiveChatSession(sessionId, getFreshIdToken);
      // Update the user context directly instead of refetching
      setUser(prevUser => ({ ...prevUser, lastOpenAskKayChat: sessionId }));
      onSelectChat(sessionId);
      onClose();
    } catch (error) {
      console.error("Failed to set active chat session:", error);
      // Optionally show an error to the user
    }
  };

  const handleNewChat = async () => {
    try {
      // Tell the backend to clear the active chat reference for this user
      await clearActiveChatSession(getFreshIdToken);
      // Update the user context directly instead of refetching
      setUser(prevUser => ({ ...prevUser, lastOpenAskKayChat: null }));
      // Then trigger the frontend state change
      onNewChat();
      onClose();
    } catch (error) {
      console.error("Failed to clear active chat session:", error);
    }
  }

  const handleDeleteClick = async (sessionId, sessionTitle) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the chat: "${sessionTitle}"`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      customClass: {
        container: 'my-swal-container'
      }
    });

    if (result.isConfirmed) {
      try {
        await deleteChatSession(sessionId, getFreshIdToken);
        setSessions(prevSessions => prevSessions.filter(s => s._id !== sessionId));
        Swal.fire({
          title: 'Deleted!',
          text: 'Your chat session has been deleted.',
          icon: 'success',
          customClass: {
            container: 'my-swal-container'
          }
        });
      } catch (err) {
        console.error('Failed to delete chat session:', err);
        Swal.fire({
          title: 'Error!',
          text: err.message || 'Could not delete the chat session. Please try again.',
          icon: 'error',
          customClass: {
            container: 'my-swal-container'
          }
        });
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="chat-history-modal-title"
    >
      <Box sx={style}>
        <Typography id="chat-history-modal-title" variant="h6" component="h2" sx={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#013D1D' }}>
          Chat History
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus />}
          onClick={handleNewChat}
          sx={{ 
            my: 2,
            backgroundColor: '#013D1D',
            '&:hover': { backgroundColor: '#047857' },
          }}
        >
          New Chat
        </Button>
        <Divider />
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>
          ) : (
            <List>
              {sessions.map((session) => (
                <ListItem
                  key={session._id}
                  disablePadding
                  secondaryAction={
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(session._id, session.title)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemButton 
                    onClick={() => handleSelect(session._id)}
                    sx={{
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(1, 61, 29, 0.04)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={session.title}
                      secondary={`Last updated: ${new Date(session.updatedAt).toLocaleString()}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default ChatHistoryModal;
