var notyf = new Notyf();

window.importedJSON = null;

window.addEventListener("DOMContentLoaded", () => {
    const items = window.localStorage.getItem("existingItems");
    if (items) {
        window.importedJSON = JSON.parse(items);
        document.getElementById("noItems").classList.remove("d-block");
        document.getElementById("noItems").classList.add("d-none");
    } else {
        window.importedJSON = null;
        document.getElementById("noItems").classList.remove("d-none");
        document.getElementById("noItems").classList.add("d-block");
    }
});

window.handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/json") {
        const reader = new FileReader();
        reader.onload = function(e) {
            const jsonContent = e.target.result;
            window.uploadExportJSON(jsonContent);
        };
        reader.onerror = function() {
            notyf.error("Error reading file");
        };
        reader.readAsText(file);
    } else {
        notyf.error("Please upload a valid JSON file");
    }
};

window.uploadExportJSON = (jsonContent) => {
    try {
        const parsedContent = JSON.parse(jsonContent);
        const items = parsedContent.items || parsedContent.ingredients;
        const recipes = parsedContent.recipes || [];

        window.localStorage.setItem("importedFile", jsonContent);
        window.localStorage.setItem("existingItems", JSON.stringify(items));
        window.localStorage.setItem("recipes", JSON.stringify(recipes));
        notyf.success("File uploaded successfully");
    } catch (error) {
        notyf.error("Error parsing JSON file");
        console.error("Error parsing JSON file:", error);
    }
};

const parseLines = (text) => {
    let ingredients = [];
    let directions = [];
    let lines = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);

    const lastLine = lines[lines.length - 1];
    if (lastLine && !lastLine.includes('.') && (lastLine.split(' ').length === 2 || lastLine.split(' ').length === 3)) {
        lines.pop();
    }

    lines.forEach((line) => {
        if (/^\d+(\.\d+)?\s*[a-zA-Z]+|[¼½¾⅓⅔⅛⅜⅝⅞]\s*[a-zA-Z]+/.test(line)) {
            ingredients.push(line);
        } else {
            directions.push(line);
        }
    });

    return { ingredients, directions };
};

const processIngredients = (ingredients) => {
    const existingItems = JSON.parse(window.localStorage.getItem("existingItems"));
    if (!existingItems) {
        notyf.error("No existing items found in local storage.");
        return ingredients.map(ingredient => ({
            description: "",
            name: ingredient,
            optional: false
        }));
    }

    const processedIngredients = ingredients.map((ingredient) => {
        // Split the ingredient into quantity and name, including fractions
        const match = ingredient.match(/^(\d+(\.\d+)?\s*[a-zA-Z]+|[¼½¾⅓⅔⅛⅜⅝⅞]\s*[a-zA-Z]+)\s+(.*)$/);
        let quantity = "";
        let name = ingredient;

        if (match) {
            quantity = match[1];
            name = match[3];
        }

        name = name.replace(/\(.*?\)/g, '').trim();
        console.log(`Processing ingredient: ${name}`); // Debugging log
        const existingItem = existingItems.find(item => item.name.toLowerCase() === name.toLowerCase());
        if (existingItem) {
            console.log(`Matched with existing item: ${existingItem.name}`); // Debugging log
            name = existingItem.name;
        }

        return {
            description: existingItem ? quantity : "",
            name: name,
            optional: false
        };
    });

    return processedIngredients;
};

const parseRecipeJSON = (recipeJSON) => {
    const parsedRecipe = JSON.parse(recipeJSON);
    const ingredients = parsedRecipe.items || parsedRecipe.ingredients;
    const directions = parsedRecipe.description.split('\n').filter(line => line.trim() !== "");

    return {
        name: parsedRecipe.name || "",
        photo: parsedRecipe.photo || "",
        source: parsedRecipe.source || "",
        tags: parsedRecipe.tags || [],
        time: parsedRecipe.time || "",
        yields: parsedRecipe.yields || "",
        prep_time: parsedRecipe.prep_time || "",
        cook_time: parsedRecipe.cook_time || "",
        ingredients: ingredients.map(item => ({
            description: item.description || "",
            name: item.name,
            optional: item.optional
        })),
        description: directions.join(" ")
    };
};

window.addRecipe = () => {
    let recipeText = document.getElementById("recipeInput").value;
    let { ingredients, directions } = parseLines(recipeText);
    ingredients = processIngredients(ingredients);
    let ingredientsToCategorize = ingredients.filter(ingredient => !ingredient.description);
    if (ingredientsToCategorize.length > 0) {
        const ul = document.getElementById("ingredientsToCategorize");
        ingredientsToCategorize.forEach((ingredient) => {
            const li = document.createElement("li");
            li.textContent = ingredient.name;
            ul.appendChild(li);
        });
    }

    const newRecipe = {
        name: document.querySelector("#recipeName").value || "",
        photo: document.querySelector("#recipePhoto").value || "",
        source: document.querySelector("#recipeSource").value || "",
        tags: [],
        time: document.querySelector("#recipeTime").value || 0,
        yields: document.querySelector("#recipeYields").value || 0,
        prep_time: document.querySelector("#recipePrepTime").value || 0,
        cook_time: document.querySelector("#recipeCookTime").value || 0,
        ingredients,
        description: directions.join(" ")
    };

    let recipes = JSON.parse(window.localStorage.getItem("recipes")) || [];
    recipes.push(newRecipe);
    window.localStorage.setItem("recipes", JSON.stringify(recipes));
};

window.exportJSON = () => {
    const items = window.localStorage.getItem("existingItems");
    const recipes = window.localStorage.getItem("recipes");

    const exportData = {
        items: items ? JSON.parse(items) : [],
        recipes: recipes ? JSON.parse(recipes) : []
    };

    const file = new Blob([JSON.stringify(exportData)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = "exportedItems.json";
    a.click();
    notyf.success("Items exported successfully");
};