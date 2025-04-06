class AdminDashboard {
    constructor() {
        // Bind methods to ensure correct context
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('admin-login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Export buttons
        const exportJsonBtn = document.getElementById('export-json-btn');
        const exportCsvBtn = document.getElementById('export-csv-btn');

        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', this.exportAnalyticsAsJSON.bind(this));
        }

        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', this.exportAnalyticsAsCSV.bind(this));
        }
    }

    // Check authentication status
    checkAuthStatus() {
        const isLoggedIn = sessionStorage.getItem('admin_authenticated') === 'true';
        
        const loginSection = document.getElementById('login-section');
        const dashboardSection = document.getElementById('dashboard-section');

        if (isLoggedIn) {
            if (loginSection) loginSection.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'block';
            
            // Load dashboard data
            this.loadDashboardData();
            this.initializeCharts();
        } else {
            if (loginSection) loginSection.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'none';
        }
    }

    // Handle login process
    handleLogin(event) {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginError = document.getElementById('login-error');

        // Simple authentication (replace with more secure method in production)
        if (username === 'admin' && password === 'portfolio2024!') {
            // Set authentication flag
            sessionStorage.setItem('admin_authenticated', 'true');
            
            // Hide login section, show dashboard
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('dashboard-section').style.display = 'block';
            
            // Load dashboard data
            this.loadDashboardData();
            this.initializeCharts();

            // Hide any previous error
            if (loginError) loginError.style.display = 'none';
        } else {
            // Show login error
            if (loginError) {
                loginError.style.display = 'block';
                loginError.textContent = 'Invalid credentials. Please try again.';
            }
        }
    }

    // Handle logout process
    handleLogout() {
        // Clear authentication
        sessionStorage.removeItem('admin_authenticated');
        
        // Show login section, hide dashboard
        document.getElementById('login-section').style.display = 'block';
        document.getElementById('dashboard-section').style.display = 'none';
    }

    // Load dashboard metrics
    loadDashboardData() {
        // Retrieve analytics from localStorage
        const totalViews = parseInt(localStorage.getItem('total_views') || '0');
        const visitorHistory = JSON.parse(localStorage.getItem('visitor_history') || '[]');
        
        // Calculate metrics
        const uniqueVisitors = this.calculateUniqueVisitors(visitorHistory);
        const todayViews = this.getTodayViews();
        const activePages = this.getActivePages();

        // Update dashboard elements
        document.getElementById('total-views').textContent = totalViews.toLocaleString();
        document.getElementById('unique-visitors').textContent = uniqueVisitors.toLocaleString();
        document.getElementById('today-views').textContent = todayViews.toLocaleString();
        document.getElementById('active-pages').textContent = activePages.toLocaleString();

        // Populate visitor table
        this.populateVisitorTable(visitorHistory);
    }

    // Calculate unique visitors
    calculateUniqueVisitors(visitorHistory) {
        const uniqueVisitors = new Set(
            visitorHistory.map(entry => 
                `${entry.userAgent}-${entry.screenWidth}-${entry.screenHeight}`
            )
        );
        return uniqueVisitors.size;
    }

    // Get today's views
    getTodayViews() {
        const today = new Date().toISOString().split('T')[0];
        return parseInt(localStorage.getItem(`pageviews_${today}`) || '0');
    }

    // Get number of active pages
    getActivePages() {
        return Object.keys(localStorage)
            .filter(key => 
                key.startsWith('section_') || 
                key.startsWith('pageviews_')
            ).length;
    }

    // Populate visitor table
    populateVisitorTable(visitorHistory) {
        const tableBody = document.getElementById('visitor-table-body');
        if (!tableBody) return;

        // Clear existing rows
        tableBody.innerHTML = '';

        // Sort history by timestamp (most recent first)
        const sortedHistory = visitorHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 20); // Show last 20 entries

        // Populate table
        sortedHistory.forEach(entry => {
            const row = document.createElement('tr');
            
            // Format timestamp
            const timestamp = new Date(entry.timestamp).toLocaleString();
            
            // Detect browser
            const browser = this.detectBrowser(entry.userAgent);
            
            // Create row
            row.innerHTML = `
                <td>${timestamp}</td>
                <td>${entry.url || 'Unknown'}</td>
                <td>${browser}</td>
                <td>${entry.screenWidth} x ${entry.screenHeight}</td>
            `;

            tableBody.appendChild(row);
        });
    }

    // Detect browser from user agent
    detectBrowser(userAgent) {
        if (userAgent.includes('Firefox')) return 'Firefox';
        if (userAgent.includes('Chrome')) return 'Chrome';
        if (userAgent.includes('Safari')) return 'Safari';
        if (userAgent.includes('Edge')) return 'Edge';
        if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) return 'Internet Explorer';
        return 'Unknown';
    }

    // Initialize charts
    initializeCharts() {
        // Traffic Chart (Daily Views)
        this.createTrafficChart();
        
        // Page Views Distribution Chart
        this.createPageViewsChart();
    }

    // Create traffic chart
    createTrafficChart() {
        const ctx = document.getElementById('traffic-chart');
        if (!ctx) return;

        // Prepare data for last 7 days
        const labels = this.getLastSevenDays();
        const data = this.getDailyViewData();

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Views',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Create page views distribution chart
    createPageViewsChart() {
        const ctx = document.getElementById('page-views-chart');
        if (!ctx) return;

        // Collect section views
        const sectionViews = this.getSectionViewData();

        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(sectionViews),
                datasets: [{
                    data: Object.values(sectionViews),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true
            }
        });
    }

    // Get labels for last 7 days
    getLastSevenDays() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            }));
        }
        return days;
    }

    // Get daily view data
    getDailyViewData() {
        const viewData = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            const key = `pageviews_${dateString}`;
            
            viewData.push(parseInt(localStorage.getItem(key) || '0'));
        }

        return viewData;
    }

    // Get section view data
    getSectionViewData() {
        const sectionViews = {};

        // Collect section view data
        Object.keys(localStorage).forEach(key => {
            const sectionMatch = key.match(/section_(\w+)_/);
            if (sectionMatch) {
                const section = sectionMatch[1];
                const views = parseInt(localStorage.getItem(key) || '0');
                
                // Only add if views exist
                if (views > 0) {
                    sectionViews[section] = views;
                }
            }
        });

        return sectionViews;
    }

    // Export analytics as JSON
    exportAnalyticsAsJSON() {
        const analyticsData = {
            total_views: localStorage.getItem('total_views'),
            visitor_history: JSON.parse(localStorage.getItem('visitor_history') || '[]'),
            section_views: {}
        };

        // Collect section views
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('section_') || key.startsWith('pageviews_')) {
                analyticsData.section_views[key] = localStorage.getItem(key);
            }
        });

        // Create downloadable JSON file
        const jsonStr = JSON.stringify(analyticsData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_analytics_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
    }

    // Export analytics as CSV
    exportAnalyticsAsCSV() {
        // Collect data
        const visitorHistory = JSON.parse(localStorage.getItem('visitor_history') || '[]');
        
        // Prepare CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // CSV Headers
        csvContent += "Timestamp,URL,User Agent,Screen Width,Screen Height\n";
        
        // Add visitor data
        visitorHistory.forEach(entry => {
            const row = [
                entry.timestamp,
                entry.url || '',
                entry.userAgent || '',
                entry.screenWidth || '',
                entry.screenHeight || ''
            ].map(field => `"${field}"`).join(',');
            
            csvContent += row + "\n";
        });

        // Create downloadable CSV file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `portfolio_visitors_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Initialize dashboard when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboard();
});