'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

// SET THIS TO TRUE TO ENABLE TRACKING ON LOCALHOST FOR TESTING
const ENABLE_LOCALHOST_TRACKING = false;

if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';

    if (!isLocal || ENABLE_LOCALHOST_TRACKING) {
        posthog.init('phc_5dDtdgOA96NyB1dvU3bI0tjKJUeqbEeJDgkzUjZH2TS', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            capture_pageview: true,
            
        });
    }
}

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
