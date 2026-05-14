import { getAuth, signOut } from 'firebase/auth'
import { useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import { LogOut } from 'lucide-react';

function LogoutButton() {
  const auth = getAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      //console.log('Logout error:', error)
    }
  }

  return (
    <Button onClick={handleLogout} variant='outlined' startIcon={<LogOut />} size='small' className="flex-none cta-button bg-blue-800 shadow-sm hover:shadow-md">Log out</Button>
  )
}

export default LogoutButton
