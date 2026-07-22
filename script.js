// --- DATA LAYER ---
function getUsers() { const data = localStorage.getItem('shopkeeper_users'); return data ? JSON.parse(data) : []; }
function saveUsers(users) { localStorage.setItem('shopkeeper_users', JSON.stringify(users)); }
function getCurrentUser() { const userData = sessionStorage.getItem('loggedInUser'); if (!userData) { window.location.href = 'login.html'; return null; } return JSON.parse(userData); }
function getProducts() { const user = getCurrentUser(); if (!user) return []; const allData = localStorage.getItem('shopkeeper_products'); const allProducts = allData ? JSON.parse(allData) : []; return allProducts.filter(p => p.userId === user.id); }
function saveProducts(products) { const user = getCurrentUser(); if (!user) return; const allData = localStorage.getItem('shopkeeper_products'); let allProducts = allData ? JSON.parse(allData) : []; allProducts = allProducts.filter(p => p.userId !== user.id); allProducts = allProducts.concat(products.map(p => ({ ...p, userId: user.id }))); localStorage.setItem('shopkeeper_products', JSON.stringify(allProducts)); }
function getTransactions() { const user = getCurrentUser(); if (!user) return []; const allData = localStorage.getItem('shopkeeper_transactions'); const allTransactions = allData ? JSON.parse(allData) : []; return allTransactions.filter(t => t.userId === user.id); }
function saveTransactions(transactions) { const user = getCurrentUser(); if (!user) return; const allData = localStorage.getItem('shopkeeper_transactions'); let allTransactions = allData ? JSON.parse(allData) : []; allTransactions = allTransactions.filter(t => t.userId !== user.id); allTransactions = allTransactions.concat(transactions.map(t => ({ ...t, userId: user.id }))); localStorage.setItem('shopkeeper_transactions', JSON.stringify(allTransactions)); }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }
function getTodayStr() { return new Date().toISOString().split('T')[0]; }

let isEditorUnlocked = false;

// --- PERMISSIONS & UI SETUP ---
function checkPermissions() {
    const user = getCurrentUser();
    const isOwner = user && user.role === 'owner';
    document.getElementById('dashboardLinkContainer').style.display = isOwner ? 'flex' : 'none';
    document.getElementById('userLabel').textContent = `👤 ${user.name} (${user.role})`;

    // Populate active seller dropdown with employees
    const sellerSelect = document.getElementById('activeSeller');
    if (sellerSelect) {
        const allUsers = getUsers();
        const employees = allUsers.filter(u => u.role === 'employee');
        sellerSelect.innerHTML = employees.map(emp => `<option value="${emp.name}">${emp.name}</option>`).join('');
        if (employees.length === 0) {
            sellerSelect.innerHTML = '<option value="">No employees</option>';
        }
    }
}

function toggleLock() {
    // This function still exists for owners to lock/unlock the terminal.
    // But we've removed the UI button from index.html; owners can still call it from console if needed.
    // Or you can keep the button in the dashboard. We'll leave the function, but the lock button
    // is now on the dashboard page (handled separately).
}

function handleLogout() {
    if (confirm("Logout?")) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    }
}

// --- PRODUCT OPERATIONS (used by both index.html and dashboard.html) ---
function sellProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product || product.stockQuantity <= 0) {
        alert("Out of stock!");
        return;
    }
    product.stockQuantity -= 1;
    const transactions = getTransactions();
    const profit = product.sellingPrice - product.costPrice;
    const activeSeller = document.getElementById('activeSeller')?.value || 'Owner';
    transactions.push({
        id: generateId(),
        productId: product.id,
        type: 'sale',
        quantity: 1,
        totalAmount: product.sellingPrice,
        profit: profit,
        seller: activeSeller,
        timestamp: new Date().toISOString()
    });
    saveProducts(products);
    saveTransactions(transactions);
    renderApp();
}

function restockProduct(productId) {
    if (getCurrentUser().role !== 'owner') {
        alert("Only the owner can restock!");
        return;
    }
    const qty = parseInt(prompt("How many units to add?"));
    if (isNaN(qty) || qty <= 0) return;
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    product.stockQuantity += qty;
    const transactions = getTransactions();
    transactions.push({
        id: generateId(),
        productId: product.id,
        type: 'restock',
        quantity: qty,
        totalAmount: 0,
        profit: 0,
        seller: 'Owner',
        timestamp: new Date().toISOString()
    });
    saveProducts(products);
    saveTransactions(transactions);
    renderApp();
}

function returnProduct(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const transactions = getTransactions();
    const today = getTodayStr();
    const todaysSales = transactions.filter(t => t.productId === productId && t.type === 'sale' && t.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (todaysSales.length === 0) {
        alert("No sales found for today.");
        return;
    }
    const latestSale = todaysSales[0];
    if (!confirm(`Void sale of 1 unit of "${product.name}"?`)) return;
    product.stockQuantity += latestSale.quantity;
    transactions.push({
        id: generateId(),
        productId: product.id,
        type: 'return',
        quantity: -latestSale.quantity,
        totalAmount: -latestSale.totalAmount,
        profit: -latestSale.profit,
        seller: 'Owner',
        timestamp: new Date().toISOString()
    });
    saveProducts(products);
    saveTransactions(transactions);
    renderApp();
    alert("✅ Sale voided!");
}

// --- RENDER ---
function renderApp() {
    renderSummary();
    renderProductList();
    checkPermissions();
}

function renderSummary() {
    const products = getProducts();
    const transactions = getTransactions();
    const today = getTodayStr();
    let salesCount = 0, profitToday = 0;
    transactions.forEach(t => {
        if (t.timestamp.startsWith(today)) {
            salesCount += t.quantity;
            profitToday += t.profit;
        }
    });
    const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0).length;
    const outOfStock = products.filter(p => p.stockQuantity === 0).length;
    document.getElementById('salesCount').textContent = salesCount;
    document.getElementById('profitToday').textContent = `$${profitToday.toFixed(2)}`;
    document.getElementById('lowStockCount').textContent = lowStockCount + outOfStock;
}

function renderProductList() {
    const container = document.getElementById('productList');
    const products = getProducts();
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery));
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>${products.length === 0 ? "No products yet." : "No products found."}</p></div>`;
        return;
    }
    let html = '';
    filtered.forEach(p => {
        let badgeClass = 'stock-high', badgeText = 'In Stock';
        if (p.stockQuantity === 0) { badgeClass = 'stock-out'; badgeText = 'Out of Stock'; }
        else if (p.stockQuantity <= p.lowStockThreshold) { badgeClass = 'stock-low'; badgeText = 'Low Stock'; }
        let actionButtons = `<button class="action-btn btn-sell" onclick="sellProduct('${p.id}')" title="Sell 1 unit">−</button>`;
        if (getCurrentUser().role === 'owner') {
            actionButtons += `<button class="action-btn btn-restock" onclick="restockProduct('${p.id}')" title="Restock">+</button>`;
        }
        actionButtons += `<button class="action-btn btn-return" onclick="returnProduct('${p.id}')" title="Void Return">↩</button>`;
        html += `<div class="product-card"><div class="product-info"><div class="product-name">${p.name}</div><div class="product-price">Cost: $${p.costPrice.toFixed(2)} | Sell: $${p.sellingPrice.toFixed(2)}</div></div><div class="product-actions"><span class="stock-badge ${badgeClass}">${badgeText} (${p.stockQuantity})</span>${actionButtons}</div></div>`;
    });
    container.innerHTML = html;
}

// --- EXPORT ---
function exportCSV() {
    const products = getProducts();
    if (products.length === 0) { alert("No products to export."); return; }
    let csv = "Product Name,Cost Price,Selling Price,Stock\n";
    products.forEach(p => { csv += `${p.name},${p.costPrice},${p.sellingPrice},${p.stockQuantity}\n`; });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ShopBox_Inventory_Report.csv'; a.click();
}

// --- RESET ---
function resetDemo() {
    if (confirm("Reset current user's products?")) {
        const products = getProducts();
        const transactions = getTransactions();
        products.length = 0; transactions.length = 0;
        saveProducts(products);
        saveTransactions(transactions);
        const sampleProducts = [
            { id: generateId(), name: 'Maize Meal', costPrice: 2.00, sellingPrice: 3.00, stockQuantity: 24, lowStockThreshold: 10 },
            { id: generateId(), name: 'Cooking Oil', costPrice: 2.50, sellingPrice: 3.50, stockQuantity: 8, lowStockThreshold: 10 },
            { id: generateId(), name: 'Salt', costPrice: 0.30, sellingPrice: 0.50, stockQuantity: 0, lowStockThreshold: 10 }
        ];
        saveProducts(sampleProducts);
        renderApp();
    }
}

// --- INIT ---
if (getProducts().length === 0) resetDemo(); else renderApp();
document.getElementById('searchInput')?.addEventListener('input', renderProductList);