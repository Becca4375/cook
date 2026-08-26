// ==========================================
// 1. Initial State (With LocalStorage Fallback)
// ==========================================
const defaultRecipes = [
  {
    id: 1,
    title: "Classic Avocado Toast",
    image: "https://images.unsplash.com/photo-1588137378633-dea1336ce1e2?w=500",
    ingredients: [
      "2 slices whole wheat bread",
      "1 ripe avocado",
      "Salt and black pepper to taste",
      "Red pepper flakes"
    ],
    preparation: [
      "Toast the bread slices until golden.",
      "Mash avocado with salt and pepper in a bowl.",
      "Spread mashed avocado onto toast.",
      "Top with red pepper flakes."
    ]
  }
];

// Load recipes from browser memory, or fall back to default array
let recipes = JSON.parse(localStorage.getItem("recipeBoxData")) || defaultRecipes;
let editingRecipeId = null;

// ==========================================
// 2. DOM Elements
// ==========================================
const grid = document.getElementById("recipe-grid");
const addModal = document.getElementById("add-modal");
const viewModal = document.getElementById("view-modal");
const recipeForm = document.getElementById("recipe-form");
const formHeader = document.getElementById("form-header");

const openAddModalBtn = document.getElementById("open-add-modal");
const closeAddModalBtn = document.getElementById("close-add-modal");
const closeViewModalBtn = document.getElementById("close-view-modal");

const editRecipeBtn = document.getElementById("edit-recipe-btn");
const deleteRecipeBtn = document.getElementById("delete-recipe-btn");

const fileInput = document.getElementById("image-file");
const urlInput = document.getElementById("image-url");
const formImagePreview = document.getElementById("form-image-preview");

// ==========================================
// 3. Helpers
// ==========================================
function saveToLocalStorage() {
  localStorage.setItem("recipeBoxData", JSON.stringify(recipes));
}

function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function updateImagePreview(src) {
  if (src) {
    formImagePreview.src = src;
    formImagePreview.classList.remove("preview-hidden");
  } else {
    formImagePreview.src = "";
    formImagePreview.classList.add("preview-hidden");
  }
}

// ==========================================
// 4. Render Functions
// ==========================================
function renderRecipes() {
  grid.innerHTML = "";

  if (recipes.length === 0) {
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #ad1457;">No recipes yet. Click '+ Add Recipe' to create one!</p>`;
    return;
  }

  recipes.forEach((recipe) => {
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500'">
      <h3>${recipe.title}</h3>
    `;
    card.addEventListener("click", () => openViewModal(recipe));
    grid.appendChild(card);
  });
}

function openViewModal(recipe) {
  const detailImg = document.getElementById("detail-img");
  detailImg.src = recipe.image && recipe.image.trim() !== "" 
    ? recipe.image 
    : "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500";

  detailImg.onerror = function () {
    this.onerror = null;
    this.src = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500";
  };

  document.getElementById("detail-title").textContent = recipe.title;

  const ingList = document.getElementById("detail-ingredients");
  ingList.innerHTML = recipe.ingredients.map((ing) => `<li>${ing}</li>`).join("");

  const prepList = document.getElementById("detail-preparation");
  prepList.innerHTML = recipe.preparation.map((step) => `<li>${step}</li>`).join("");

  deleteRecipeBtn.onclick = () => handleDeleteRecipe(recipe.id);
  editRecipeBtn.onclick = () => openEditModal(recipe);

  viewModal.showModal();
}

function openEditModal(recipe) {
  editingRecipeId = recipe.id;
  formHeader.textContent = "Edit Recipe";

  document.getElementById("title").value = recipe.title;
  document.getElementById("ingredients").value = recipe.ingredients.join("\n");
  document.getElementById("preparation").value = recipe.preparation.join("\n");

  fileInput.value = "";
  if (recipe.image.startsWith("data:")) {
    urlInput.value = "";
  } else {
    urlInput.value = recipe.image;
  }

  updateImagePreview(recipe.image);

  viewModal.close();
  addModal.showModal();
}

function handleDeleteRecipe(id) {
  if (confirm("Are you sure you want to delete this recipe?")) {
    recipes = recipes.filter((r) => r.id !== id);
    saveToLocalStorage(); // Save changes after deletion
    renderRecipes();
    viewModal.close();
  }
}

// ==========================================
// 5. Dynamic Image Preview Listeners
// ==========================================
fileInput.addEventListener("change", async () => {
  if (fileInput.files && fileInput.files[0]) {
    urlInput.value = "";
    const base64 = await getBase64(fileInput.files[0]);
    updateImagePreview(base64);
  }
});

urlInput.addEventListener("input", () => {
  if (urlInput.value.trim() !== "") {
    fileInput.value = "";
    updateImagePreview(urlInput.value.trim());
  }
});

// ==========================================
// 6. Form Submission
// ==========================================
recipeForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let imageSrc = "";
  const currentRecipe = recipes.find((r) => r.id === editingRecipeId);

  if (fileInput.files && fileInput.files[0]) {
    imageSrc = await getBase64(fileInput.files[0]);
  } else if (urlInput.value.trim() !== "") {
    imageSrc = urlInput.value.trim();
  } else if (currentRecipe) {
    imageSrc = currentRecipe.image;
  } else {
    imageSrc = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=500";
  }

  const recipeData = {
    title: document.getElementById("title").value.trim(),
    image: imageSrc,
    ingredients: document
      .getElementById("ingredients")
      .value.split("\n")
      .map((i) => i.trim())
      .filter(Boolean),
    preparation: document
      .getElementById("preparation")
      .value.split("\n")
      .map((p) => p.trim())
      .filter(Boolean)
  };

  if (editingRecipeId) {
    recipes = recipes.map((r) =>
      r.id === editingRecipeId ? { ...r, ...recipeData } : r
    );
    editingRecipeId = null;
  } else {
    recipes.unshift({ id: Date.now(), ...recipeData });
  }

  saveToLocalStorage(); // Save changes after adding/editing
  renderRecipes();
  recipeForm.reset();
  updateImagePreview("");
  addModal.close();
});

// ==========================================
// 7. Modal Controls
// ==========================================
openAddModalBtn.addEventListener("click", () => {
  editingRecipeId = null;
  formHeader.textContent = "New Recipe";
  recipeForm.reset();
  updateImagePreview("");
  addModal.showModal();
});

closeAddModalBtn.addEventListener("click", () => {
  recipeForm.reset();
  updateImagePreview("");
  addModal.close();
});

closeViewModalBtn.addEventListener("click", () => viewModal.close());

[addModal, viewModal].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    const dialogBounds = modal.getBoundingClientRect();
    if (
      e.clientX < dialogBounds.left ||
      e.clientX > dialogBounds.right ||
      e.clientY < dialogBounds.top ||
      e.clientY > dialogBounds.bottom
    ) {
      modal.close();
    }
  });
});

// ==========================================
// 8. App Init
// ==========================================
renderRecipes();