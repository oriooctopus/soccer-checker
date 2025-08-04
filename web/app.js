// App state
let currentTab = 'highlights';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    
    // Load saved preferences
    loadPreferences();
});

// Tab functionality
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update active tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    currentTab = tabName;
    savePreferences();
}

// Search highlights
async function searchHighlights() {
    const team = document.getElementById('highlights-team').value.trim();
    const league = document.getElementById('highlights-league').value;
    const days = document.getElementById('highlights-days').value;
    const resultsDiv = document.getElementById('highlights-results');
    
    // Show loading
    resultsDiv.innerHTML = '<div class="loading">🔍 Searching for highlights...</div>';
    
    try {
        // Load FootballAPI and search for highlights
        const api = new FootballAPI();
        const result = await api.getHighlights(team, league, parseInt(days));
        
        if (result.success) {
            resultsDiv.innerHTML = renderHighlights(result.highlights);
            if (result.note) {
                resultsDiv.innerHTML += `<div class="warning"><p><strong>Note:</strong> ${result.note}</p></div>`;
            }
        } else {
            resultsDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> ${result.error}</div>`;
        }
        
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>❌ Error</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Search fixtures
async function searchFixtures() {
    const team = document.getElementById('fixtures-team').value.trim();
    const league = document.getElementById('fixtures-league').value;
    const days = document.getElementById('fixtures-days').value;
    const resultsDiv = document.getElementById('fixtures-results');
    
    // Show loading
    resultsDiv.innerHTML = '<div class="loading">📅 Fetching fixtures...</div>';
    
    try {
        // First try loading from static data
        const dataUrl = '/data/fixtures.json';
        const response = await fetch(dataUrl);
        
        if (response.ok) {
            const allFixtures = await response.json();
            const leagueFixtures = allFixtures[league] || [];
            
            // Filter by team if specified
            let filteredFixtures = leagueFixtures;
            if (team) {
                const lowerTeam = team.toLowerCase();
                filteredFixtures = leagueFixtures.filter(fixture => 
                    fixture.homeTeam.toLowerCase().includes(lowerTeam) ||
                    fixture.awayTeam.toLowerCase().includes(lowerTeam)
                );
            }
            
            // Filter by date range
            const now = new Date();
            const cutoffDate = new Date(now.getTime() + (parseInt(days) * 24 * 60 * 60 * 1000));
            
            filteredFixtures = filteredFixtures.filter(fixture => {
                const fixtureDate = new Date(fixture.date);
                return fixtureDate <= cutoffDate;
            });
            
            resultsDiv.innerHTML = renderFixtures(filteredFixtures);
        } else {
            // Fallback to API call
            const api = new FootballAPI();
            const result = await api.getFixtures(league, team, parseInt(days));
            
            if (result.success) {
                resultsDiv.innerHTML = renderFixtures(result.fixtures);
            } else {
                resultsDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> ${result.error}</div>`;
            }
        }
        
    } catch (error) {
        resultsDiv.innerHTML = `
            <div class="error">
                <strong>❌ Error</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Helper function to render highlights
function renderHighlights(highlights) {
    if (!highlights || highlights.length === 0) {
        return '<div class="welcome-message"><p>No highlights found. Try adjusting your search criteria.</p></div>';
    }
    
    const html = `
        <div class="success-count">✅ Found ${highlights.length} highlights</div>
        ${highlights.map((video, index) => `
            <div class="video-card">
                <div class="video-title">
                    ${video.isPreferred ? '⭐ ' : ''}
                    <a href="${video.url}" target="_blank" rel="noopener">
                        ${video.title}
                    </a>
                </div>
                <div class="video-meta">
                    <div class="meta-item">
                        📺 ${video.channel}
                    </div>
                    ${video.duration ? `
                        <div class="meta-item">
                            ⏱️ ${video.duration}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    `;
    
    return html;
}

// Helper function to render fixtures
function renderFixtures(fixtures) {
    if (!fixtures || fixtures.length === 0) {
        return '<div class="welcome-message"><p>No fixtures found. Try adjusting your search criteria.</p></div>';
    }
    
    const html = `
        <div class="success-count">✅ Found ${fixtures.length} fixtures</div>
        ${fixtures.map(fixture => `
            <div class="fixture-card">
                <div class="fixture-teams">
                    ${fixture.homeTeam} vs ${fixture.awayTeam}
                </div>
                <div class="fixture-meta">
                    <div class="meta-item">
                        📅 ${fixture.date}
                    </div>
                    <div class="meta-item">
                        ⏰ ${fixture.time}
                    </div>
                    <div class="meta-item">
                        🏆 ${fixture.competition}
                    </div>
                    <div class="meta-item">
                        📊 ${fixture.status}
                    </div>
                    ${fixture.score ? `
                        <div class="meta-item">
                            ⚽ ${fixture.score}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    `;
    
    return html;
}

// Save user preferences
function savePreferences() {
    const prefs = {
        currentTab,
        highlightsTeam: document.getElementById('highlights-team')?.value || '',
        highlightsLeague: document.getElementById('highlights-league')?.value || 'premiere',
        highlightsDays: document.getElementById('highlights-days')?.value || '3',
        fixturesTeam: document.getElementById('fixtures-team')?.value || '',
        fixturesLeague: document.getElementById('fixtures-league')?.value || 'premiere',
        fixturesDays: document.getElementById('fixtures-days')?.value || '7'
    };
    
    localStorage.setItem('footballAppPrefs', JSON.stringify(prefs));
}

// Load user preferences
function loadPreferences() {
    try {
        const prefs = JSON.parse(localStorage.getItem('footballAppPrefs') || '{}');
        
        if (prefs.currentTab) {
            switchTab(prefs.currentTab);
        }
        
        // Restore form values
        if (prefs.highlightsTeam) document.getElementById('highlights-team').value = prefs.highlightsTeam;
        if (prefs.highlightsLeague) document.getElementById('highlights-league').value = prefs.highlightsLeague;
        if (prefs.highlightsDays) document.getElementById('highlights-days').value = prefs.highlightsDays;
        if (prefs.fixturesTeam) document.getElementById('fixtures-team').value = prefs.fixturesTeam;
        if (prefs.fixturesLeague) document.getElementById('fixtures-league').value = prefs.fixturesLeague;
        if (prefs.fixturesDays) document.getElementById('fixtures-days').value = prefs.fixturesDays;
        
    } catch (error) {
        console.log('Could not load preferences:', error);
    }
}

// Save preferences when form values change
document.addEventListener('change', (e) => {
    if (e.target.matches('input, select')) {
        savePreferences();
    }
});

// Install prompt for PWA
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    showInstallPrompt();
});

function showInstallPrompt() {
    // You can customize this to show an install button
    const installBanner = document.createElement('div');
    installBanner.innerHTML = `
        <div style="position: fixed; bottom: 20px; left: 20px; right: 20px; background: #2563eb; color: white; padding: 1rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000;">
            <p style="margin: 0 0 0.5rem 0; font-weight: 500;">📱 Install Football App</p>
            <p style="margin: 0 0 1rem 0; font-size: 0.9rem; opacity: 0.9;">Add to home screen for quick access!</p>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="installApp()" style="flex: 1; padding: 0.5rem; background: white; color: #2563eb; border: none; border-radius: 6px; font-weight: 500; cursor: pointer;">Install</button>
                <button onclick="dismissInstall()" style="padding: 0.5rem 1rem; background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3); border-radius: 6px; cursor: pointer;">Later</button>
            </div>
        </div>
    `;
    document.body.appendChild(installBanner);
    window.installBanner = installBanner;
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
        });
    }
    dismissInstall();
}

function dismissInstall() {
    if (window.installBanner) {
        window.installBanner.remove();
    }
}