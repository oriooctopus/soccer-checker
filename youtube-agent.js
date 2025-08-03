const { chromium } = require('playwright');

class YouTubeSearchAgent {
    constructor() {
        this.preferredChannels = [
            'CBS Sports Golazo',
            'Peacock Sports',
            'ESPN FC',
            'Sky Sports Football',
            'COPA90'
        ];
        this.scorePatterns = [
            /\d+\s*-\s*\d+/,
            /\d+:\d+/,
            /\(\d+\s*-\s*\d+\)/,
            /\[\d+\s*-\s*\d+\]/,
            /\d+\s*x\s*\d+/,
            /\d+-\d+/
        ];
    }

    async searchHighlights(query, maxResults = 20, days = null) {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        try {
            let url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(query);
            
            if (days) {
                if (days === 1) {
                    url += '&sp=EgIIAg%253D%253D';
                } else if (days <= 7) {
                    url += '&sp=EgIIAw%253D%253D';
                } else if (days <= 30) {
                    url += '&sp=EgIIBA%253D%253D';
                }
            }
            
            await page.goto(url);
            
            await page.waitForTimeout(3000);
            
            let videos = [];
            
            try {
                await page.waitForSelector('div#contents ytd-video-renderer', { timeout: 5000 });
                
                videos = await page.$$eval('div#contents ytd-video-renderer', (elements) => {
                    return elements.slice(0, 30).map(element => {
                        const titleElement = element.querySelector('#video-title yt-formatted-string') || 
                                           element.querySelector('a#video-title');
                        const channelElement = element.querySelector('#text a') || 
                                             element.querySelector('ytd-channel-name a') ||
                                             element.querySelector('#channel-name a');
                        const linkElement = element.querySelector('a#video-title');
                        const durationElement = element.querySelector('#time-status span') ||
                                              element.querySelector('ytd-thumbnail-overlay-time-status-renderer span');
                        let uploadDateElement = element.querySelector('ytd-video-meta-block #metadata-line span:nth-child(2)') ||
                                                element.querySelector('#metadata span:nth-child(2)') ||
                                                element.querySelector('.ytd-video-meta-block span:nth-child(2)') ||
                                                element.querySelector('#published-time-text') ||
                                                element.querySelector('span[aria-label*="ago"]');
                        
                        // Fallback: look for any span containing "ago"
                        if (!uploadDateElement || !uploadDateElement.textContent?.includes('ago')) {
                            const allSpans = element.querySelectorAll('span');
                            uploadDateElement = Array.from(allSpans).find(span => 
                                span.textContent && span.textContent.toLowerCase().includes('ago')
                            );
                        }
                        
                        const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title') || '';
                        const channel = channelElement?.textContent?.trim() || '';
                        const href = linkElement?.getAttribute('href') || '';
                        const url = href ? `https://www.youtube.com${href}` : '';
                        const duration = durationElement?.textContent?.trim() || '';
                        const uploadDate = uploadDateElement?.textContent?.trim() || '';
                        
                        return {
                            title,
                            channel,
                            url,
                            duration,
                            uploadDate
                        };
                    }).filter(video => video.title && video.url);
                });
            } catch (selectorError) {
                console.log('Primary selector failed, trying alternative selectors...');
                
                await page.waitForSelector('div[id="contents"]', { timeout: 5000 });
                
                videos = await page.$$eval('div[id="contents"] a[href*="/watch"]', (elements) => {
                    const seen = new Set();
                    return elements.slice(0, 30).map(element => {
                        const title = element.getAttribute('title') || 
                                    element.querySelector('#video-title')?.textContent?.trim() || '';
                        const href = element.getAttribute('href') || '';
                        const url = href ? `https://www.youtube.com${href}` : '';
                        
                        if (!title || !url || seen.has(url)) return null;
                        seen.add(url);
                        
                        const parentContainer = element.closest('ytd-video-renderer') || 
                                              element.closest('div[class*="video"]');
                        const channelElement = parentContainer?.querySelector('a[href*="/channel"]') ||
                                             parentContainer?.querySelector('a[href*="/@"]');
                        const channel = channelElement?.textContent?.trim() || '';
                        let uploadDateElement = parentContainer?.querySelector('ytd-video-meta-block #metadata-line span:nth-child(2)') ||
                                                parentContainer?.querySelector('#metadata span:nth-child(2)') ||
                                                parentContainer?.querySelector('.ytd-video-meta-block span:nth-child(2)') ||
                                                parentContainer?.querySelector('#published-time-text') ||
                                                parentContainer?.querySelector('span[aria-label*="ago"]');
                        
                        // Fallback: look for any span containing "ago"
                        if (!uploadDateElement || !uploadDateElement?.textContent?.includes('ago')) {
                            const allSpans = parentContainer?.querySelectorAll('span') || [];
                            uploadDateElement = Array.from(allSpans).find(span => 
                                span.textContent && span.textContent.toLowerCase().includes('ago')
                            );
                        }
                        const uploadDate = uploadDateElement?.textContent?.trim() || '';
                        
                        return {
                            title,
                            channel,
                            url,
                            duration: '',
                            uploadDate
                        };
                    }).filter(video => video);
                });
            }
            
            return videos.slice(0, maxResults);
            
        } catch (error) {
            console.error('Error searching YouTube:', error);
            return [];
        } finally {
            await browser.close();
        }
    }

    isWithinDays(uploadDate, days) {
        if (!uploadDate || !days) return true;
        
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        
        // Parse YouTube date formats like "1 day ago", "2 weeks ago", "3 months ago"
        const lowerDate = uploadDate.toLowerCase();
        
        if (lowerDate.includes('hour') || lowerDate.includes('minute')) {
            return true; // Less than a day old
        }
        
        if (lowerDate.includes('day')) {
            const dayMatch = lowerDate.match(/(\d+)\s*day/);
            if (dayMatch) {
                const daysAgo = parseInt(dayMatch[1]);
                return daysAgo <= days;
            }
        }
        
        if (lowerDate.includes('week')) {
            const weekMatch = lowerDate.match(/(\d+)\s*week/);
            if (weekMatch) {
                const weeksAgo = parseInt(weekMatch[1]);
                return (weeksAgo * 7) <= days;
            }
        }
        
        if (lowerDate.includes('month') || lowerDate.includes('year')) {
            return false; // Too old
        }
        
        return true; // Default to include if we can't parse
    }

    filterVideos(videos, days = null, teamName = null) {
        return videos.filter(video => {
            const hasScore = this.scorePatterns.some(pattern => 
                pattern.test(video.title) || pattern.test(video.channel)
            );
            
            const isLiveOrUpcoming = video.title.toLowerCase().includes('live') ||
                                   video.title.toLowerCase().includes('upcoming') ||
                                   video.duration === '';
            
            const hasHighlights = video.title.toLowerCase().includes('highlights');
            
            const withinDateRange = this.isWithinDays(video.uploadDate, days);
            
            const lowerTitle = video.title.toLowerCase();
            const isGameSimulation = /fc\d+/.test(lowerTitle) || lowerTitle.includes('career');
            
            const containsTeam = !teamName || lowerTitle.includes(teamName.toLowerCase());
            
            return !hasScore && !isLiveOrUpcoming && hasHighlights && withinDateRange && !isGameSimulation && containsTeam;
        });
    }

    prioritizePreferredChannels(videos, teamName = null) {
        const preferred = [];
        const teamSpecific = [];
        const others = [];
        
        videos.forEach(video => {
            const isPreferred = this.preferredChannels.some(channel => 
                video.channel.toLowerCase().includes(channel.toLowerCase())
            );
            
            const isTeamSpecific = teamName && 
                video.title.toLowerCase().includes(teamName.toLowerCase());
            
            if (isTeamSpecific) {
                teamSpecific.push({ ...video, isPreferred: isPreferred });
            } else if (isPreferred) {
                preferred.push({ ...video, isPreferred: true });
            } else {
                others.push({ ...video, isPreferred: false });
            }
        });
        
        return [...teamSpecific, ...preferred, ...others];
    }

    async searchSoccerHighlights(team1, team2 = null, league = null, days = null) {
        let query = '';
        
        if (team1) {
            query = team1;
            if (team2) {
                query += ` vs ${team2}`;
            }
        }
        
        if (league) {
            const leagueMap = {
                'premiere': 'Premier League',
                'ligue1': 'Ligue 1',
                'laliga': 'La Liga'
            };
            const leagueName = leagueMap[league.toLowerCase()] || league;
            query = query ? `${query} ${leagueName}` : leagueName;
        }
        
        query += ' highlights';
        
        if (days) {
            if (days === 1) {
                query += ' today';
            } else if (days <= 7) {
                query += ' this week';
            } else if (days <= 30) {
                query += ' this month';
            }
        }
        
        console.log(`Searching for: "${query}"`);
        const results = await this.searchHighlights(query, 20, days);
        
        const filteredVideos = this.filterVideos(results, days, team1);
        const sortedVideos = this.prioritizePreferredChannels(filteredVideos, team1);
        
        return sortedVideos;
    }

    async searchRecentFriendlyHighlights(maxResults = 20) {
        const searches = [
            'Premier League friendly highlights 2025',
            'summer friendly highlights Premier League',
            'preseason highlights Premier League teams'
        ];
        
        let allResults = [];
        
        for (const query of searches) {
            try {
                const results = await this.searchHighlights(query, 15);
                allResults = allResults.concat(results);
            } catch (error) {
                console.error(`Error searching "${query}":`, error);
            }
        }
        
        // Filter for single game highlights
        const singleGameHighlights = allResults.filter(video => {
            const title = video.title.toLowerCase();
            
            // Look for "vs" or "v" indicating single match
            const hasSingleMatch = title.includes(' vs ') || title.includes(' v ') || 
                                  title.includes(' vs. ') || title.includes(' v. ');
            
            // Exclude compilations/multiple games
            const isCompilation = title.includes('all ') || title.includes('best ') || 
                                 title.includes('top ') || title.includes('every ') ||
                                 title.includes('goals from') || title.includes('season');
            
            // Look for friendly/preseason indicators
            const isFriendly = title.includes('friendly') || title.includes('preseason') || 
                              title.includes('summer') || title.includes('tour');
            
            return hasSingleMatch && !isCompilation && isFriendly;
        });
        
        // Remove duplicates
        const uniqueResults = singleGameHighlights.filter((video, index, self) => 
            index === self.findIndex(v => v.url === video.url)
        );
        
        return uniqueResults.slice(0, maxResults);
    }
}

module.exports = YouTubeSearchAgent;