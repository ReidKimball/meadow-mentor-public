import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from './LogoutButton'

import { useLocation } from 'react-router'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
//import { Navigate } from 'react-router'


export default function Account() {
    const location = useLocation()
    const [message, setMessage] = useState(location.state?.message || '')
    const [userInfo, setUserInfo] = useState({ email: '', subscriptionTier: '' })
    //const [userInfo, setUserInfo] = useState(location.state?.data.user.email || '')
    const navigate = useNavigate()

    const { user, isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return <div>Loading...</div>; // Display a loading message while fetching user data
    }

    if (!user || !isAuthenticated) {
        return (
            <>
                <div>Please log in to view your profile.</div> {/*Handle the case where the user isn't authenticated*/}
                <LoginButton />
            </>
        )
    }
    /*
    useEffect(() => {
        const fetchUserInfo = async () => {
            //console.log('Entered fetchUserInfo')
            
            try {
                const response = await fetch('http://localhost:3000/user-info', {
                    credentials: 'include'
                })
                //console.log('response from user-info route: ', response)

                const data = await response.json()
                //console.log('data from user-info response.json: ', data)
                
                if (data.success) {
                    setUserInfo(data.user)
                } else {
                    navigate('/login')
                }
            } catch (error) {
                console.error('Error fetching user info:', error)
            }
        }

        fetchUserInfo()
    }, [])

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage('')
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [message])
    */

    return (
        <>
            <main>
                <h1>Account Info</h1>
                {message && <div className='success-message'>{message}</div>}
                <div className='account-details'>
                    <p><strong>Email: </strong>{user.email}</p>
                    <p><strong>Subscription: </strong>{user.subscriptionTier ? user.subscriptionTier : <span>n/a</span>}</p>
                </div>
            </main>
        </>
    )
}