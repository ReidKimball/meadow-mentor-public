/**
 * @file RecipeValidationLogsPage.jsx
 * @module pages/Admin/RecipeValidationLogsPage
 * @description Admin page to view AI recipe validation logs.
 * @version 1.0.0
 * @date 2025-09-13
 * @author Cascade
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  CircularProgress, 
  Alert, 
  Pagination, 
  Collapse, 
  IconButton, 
  Tabs, 
  Tab 
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { useUser } from '../../context/UserContext';
import { getRecipeValidationLogs } from '../../services/adminService';
import dayjs from 'dayjs';

const LogRow = ({ log }) => {
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {log.recipeTitle}
        </TableCell>
        <TableCell>{log.diet}</TableCell>
        <TableCell>{log.attemptNumber}</TableCell>
        <TableCell>{log.isCompliant ? '✅ Yes' : '❌ No'}</TableCell>
        <TableCell>{dayjs(log.createdAt).format('YYYY-MM-DD HH:mm')}</TableCell>
        <TableCell>{log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : 'N/A'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Validation Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre>{JSON.stringify(log.validationReport, null, 2)}</pre>
              </Paper>
              <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
                Original Recipe JSON
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                <pre>{JSON.stringify(log.originalRecipeJson, null, 2)}</pre>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const RecipeValidationLogsPage = () => {
  const { getFreshIdToken } = useUser();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'compliant', 'non-compliant'

  const fetchLogs = useCallback(async (currentPage, currentFilter) => {
    setLoading(true);
    setError(null);
    try {
      let isCompliant;
      if (currentFilter === 'compliant') isCompliant = true;
      if (currentFilter === 'non-compliant') isCompliant = false;

      const data = await getRecipeValidationLogs(getFreshIdToken, currentPage, 20, isCompliant);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to fetch logs.');
    } finally {
      setLoading(false);
    }
  }, [getFreshIdToken]);

  useEffect(() => {
    fetchLogs(page, filter);
  }, [page, filter, fetchLogs]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleFilterChange = (event, newValue) => {
    setPage(1); // Reset to first page on filter change
    setFilter(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>AI Recipe Validation Logs</Typography>
      
      <Paper sx={{ mb: 2 }}>
        <Tabs value={filter} onChange={handleFilterChange} centered>
          <Tab label="All" value="all" />
          <Tab label="Compliant" value="compliant" />
          <Tab label="Non-Compliant" value="non-compliant" />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Recipe Title</TableCell>
                  <TableCell>Diet</TableCell>
                  <TableCell>Attempt #</TableCell>
                  <TableCell>Compliant</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <LogRow key={log._id} log={log} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default RecipeValidationLogsPage;
