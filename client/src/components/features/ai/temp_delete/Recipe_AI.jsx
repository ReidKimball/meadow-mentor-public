import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm' // see more at: https://www.npmjs.com/package/react-markdown/v/8.0.6#use
import Copy_Text from './Copy_Text'
import SaveResponseButton from './SaveResponseButton.jsx'

export default function Recipe_AI(props) {

    return (
        <section className="suggested-recipe-container max-w-none" aria-live='polite'>
            <div className='py-8 flex items-center gap-2'>
                <div className='text-4xl font-bold'>Kay says:</div>
                <Copy_Text AI_Text={props.recipeText} />
                {/* Use the new component, passing the responseId */}
                <SaveResponseButton responseId={props.responseId} />
            </div>
            <article className="prose" aria-live="polite">
                <ReactMarkdown children={props.recipeText} remarkPlugins={[remarkGfm]} />
            </article>
        </section>
    )
}