// --- CONFIGURATION: CHANGE CREDENTIALS HERE ---
const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const ordersBody = document.getElementById('ordersBody');
    const noOrders = document.getElementById('noOrders');
    const orderSearch = document.getElementById('orderSearch');
    const exportCsvBtn = document.getElementById('exportCsvBtn');

    // --- Authentication Logic ---
    const checkAuth = () => {
        const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn');
        const currentPage = window.location.pathname;

        if (!isLoggedIn && currentPage.includes('dashboard.html')) {
            window.location.href = 'admin.html';
        }
        if (isLoggedIn && currentPage.includes('admin.html')) {
            window.location.href = 'dashboard.html';
        }
    };

    checkAuth();

    // --- Login Form Handling ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('adminUser').value;
            const pass = document.getElementById('adminPass').value;
            const errorMsg = document.getElementById('loginError');

            if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.innerText = "Invalid credentials!";
            }
        });
    }

    // --- Logout Handling ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isAdminLoggedIn');
            window.location.href = 'admin.html';
        });
    }

    // --- Render Orders for Dashboard ---
    const renderOrders = (filter = "") => {
        if (!ordersBody) return;
        
        const orders = JSON.parse(localStorage.getItem('tubeBoostOrders')) || [];

        // --- Calculate Today's Stats ---
        const PLAN_SUBS = { 'Basic': 15, 'Standard': 36, 'Premium': 150 };
        const PLAN_PRICES = { 'Basic': 10, 'Standard': 30, 'Premium': 100 };
        const todayStr = new Date().toDateString();
        
        const totalSubsToday = orders.reduce((total, order) => {
            const orderDate = new Date(order.id).toDateString();
            return orderDate === todayStr 
                ? total + (PLAN_SUBS[order.plan] || 0) 
                : total;
        }, 0);

        const totalSubsEl = document.getElementById('totalSubsToday');
        if (totalSubsEl) totalSubsEl.innerText = totalSubsToday.toLocaleString();

        // --- Calculate Total Revenue ---
        const totalRevenue = orders.reduce((total, order) => {
            return total + (PLAN_PRICES[order.plan] || 0);
        }, 0);

        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) totalRevenueEl.innerText = totalRevenue.toLocaleString();

        const filteredOrders = orders.filter(order => 
            order.name.toLowerCase().includes(filter.toLowerCase()) || 
            order.email.toLowerCase().includes(filter.toLowerCase())
        );
        
        if (filteredOrders.length === 0) {
            noOrders.style.display = 'block';
            noOrders.innerText = filter ? "No matching orders found." : "No orders found yet.";
            ordersBody.innerHTML = '';
            return;
        }

        noOrders.style.display = 'none';
        ordersBody.innerHTML = [...filteredOrders].reverse().map(order => `
            <tr>
                <td>${order.date}</td>
                <td>
                    <strong>${order.name}</strong><br>
                    <small style="color: var(--text-gray)">${order.email}</small>
                </td>
                <td><span class="btn" style="padding: 4px 10px; font-size: 0.7rem;">${order.plan}</span></td>
                <td>
                    <a href="${order.link}" target="_blank" style="color: var(--primary-red); text-decoration: none;">
                        View Channel <i class="fas fa-external-link-alt" style="font-size: 0.7rem;"></i>
                    </a>
                </td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    ${order.status !== 'Completed' ? `
                    <button class="btn btn-complete" data-id="${order.id}" title="Mark as Completed">
                        <i class="fas fa-check"></i>
                    </button>
                    ` : ''}
                    <button class="btn btn-delete" data-id="${order.id}" title="Delete Order">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    };

    // --- Search Handling ---
    if (orderSearch) {
        orderSearch.addEventListener('input', (e) => renderOrders(e.target.value));
    }

    // --- Export to CSV Handling ---
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            const orders = JSON.parse(localStorage.getItem('tubeBoostOrders')) || [];
            if (orders.length === 0) {
                alert("No orders to export.");
                return;
            }

            const headers = ['ID', 'Date', 'Name', 'Email', 'Plan', 'Link', 'Status'];
            
            // Function to escape commas and quotes in CSV fields
            const escapeCsvField = (field) => {
                if (field === null || field === undefined) return '';
                const str = String(field);
                // If the field contains a comma, a double quote, or a newline, wrap it in double quotes
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            };

            const csvRows = [
                headers.join(','),
                ...orders.map(order => [
                    order.id,
                    order.date,
                    order.name,
                    order.email,
                    order.plan,
                    order.link,
                    order.status
                ].map(escapeCsvField).join(','))
            ];

            const csvString = csvRows.join('\n');
            downloadCsv(csvString, 'tubeboost-orders.csv');
        });
    }

    // --- Event Delegation for Action Buttons ---
    if (ordersBody) {
        ordersBody.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.btn-delete');
            const completeBtn = e.target.closest('.btn-complete');

            if (deleteBtn) {
                const id = parseInt(deleteBtn.getAttribute('data-id'));
                if (confirm('Are you sure you want to delete this order?')) {
                    let orders = JSON.parse(localStorage.getItem('tubeBoostOrders')) || [];
                    orders = orders.filter(o => o.id !== id);
                    localStorage.setItem('tubeBoostOrders', JSON.stringify(orders));
                    renderOrders(orderSearch.value);
                }
            }

            if (completeBtn) {
                const id = parseInt(completeBtn.getAttribute('data-id'));
                let orders = JSON.parse(localStorage.getItem('tubeBoostOrders')) || [];
                const orderIndex = orders.findIndex(o => o.id === id);
                if (orderIndex > -1) {
                    orders[orderIndex].status = 'Completed';
                    localStorage.setItem('tubeBoostOrders', JSON.stringify(orders));
                    renderOrders(orderSearch.value);
                }
            }
        });

        renderOrders();
    }

    function downloadCsv(csvString, fileName) {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});