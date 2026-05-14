import AIService from './api/AIService.jsx'
import { Utensils } from 'lucide-react'

export default function MealAnalysis_Service() {
    const tryQuestionButtons = [
        { label: "Waffles", value: "waffles" },
        { label: "Pizza", value: "pizza" },
        { label: "Breakfast Burrito with Eggs and Cheese", value: "breakfast burrito with eggs and cheese" }
    ]

    return (
        <AIService
            title="Analyze Meal"
            description="Upload an image of your meal to analyze its SCD compliance."
            apiService='analyzeMeal'
            apiEndpoint="/api/analyze_meal"
            fileInputName="mealImage"
            uploadButtonText="Upload your meal image below"
            submitButtonText="Analyze Meal"
            submitButtonIcon={<Utensils />}
            //tryQuestionButtons={tryQuestionButtons}
            resultTitle="Kay says:"
        />
    )
}
