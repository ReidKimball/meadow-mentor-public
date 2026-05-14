import PricingTable from '../features/payments/PricingTable.jsx';
import { useLocation } from 'react-router';
import MetaTags from '../Common/MetaTags.jsx';

export default function Pricing() {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    const pageInfo = {
        title: "Pricing", // Just the specific part of the title
        description: "Explore the pricing options for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/pricing",
        // You could add a specific imageUrl here if needed for this page:
        imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
    };

    return (
        <div>
            <MetaTags {...pageInfo} />
            {isLandingPage ? <LandingPagePricing /> : <PricingTable />}
        </div>
    );
}