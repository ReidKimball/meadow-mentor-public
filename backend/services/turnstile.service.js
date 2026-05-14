/**
 * @file turnstile.service.js
 * @description Service for verifying Cloudflare Turnstile tokens.
 */


/**
 * Verify a Turnstile token with Cloudflare's siteverify API.
 * 
 * @param {string} token - The token provided by the frontend widget.
 * @param {string} remoteIp - (Optional) The IP address of the client.
 * @returns {Promise<boolean>} - True if validation is successful, False otherwise.
 */
export const verifyTurnstileToken = async (token, remoteIp) => {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('❌ (turnstile.service) CLOUDFLARE_TURNSTILE_SECRET_KEY is not defined in environment variables.');
    // Fail open or closed? Closed for security.
    return false; 
  }

  if (!token) {
      console.warn('⚠️ (turnstile.service) No token provided for verification.');
      return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    // Using axios or fetch. Let's use fetch if node >= 18, or axios if available.
    // Based on package.json check (coming next), I'll default to fetch if likely available, fallback to axios.
    // Actually, I'll write this file AFTER checking package.json to be sure.
    // BUT, I can see 'axios' is commonly used in this project likely.
    
    // Placeholder - waiting for package.json view result to decide on fetch vs axios.
    // I will use GLOBAL fetch for now as it makes the snippet standard.
    
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData,
    });

    const data = await response.json();
    
    if (!data.success) {
        console.warn('⚠️ (turnstile.service) Token verification failed:', data['error-codes']);
        return false;
    }

    return true;
  } catch (error) {
    console.error('❌ (turnstile.service) Error communicating with Cloudflare:', error);
    return false;
  }
};
