// Simple API layer for the Football Hub PWA
// This can be deployed as serverless functions or used with a CORS proxy

class FootballAPI {
    constructor() {
        this.FOOTBALL_API_KEY = 'e15c14b06c7943cd8ccc0613c28c9f74';
        this.BASE_URL = 'https://api.football-data.org/v4';
        
        // For CORS issues, we could use a proxy or serverless function
        this.CORS_PROXY = null; // Disabled for now
        
        // Team mappings (from our teams.json)
        this.teams = {
            premiere: [
                "Arsenal", "Arsenal FC", "Aston Villa", "Aston Villa FC", "AFC Bournemouth", "Bournemouth", 
                "Brentford", "Brentford FC", "Brighton", "Brighton & Hove Albion", "Brighton & Hove Albion FC", 
                "Burnley", "Burnley FC", "Chelsea", "Chelsea FC", "Crystal Palace", "Crystal Palace FC", 
                "Everton", "Everton FC", "Fulham", "Fulham FC", "Leeds United", "Leeds United FC", 
                "Liverpool", "Liverpool FC", "Manchester City", "Manchester City FC", "Manchester United", 
                "Manchester United FC", "Newcastle United", "Newcastle United FC", "Nottingham Forest", 
                "Nottingham Forest FC", "Sunderland", "Sunderland AFC", "Tottenham", "Tottenham Hotspur", 
                "Tottenham Hotspur FC", "West Ham United", "West Ham United FC", "Wolverhampton Wanderers", 
                "Wolverhampton Wanderers FC", "Wolves"
            ]
        };
    }

    // Get fixtures from Football-Data.org API
    async getFixtures(league = 'premiere', teamName = null, days = 7, backDays = 1) {
        try {
            const leagueMap = {
                'premiere': 'PL',
                'laliga': 'PD', 
                'bundesliga': 'BL1',
                'seriea': 'SA',
                'ligue1': 'FL1'
            };
            
            const competitionCode = leagueMap[league.toLowerCase()] || 'PL';
            
            // Calculate date range
            const now = new Date();
            const startDate = new Date(now.getTime() - (backDays * 24 * 60 * 60 * 1000));
            const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
            
            const dateFrom = startDate.toISOString().split('T')[0];
            const dateTo = endDate.toISOString().split('T')[0];
            
            const url = `${this.BASE_URL}/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
            
            const response = await fetch(url, {
                headers: { 'X-Auth-Token': this.FOOTBALL_API_KEY }
            });
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Transform API data to our format
            const fixtures = data.matches.map(match => {
                const matchDate = new Date(match.utcDate);
                return {
                    date: matchDate.toDateString(),
                    time: matchDate.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    }),
                    homeTeam: match.homeTeam.name,
                    awayTeam: match.awayTeam.name,
                    competition: match.competition.name,
                    status: match.status,
                    score: match.score.fullTime.home !== null ? 
                           `${match.score.fullTime.home}-${match.score.fullTime.away}` : ''
                };
            });
            
            // Filter by team if specified
            const filteredFixtures = this.filterFixtures(fixtures, teamName);
            
            return {
                success: true,
                count: filteredFixtures.length,
                fixtures: filteredFixtures
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                fixtures: []
            };
        }
    }

    // Filter fixtures by team name
    filterFixtures(fixtures, teamName) {
        if (!teamName) return fixtures;
        
        const lowerTeamName = teamName.toLowerCase();
        return fixtures.filter(fixture => {
            const homeMatch = fixture.homeTeam.toLowerCase().includes(lowerTeamName);
            const awayMatch = fixture.awayTeam.toLowerCase().includes(lowerTeamName);
            return homeMatch || awayMatch;
        });
    }

    // Get highlights using CLI integration
    async getHighlights(teamName = null, league = 'premiere', days = 3) {
        try {
            // For GitHub Pages, we need to use a different approach
            // Since we can't run Node.js CLI directly in browser
            
            // Try to use GitHub Actions generated data first
            const dataUrl = '/data/highlights.json';
            try {
                const response = await fetch(dataUrl);
                if (response.ok) {
                    const allHighlights = await response.json();
                    let highlights = allHighlights[league] || [];
                    
                    // Filter by team if specified
                    if (teamName) {
                        const lowerTeam = teamName.toLowerCase();
                        highlights = highlights.filter(highlight => 
                            highlight.title.toLowerCase().includes(lowerTeam)
                        );
                    }
                    
                    return {
                        success: true,
                        count: highlights.length,
                        highlights: highlights
                    };
                }
            } catch (fetchError) {
                console.log('No pre-generated highlights data, using fallback');
            }
            
            // Fallback: Show informative message with CLI command
            return {
                success: true,
                count: 0,
                highlights: [],
                note: `No highlights found in static data. The CLI version works: npm run search -- --team ${teamName || 'Brighton'} --days ${days}. To integrate real-time search, we'd need a serverless function or CORS proxy.`
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                highlights: []
            };
        }
    }

    // Check if team is recognized
    isRecognizedTeam(teamName, league = 'premiere') {
        if (!this.teams[league]) return false;
        
        const lowerTeamName = teamName.toLowerCase();
        return this.teams[league].some(team => 
            team.toLowerCase().includes(lowerTeamName) || 
            lowerTeamName.includes(team.toLowerCase())
        );
    }
}

// For use in browser
if (typeof window !== 'undefined') {
    window.FootballAPI = FootballAPI;
}

// For use in Node.js/serverless
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FootballAPI;
}