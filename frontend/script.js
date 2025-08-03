// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Global State
let currentUser = null;
let authToken = null;
let currentStock = null;
let currentTradeType = 'buy';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const tradeModal = document.getElementById('tradeModal');
const loadingSpinner = document.getElementById('loadingSpinner');
const toastContainer = document.getElementById('toastContainer');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

function initializeApp() {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
        hideLoginModal();
        loadDashboardData();
    } else {
        showLoginModal();
    }
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });

    // Auth forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', handleAuthTab);
    });

    // Trade modal
    document.getElementById('closeTradeModal').addEventListener('click', hideTradeModal);
    document.getElementById('tradeForm').addEventListener('submit', handleTrade);
    
    // Trade tabs
    document.querySelectorAll('.trade-tab').forEach(tab => {
        tab.addEventListener('click', handleTradeTab);
    });

    // Trade quantity input
    document.getElementById('tradeQuantity').addEventListener('input', updateTradeSummary);

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            // Don't allow closing login modal if not authenticated
            if (authToken) {
                hideLoginModal();
            }
        }
        if (e.target === tradeModal) {
            hideTradeModal();
        }
    });
}

// Authentication Functions
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            hideLoginModal();
            showToast('Login successful!', 'success');
            loadDashboardData();
        } else {
            showToast(data.detail || 'Login failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;

    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            hideLoginModal();
            showToast('Account created successfully!', 'success');
            loadDashboardData();
        } else {
            showToast(data.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showLoginModal();
    showToast('Logged out successfully', 'success');
}

function checkAuthStatus() {
    if (!authToken) {
        showLoginModal();
    }
}

// Navigation Functions
function handleNavigation(e) {
    e.preventDefault();
    const sectionName = e.target.closest('.nav-link').dataset.section;
    showSection(sectionName);
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.closest('.nav-link').classList.add('active');
}

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'stocks':
            loadStocks();
            break;
        case 'portfolio':
            loadPortfolio();
            break;
        case 'history':
            loadTradeHistory();
            break;
    }
}

// Data Loading Functions
async function loadDashboardData() {
    if (!authToken) return;
    
    try {
        // Load portfolio and trade history for dashboard stats
        await Promise.all([
            loadPortfolio(),
            loadTradeHistory(),
            updateUserBalance()
        ]);
        
        updateDashboardStats();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadStocks() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE_URL}/stocks/`);
        const stocks = await response.json();
        
        displayStocks(stocks);
    } catch (error) {
        showToast('Error loading stocks', 'error');
    } finally {
        hideLoading();
    }
}

async function loadPortfolio() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/trade/portfolio`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const portfolio = await response.json();
        displayPortfolio(portfolio);
        return portfolio;
    } catch (error) {
        console.error('Error loading portfolio:', error);
        return [];
    }
}

async function loadTradeHistory() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/trade/history`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const history = await response.json();
        displayTradeHistory(history);
        return history;
    } catch (error) {
        console.error('Error loading trade history:', error);
        return [];
    }
}

async function updateUserBalance() {
    // This would typically come from a user profile endpoint
    // For now, we'll calculate it based on portfolio and trades
    const balance = 100000; // Default starting balance
    document.getElementById('userBalance').textContent = formatCurrency(balance);
}

// Display Functions
function displayStocks(stocks) {
    const stocksGrid = document.getElementById('stocksGrid');
    
    if (stocks.length === 0) {
        stocksGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <p>No stocks available at the moment.</p>
            </div>
        `;
        return;
    }
    
    stocksGrid.innerHTML = stocks.map(stock => `
        <div class="stock-card" data-symbol="${stock.symbol}">
            <div class="stock-header">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-price">${formatCurrency(stock.price)}</div>
            </div>
            <div class="stock-name">${stock.name}</div>
            <div class="stock-actions">
                <button class="btn-buy" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'buy')">
                    Buy
                </button>
                <button class="btn-sell" onclick="openTradeModal('${stock.symbol}', '${stock.name}', ${stock.price}, 'sell')">
                    Sell
                </button>
            </div>
        </div>
    `).join('');
}

function displayPortfolio(portfolio) {
    const portfolioList = document.getElementById('portfolioList');
    
    if (portfolio.length === 0) {
        portfolioList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <p>Your portfolio is empty. Start trading to build your positions!</p>
            </div>
        `;
        return;
    }
    
    portfolioList.innerHTML = portfolio.map(item => {
        const currentValue = item.quantity * item.avg_price; // This would use current price in real app
        const gain = 0; // Calculate based on current price vs avg price
        const gainPercent = 0;
        
        return `
            <div class="portfolio-item">
                <div class="item-info">
                    <div class="item-symbol">${item.symbol}</div>
                    <div class="item-details">${item.quantity} shares @ ${formatCurrency(item.avg_price)}</div>
                </div>
                <div class="item-value">
                    <div class="item-price">${formatCurrency(currentValue)}</div>
                    <div class="item-change ${gain >= 0 ? 'positive' : 'negative'}">
                        ${gain >= 0 ? '+' : ''}${formatCurrency(gain)} (${gainPercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayTradeHistory(history) {
    const historyList = document.getElementById('historyList');
    const recentTradesList = document.getElementById('recentTradesList');
    
    if (history.length === 0) {
        const emptyState = `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No trade history yet. Your completed trades will appear here.</p>
            </div>
        `;
        historyList.innerHTML = emptyState;
        recentTradesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <p>No trades yet. Start trading to see your activity here!</p>
            </div>
        `;
        return;
    }
    
    const historyHTML = history.map(trade => `
        <div class="history-item">
            <div class="item-info">
                <div class="item-symbol">${trade.symbol}</div>
                <div class="item-details">
                    ${trade.trade_type} ${trade.quantity} shares @ ${formatCurrency(trade.price)}
                </div>
            </div>
            <div class="item-value">
                <div class="item-price">${formatCurrency(trade.quantity * trade.price)}</div>
                <div class="item-change">${formatDate(trade.timestamp)}</div>
            </div>
        </div>
    `).join('');
    
    historyList.innerHTML = historyHTML;
    
    // Show recent trades (last 5) on dashboard
    const recentTrades = history.slice(0, 5);
    recentTradesList.innerHTML = recentTrades.map(trade => `
        <div class="history-item">
            <div class="item-info">
                <div class="item-symbol">${trade.symbol}</div>
                <div class="item-details">
                    ${trade.trade_type} ${trade.quantity} shares
                </div>
            </div>
            <div class="item-value">
                <div class="item-price">${formatCurrency(trade.quantity * trade.price)}</div>
            </div>
        </div>
    `).join('');
}

function updateDashboardStats() {
    // This would calculate real stats based on portfolio and trades
    // For now, showing placeholder values
    document.getElementById('totalValue').textContent = '$100,000.00';
    document.getElementById('totalGains').textContent = '$0.00';
    document.getElementById('totalTrades').textContent = '0';
    document.getElementById('activePositions').textContent = '0';
}

// Trading Functions
function openTradeModal(symbol, name, price, type = 'buy') {
    currentStock = { symbol, name, price };
    currentTradeType = type;
    
    document.getElementById('tradeStockSymbol').textContent = symbol;
    document.getElementById('tradeStockName').textContent = name;
    document.getElementById('tradeStockPrice').textContent = formatCurrency(price);
    
    // Set active trade tab
    document.querySelectorAll('.trade-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    
    // Reset form
    document.getElementById('tradeQuantity').value = '';
    updateTradeSummary();
    
    showTradeModal();
}

function handleTradeTab(e) {
    const type = e.target.dataset.type;
    currentTradeType = type;
    
    document.querySelectorAll('.trade-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    updateTradeSummary();
}

function updateTradeSummary() {
    const quantity = parseInt(document.getElementById('tradeQuantity').value) || 0;
    const totalCost = quantity * currentStock.price;
    
    document.getElementById('totalCost').textContent = formatCurrency(totalCost);
    
    // Update button text
    const executeBtn = document.getElementById('executeTradeBtn');
    executeBtn.textContent = `${currentTradeType.toUpperCase()} ${quantity} Shares`;
}

async function handleTrade(e) {
    e.preventDefault();
    
    if (!authToken) {
        showToast('Please log in to trade', 'error');
        return;
    }
    
    const quantity = parseInt(document.getElementById('tradeQuantity').value);
    
    if (!quantity || quantity <= 0) {
        showToast('Please enter a valid quantity', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const tradeData = {
            symbol: currentStock.symbol,
            quantity: quantity,
            price: currentStock.price,
            trade_type: currentTradeType
        };
        
        const response = await fetch(`${API_BASE_URL}/trade/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(tradeData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            hideTradeModal();
            showToast(`${currentTradeType.toUpperCase()} order executed successfully!`, 'success');
            
            // Refresh data
            loadDashboardData();
            if (document.getElementById('portfolio').classList.contains('active')) {
                loadPortfolio();
            }
            if (document.getElementById('history').classList.contains('active')) {
                loadTradeHistory();
            }
        } else {
            showToast(result.detail || 'Trade execution failed', 'error');
        }
    } catch (error) {
        showToast('Network error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Modal Functions
function showLoginModal() {
    loginModal.classList.add('active');
}

function hideLoginModal() {
    loginModal.classList.remove('active');
}

function showTradeModal() {
    tradeModal.classList.add('active');
}

function hideTradeModal() {
    tradeModal.classList.remove('active');
}

function handleAuthTab(e) {
    const tabType = e.target.dataset.tab;
    
    // Update active tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show corresponding form
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(`${tabType}Form`).classList.add('active');
}

// Utility Functions
function showLoading() {
    loadingSpinner.classList.add('active');
}

function hideLoading() {
    loadingSpinner.classList.remove('active');
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Export functions for global access
window.openTradeModal = openTradeModal;