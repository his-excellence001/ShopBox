// ==========================================
// 0. SUB0 / LINGOQL BACKEND INTEGRATION (Swappable Data Layer)
// ==========================================

// --- PLACEHOLDER FOR SUB0/LINGOQL BACKEND INTEGRATION ---
// For the hackathon demo, we use localStorage. In production, uncomment these:

/*
async function getProducts() {
    const res = await fetch('https://your-sub0-api.com/products', {
        headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('userToken') }
    });
    return res.json();
}

async function saveProducts(products) {
    await fetch('https://your-sub0-api.com/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
    });
}
*/


// ==========================================
// 1. DATA STORAGE & INIT (LocalStorage fallback)
// ==========================================

// Get products from localStorage or use default seed data
function getProducts() {
    const defaultProducts = [
        { id: "prod_001", name: "10kg Long Grain Rice", cost: 8.50, sell: 12.00, stock: 15 },
        { id: "prod_002", name: "5L Cooking Oil", cost: 6.00, sell: 9.50, stock: 4 },
        { id: "prod_003", name: "1kg Iodized Salt", cost: 0.80, sell: 1.50, stock: 25 }
    ];
    const stored = localStorage.getItem("shopbox_products");
    if (!stored) {
        localStorage.setItem("shopbox_products", JSON.stringify(defaultProducts));
        return defaultProducts;
    }
    return JSON.parse(stored);
}

function saveProducts(products) {
    localStorage.setItem("shopbox_products", JSON.stringify(products));
}

// Get logged-in user details
function getCurrentUser() {
    const defaultUser = { username: "Owner", role: "owner" }; // Fallback default
    const session = localStorage.getItem("shopbox_session");
    return session ? JSON.parse(session) : defaultUser;
}

// Get system lock status
function getLockStatus() {
    const locked = localStorage.getItem("shopbox_locked");
    return locked === "true"; // Defaults to false if null
}

function setLockStatus(isLocked) {
    localStorage.setItem("shopbox_locked", isLocked ? "true" : "false");
}


// ==========================================
// 2. CORE OPERATIONS (Add, Restock, Sell, Delete, Export)
// ==========================================

// Add a brand-new product (Owner Only)
function handleAddProduct() {
    const name = document.getElementById("prodName").value.trim();
    const cost = parseFloat(document.getElementById("prodCost").value);
    const sell = parseFloat(document.getElementById("prodSell").value);
    const stock = parseInt(document.getElementById("prodStock").value);

    if (!name || isNaN(cost) || isNaN(sell) || isNaN(stock)) {
        alert("Please fill in all product details with valid numbers.");
        return;
    }

    const products = getProducts();
    const newProduct = {
        id: "prod_" + Date.now(),
        name: name,
        cost: cost,
        sell: sell,
        stock: stock
    };

    products.push(newProduct);
    saveProducts(products);
    closeModal();
    renderApp();
}

// Restock an existing product's inventory
function restockProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    
    if (product) {
        const amount = prompt(`How many units of "${product.name}" are you adding?`, "10");
        const qty = parseInt(amount);
        if (isNaN(qty) || qty <= 0) return;

        product.stock += qty;
        saveProducts(products);
        renderApp();
    }
}

// Register a sale
function sellProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);

    if (product) {
        if (product.stock <= 0) {
            alert(`"${product.name}" is out of stock!`);
            return;
        }

        product.stock -= 1;
        saveProducts(products);
        
        // Track sales statistics (Mock tracking for summary metrics)
        updateSalesMetrics(product.sell, product.sell - product.cost);
        renderApp();
    }
}

// Delete a product permanently (Owner Only)
function deleteProduct(productId) {
    const user = getCurrentUser();
    
    // Safety check: Only Owners have access to run this
    if (user.role !== 'owner') { 
        alert("Only the Owner can delete products."); 
        return; 
    }
    
    // Safety check: Avoid accidental clicks
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    
    let products = getProducts();
    products = products.filter(p => p.id !== productId);
    saveProducts(products);
    renderApp();
}

// ⭐ THE NEW UPGRADE: Export local products array as a clean CSV file
function exportCSV() {
    const products = getProducts();
    if (products.length === 0) { 
        alert("No products to export."); 
        return; 
    }

    // Set up table header rows
    let csv = "Product Name,Cost Price ($),Selling Price ($),Stock Level (Units)\n";
    
    // Loop through inventory list and clean up commas to avoid column break errors
    products.forEach(p => {
        const escapedName = p.name.replace(/,/g, ""); 
        csv += `${escapedName},${p.cost.toFixed(2)},${p.sell.toFixed(2)},${p.stock}\n`;
    });

    // Generate blob file and trigger direct system download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ShopBox_Inventory_Report.csv';
    a.click();
}


// ==========================================
// 3. LOCK & PERMISSIONS LOGIC
// ==========================================

function toggleLock() {
    const currentlyLocked = getLockStatus();
    
    if (currentlyLocked) {
        // Unlock attempt: Require verification
        const pin = prompt("Enter your Owner PIN to unlock modifications:");
        if (pin === "1234" || pin === "0000") { // Placeholder pins
            setLockStatus(false);
        } else {
            alert("Incorrect PIN! Action rejected.");
            return;
        }
    } else {
        // Lock instantly
        setLockStatus(true);
    }
    renderApp();
}

function handleLogout() {
    localStorage.removeItem("shopbox_session");
    window.location.href = "login.html";
}


// ==========================================
// 4. RENDER PIPELINE (Building the UI dynamically)
// ==========================================

function renderApp() {
    const user = getCurrentUser();
    const products = getProducts();
    const isLocked = getLockStatus();
    const query = document.getElementById("searchInput").value.toLowerCase();

    // Set User Identity Header label
    document.getElementById("userLabel").innerText = `${user.username} (${user.role.toUpperCase()})`;

    // Filter Products based on search bar
    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(query));

    // Render Product Cards Grid
    const listContainer = document.getElementById("productList");
    listContainer.innerHTML = "";

    filteredProducts.forEach(p => {
        const isLowStock = p.stock <= 5;
        const card = document.createElement("div");
        card.className = `product-card ${isLowStock ? "low-stock" : ""}`;

        card.innerHTML = `
            <div class="product-info">
                <h3>${p.name}</h3>
                <p class="price">Selling: <strong>$${p.sell.toFixed(2)}</strong> <span style="font-size: 0.8rem; color: #7f8c8d;">(Cost: $${p.cost.toFixed(2)})</span></p>
                <p class="stock-level ${isLowStock ? "text-orange" : ""}">
                    Stock remaining: <strong>${p.stock} units</strong>
                </p>
            </div>
            <div class="product-actions">
                <button class="action-btn btn-restock" onclick="restockProduct('${p.id}')">Restock</button>
                <button class="action-btn btn-sell" onclick="sellProduct('${p.id}')">Sell</button>
                
                <!-- The dynamically injected Delete button. Handled via JS roles -->
                <button class="action-btn btn-delete" id="deleteBtn-${p.id}" onclick="deleteProduct('${p.id}')" title="Delete Product">✕</button>
            </div>
        `;
        listContainer.appendChild(card);
    });

    // Handle Role-Based UI Element Displays
    const isOwner = user.role === "owner";

    // Show/Hide buttons depending on Owner role & Lock status
    document.getElementById("addProductBtn").style.display = (isOwner && !isLocked) ? "block" : "none";
    document.getElementById("addEmpBtn").style.display = (isOwner && !isLocked) ? "block" : "none";
    document.getElementById("lockBtn").style.display = isOwner ? "block" : "none";
    document.getElementById("dashboardLinkContainer").style.display = isOwner ? "flex" : "none";

    // Update Owner's Lock Button text & colors dynamically
    const lockBtn = document.getElementById("lockBtn");
    if (isLocked) {
        lockBtn.innerText = "🔒 Locked";
        lockBtn.className = "btn btn-warning";
    } else {
        lockBtn.innerText = "🔓 Unlocked";
        lockBtn.className = "btn btn-success";
    }

    // Toggle delete button visibilities based on Owner role and current Lock status
    products.forEach(p => {
        const deleteBtn = document.getElementById(`deleteBtn-${p.id}`);
        if (deleteBtn) {
            deleteBtn.style.display = (isOwner && !isLocked) ? "inline-block" : "none";
        }
    });

    // Update Dashboard Metrics Counters
    calculateSummaryMetrics(products);
}


// ==========================================
// 5. HELPER METRICS ENGINE (Mocking Data)
// ==========================================

function updateSalesMetrics(saleVal, profitVal) {
    let todaySalesCount = parseInt(localStorage.getItem("sales_count") || "0");
    let todayProfit = parseFloat(localStorage.getItem("profit_today") || "0");

    todaySalesCount += 1;
    todayProfit += profitVal;

    localStorage.setItem("sales_count", todaySalesCount);
    localStorage.setItem("profit_today", todayProfit);
}

function calculateSummaryMetrics(products) {
    const todaySalesCount = localStorage.getItem("sales_count") || "0";
    const todayProfit = parseFloat(localStorage.getItem("profit_today") || "0");
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    document.getElementById("salesCount").innerText = todaySalesCount;
    document.getElementById("profitToday").innerText = `$${todayProfit.toFixed(2)}`;
    
    const lowStockLabel = document.getElementById("lowStockCount");
    lowStockLabel.innerText = lowStockCount;
    if (lowStockCount > 0) {
        lowStockLabel.className = "value orange";
    } else {
        lowStockLabel.className = "value";
    }
}

function resetDemo() {
    if (confirm("Reset local database to default settings?")) {
        localStorage.removeItem("shopbox_products");
        localStorage.removeItem("sales_count");
        localStorage.removeItem("profit_today");
        localStorage.removeItem("shopbox_locked");
        setLockStatus(false);
        renderApp();
    }
}


// ==========================================
// 6. INITIAL EVENT LISTENERS
// ==========================================

window.onload = function() {
    renderApp();
    
    // Live Search Filter Listener
    document.getElementById("searchInput").addEventListener("input", renderApp);
};

// Modal toggling functions
function openModal() { document.getElementById("addProductModal").classList.add("active"); }
function closeModal() { document.getElementById("addProductModal").classList.remove("active"); }
function openEmpModal() { document.getElementById("addEmpModal").classList.add("active"); }
function closeEmpModal() { document.getElementById("addEmpModal").classList.remove("active"); }