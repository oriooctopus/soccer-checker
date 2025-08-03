#!/usr/bin/env node

const YouTubeSearchAgent = require('./youtube-agent');

function parseArgs(args) {
    const parsed = {
        team: null,
        league: 'premiere',
        days: 3
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        if (arg.startsWith('--team=')) {
            parsed.team = arg.split('=')[1];
        } else if (arg === '--team' && i + 1 < args.length) {
            parsed.team = args[++i];
        } else if (arg.startsWith('--league=')) {
            parsed.league = arg.split('=')[1];
        } else if (arg === '--league' && i + 1 < args.length) {
            parsed.league = args[++i];
        } else if (arg.startsWith('--days=')) {
            parsed.days = parseInt(arg.split('=')[1]);
        } else if (arg === '--days' && i + 1 < args.length) {
            parsed.days = parseInt(args[++i]);
        }
    }
    
    return parsed;
}

function validateLeague(league) {
    const validLeagues = ['premiere', 'ligue1', 'laliga'];
    return validLeagues.includes(league.toLowerCase());
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Usage: node cli.js [--team <team>] [--league <league>] [--days <days>]');
        console.log('');
        console.log('Options:');
        console.log('  --team     Team name to search for (default: none)');
        console.log('  --league   League: premiere, ligue1, or laliga (default: premiere)');
        console.log('  --days     Days back to search (default: 3)');
        console.log('');
        console.log('Examples:');
        console.log('  node cli.js');
        console.log('  node cli.js --team Arsenal');
        console.log('  node cli.js --league laliga --days 1');
        console.log('  node cli.js --team "Real Madrid" --league laliga --days 1');
        process.exit(1);
    }
    
    const parsed = parseArgs(args);
    
    if (parsed.league && !validateLeague(parsed.league)) {
        console.error('❌ Error: Invalid league. Use: premiere, ligue1, or laliga');
        process.exit(1);
    }
    
    const agent = new YouTubeSearchAgent();
    
    console.log('🔍 Searching for spoiler-free soccer highlights...\n');
    
    try {
        const results = await agent.searchSoccerHighlights(parsed.team, null, parsed.league, parsed.days);
        
        if (results.length === 0) {
            console.log('❌ No spoiler-free results found. Try a different search term.');
            return;
        }
        
        console.log(`✅ Found ${results.length} spoiler-free results:\n`);
        
        results.forEach((video, index) => {
            const preferredIcon = video.isPreferred ? '⭐ ' : '';
            console.log(`${index + 1}. ${preferredIcon}${video.title}`);
            console.log(`   📺 ${video.channel}`);
            console.log(`   🔗 ${video.url}`);
            if (video.duration) {
                console.log(`   ⏱️  ${video.duration}`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();