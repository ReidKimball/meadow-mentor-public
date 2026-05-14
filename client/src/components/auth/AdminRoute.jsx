import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { API_BASE_URL } from '../../env-config.js'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { useUser } from '../../context/UserContext.jsx';

function AdminRoute() {
    const [isAdmin, setIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    const auth = getAuth()
    const { getFreshIdToken } = useUser();

    useEffect(() => {
        const checkAdminStatus = async (user) => {
            if (!user) {
                setIsAdmin(false)
                setLoading(false)
                return
            }

            try {
                const idToken = await getFreshIdToken();
                if (!idToken) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }
                const response = await fetch(`${API_BASE_URL}/api/users/checkAdmin/${user.uid}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                })

                const data = await response.json()
                setIsAdmin(data.isAdmin === true)
            } catch (error) {
                console.error('[AdminRoute] Error checking admin status:', error)
                setIsAdmin(false)
            } finally {
                setLoading(false)
            }
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            checkAdminStatus(user)
        })

        return () => {
            unsubscribe();
        }
    }, [auth, getFreshIdToken])

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    return isAdmin ? <Outlet /> : <Navigate to="/" replace />
}

export default AdminRoute
