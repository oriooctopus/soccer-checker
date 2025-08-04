const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');

class ScheduleAgent {
    constructor() {
        this.teams = this.loadTeams();
    }

    loadTeams() {
        try {
            const teamsPath = path.join(__dirname, 'teams.json');
            const teamsData = fs.readFileSync(teamsPath, 'utf8');
            return JSON.parse(teamsData);
        } catch (error) {
            console.error('Error loading teams data:', error);
            return {};
        }
    }

    isRecognizedTeam(teamName) {
        const lowerTeamName = teamName.toLowerCase();
        for (const league in this.teams) {
            for (const team of this.teams[league]) {
                if (lowerTeamName.includes(team.toLowerCase()) || team.toLowerCase().includes(lowerTeamName)) {
                    return true;
                }
            }
        }
        return false;
    }

    async searchSchedule(teamName = null, league = null, days = 7, backDays = 1) {
        try {
            const API_KEY = 'e15c14b06c7943cd8ccc0613c28c9f74';
            
            // Map league names to Football-Data.org competition codes
            const leagueMap = {
                'premiere': 'PL',
                'laliga': 'PD', 
                'bundesliga': 'BL1',
                'seriea': 'SA',
                'ligue1': 'FL1'
            };
            
            const competitionCode = leagueMap[league?.toLowerCase()] || 'PL';
            
            // Calculate date range
            const now = new Date();
            const startDate = new Date(now.getTime() - (backDays * 24 * 60 * 60 * 1000));
            const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
            
            const dateFrom = startDate.toISOString().split('T')[0];
            const dateTo = endDate.toISOString().split('T')[0];
            
            const url = `https://api.football-data.org/v4/competitions/${competitionCode}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;
            
            
            // Use built-in https module instead of fetch
            const data = await new Promise((resolve, reject) => {
                const req = https.get(url, {
                    headers: { 'X-Auth-Token': API_KEY }
                }, (res) => {
                    let body = '';
                    
                    res.on('data', (chunk) => {
                        body += chunk;
                    });
                    
                    res.on('end', () => {
                        try {
                            if (res.statusCode !== 200) {
                                reject(new Error(`API Error: ${res.statusCode} ${res.statusMessage}`));
                                return;
                            }
                            const jsonData = JSON.parse(body);
                            resolve(jsonData);
                        } catch (error) {
                            reject(new Error(`JSON Parse Error: ${error.message}`));
                        }
                    });
                });
                
                req.on('error', (error) => {
                    reject(new Error(`Network Error: ${error.message}`));
                });
                
                req.setTimeout(10000, () => {
                    req.destroy();
                    reject(new Error('Request timeout'));
                });
            });
            
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
            
            // Filter fixtures based on criteria
            const filteredFixtures = this.filterFixtures(fixtures, teamName, days, backDays);
            
            return filteredFixtures;
            
        } catch (error) {
            console.error('Error fetching fixtures from Football-Data.org:', error.message);
            return [];
        }
    }

    filterFixtures(fixtures, teamName = null, days = 7, backDays = 1) {
        const now = new Date();
        const startDate = new Date(now.getTime() - (backDays * 24 * 60 * 60 * 1000));
        const endDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
        
        return fixtures.filter(fixture => {
            // Filter by team if specified
            if (teamName) {
                const lowerTeamName = teamName.toLowerCase();
                const homeMatch = fixture.homeTeam.toLowerCase().includes(lowerTeamName);
                const awayMatch = fixture.awayTeam.toLowerCase().includes(lowerTeamName);
                
                
                if (!homeMatch && !awayMatch) {
                    return false;
                }
            }
            
            // Filter by recognized teams
            const homeTeamRecognized = this.isRecognizedTeam(fixture.homeTeam);
            const awayTeamRecognized = this.isRecognizedTeam(fixture.awayTeam);
            if (!homeTeamRecognized || !awayTeamRecognized) {
                return false;
            }
            
            // TODO: Add date filtering when we can properly parse fixture dates
            // For now, include all fixtures and rely on the source to provide recent ones
            
            return true;
        });
    }

    async getLineup(teamName, matchDate) {
        // This would fetch lineup data for completed matches
        // Implementation would depend on the data source
        // For now, return placeholder
        return {
            homeTeam: {
                formation: "4-3-3",
                players: []
            },
            awayTeam: {
                formation: "4-2-3-1", 
                players: []
            }
        };
    }
}

module.exports = ScheduleAgent;