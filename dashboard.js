// dashboard.js
// Uses shared functions from script.js (already loaded)

function lockAndLogout() {
    if (confirm("Lock dashboard and return to sales terminal? You will be logged out.")) {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
}

// --- Employee Management ---
function openAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.add('active');
}
function closeAddEmployeeModal() {
    document.getElementById('addEmployeeModal').classList.remove('active');
    document.getElementById('empName').value = '';
    document.getElementById('empPin').value = '';
}
function handleAddEmployee() {
    const name = document.getElementById('empName').value.trim();
    const pin = document.getElementById('empPin').value.trim();
    if (!name || pin.length < 4) {
        alert("Enter name and a 4-digit PIN.");
        return;
    }
    const users = getUsers();
    if (users.find(u => u.name === name)) {
        alert("Name already exists.");
        return;
    }
    users.push({ id: Date.now().toString(), name: name, pin: pin, role: 'employee', company: '' });
    saveUsers(users);
    alert(`✅ Employee "${name}" added!`);
    closeAddEmployeeModal();
    renderEmployeeList();
}

function renderEmployeeList() {
    const users = getUsers();
    const employees = users.filter(u => u.role === 'employee');
    const container = document.getElementById('employeeList');
    if (employees.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center;">No employees yet.</p>';
        return;
    }
    let html = '<ul style="list-style:none; padding:0;">';
    employees.forEach(emp => {
        html += `<li style="padding:8px 0; border-bottom:1px solid #334155; display:flex; justify-content:space-between;">
            <span>${emp.name}</span>
            <button onclick="removeEmployee('${emp.id}')" style="background:none; border:none; color:#ef4444; cursor:pointer;">Remove</button>
        </li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
}

function removeEmployee(empId) {
    if (!confirm("Remove this employee?")) return;
    let users = getUsers();
    users = users.filter(u => u.id !== empId);
    saveUsers(users);
    renderEmployeeList();
}

// --- Product Management (Owner only) ---
function openAddProductModal() {
    document.getElementById('addProductModal').classList.add('active');
}
function closeAddProductModal() {
    document.getElementById('addProductModal').classList.remove('active');
    document.getElementById('prodName').value = '';
    document.getElementById('prodCost').value = '';
    document.getElementById('prodSell').value = '';
    document.getElementById('prodStock').value = '10';
}
function handleAddProduct() {
    const name = document.getElementById('prodName').value.trim();
    const cost = parseFloat(document.getElementById('prodCost').value);
    const sell = parseFloat(document.getElementById('prodSell').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    if (!name || isNaN(cost) || isNaN(sell)) {
        alert("Fill all fields correctly.");
        return;
    }
    const products = getProducts();
    products.push({
        id: generateId(),
        name: name,
        costPrice: cost,
        sellingPrice: sell,
        stockQuantity: stock || 0,
        lowStockThreshold: 10
    });
    saveProducts(products);
    closeAddProductModal();
    renderProductListDashboard();
    populateScenarioDropdown();
}

function renderProductListDashboard() {
    const container = document.getElementById('productListDashboard');
    const products = getProducts();
    if (products.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center;">No products yet.</p>';
        return;
    }
    let html = '';
    products.forEach(p => {
        html += `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px; border-bottom:1px solid #334155;">
            <span>${p.name} (Stock: ${p.stockQuantity})</span>
            <button onclick="restockProductDashboard('${p.id}')" class="btn btn-success" style="padding:4px 10px; font-size:0.8rem;">+ Restock</button>
        </div>`;
    });
    container.innerHTML = html;
}

function restockProductDashboard(productId) {
    // Reuse the restockProduct function from script.js (it's already included)
    restockProduct(productId);
    renderProductListDashboard();
}

// --- Scenario Simulator (uses products) ---
function populateScenarioDropdown() {
    const select = document.getElementById('simProduct');
    if (!select) return;
    const products = getProducts();
    select.innerHTML = '<option value="">-- Choose product --</option>';
    products.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.name;
        opt.textContent = `${p.name} (Stock: ${p.stockQuantity})`;
        select.appendChild(opt);
    });
}

function runScenario() {
    const productName = document.getElementById('simProduct').value;
    const priceChange = parseFloat(document.getElementById('simPrice').value);
    const resultEl = document.getElementById('scenarioResult');
    if (!productName || isNaN(priceChange)) {
        resultEl.textContent = "⚠️ Please select a product and enter a price change.";
        resultEl.style.color = "#ef4444";
        return;
    }
    const weeklySales = 10; // could be dynamic later
    const profitImpact = weeklySales * priceChange;
    resultEl.innerHTML = `📊 <strong>Scenario Result:</strong> If you change the price of <strong>${productName}</strong> by $${priceChange.toFixed(2)}, your estimated <strong>weekly profit change</strong> is <strong style="color:${profitImpact >= 0 ? '#22c55e' : '#ef4444'};">$${profitImpact.toFixed(2)}</strong> per week.`;
    resultEl.style.color = "#e2e8f0";
}

// --- Advice dismiss ---
function dismissAdvice(id) {
    document.getElementById(id).style.display = 'none';
}

// --- Init on page load ---
document.addEventListener('DOMContentLoaded', function() {
    renderProductListDashboard();
    renderEmployeeList();
    populateScenarioDropdown();
});