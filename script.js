// ==========================================
// SHOPBOX CORE APPLICATION SCRIPT
// ==========================================

// --- STORAGE HELPER FUNCTIONS ---

function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function saveProducts(products) {
    localStorage.setItem('products', JSON.stringify(products));
}

function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

function saveTransactions(transactions) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// --- CORE PRODUCT MANAGEMENT ---

function addProduct(name, costPrice, sellingPrice, stockQuantity) {
    const products = getProducts();
    const newProduct = {
        id: Date.now().toString(),
        name: name,
        costPrice: parseFloat(costPrice) || 0,
        price: parseFloat(sellingPrice) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        createdAt: new Date().toISOString()
    };
    products.push(newProduct);
    saveProducts(products);
    updateUI();
}

function recordSale(productId, quantity) {
    const products = getProducts();
    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
        alert("Product not found!");
        return;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (product.stockQuantity < qty) {
        alert(`Insufficient stock! Only ${product.stockQuantity} remaining.`);
        return;
    }

    // Deduct stock
    product.stockQuantity -= qty;
    saveProducts(products);

    // Record sale transaction
    const transactions = getTransactions();
    const transaction = {
        id: Date.now().toString(),
        productId: productId,
        productName: product.name,
        type: 'sale',
        quantity: qty,
        amount: product.price * qty,
        profit: (product.price - product.costPrice) * qty,
        timestamp: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions(transactions);

    updateUI();
}

// --- CORRECTED RETURN PRODUCT FUNCTION ---

function returnProduct(productId) {
    const products = getProducts();
    const product = products.find(p => String(p.id) === String(productId));
    
    if (!product) {
        alert("Product not found.");
        return;
    }

    const transactions = getTransactions();
    const today = getTodayStr();

    // 1. Filter today's sale transactions for this product
    const todaysSales = transactions
        .filter(t => String(t.productId) === String(productId) && t.type === 'sale' && t.timestamp && t.timestamp.startsWith(today))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (todaysSales.length === 0) {
        alert(`No sales recorded today for "${product.name}".`);
        return;
    }

    const latestSale = todaysSales[0];

    if (!confirm(`Void sale of ${latestSale.quantity} unit(s) of "${product.name}"?`)) {
        return;
    }

    // 2. Restore inventory stock and save
    product.stockQuantity = (Number(product.stockQuantity) || 0) + Number(latestSale.quantity);
    saveProducts(products);

    // 3. Log a negative return transaction to fix daily totals and save
    const returnTransaction = {
        id: Date.now().toString(),
        productId: productId,
        productName: product.name,
        type: 'return',
        quantity: -Math.abs(latestSale.quantity),
        amount: -(Number(latestSale.amount) || (Number(product.price) * Number(latestSale.quantity))),
        profit: -(Number(latestSale.profit) || 0),
        timestamp: new Date().toISOString()
    };
    
    transactions.push(returnTransaction);
    saveTransactions(transactions);

    // 4. Update UI
    updateUI();
    alert(`Successfully voided sale for "${product.name}". Stock restored!`);
}

// --- UI REFRESH AND RENDER LOGIC ---

function renderProducts() {
    const productListEl = document.getElementById('product-list');
    if (!productListEl) return;

    const products = getProducts();
    productListEl.innerHTML = '';

    if (products.length === 0) {
        productListEl.innerHTML = '<p class="empty-msg">No products added yet.</p>';
        return;
    }

    products.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-card';
        item.innerHTML = `
            <h3>${product.name}</h3>
            <p><strong>Stock:</strong> ${product.stockQuantity}</p>
            <p><strong>Price:</strong> $${Number(product.price).toFixed(2)}</p>
            <div class="card-actions">
                <button onclick="recordSale('${product.id}', 1)">Sell 1</button>
                <button onclick="returnProduct('${product.id}')" class="btn-return">Return Sale</button>
            </div>
        `;
        productListEl.appendChild(item);
    });
}

function renderDashboard() {
    const dashboardEl = document.getElementById('dashboard-stats');
    if (!dashboardEl) return;

    const transactions = getTransactions();
    const today = getTodayStr();

    const todaysTransactions = transactions.filter(t => t.timestamp && t.timestamp.startsWith(today));

    const totalSales = todaysTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalProfit = todaysTransactions.reduce((sum, t) => sum + (Number(t.profit) || 0), 0);

    dashboardEl.innerHTML = `
        <div class="stat-box">
            <h4>Today's Sales</h4>
            <p>$${totalSales.toFixed(2)}</p>
        </div>
        <div class="stat-box">
            <h4>Today's Profit</h4>
            <p>$${totalProfit.toFixed(2)}</p>
        </div>
    `;
}

function updateUI() {
    renderProducts();
    renderDashboard();
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});