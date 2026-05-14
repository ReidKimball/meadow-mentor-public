import Button from '@mui/material/Button'
import { Link } from 'react-router'

export default function MentorIntro(props) {

  const handleClick = () => {
    // Call the tracking function if provided
    if (props.onButtonClick) {
      //console.log(`(MentorIntro.jsx) - Sign up button clicked from Kay Hero Section`)
      props.onButtonClick();
    }
  }

  return (
    <div className="max-w-md rounded-xl bg-amber-50 p-6 shadow-md">
      <div className="space-y-4">
        <div className="text-xl text-left font-semibold font-[Montserrat] tracking-[0.015em] leading-[1.2]">
          {props.dlgHello}
        </div>

        <div className="text-left text-lg font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]">
          {props.dlgText}
        </div>
      </div>
      <div className='flex flex-row pt-8 items-center justify-center'>
        {/* <Link to="/profile"> */}
        <Link to={props.link}>
          <Button
            variant='contained'
            color='primary'
            size='large'
            className="rounded-md px-4 py-2 font-medium text-gray-800 "
            onClick={handleClick}
          // data-umami-event="signup_button_click"
          >
            {props.btnText}
          </Button>
        </Link>
      </div>
    </div>
  );
}