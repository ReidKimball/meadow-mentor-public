import { Button } from "@mui/material"
import { ChefHat } from "lucide-react"

export default function IngredientsList(props) {

    // adds ingredients to a list by going through each item in an array
    const ingredientsEl = props.ingredients.map(ingredient => (
        <li key={ingredient}>{ingredient}</li>
    ))


    return (
        <>
            {
                <section className="prose prose-gray max-w-none">
                {/* <section className="max-w-none"> */}
                    <h2>Ingredients on hand ({props.ingredients.length}/4):</h2>
                    <ul className='ingredients-list' aria-live='polite'>{ingredientsEl}</ul>
                    {props.ingredients.length > 3 && <div className='get-recipe-container'>
                        <div ref={props.ref}> {/* received from Recipe_Service.jsx as a prop named ref. the ref= is a special propery of the div tag */}
                            <h3>Ready for a recipe?</h3>
                            <p>Generate a recipe from your list of ingredients.</p>
                        </div>
                        <Button disabled={props.formDisabled} variant='contained' startIcon={<ChefHat />} size='large' className="w-64 cta-button bg-blue-800 shadow-sm hover:shadow-md" onClick={() => props.getClaudeRecipe()}>Get Recipe</Button> {/* don't forget the () at end of function to call it */}
                        
                    </div>}
                </section>
            }
        </>
    )
}