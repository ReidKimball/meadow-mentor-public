import React from 'react'
import RoadmapTable from './RoadmapTable'
import MetaTags from '../Common/MetaTags';

export default function Roadmap() {

    const pageInfo = {
        title: "Development Roadmap", // Just the specific part of the title
        description: "See the planned features and development roadmap for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/roadmap",
        // You could add a specific imageUrl here if needed for this page:
        imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
    };


    return (
        <>
            <MetaTags {...pageInfo} />
            <main className="p-8">
                {/* Reduce font size on small screens */}
                <div className="text-4xl sm:text-5xl md:text-6xl leading-normal text-left">Roadmap</div>
                {/* Reduce horizontal padding on small screens */}
                <div className='flex-grow leading-normal py-8 px-4 sm:px-8 md:px-16 lg:px-32'>
                    <div>
                        <p className='pb-8'>Below is a list of all of the features on our roadmap either in development or in the future. Make sure to take a look at our existing features or changelog.</p>
                        <RoadmapTable />
                    </div>
                </div>
            </main>
        </>
    )
}