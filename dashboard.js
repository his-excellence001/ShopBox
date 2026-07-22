// ==========================================
// SHOPBOX DASHBOARD LOGIC (dashboard.js)
// ==========================================

const OWNER_PIN = "1234"; // Default Owner PIN

// --- DATA ACCESS HELPERS ---

function getProducts() {
    return JSON.parse(localStorage.getItem('products')) || [];
}

function getTransactions() {
    return JSON.parse(localStorage.getItem('transactions')) || [];
}

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

// --- PIN SECURITY LOCK ---

function initPinLock() {
    const pinModal = document.getElementById('pinModal');
    const dashboardContent = document.getElementById('dashboardContent');
    const pinInput = document.getElementById('pinInput');
    const pinSubmitBtn = document.getElementById('pinSubmitBtn');
    const pinError = document.getElementById('pinError');
    const lockBtn = document.getElementById('lockBtn');

    // Check if already unlocked in this session
    if (sessionStorage.getItem('dashboardUnlocked') === 'true') {
        if (pinModal) pinModal.style.display = 'none';
        if (dashboardContent) dashboardContent.style.display = 'block';
        loadDashboardData();
    } else {
        if (pinModal) pinModal.style.display = 'flex';
        if (dashboardContent) dashboardContent.style.display = 'none';
    }

    // Unlock handler
    function attemptUnlock() {
        if (pinInput.value === OWNER_PIN) {
            sessionStorage.setItem('dashboardUnlocked', 'true');
            pinError.style.display = 'none';
            pinModal.style.display = 'none';
            dashboardContent.style.display = 'block';
            loadDashboardData();
        } else {
            pinError.style.display = 'block';
            pinInput.value = '';
        }
    }

    if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', attemptUnlock);
    
    if (pinInput) {
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') attemptUnlock();
        });
    }

    if (lockBtn) {
        lockBtn.addEventListener('click', () => {
            sessionStorage.removeItem('dashboardUnlocked');
            location.reload();
        });
    }
}

// --- METRICS & DASHBOARD DATA ---

function loadDashboardData() {
    const products = getProducts();
    const transactions = getTransactions();
    const today = getTodayStr();

    // 1. Calculate Today's Gross Sales & Profit
    const todaysTransactions = transactions.filter(t => t.timestamp && t.timestamp.startsWith(today));
    
    const todaysSales = todaysTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const todaysProfit = todaysTransactions.reduce((sum, t) => sum + (Number(t.profit) || 0), 0);

    // 2. Calculate Total Inventory Valuation & Low Stock Count
    let totalStockValue = 0;
    let lowStockCount = 0;

    products.forEach(p => {
        const qty = Number(p.stockQuantity) || 0;
        const cost = Number(p.costPrice) || Number(p.price) || 0;
        totalStockValue += qty * cost;

        if (qty <= (p.lowStockThreshold || 5)) {
            lowStockCount++;
        }
    });

    // 3. Update DOM Elements
    const metricSalesEl = document.getElementById('metricSales');
    const metricProfitEl = document.getElementById('metricProfit');
    const metricStockValueEl = document.getElementById('metricStockValue');
    const metricLowStockEl = document.getElementById('metricLowStock');

    if (metricSalesEl) metricSalesEl.textContent = `$${todaysSales.toFixed(2)}`;
    if (metricProfitEl) metricProfitEl.textContent = `$${todaysProfit.toFixed(2)}`;
    if (metricStockValueEl) metricStockValueEl.textContent = `$${totalStockValue.toFixed(2)}`;
    if (metricLowStockEl) metricLowStockEl.textContent = `${lowStockCount} Items`;

    // 4. Populate Simulator Dropdown & Render Analytics Charts
    populateSimulatorProducts(products);
    initSimulator();
    renderCharts(products, transactions);
}

// --- RESTOCK SCENARIO SIMULATOR ---

function populateSimulatorProducts(products) {
    const simProductSelect = document.getElementById('simProduct');
    if (!simProductSelect) return;

    simProductSelect.innerHTML = '<option value="">-- Choose product --</option>';

    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (Stock: ${p.stockQuantity}, Cost: $${Number(p.costPrice || 0).toFixed(2)})`;
        option.dataset.cost = p.costPrice || 0;
        option.dataset.price = p.price || 0;
        simProductSelect.appendChild(option);
    });

    // Auto-fill cost field when a product is selected
    simProductSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.selectedOptions[0];
        const simCostInput = document.getElementById('simCost');
        if (selectedOption && simCostInput && selectedOption.dataset.cost) {
            simCostInput.value = selectedOption.dataset.cost;
        }
    });
}

function initSimulator() {
    const simulatorForm = document.getElementById('simulatorForm');
    const simResult = document.getElementById('simResult');
    if (!simulatorForm) return;

    simulatorForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const productId = document.getElementById('simProduct').value;
        const qty = parseInt(document.getElementById('simQty').value, 10);
        const costPerUnit = parseFloat(document.getElementById('simCost').value);

        if (!productId || isNaN(qty) || isNaN(costPerUnit)) {
            alert("Please complete all simulation fields.");
            return;
        }

        const products = getProducts();
        const product = products.find(p => String(p.id) === String(productId));
        if (!product) return;

        const totalInvestment = qty * costPerUnit;
        const potentialRevenue = qty * Number(product.price || 0);
        const potentialProfit = potentialRevenue - totalInvestment;

        simResult.style.display = 'block';
        simResult.innerHTML = `
            <div style="background: #1e293b; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h4 style="margin: 0 0 10px 0; color: #38bdf8;">Simulation Results for "${product.name}"</h4>
                <p><strong>Order Quantity:</strong> ${qty} units</p>
                <p><strong>Total Cash Required:</strong> $${totalInvestment.toFixed(2)}</p>
                <p><strong>Projected Gross Revenue:</strong> $${potentialRevenue.toFixed(2)}</p>
                <p><strong>Projected Net Profit:</strong> <span style="color: ${potentialProfit >= 0 ? '#4ade80' : '#f87171'}">$${potentialProfit.toFixed(2)}</span></p>
            </div>
        `;
    });
}

// --- CHART.JS ANALYTICS ---

let salesChartInstance = null;
let productsChartInstance = null;

function renderCharts(products, transactions) {
    const salesCtx = document.getElementById('salesChart');
    const productsCtx = document.getElementById('productsChart');

    if (!salesCtx || !productsCtx) return;

    // Prepare sales trend data (group by transaction type)
    const salesTotal = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const profitTotal = transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + (Number(t.profit) || 0), 0);
    const returnsTotal = Math.abs(transactions.filter(t => t.type === 'return').reduce((sum, t) => sum + (Number(t.amount) || 0), 0));

    // Destroy existing chart instances on reload
    if (salesChartInstance) salesChartInstance.destroy();
    if (productsChartInstance) productsChartInstance.destroy();

    // Chart 1: Revenue vs Profit
    salesChartInstance = new Chart(salesCtx, {
        type: 'bar',
        data: {
            labels: ['Total Revenue', 'Net Profit', 'Total Returns'],
            datasets: [{
                label: 'USD ($)',
                data: [salesTotal, profitTotal, returnsTotal],
                backgroundColor: ['#3b82f6', '#22c55e', '#ef4444']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // Chart 2: Top Selling Inventory Stock Levels
    const productNames = products.map(p => p.name);
    const productStocks = products.map(p => p.stockQuantity);

    productsChartInstance = new Chart(productsCtx, {
        type: 'doughnut',
        data: {
            labels: productNames.length ? productNames : ['No Products'],
            datasets: [{
                data: productStocks.length ? productStocks : [1],
                backgroundColor: ['#f59e0b', '#10b981', '#6366f1', '#ec4899', '#8b5cf6']
            }]
        },
        options: {
            responsive: true
        }
    });
}

// --- INITIALIZE ON DOM LOAD ---

document.addEventListener('DOMContentLoaded', () => {
    initPinLock();
});