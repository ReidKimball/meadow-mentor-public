import React from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router'

export default function LoginButton(props) {

  const handleClick = () => {
    // Call the tracking function if provided
    if (props.onButtonClick) {
      //console.log(`(MentorIntro.jsx) - Sign up button clicked from Kay Hero Section`)
      props.onButtonClick();
    }
  }

  return (
    <>
      <Link to={props.link}>
        <Button
          size='small'
          variant='outlined'
          onClick={handleClick}
          sx={{
            borderColor: '#013D1D',
            color: '#013D1D',
            textTransform: 'none',
            fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            '&:hover': {
              borderColor: '#047857',
              backgroundColor: 'rgba(1, 61, 29, 0.04)'
            }
          }}
        >
          Log in
        </Button>
      </Link>
    </>
  )
}