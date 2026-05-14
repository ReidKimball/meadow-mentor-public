import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// see more at: https://www.npmjs.com/package/react-markdown/v/8.0.6#use
import Copy_Text from './Copy_Text'
import SaveResponseButton from './SaveResponseButton'

export default function Coach_AI(props) {

    return (
        // Use props.ref directly if passed like that
        <section className="suggested-recipe-container prose prose-slate max-w-none" aria-live='polite' ref={props.ref}>
            {/* Removed the extra wrapping div as ref can be on the section */}
            <div className='py-8 flex items-center gap-2'>
                <div className='text-4xl font-bold'>Kay says:</div>
                <Copy_Text AI_Text={props.coachingText} />
                {/* Use the new component, passing the responseId */}
                <SaveResponseButton responseId={props.responseId} />
            </div>
            {/* Removed the error display div, it's inside SaveResponseButton now */}
            <article className="prose" aria-live="polite">
                <ReactMarkdown children={props.coachingText} remarkPlugins={[remarkGfm]} />
            </article>
        </section>
    )
}