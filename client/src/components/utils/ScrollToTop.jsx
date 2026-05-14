import { useEffect } from 'react';
import { useLocation } from 'react-router';

function ScrollToTop() {
    // Get the current location object
    const { pathname } = useLocation();

    // useEffect hook runs after component renders and when dependencies change
    useEffect(() => {
        // Scroll the window to the top left corner (0, 0)
        window.scrollTo(0, 0);
    }, [pathname]); // The effect depends on the pathname. It will re-run every time the pathname changes.

    // This component does not render any visible UI
    return null;
}

export default ScrollToTop;
