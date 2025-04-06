/**
 * Tencent Cloud Integration for Portfolio Admin Dashboard
 * 
 * This file contains functions to:
 * 1. Track and collect visitor data
 * 2. Export data to Tencent Cloud COS bucket
 * 3. Fetch data from Tencent Cloud for dashboard display
 * 4. Handle fallback to local storage when cloud operations fail
 */

// Configuration for Tencent Cloud COS
const tencentConfig = {
    Bucket: 'website-traffic-1352137578',
    Region: 'ap-bangkok',
    // Credentials are fetched securely from the server
  };
  
  // Initialize the tracking system
  function initVisitorTracking() {
    // Capture page view
    trackPageView();
    
    // Set up section tracking
    trackSectionViews();
    
    // Schedule data sync to Tencent Cloud every 5 minutes
    setInterval(syncDataToTencentCloud, 5 * 60 * 1000);
    
    console.log('Visitor tracking initialized');
  }
  
  // Track page view
  function trackPageView() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Increment total views
    incrementCounter('total_views');
    
    // Increment today's views
    incrementCounter(`pageviews_${today}`);
    
    // Log visitor data
    logVisitorData();
    
    // Track geographic data (uses IP geolocation service)
    trackGeographicData();
  }
  
  // Increment a counter in localStorage (with cloud sync)
  function incrementCounter(key, amount = 1) {
    // Get current value from localStorage
    const currentValue = parseInt(localStorage.getItem(key) || '0');
    
    // Increment and save back to localStorage
    const newValue = currentValue + amount;
    localStorage.setItem(key, newValue.toString());
    
    // Mark this key as needing cloud sync
    markForSync(key);
    
    return newValue;
  }
  
  // Log visitor data for analytics
  function logVisitorData() {
    // Get existing history or initialize empty array
    const visitorHistory = JSON.parse(localStorage.getItem('visitor_history') || '[]');
    
    // Create entry with current timestamp and browser info
    const entry = {
      timestamp: new Date().toISOString(),
      data: {
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    // Add to history (limit to 100 entries to prevent localStorage overflow)
    visitorHistory.unshift(entry);
    if (visitorHistory.length > 100) {
      visitorHistory.pop();
    }
    
    // Save back to localStorage
    localStorage.setItem('visitor_history', JSON.stringify(visitorHistory));
    
    // Mark for cloud sync
    markForSync('visitor_history');
  }
  
  // Track section views
  function trackSectionViews() {
    // Find all section nav links
    const sectionLinks = document.querySelectorAll('nav a[href^="#"]');
    
    // Add click event listeners
    sectionLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        const sectionId = this.getAttribute('href').substring(1);
        trackSectionView(sectionId);
      });
    });
    
    // Also track initial section on page load
    if (window.location.hash) {
      const initialSection = window.location.hash.substring(1);
      trackSectionView(initialSection);
    } else {
      // Default to home section if no hash
      trackSectionView('home');
    }
  }
  
  // Track a specific section view
  function trackSectionView(sectionId) {
    // Normalize section ID
    const section = sectionId.toLowerCase();
    
    // Increment section counter
    const key = `section_${section}`;
    incrementCounter(key);
    
    // Update section_data aggregate
    updateSectionData(section);
    
    // Log section view in history
    logSectionView(section);
  }
  
  // Update aggregate section data
  function updateSectionData(section) {
    // Get current section data
    const sectionData = JSON.parse(localStorage.getItem('section_data') || '{}');
    
    // Initialize section if not exists
    if (!sectionData[section]) {
      sectionData[section] = 0;
    }
    
    // Increment count
    sectionData[section]++;
    
    // Save back to localStorage
    localStorage.setItem('section_data', JSON.stringify(sectionData));
    
    // Mark for cloud sync
    markForSync('section_data');
  }
  
  // Log section view in history
  function logSectionView(section) {
    // Get existing history or initialize empty array
    const sectionHistory = JSON.parse(localStorage.getItem('section_history') || '[]');
    
    // Create entry
    const entry = {
      timestamp: new Date().toISOString(),
      section: section
    };
    
    // Add to history (limit to 100 entries)
    sectionHistory.unshift(entry);
    if (sectionHistory.length > 100) {
      sectionHistory.pop();
    }
    
    // Save back to localStorage
    localStorage.setItem('section_history', JSON.stringify(sectionHistory));
    
    // Mark for cloud sync
    markForSync('section_history');
  }
  
  // Track geographic data based on visitor IP
  async function trackGeographicData() {
    try {
      // Fetch geolocation data from IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) {
        throw new Error('Failed to fetch geolocation data');
      }
      
      const geoData = await response.json();
      
      // Extract country and city
      const country = geoData.country_name;
      const city = geoData.city;
      
      if (country && city) {
        // Update country stats
        updateGeoStats('countries', country);
        
        // Update city stats
        updateGeoStats('cities', city);
        
        // Update city-country mapping
        updateCityCountryMap(city, country);
      }
    } catch (error) {
      console.error('Error tracking geographic data:', error);
      // Silently fail - geographic tracking is non-critical
    }
  }
  
  // Update geographic statistics
  function updateGeoStats(type, location) {
    // Get current geo data
    const geoData = JSON.parse(localStorage.getItem('geo_data') || '{"countries":{}, "cities":{}, "cityCountryMap":{}}');
    
    // Initialize if not exists
    if (!geoData[type]) {
      geoData[type] = {};
    }
    
    // Initialize location if not exists
    if (!geoData[type][location]) {
      geoData[type][location] = 0;
    }
    
    // Increment count
    geoData[type][location]++;
    
    // Save back to localStorage
    localStorage.setItem('geo_data', JSON.stringify(geoData));
    
    // Mark for cloud sync
    markForSync('geo_data');
  }
  
  // Update city to country mapping
  function updateCityCountryMap(city, country) {
    // Get current geo data
    const geoData = JSON.parse(localStorage.getItem('geo_data') || '{"countries":{}, "cities":{}, "cityCountryMap":{}}');
    
    // Initialize if not exists
    if (!geoData.cityCountryMap) {
      geoData.cityCountryMap = {};
    }
    
    // Set or update mapping
    geoData.cityCountryMap[city] = country;
    
    // Save back to localStorage
    localStorage.setItem('geo_data', JSON.stringify(geoData));
    
    // Mark for cloud sync
    markForSync('geo_data');
  }
  
  // Mark a key for syncing to Tencent Cloud
  function markForSync(key) {
    // Get current sync queue
    const syncQueue = JSON.parse(localStorage.getItem('_tencent_sync_queue') || '[]');
    
    // Add key if not already in queue
    if (!syncQueue.includes(key)) {
      syncQueue.push(key);
      localStorage.setItem('_tencent_sync_queue', JSON.stringify(syncQueue));
    }
  }
  
  // Sync all marked data to Tencent Cloud
  async function syncDataToTencentCloud() {
    // Get sync queue
    const syncQueue = JSON.parse(localStorage.getItem('_tencent_sync_queue') || '[]');
    
    // If nothing to sync, exit
    if (syncQueue.length === 0) {
      return;
    }
    
    console.log(`Syncing ${syncQueue.length} items to Tencent Cloud`);
    
    // Process each item in queue
    const remainingQueue = [];
    
    for (const key of syncQueue) {
      try {
        // Get data from localStorage
        const data = localStorage.getItem(key);
        
        // Skip if data doesn't exist
        if (data === null) {
          continue;
        }
        
        // Parse JSON if it's a JSON string
        const parsedData = key.includes('_history') || key === 'section_data' || key === 'geo_data' 
          ? JSON.parse(data) 
          : data;
        
        // Upload to Tencent Cloud
        const success = await saveDataToTencentCloud(key, parsedData);
        
        // If failed, keep in queue for next sync
        if (!success) {
          remainingQueue.push(key);
        }
      } catch (error) {
        console.error(`Error syncing ${key} to Tencent Cloud:`, error);
        // Keep in queue for next attempt
        remainingQueue.push(key);
      }
    }
    
    // Update sync queue with remaining items
    localStorage.setItem('_tencent_sync_queue', JSON.stringify(remainingQueue));
    
    console.log(`Sync complete. ${syncQueue.length - remainingQueue.length} items synced, ${remainingQueue.length} remaining.`);
  }
  
  // ============================
  // Tencent Cloud COS Integration
  // ============================
  
  // Fetch the authentication credentials from server
  async function fetchTencentCredentials() {
    try {
      // In production, this would call your secure backend endpoint
      // that provides temporary credentials using STS
      const response = await fetch('/api/tencent-credentials');
      
      if (!response.ok) {
        throw new Error('Failed to fetch Tencent Cloud credentials');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return null;
    }
  }
  
  // Initialize Tencent Cloud COS SDK
  async function initTencentCOS() {
    try {
      // Ensure COS SDK is loaded
      if (typeof COS !== 'function') {
        console.error('Tencent Cloud COS SDK not loaded');
        return null;
      }
      
      // Get credentials
      const credentials = await fetchTencentCredentials();
      
      if (!credentials) {
        throw new Error('No valid credentials available');
      }
      
      // Initialize COS instance
      const cos = new COS({
        SecretId: credentials.SecretId,
        SecretKey: credentials.SecretKey,
        // Use SecurityToken if using temporary credentials (STS)
        SecurityToken: credentials.SecurityToken,
        // Use automatic authentication if provided
        getAuthorization: credentials.getAuthorization
      });
      
      return cos;
    } catch (error) {
      console.error('Failed to initialize Tencent Cloud COS:', error);
      return null;
    }
  }
  
  // Fetch data from Tencent Cloud
  async function fetchTencentCloudData(key) {
    try {
      // Try to get the COS instance
      const cos = await initTencentCOS();
      
      // If COS initialization failed, fall back to localStorage
      if (!cos) {
        console.warn(`Using localStorage fallback for ${key}`);
        
        // For mock data (during development or when cloud is unavailable)
        if (key === 'geo_data') {
          return getMockGeoData();
        }
        
        const data = localStorage.getItem(key);
        return data ? (key.includes('_history') || key === 'section_data' || key === 'geo_data' ? JSON.parse(data) : data) : null;
      }
      
      // Attempt to get object from Tencent Cloud
      return new Promise((resolve, reject) => {
        cos.getObject({
          Bucket: tencentConfig.Bucket,
          Region: tencentConfig.Region,
          Key: `analytics/${key}.json`,
        }, function(err, data) {
          if (err) {
            console.warn(`Cloud fetch failed for ${key}, using localStorage fallback`);
            // Fall back to localStorage
            const localData = localStorage.getItem(key);
            resolve(localData ? (key.includes('_history') || key === 'section_data' || key === 'geo_data' ? JSON.parse(localData) : localData) : null);
          } else {
            // Parse the response body
            try {
              const bodyStr = data.Body.toString();
              const parsedData = JSON.parse(bodyStr);
              resolve(parsedData);
            } catch (e) {
              console.error('Error parsing cloud data:', e);
              resolve(null);
            }
          }
        });
      });
    } catch (error) {
      console.error(`Error in fetchTencentCloudData for ${key}:`, error);
      
      // Fallback to localStorage in case of any error
      const data = localStorage.getItem(key);
      return data ? (key.includes('_history') || key === 'section_data' || key === 'geo_data' ? JSON.parse(data) : data) : null;
    }
  }
  
  // Save data to Tencent Cloud
  async function saveDataToTencentCloud(key, data) {
    try {
      // Try to get the COS instance
      const cos = await initTencentCOS();
      
      // If COS initialization failed, mark for future sync and return false
      if (!cos) {
        markForSync(key);
        return false;
      }
      
      // Prepare data for upload
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Upload to Tencent Cloud
      return new Promise((resolve, reject) => {
        cos.putObject({
          Bucket: tencentConfig.Bucket,
          Region: tencentConfig.Region,
          Key: `analytics/${key}.json`,
          Body: jsonData,
          ContentType: 'application/json',
        }, function(err, data) {
          if (err) {
            console.error(`Failed to save ${key} to Tencent Cloud:`, err);
            resolve(false);
          } else {
            console.log(`Successfully saved ${key} to Tencent Cloud`);
            resolve(true);
          }
        });
      });
    } catch (error) {
      console.error(`Error in saveDataToTencentCloud for ${key}:`, error);
      return false;
    }
  }
  
  // Get mock geographic data (used when cloud fetch fails)
  function getMockGeoData() {
    return {
      countries: {
        "United States": 4256,
        "China": 2187,
        "India": 1945,
        "Germany": 1124,
        "United Kingdom": 982,
        "Canada": 876,
        "Australia": 743,
        "Japan": 687,
        "France": 634,
        "Brazil": 589,
        // Add more countries as needed
      },
      cities: {
        "Atlanta": 1245,
        "New York": 876,
        "San Francisco": 765,
        "Beijing": 687,
        "Bangalore": 643,
        "London": 598,
        "Toronto": 534,
        "Berlin": 487,
        // Add more cities as needed
      },
      cityCountryMap: {
        "Atlanta": "United States",
        "New York": "United States",
        "San Francisco": "United States",
        "Beijing": "China",
        "Bangalore": "India",
        "London": "United Kingdom",
        "Toronto": "Canada",
        "Berlin": "Germany",
        // Add more mappings as needed
      }
    };
  }
  
  // Export functions for use in main script
  window.portfolioAnalytics = {
    initVisitorTracking,
    trackPageView,
    trackSectionView,
    syncDataToTencentCloud,
    fetchTencentCloudData
  };