import MetaTags from '../Common/MetaTags'

const profileImage = 'https://storage.googleapis.com/meadow_mentor_public_media/images/about_reid_kimball_profile.webp';

export default function About() {
    const pageInfo = {
        title: "About", // Just the specific part of the title
        description: "Learn about the humble beginnings of Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/about",
        // You could add a specific imageUrl here if needed for this page:
        // imageUrl: "https://meadowmentor.com/images/roadmap-specific-image.png",
    };

    return (
        <>
            <MetaTags {...pageInfo} />
            <main className="p-8">
                <div className="text-6xl leading-normal text-center">About</div>

                <div className='grid md:grid-cols-2 gap-8 py-16 justify-center justify-items-center'> {/*className="flex gap-8 mb-8"*/}
                    <div className="flex-shrink-1">
                        <img
                            src={profileImage}
                            alt="Reid Kimball Profile"
                            className="rounded-3xl max-w-96 object-cover"
                        />
                        <div className='pt-1 text-sm text-slate-600 text-center'>SCD Waffles, recipe by Meadow Mentor</div>
                    </div>
                    <div className='flex-grow'>
                        <p className='leading-normal'>
                            I'll never forget the date, February 13, 1997. I was diagnosed with Crohn's disease, a debilitating inflammatory bowel disease. It was 8 years
                            later when I started using the <a href='https://breakingtheviciouscycle.info' target='_blank'>Specific Carbohydrate Diet</a> (SCD) to help me manage my symptoms. Over the years I regained much of my health thanks to the SCD.
                            I was lucky my mother taught me everything I know about the SCD.
                        </p>

                        <p className='leading-normal pt-4'>Studies report that patients lack the education and guidance needed to have successful outcomes on the SCD.(1)</p>

                        <p className='leading-normal pt-4'>I'm Reid, and Meadow Mentor helps people master therapeutic diets like the SCD.</p>

                        <p className='leading-normal pt-4'>Meadow Mentor aims to be complimentary to other resources you may use in your therapeutic diet journey, such as books, doctors, friends, and family.</p>

                        <p className='leading-normal pt-4'>Meadow Mentor uses an advanced artificial intelligence to provide you with personalized, contextualized instant information that can help you follow your therapeutic diet exactly as it's prescribed.</p>

                        <p className='leading-normal pt-4'>If you have any questions about this web app, reach out to: meadowmentor -at- gmail.</p>

                        <p className='text-base py-8'>(1) <a href='https://pmc.ncbi.nlm.nih.gov/articles/PMC10158462/' target='_blank'>Perspectives on Specific Carbohydrate Diet Education from Inflammatory Bowel Disease Patients and Caregivers: A Needs Assessment</a></p>

                    </div>
                </div>
            </main>
        </>
    )
}
