
const CURRENCY = "৳"; 
let cart = [];
let currentCategoryId = "";

// Elements
const categoriesEl = document.getElementById("categories");
const cardsEl = document.getElementById("tree-cards");
const spinnerEl = document.getElementById("cards-spinner");
const cartListEl = document.getElementById("cart-list");
const totalEl = document.getElementById("total");

// -----------------------------
// Utilities
// -----------------------------
const showSpinner = (flag) => {
  spinnerEl.classList.toggle("hidden", !flag);
  cardsEl.classList.toggle("hidden", flag);
};

const parseDataArray = (json) => {
  // Defensive: support various shapes from the API
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.plants)) return json.plants;
  if (Array.isArray(json?.items)) return json.items;
  return [];
};

const parseSingle = (json) => {
  // Plant detail could be under different keys
  return json?.data || json?.plant || json?.item || json;
};

const money = (num) => `${CURRENCY}${Number(num || 0)}`;

// -----------------------------
// Categories
// -----------------------------
const loadCategories = async () => {
  // Add a static all trees first
  renderCategoryButtons([{ id: "", name: "All Trees" }], true);

  try {
    const res = await fetch("https://openapi.programming-hero.com/api/categories");
    const jsonn = await res.json();
    console.log(jsonn.categories
)
    const cats = parseDataArray(jsonn.categories).map((c) => ({
      id: c.id ?? c.category_id ?? c._id ?? "",
      name: c.category ?? c.category_name ?? c.name ?? "Unnamed",
    }));
    renderCategoryButtons(cats);
  } catch (e) {
    console.error("Category load failed:", e);
  }
};

const renderCategoryButtons = (cats, replace = false) => {
  if (replace) categoriesEl.innerHTML = "";
  cats.forEach((cat, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = cat.id;
    btn.className =
      "btn btn-sm w-full md:btn-md normal-case mr-2 md:mr-0 md:mb-2 rounded-lg " +
      "bg-green-200 hover:bg-green-300 text-green-900 border-none";
    btn.textContent = cat.name;
    btn.addEventListener("click", () => onCategoryClick(cat.id, btn));
    categoriesEl.appendChild(btn);

    // make all trees active initially
    if (replace && idx === 0) setActiveButton(btn);
  });
};

const setActiveButton = (btn) => {
  // remove old
  [...categoriesEl.children].forEach((b) =>
    b.classList.remove("bg-green-600", "text-white")
  );
  // set new
  btn.classList.add("bg-green-600", "text-white");
};

const onCategoryClick = (id, btn) => {
  currentCategoryId = id || "";
  setActiveButton(btn);
  loadTrees(currentCategoryId);
};


// Trees Cards

const loadTrees = async (categoryId = "") => {
  showSpinner(true);
  try {
    const url = categoryId
      ? `https://openapi.programming-hero.com/api/category/${categoryId}`
      : "https://openapi.programming-hero.com/api/plants";

    const res = await fetch(url);
    const json = await res.json();
    const trees = parseDataArray(json);

    renderCards(trees);
  } catch (e) {
    console.error("Tree load failed:", e);
    cardsEl.innerHTML =
      '<div class="col-span-full text-center text-red-600">Failed to load trees.</div>';
  } finally {
    showSpinner(false);
  }
};

const renderCards = (trees) => {
  cardsEl.innerHTML = "";
  trees.forEach((tree) => {
    const {
      id = tree._id || tree.plant_id || "",
      name = "Unnamed Tree",
      image = "https://placehold.co/600x400?text=Tree",
      short_description = tree.description || "—",
      category = tree.category_name || tree.type || "—",
      price = tree.price ?? 0,
    } = tree;

    const card = document.createElement("div");
    card.className = "bg-white rounded-2xl shadow p-4 flex flex-col";

    card.innerHTML = `
      <div class="w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
        <img src="${image}" alt="${name}" class="w-full h-full object-cover" />
      </div>
      <h3 class="text-lg font-bold mt-3 cursor-pointer text-green-700 hover:underline">${name}</h3>
      <p class="text-sm mt-1">${short_description}</p>
      <div class="flex items-center justify-between mt-3">
        <span class="badge badge-ghost">${category}</span>
        <span class="font-semibold">${money(price)}</span>
      </div>
      <button class="btn mt-3 bg-green-600 hover:bg-green-500 text-white border-none">Add to Cart</button>
    `;

    // modal open
    card.querySelector("h3").addEventListener("click", () => showModal(id));

    // add to cart
    card.querySelector("button").addEventListener("click", () =>
      addToCart({ id, name, price })
    );

    cardsEl.appendChild(card);
  });

  if (!trees.length) {
    cardsEl.innerHTML =
      '<div class="col-span-full text-center">No trees found in this category.</div>';
  }
};


// Modal

const showModal = async (id) => {
  try {
    const res = await fetch(`https://openapi.programming-hero.com/api/plant/${id}`);
    const json = await res.json();
    const plant = json.plants;

    console.log(plant);

   
    const imgEl = document.getElementById("modal-img");
    imgEl.src = plant?.image || "https://via.placeholder.com/200";
    imgEl.alt = plant?.name || "Tree Image";

    document.getElementById("modal-title").innerText =
      plant?.name || "Tree Details";
    document.getElementById("modal-desc").innerText =
      plant?.description || "No description available.";
    document.getElementById("modal-price").innerText = money(plant?.price || 0);

    document.getElementById("tree-modal").showModal();
  } catch (e) {
    console.error("Modal load failed:", e);
  }
};

// Cart

const addToCart = (item) => {
  cart.push(item);
  renderCart();
};

const removeFromCart = (idx) => {
  cart.splice(idx, 1);
  renderCart();
};

const renderCart = () => {
  cartListEl.innerHTML = "";
  cart.forEach((it, i) => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center bg-white rounded-md px-3 py-2";
    li.innerHTML = `<div class="flex flex-col">
      <span class="font-bold">${it.name}</span>
      <span class="font-bold">৳ ${it.price}</span>
      </div>
      <button class=" text-lg" aria-label="Remove"><i class="fa-solid fa-circle-xmark"></i></button>
    `;
    li.querySelector("button").addEventListener("click", () => removeFromCart(i));
    cartListEl.appendChild(li);
  });

  const total = cart.reduce((sum, it) => sum + Number(it.price || 0), 0);
  totalEl.textContent = money(total);
};


// Init

loadCategories();
loadTrees(); 