app.post(
  "/api/check_ingredients",
  upload.single("ingredientsLabel"),
  checkUserLimits,
  async (req, res) => {
    const userIP = req.ip || req.connection.remoteAddress;
    console.log(`User IP address: ${userIP}`);

    // Fetch user data
    const firebaseUID = req.headers.authorization?.split("Bearer ")[1];

    // Find the user to get their MongoDB _id
    const user = await User.findOne({ firebaseUID });

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      } else {
        console.log("Received file:", req.file);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }

    const ingredientsLabel = req.file; // files are sent in req.file, not req.body and var name needs to match what I'm sending from ai.js
    console.log(
      `(index.js) - Received ingredients label from ai.js: ${ingredientsLabel}`
    );
    console.log("(index.js) - Sending file request to AI API...");

    const imageBuffer = req.file.buffer;
    const imageBase64 = imageBuffer.toString("base64");

    console.log(`(index.js) - MODEL SELECTED: ${modelSelected}`);

    if (modelSelected === "CLAUDE") {
      try {
        const msg = await anthropic.messages.create({
          model: process.env.SONNET_MODEL,
          max_tokens: 1024,
          system: INGREDIENT_ANALYSIS_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: req.file.mimetype,
                    data: imageBase64,
                  },
                },
                {
                  type: "text",
                  text: "Analyze this ingredient label for SCD compliance. Follow your system prompt.",
                },
              ],
            },
          ],
        });
        res.json({ checkIngResponse: msg.content[0].text });
        // After successful response:
        console.log(
          "(index.js check_ingredients) - CLAUDE check ingredient label response successfully generated"
        );
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    } else if (modelSelected === "GEMINI") {
      try {
        console.log("(index.js - check_ingredients) - trying Gemini...");

        const prompt = `${user.firstName} has ${user.conditionTreating}. Analyze this ingredient label for ${user.therapeuticDiet} compliance. Follow your system prompt. Refer to them directly.`;
        const image = {
          inlineData: {
            data: imageBase64,
            mimeType: req.file.mimetype,
          },
        };
        const apiService = req.body.apiService; // || req.file.fieldname //needs to match what I'm sending from ai.js
        console.log(
          `(index.js) - Received apiService from ai.js: ${apiService}`
        );
        console.log("(index.js) - Sending question request to AI API...");
        const remainingRequests = res.getHeader("RateLimit-Remaining");
        const resetTime = user.apiUsage.lastReset; //this is the time that it was last reset
        //const msg = await geminiIngredientLabels.generateContent([prompt, image])

        // Get the appropriate model for the user's therapeutic diet
        const userGeminiIngredientLabels = getGeminiModel(
          apiService,
          user.therapeuticDiet
        );

        const msg = await userGeminiIngredientLabels.generateContent([
          prompt,
          image,
        ]);
        const response = await msg.response;
        const text = response.text();

        // Find the user to get their MongoDB _id - user should already be available
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        // Save response to MongoDB database
        const savedResponse = new AIResponse({
          userId: user._id.toString(),
          firebaseUID: firebaseUID,
          serviceType: "checkIngredients",
          prompt: image, // will this store the image users uploaded?
          response: text,
        });

        await savedResponse.save();

        console.log(
          "(index.js - check_ingredients) - Received response from Gemini:",
          text
        );
        res.json({
          checkIngredientsResponse: text,
          remainingRequests: remainingRequests,
          resetTime: resetTime,
          responseId: savedResponse._id,
        });
      } catch (error) {
        // Check if it's a rate limit error from the AI provider
        if (error.message.includes("rate") || error.message.includes("quota")) {
          res.status(429).json({
            error: "API Rate Limit Met",
            isRateLimit: true,
          });
        } else {
          res.status(500).json({ error: error.message });
        }
        console.log(error);
      }
    }
  }
);
