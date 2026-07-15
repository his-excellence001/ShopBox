function getUsers() {
    const data = localStorage.getItem('shopkeeper_users');
    return data ? JSON.parse(data) : [];
}

function saveUsers(users) {
    localStorage.setItem('shopkeeper_users', JSON.stringify(users));
}

function handleRegister() {
    const name = document.getElementById('loginUser').value.trim();
    const pin = document.getElementById('loginPin').value.trim();
    const errorEl = document.getElementById('loginError');

    if (!name || pin.length < 4) {
        errorEl.textContent = "Please enter a name and a PIN (at least 4 digits).";
        return;
    }

    const users = getUsers();
    if (users.find(u => u.name === name)) {
        errorEl.textContent = "That name is already taken.";
        return;
    }

    // 🚀 AUTO-ASSIGN ROLE: First user is Owner, everyone else is Employee
    const role = users.length === 0 ? 'owner' : 'employee';

    users.push({ id: Date.now().toString(), name: name, pin: pin, role: role });
    saveUsers(users);
    errorEl.textContent = `✅ Registered as ${role.charAt(0).toUpperCase() + role.slice(1)}! Please login.`;
    errorEl.style.color = "#27ae60";
}

function handleLogin() {
    const name = document.getElementById('loginUser').value.trim();
    const pin = document.getElementById('loginPin').value.trim();
    const errorEl = document.getElementById('loginError');

    const users = getUsers();
    const foundUser = users.find(u => u.name === name && u.pin === pin);

    if (foundUser) {
        sessionStorage.setItem('loggedInUser', JSON.stringify(foundUser));
        window.location.href = 'index.html';
    } else {
        errorEl.textContent = "❌ Wrong name or PIN. Please try again.";
        errorEl.style.color = "#e74c3c";
    }
}

if (sessionStorage.getItem('loggedInUser')) {
    window.location.href = 'index.html';
}