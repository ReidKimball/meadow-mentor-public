// Weekly video configuration
// Update this object when adding new weekly videos

export const WEEKLY_VIDEOS = {
  // Key format: YYMMDD-WW (Year, Month, Day, Week Number)
  250323: {
    videoId: "BGq25o334Zw", // get code before ? mark - https://youtu.be/BGq25o334Zw?si=4AP_IvDMBBKwPKtD
    title: "Weekly app tips and updates",
    description:
      "The latest updates to the Meadow Mentor app. New videos every week to support your health journey.",
  },
  250330: {
    //https://youtu.be/lyCZam-5uhM
    videoId: "lyCZam-5uhM", // get code before ? mark - https://youtu.be/BGq25o334Zw?si=4AP_IvDMBBKwPKtD
    title: "Weekly app tips and updates",
    description:
      "The latest updates to the Meadow Mentor app. New videos every week to support your health journey.",
  },
  // Add new videos here, change the date to the current date, the videoId, and save.
  // "250330": {
  //   videoId: "newVideoId",
  //   title: "Weekly app tips and updates",
  //   description: "The latest updates to the Meadow Mentor app. New videos every week to support your health journey."
  // }
};

// Get the most recent video based on the key
export const getCurrentVideo = () => {
  const videoKeys = Object.keys(WEEKLY_VIDEOS);
  // Sort keys to get the most recent one (assuming the format YYMMDD-WW)
  videoKeys.sort((a, b) => b.localeCompare(a));

  // Return the most recent video
  return {
    ...WEEKLY_VIDEOS[videoKeys[0]],
    key: `hasSeenWeeklyVideo_${videoKeys[0]}`,
  };
};
