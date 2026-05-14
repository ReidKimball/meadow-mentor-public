import { Link } from 'react-router'
import { Button } from '@mui/material'
//import { useAuth0 } from '@auth0/auth0-react'

export default function ProfileButton() {
    //const { user, isAuthenticated, isLoading } = useAuth0();
    const isAuthenticated = true
    
    return (
        <>
        <section>
            {isAuthenticated ? (
                <>
                    <Link to="/profile">
                        <Button variant='outlined' size='small' className="cta-button bg-blue-800 shadow-sm hover:shadow-md">Profile</Button>
                    </Link>
                </>
            ) : (
                <>
                    <Link to="/login">
                        <Button variant='outlined' size='small' className="cta-button bg-blue-800 shadow-sm hover:shadow-md">Login</Button>
                    </Link>                  
                </>
                )}
        </section>
        </>
    )
}