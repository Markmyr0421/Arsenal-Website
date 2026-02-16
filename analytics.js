// ============================================
// GOOGLE ANALYTICS 4 - Global Configuration
// ============================================
// This file handles Google Analytics tracking for all pages

// Initialize gtag if not already loaded
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Configure Google Analytics with your Measurement ID
gtag('config', 'G-9VR65JWHR8', {
    'send_page_view': true,
    'anonymize_ip': true,  // For GDPR compliance
    'allow_google_signals': false,  // Disable personalized ads
    'cookie_flags': 'SameSite=None;Secure'
});

console.log('✅ Google Analytics loaded (Measurement ID: G-9VR65JWHR8)');

// ============================================
// CUSTOM EVENT TRACKING FUNCTIONS
// ============================================

/**
 * Track page views (called automatically, but can be used for SPAs)
 */
function trackPageView(pageTitle, pagePath) {
    gtag('event', 'page_view', {
        page_title: pageTitle || document.title,
        page_location: window.location.href,
        page_path: pagePath || window.location.pathname
    });
}

/**
 * Track button/link clicks
 */
function trackClick(elementName, elementCategory) {
    gtag('event', 'click', {
        event_category: elementCategory || 'engagement',
        event_label: elementName,
        page_path: window.location.pathname
    });
}

/**
 * Track external link clicks
 */
function trackExternalLink(url, linkText) {
    gtag('event', 'external_link_click', {
        link_url: url,
        link_text: linkText,
        outbound: true
    });
}

/**
 * Track player page views
 */
function trackPlayerView(playerName) {
    gtag('event', 'player_page_view', {
        player_name: playerName,
        page_type: 'player_profile'
    });
}

/**
 * Track season page views
 */
function trackSeasonView(season) {
    gtag('event', 'season_page_view', {
        season: season,
        page_type: 'season_info'
    });
}

/**
 * Track back button clicks
 */
function trackBackButton() {
    gtag('event', 'navigation', {
        event_category: 'navigation',
        event_label: 'back_to_home',
        navigation_type: 'back_button'
    });
}

/**
 * Track language changes
 */
function trackLanguageChange(newLanguage) {
    gtag('event', 'language_change', {
        new_language: newLanguage,
        event_category: 'engagement'
    });
}

// ============================================
// AUTO-TRACK EXTERNAL LINKS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Track all external links automatically
    document.querySelectorAll('a[href^="http"]').forEach(link => {
        // Skip links to your own domain
        if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', function(e) {
                trackExternalLink(this.href, this.textContent.trim());
            });
        }
    });

    // Track back button clicks
    document.querySelectorAll('.back-button, [href="index.html"]').forEach(button => {
        button.addEventListener('click', trackBackButton);
    });

    console.log('✅ Analytics event listeners attached');
});

// ============================================
// TRACK PAGE ENGAGEMENT TIME
// ============================================
let startTime = Date.now();
let engaged = false;

// Track user engagement (scrolling, clicking, typing)
['scroll', 'click', 'keypress'].forEach(event => {
    document.addEventListener(event, function() {
        if (!engaged) {
            engaged = true;
            gtag('event', 'user_engagement', {
                engagement_time_msec: Date.now() - startTime
            });
        }
    }, { once: true });
});

// Track time on page when user leaves
window.addEventListener('beforeunload', function() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
    gtag('event', 'page_exit', {
        time_on_page_seconds: timeSpent,
        page_path: window.location.pathname
    });
});

// ============================================
// TRACK SCROLL DEPTH
// ============================================
let scrollDepthTracked = {
    '25': false,
    '50': false,
    '75': false,
    '100': false
};

window.addEventListener('scroll', function() {
    const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    // Track at 25%, 50%, 75%, 100%
    [25, 50, 75, 100].forEach(depth => {
        if (scrollPercent >= depth && !scrollDepthTracked[depth]) {
            scrollDepthTracked[depth] = true;
            gtag('event', 'scroll_depth', {
                percent_scrolled: depth,
                page_path: window.location.pathname
            });
        }
    });
});

