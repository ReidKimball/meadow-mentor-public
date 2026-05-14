import { Card, CardContent, Typography, List, ListItem } from '@mui/material'

const tierBasicUses = 2 // for the card below to show how many AI uses the basic tier gets
export const StandardPanel = () => {
  const standardStatusPanel = (
    <>
      <div className="text-slate-300 text-xl bg-slate-600 p-4 rounded-lg bg-opacity-30 flex gap-2 justify-center items-center"> {/* w-72 */}
        Basic Member
      </div>

      {/* In StandardPanel.jsx */}

      {/* <Card>
        <CardContent>
          <Typography variant="h5">Basic Plan (Free)</Typography>
          <Typography variant="body1">
            All AI services available with {tierBasicUses} uses per day:
          </Typography>
          <List>
            <ListItem>Recipe Generation: {tierBasicUses}/day</ListItem>
            <ListItem>Meal Conversion: {tierBasicUses}/day</ListItem>
            <ListItem>Ask Kay: {tierBasicUses}/day</ListItem>
            <ListItem>Ingredient Checking: {tierBasicUses}/day</ListItem>
            <ListItem>Doctor Report Analysis: {tierBasicUses}/day</ListItem>
          </List>
        </CardContent>
      </Card> */}
    </>
  );

  return standardStatusPanel;
};