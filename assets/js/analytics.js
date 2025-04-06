class AnalyticsTracker {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize storage if not existing
        if (!localStorage.getItem('total_views')) {
            localStorage.setItem('total_views', '0');
        }
    }

    trackPageView() {
        // Increment total views
        let totalViews = parseInt(localStorage.getItem('total_views') || '0');
        localStorage.setItem('total_views', (totalViews + 1).toString());

        // Track daily views
        const today = new Date().toISOString().split('T')[0];
        const dailyKey = `pageviews_${today}`;
        let dailyViews = parseInt(localStorage.getItem(dailyKey) || '0');
        localStorage.setItem(dailyKey, (dailyViews + 1).toString());

        // Log visitor details
        this.logVisitorDetails();
    }

    logVisitorDetails() {
        const visitorData = {
            timestamp: new Date().toISOString(),
            url: window.location.pathname,
            referrer: document.referrer || 'direct',
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            language: navigator.language
        };

        // Store visitor history
        const visitorHistory = JSON.parse(localStorage.getItem('visitor_history') || '[]');
        visitorHistory.push(visitorData);

        // Keep only last 100 entries
        if (visitorHistory.length > 100) {
            visitorHistory.shift();
        }

        localStorage.setItem('visitor_history', JSON.stringify(visitorHistory));
    }

    trackSectionView(sectionId) {
        const today = new Date().toISOString().split('T')[0];
        const sectionKey = `section_${sectionId}_${today}`;
        let sectionViews = parseInt(localStorage.getItem(sectionKey) || '0');
        localStorage.setItem(sectionKey, (sectionViews + 1).toString());
    }

    getAnalytics() {
        return {
            totalViews: parseInt(localStorage.getItem('total_views') || '0'),
            visitorHistory: JSON.parse(localStorage.getItem('visitor_history') || '[]')
        };
    }
}

// Initialize and run analytics on page load
document.addEventListener('DOMContentLoaded', () => {
    const tracker = new AnalyticsTracker();
    tracker.trackPageView();

    // Track section views on scroll
    const sections = document.querySelectorAll('section[id]');
    let lastSection = null;

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (
                scrollPosition >= sectionTop && 
                scrollPosition < sectionTop + sectionHeight
            ) {
                if (sectionId !== lastSection) {
                    tracker.trackSectionView(sectionId);
                    lastSection = sectionId;
                }
            }
        });
    });

    // Update view counter if element exists
    const viewCountElement = document.getElementById('view-count');
    if (viewCountElement) {
        const analytics = tracker.getAnalytics();
        viewCountElement.textContent = analytics.totalViews.toLocaleString();
    }
});