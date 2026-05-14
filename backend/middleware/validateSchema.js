export const validate = (schema) => async (req, res, next) => {
  try {
    // DEBUG: Show incoming request body for this validation
    console.log('[validateSchema] Incoming body for', req.method, req.originalUrl, JSON.stringify(req.body, null, 2));
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    return next();
  } catch (error) {
    // DEBUG: Log full Zod validation error details
    console.error('[validateSchema] Validation error details:', JSON.stringify(error.errors, null, 2));
    const errorMessages = error.errors.map(err => err.message);
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errorMessages 
    });
  }
};
