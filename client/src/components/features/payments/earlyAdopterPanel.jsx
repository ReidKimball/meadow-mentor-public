import { Card, CardContent, Typography, List, ListItem } from '@mui/material'

const tierPremiumUses = 6 // used in the Card below

export const EarlyAdopterPanel = () => {
  const earlyAdopterStatusIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );

  const earlyAdopterStatusPanel = (
    <>
      <div className="h-2 text-teal-300 text-xl bg-teal-800 p-4 py-8 rounded-lg bg-opacity-30 flex gap-2 justify-center items-center"> {/* w-72 */}
        {earlyAdopterStatusIcon}
        Early Adopter Member
      </div>

      {/* // In EarlyAdopterPanel.jsx */}
      {/* <Card>
        <CardContent>
          <Typography variant="h5">Early Adopter Plan</Typography>
          <Typography variant="body1">
            All AI services available with {tierPremiumUses} uses per day:
          </Typography>
          <List>
            <ListItem>Recipe Generation: {tierPremiumUses}/day</ListItem>
            <ListItem>Meal Conversion: {tierPremiumUses}/day</ListItem>
            <ListItem>Ask Kay: {tierPremiumUses}/day</ListItem>
            <ListItem>Ingredient Checking: {tierPremiumUses}/day</ListItem>
            <ListItem>Doctor Report Analysis: {tierPremiumUses}/day</ListItem>
          </List>
        </CardContent>
      </Card> */}

    </>
  );

  return earlyAdopterStatusPanel;
};