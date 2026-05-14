import AIService from './api/AIService.jsx'
import { Stethoscope } from 'lucide-react'

export default function MedicalReportAnalysis_Service() {
    const tryQuestionButtons = [
        { label: "Waffles", value: "waffles" },
        { label: "Pizza", value: "pizza" },
        { label: "Breakfast Burrito with Eggs and Cheese", value: "breakfast burrito with eggs and cheese" }
    ]

    return (
        <AIService
            title="Analyze Medical Report"
            description="Upload a PDF of your medical report to analyze its findings."
            apiService='analyzeDoctorReport'
            apiEndpoint="/api/analyze_medical_report"
            fileInputName="medicalReportPDF"
            uploadButtonText="Upload your medical report PDF below"
            submitButtonText="Analyze Medical Report"
            submitButtonIcon={<Stethoscope />}
            //tryQuestionButtons={tryQuestionButtons}
            resultTitle="Kay says:"
        />
    )
}
