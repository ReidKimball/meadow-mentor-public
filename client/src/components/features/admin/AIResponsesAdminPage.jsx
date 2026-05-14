import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useUser } from "../../../context/UserContext";
import { getUsersWithResponses, getResponsesByFilter, deleteResponse } from "../../../services/adminService";
import { Box, Typography, TextField, CircularProgress, Grid, Button, FormControl, InputLabel, Select, MenuItem, Card, CardContent, CardActions, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Swal from 'sweetalert2';

const AiResponsesAdminPage = () => {
  const { getFreshIdToken } = useUser();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [responses, setResponses] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    serviceType: '',
    saved: '',
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [error, setError] = useState("");
  const [viewingResponse, setViewingResponse] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const fetchedUsers = await getUsersWithResponses(getFreshIdToken);
        setUsers(fetchedUsers);
      } catch (err) {
        setError("Failed to fetch users.");
        console.error(err);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [getFreshIdToken]);

  const handleFetchResponses = useCallback(async () => {
    if (!selectedUser) return;

    setLoadingResponses(true);
    setError("");
    try {
      const queryParams = { firebaseUID: selectedUser.firebaseUID };
      if (filters.startDate) queryParams.startDate = filters.startDate;
      if (filters.endDate) queryParams.endDate = filters.endDate;
      if (filters.serviceType) queryParams.serviceType = filters.serviceType;
      if (filters.saved !== '') queryParams.saved = filters.saved;

      const fetchedResponses = await getResponsesByFilter(queryParams, getFreshIdToken);
      setResponses(fetchedResponses);
    } catch (err) {
      setError("Failed to fetch responses.");
      console.error(err);
    } finally {
      setLoadingResponses(false);
    }
  }, [selectedUser, filters, getFreshIdToken]);

  useEffect(() => {
    if (selectedUser) {
      const defaultFilters = { startDate: '', endDate: '', serviceType: '', saved: '' };
      setFilters(defaultFilters);

      const fetchInitialResponses = async () => {
        setLoadingResponses(true);
        setError("");
        try {
          const queryParams = { firebaseUID: selectedUser.firebaseUID };
          const fetchedResponses = await getResponsesByFilter(queryParams, getFreshIdToken);
          setResponses(fetchedResponses);
        } catch (err) {
          setError("Failed to fetch responses.");
          console.error(err);
        } finally {
          setLoadingResponses(false);
        }
      };
      fetchInitialResponses();
    } else {
      setResponses([]);
    }
  }, [selectedUser, getFreshIdToken]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleViewClick = (response) => {
    setViewingResponse(response);
  };

  const handleCloseView = () => {
    setViewingResponse(null);
  };

  const handleDeleteClick = async (responseId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await deleteResponse(responseId, getFreshIdToken);
        setResponses(prevResponses => prevResponses.filter(response => response._id !== responseId));
        Swal.fire(
          'Deleted!',
          'The response has been deleted.',
          'success'
        );
      } catch (err) {
        setError('Failed to delete response.');
        console.error(err);
        Swal.fire(
          'Error!',
          'Failed to delete the response.',
          'error'
        );
      }
    }
  };

  const filteredUsers = useMemo(() =>
    users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    ), [users, searchTerm]);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin: AI Responses
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6">Users</Typography>
          <TextField
            fullWidth
            label="Search by email"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />
          {loadingUsers ? (
            <CircularProgress />
          ) : (
            <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {filteredUsers.map(user => (
                <Box key={user.firebaseUID} sx={{ p: 1, borderBottom: '1px solid #ccc', cursor: 'pointer', backgroundColor: selectedUser?.firebaseUID === user.firebaseUID ? '#e0e0e0' : 'transparent' }} onClick={() => setSelectedUser(user)}>
                  <Typography>{user.email}</Typography>
                  <Typography variant="caption">{user.firstName} {user.lastName}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h6">Responses</Typography>
          {selectedUser ? (
            <Box>
              <Typography>Responses for {selectedUser.email}</Typography>
              
              <Grid container spacing={2} sx={{ my: 2, alignItems: 'center' }}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    name="startDate"
                    label="Start Date"
                    type="date"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    name="endDate"
                    label="End Date"
                    type="date"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Service Type</InputLabel>
                    <Select
                      name="serviceType"
                      value={filters.serviceType}
                      label="Service"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value=""><em>All</em></MenuItem>
                      <MenuItem value="checkIngredients">Ingredient Analysis</MenuItem>
                      <MenuItem value="recipeGeneration">Recipe Generation</MenuItem>
                      <MenuItem value="mealConvert">Meal Conversion</MenuItem>
                      <MenuItem value="askKay">Ask Kay</MenuItem>
                      <MenuItem value="analyzeMeal">Meal Analysis</MenuItem>
                      <MenuItem value="analyzeDoctorReport">Doctor Report Analysis</MenuItem>
                      <MenuItem value="mealPlanner">7-Day Meal Plan</MenuItem>
                      <MenuItem value="journalAnalysis">Journal Analysis</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Saved Items</InputLabel>
                    <Select
                      name="saved"
                      value={filters.saved}
                      label="Saved"
                      onChange={handleFilterChange}
                    >
                      <MenuItem value=""><em>All</em></MenuItem>
                      <MenuItem value="true">Saved</MenuItem>
                      <MenuItem value="false">Not Saved</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sx={{ textAlign: 'right' }}>
                    <Button variant="contained" onClick={handleFetchResponses}>Apply Filters</Button>
                </Grid>
              </Grid>

              {loadingResponses ? (
                <CircularProgress />
              ) : (
                <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
                  {responses.length === 0 ? (
                    <Typography>No responses found for this user with the selected filters.</Typography>
                  ) : (
                    responses.map(response => (
                      <Card key={response._id} sx={{ mb: 2 }}>
                        <CardContent>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(response.createdAt).toLocaleString()} - {response.serviceType}
                          </Typography>
                          <Box sx={{ my: 1, p: 1, border: '1px solid #eee', borderRadius: 1, maxHeight: 100, overflow: 'hidden' }}>
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {response.prompt && typeof response.prompt === 'string' ? `${response.prompt.substring(0, 200)}...` : '[No prompt available]'}
                            </ReactMarkdown>
                          </Box>
                        </CardContent>
                        <CardActions>
                          <IconButton onClick={() => handleViewClick(response)}><ViewIcon /></IconButton>
                          <IconButton onClick={() => handleDeleteClick(response._id)}><DeleteIcon /></IconButton>
                        </CardActions>
                      </Card>
                    ))
                  )}
                </Box>
              )}
            </Box>
          ) : (
            <Typography>Select a user to view their responses.</Typography>
          )}
        </Grid>
      </Grid>

      {viewingResponse && (
        <Dialog open={!!viewingResponse} onClose={handleCloseView} fullWidth maxWidth="md">
          <DialogTitle>Response Details</DialogTitle>
          <DialogContent dividers>
            <Typography variant="h6">Prompt</Typography>
            <Box sx={{ my: 1, p: 2, border: '1px solid #eee', borderRadius: 1, maxHeight: '30vh', overflowY: 'auto' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewingResponse.prompt}
              </ReactMarkdown>
            </Box>
            <Typography variant="h6" sx={{ mt: 2 }}>Response</Typography>
            <Box sx={{ my: 1, p: 2, border: '1px solid #eee', borderRadius: 1, maxHeight: '30vh', overflowY: 'auto' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {viewingResponse.response}
              </ReactMarkdown>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseView}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AiResponsesAdminPage;
