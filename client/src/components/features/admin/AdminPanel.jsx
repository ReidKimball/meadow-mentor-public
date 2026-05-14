import { useState, useEffect } from 'react'
import { app, db, auth as firebaseAuth } from '../../../config/firestore.js'
import { getPortalUrl } from '../payments/stripePayment.jsx'
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore'
import { deleteUser, getAuth } from 'firebase/auth'
import { Link as RouterLink } from 'react-router';
import { API_BASE_URL } from '../../../env-config.js'
import { useUser } from '../../../context/UserContext.jsx'

import {
    Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Typography, Box, CircularProgress, Divider,
    FormControl, InputLabel, Select, MenuItem, TextField, Card, CardContent
} from '@mui/material'

function AdminPanel() {
    const [users, setUsers] = useState([])
    const [conditionSearches, setConditionSearches] = useState([])
    const [loading, setLoading] = useState(true)
    const [conditionLoading, setConditionLoading] = useState(true)
    const [deleting, setDeleting] = useState({})
    const [deletingCondition, setDeletingCondition] = useState({})
    const [timeScale, setTimeScale] = useState('week')
    const [customDateRange, setCustomDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
        endDate: new Date().toISOString().split('T')[0] // today
    })
    const [userStats, setUserStats] = useState({
        total: 0,
        inPeriod: 0,
        startDate: null,
        endDate: null
    })
    const { getFreshIdToken } = useUser()

    useEffect(() => {
        fetchUsers()
        fetchConditionSearches()
    }, [])

    useEffect(() => {
        if (users.length > 0) {
            calculateUserStats()
        }
    }, [users, timeScale, customDateRange])

    const calculateUserStats = () => {
        // Get date range based on selected time scale
        let startDate, endDate
        const now = new Date()

        switch (timeScale) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                endDate = now
                break
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                endDate = now
                break
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                endDate = now
                break
            case 'lifetime':
                // Find earliest user creation date
                const usersWithCreatedAt = users.filter(user => user.createdAt)
                if (usersWithCreatedAt.length > 0) {
                    startDate = new Date(Math.min(...usersWithCreatedAt.map(user =>
                        new Date(user.createdAt).getTime()
                    )))
                } else {
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) // Default to 1 year ago
                }
                endDate = now
                break
            case 'custom':
                startDate = new Date(customDateRange.startDate)
                endDate = new Date(customDateRange.endDate)
                // Set end date to end of day
                endDate.setHours(23, 59, 59, 999)
                break
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                endDate = now
        }

        // Count users in the selected time period
        const usersInPeriod = users.filter(user => {
            if (!user.createdAt) return false

            const createdAt = new Date(user.createdAt)
            return createdAt >= startDate && createdAt <= endDate
        })

        setUserStats({
            total: users.length,
            inPeriod: usersInPeriod.length,
            startDate,
            endDate
        })
    }

    const fetchConditionSearches = async () => {
        setConditionLoading(true)
        try {
            const idToken = await getFreshIdToken()
            if (!idToken) throw new Error('Authentication token not available.')
            const response = await fetch(`${API_BASE_URL}/api/condition-searches/searches`, {
                headers: { 'Authorization': `Bearer ${idToken}` }
            })

            if (!response.ok) {
                throw new Error('Failed to fetch condition searches')
            }

            let searches = await response.json()

            // Sort by length of normalized_term (shortest to longest)
            searches.sort((a, b) =>
                a.normalized_term.length - b.normalized_term.length
            )

            setConditionSearches(searches)
        } catch (error) {
            console.error('Error fetching condition searches:', error)
        } finally {
            setConditionLoading(false)
        }
    }

    const deleteConditionSearch = async (id) => {
        setDeletingCondition(prev => ({ ...prev, [id]: true }))

        try {
            const idToken = await getFreshIdToken()
            if (!idToken) throw new Error('Authentication token not available.')
            const response = await fetch(`${API_BASE_URL}/api/condition-searches/search/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete condition search')
            }

            // Update UI to remove the deleted condition search
            setConditionSearches(conditionSearches.filter(search => search._id !== id))
        } catch (error) {
            console.error(`Error deleting condition search ${id}:`, error)
            alert(`Failed to delete condition search: ${error.message}`)
        } finally {
            setDeletingCondition(prev => ({ ...prev, [id]: false }))
        }
    }

    const fetchUsers = async () => {
        setLoading(true)
        try {
            // try to read a single document first to test permissions
            try {
                const testDoc = await getDoc(doc(db, 'users', firebaseAuth.currentUser.uid))
            } catch (e) {
            }

            // Fetch from Firestore
            const usersCollection = collection(db, 'users')
            const userSnapshot = await getDocs(usersCollection)
            const userList = userSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                source: 'Firestore'
            }))

            // Fetch from MongoDB
            const mongoIdToken = await getFreshIdToken()
            if (!mongoIdToken) throw new Error('Authentication token not available for MongoDB users fetch.')
            const mongoResponse = await fetch(`${API_BASE_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${mongoIdToken}` }
            })
            const mongoUsers = await mongoResponse.json()

            // Combine and deduplicate users
            setUsers([...userList, ...mongoUsers])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const deleteUserAccount = async (userId, userEmail) => {
        setDeleting(prev => ({ ...prev, [userId]: true }))

        try {
            // Use the backend API to delete the user (handles MongoDB and Stripe)
            const idToken = await getFreshIdToken()
            if (!idToken) throw new Error('Authentication token not available.')
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Failed to delete user from backend')
            }

            // Delete Firestore data after backend deletion is successful
            try {
                const userDoc = doc(db, 'users', userId);
                await deleteDoc(userDoc);
            } catch (firestoreError) {
                console.error(`Error deleting Firestore data: ${firestoreError}`);
                // Continue anyway since the MongoDB record is deleted
            }

            // Update UI to remove the deleted user
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error)
            alert(`Failed to delete user: ${error.message}`)
        } finally {
            setDeleting(prev => ({ ...prev, [userId]: false }))
        }
    }

    const handleTimeScaleChange = (event) => {
        setTimeScale(event.target.value)
    }

    const handleDateRangeChange = (field) => (event) => {
        setCustomDateRange({
            ...customDateRange,
            [field]: event.target.value
        })
    }

    const formatDate = (date) => {
        return date ? date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }) : ''
    }

    return (
        <Box p={4}>
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>

            <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        AI Recipe Validation Logs
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Review and analyze the validation attempts of AI-generated recipes to improve system accuracy.
                    </Typography>
                    <Button component={RouterLink} to="/admin/recipe-validation-logs" variant="contained">
                        View Logs
                    </Button>
                </CardContent>
            </Card>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" gutterBottom>New Users Gained</Typography>

            <Box display="flex" alignItems="center" mb={2} gap={2}>
                <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                    <InputLabel>Time Scale</InputLabel>
                    <Select
                        value={timeScale}
                        onChange={handleTimeScaleChange}
                        label="Time Scale"
                    >
                        <MenuItem value="week">Last Week</MenuItem>
                        <MenuItem value="month">Last Month</MenuItem>
                        <MenuItem value="year">Last Year</MenuItem>
                        <MenuItem value="lifetime">Lifetime</MenuItem>
                        <MenuItem value="custom">Custom Range</MenuItem>
                    </Select>
                </FormControl>

                {timeScale === 'custom' && (
                    <Box display="flex" gap={2}>
                        <TextField
                            label="Start Date"
                            type="date"
                            value={customDateRange.startDate}
                            onChange={handleDateRangeChange('startDate')}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            value={customDateRange.endDate}
                            onChange={handleDateRangeChange('endDate')}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                )}

                <Button
                    variant="contained"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    Refresh Data
                </Button>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <Card variant="outlined" sx={{ mb: 4 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            User Growth Summary
                        </Typography>
                        <Typography variant="body1">
                            <strong>Time Period:</strong> {formatDate(userStats.startDate)} to {formatDate(userStats.endDate)}
                        </Typography>
                        <Typography variant="body1">
                            <strong>New Users in Period:</strong> {userStats.inPeriod}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Total Users:</strong> {userStats.total}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Divider sx={{ my: 4 }} />

            <Typography variant="h4" gutterBottom>Condition Search Management</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={fetchConditionSearches}
                disabled={conditionLoading}
                sx={{ mb: 3 }}
            >
                Refresh Condition Searches
            </Button>

            {conditionLoading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper} sx={{ mb: 5 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Normalized Term</TableCell>
                                <TableCell>Term Length</TableCell>
                                <TableCell>Search Count</TableCell>
                                <TableCell>Matched Condition</TableCell>
                                <TableCell>Last Searched</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conditionSearches.map((search) => (
                                <TableRow key={search._id}>
                                    <TableCell>{search.normalized_term}</TableCell>
                                    <TableCell>{search.normalized_term.length}</TableCell>
                                    <TableCell>{search.search_count}</TableCell>
                                    <TableCell>{search.matched_condition ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>{new Date(search.last_searched).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            disabled={deletingCondition[search._id]}
                                            onClick={() => deleteConditionSearch(search._id)}
                                        >
                                            {deletingCondition[search._id] ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Divider sx={{ my: 4 }} />


            <Typography variant="h4" gutterBottom>User Management</Typography>

            <Button
                variant="contained"
                color="primary"
                onClick={fetchUsers}
                disabled={loading}
                sx={{ mb: 3 }}
            >
                Refresh User List
            </Button>

            {loading ? (
                <Box display="flex" justifyContent="center" my={4}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>User ID</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Data Sources</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.firstName} {user.lastName}</TableCell>
                                    <TableCell>{user.source}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            disabled={deleting[user.id]}
                                            onClick={() => deleteUserAccount(user.id, user.email)}
                                        >
                                            {deleting[user.id] ? 'Deleting...' : 'Delete'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    )
}

export default AdminPanel
