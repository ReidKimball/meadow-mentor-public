import { CircleCheck } from 'lucide-react'

export default function About() {
    return (
        <>
            <main className="p-8">                
                <div className="flex text-6xl md:max-lg:text-3xl text-center leading-normal justify-center items-center gap-8 "><CircleCheck size='96px' color='green'/>Thank You for your payment</div>
                    <p className='text-center text-2xl py-8 justify-center'>A payment to REID KIMBALL will appear on your statement.</p>
            </main>
        </>
    )
}
