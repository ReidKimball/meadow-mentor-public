import React, { useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Button } from '@mui/material'
import { Upload } from 'lucide-react'
import { LoadingSpinner } from '../LoadingSpinner.jsx'
import Copy_Text from '../Copy_Text'
import useAIService from '../../../hooks/useAIService.js'// Import the hook


export default function AIService({
    title,
    description,
    apiService,
    apiEndpoint,
    fileInputName,
    uploadButtonText,
    submitButtonText,
    submitButtonIcon,
    tryQuestionButtons, // Array of { label, value } objects
    resultTitle = "AI Response:", // Default result title
}) {
    const {
        resultText,
        formDisabled,
        isAILoading,
        uploadedImage,
        handleFileUpload,
        disableUserForm,
        error,
        setResultText,
        remainingUses,
        resetTime
    } = useAIService(apiService, apiEndpoint, fileInputName)

    //console.log(`(AIService.jsx) - fileInputName = ${fileInputName}`)

    const resultSection = useRef(null)

    useEffect(() => {
        if (resultText !== '' && resultSection.current !== null) {
            resultSection.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [resultText])

    function tryQuestion(value) {
        const formData = new FormData()
        formData.set(fileInputName, value) // Use fileInputName consistently
        disableUserForm(formData)
    }

    // Clear result text
    function clearResult() {
        setResultText('')
    }

    const formatResetTime = (seconds) => {
        // Create date for seconds from now
        const resetDate = new Date(Date.now() + (seconds * 1000))

        // Format to: Tuesday, March 3rd at 10:00 PM
        return resetDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    return (
        <>
            <main>
                {isAILoading && <div className='loading-spinner'><LoadingSpinner /></div>}

                <div className='ai-service-container'>
                    <div className='text-3xl'><h1>{title}</h1></div>
                    <p>{description}</p>

                    <form action={disableUserForm} className="add-ingredient-form">
                        <fieldset disabled={formDisabled}>
                            <div className={`text-lg text-center bg-red-200 rounded-lg m-2 p-2 ${remainingUses < 2 ? 'text-red-500' : ''}`}>{remainingUses} uses of this AI service remaining until it resets on: {formatResetTime(resetTime)} Need more uses? Upgrade to Premium!</div>
                            <div className='flex flex-row gap-4'>
                                <Upload className='w-8 h-8 text-gray-500 mb-2' />
                                <span className='text-lg text-gray-700'>{uploadButtonText}</span>
                            </div>
                            <label htmlFor={fileInputName} className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                                <input
                                    type='file'
                                    className='h-full w-full'
                                    name={fileInputName}
                                    accept='image/*, application/pdf'
                                    onChange={handleFileUpload}
                                />
                            </label>

                            {error && <div className="error-message">{error}</div>} {/* Display error */}
                            <Button disabled={formDisabled} type='submit' variant='contained' startIcon={submitButtonIcon} size='large'>{submitButtonText}</Button>
                            <Button onClick={clearResult} variant='outlined' size='large'>Start New Chat</Button>
                        </fieldset>
                    </form>

                    {uploadedImage && (
                        <div className="image-container">
                            <img
                                src={uploadedImage}
                                alt="Uploaded"
                                style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                            />
                        </div>
                    )}

                    {tryQuestionButtons && tryQuestionButtons.length > 0 && (
                        <div className='text-4xl p-8 bg-blue-200 rounded-md'>
                            <div className='text-4xl'>Try these:</div>
                            <div className='gap-8 p-8 flex flex-col flex-wrap content-center md:flex-row md:justify-center'>
                                {tryQuestionButtons.map((button, index) => (
                                    <Button key={index} variant='outlined' className="cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => tryQuestion(button.value)}>
                                        {button.label}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}

                    {resultText && (
                        // <section className="suggested-recipe-container prose prose-slate max-w-none" aria-live='polite'>
                        <section className="suggested-recipe-container max-w-none" aria-live='polite'>
                            <div ref={resultSection}>
                                <div className='py-8 flex items-center gap-2'>
                                    <div className='text-4xl font-bold'>{resultTitle}</div>
                                    <Copy_Text AI_Text={resultText} />
                                </div>
                            </div>
                            {/* <article className="prose prose-headings:font-bold prose-p:my-4 prose-ul:list-disc prose-ol:list-decimal" aria-live="polite"> */}
                            <article className="prose" aria-live="polite">
                                <ReactMarkdown children={resultText} remarkPlugins={[remarkGfm]} />
                            </article>
                        </section>
                    )}
                </div>
            </main>
        </>
    )
}
