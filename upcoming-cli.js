#!/usr/bin/env node

const ScheduleAgent = require('./schedule-agent');

function parseArgs(args) {
    const parsed = {
        team: null,
        league: 'premiere',
        days: 7,
        back: 1
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
        } else if (arg.startsWith('--back=')) {
            parsed.back = parseInt(arg.split('=')[1]);
        } else if (arg === '--back' && i + 1 < args.length) {
            parsed.back = parseInt(args[++i]);
        }
    }
    
    return parsed;
}

function validateLeague(league) {
    const validLeagues = ['premiere', 'ligue1', 'laliga', 'bundesliga', 'seriea'];
    return validLeagues.includes(league.toLowerCase());
}

async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Usage: node upcoming-cli.js [--team <team>] [--league <league>] [--days <days>] [--back <back>]');
        console.log('');
        console.log('Options:');
        console.log('  --team     Team name to search for (default: none)');
        console.log('  --league   League: premiere, ligue1, laliga, bundesliga, seriea (default: premiere)');
        console.log('  --days     Days forward to search (default: 7)');
        console.log('  --back     Days backward to include (default: 1)');
        console.log('');
        console.log('Examples:');
        console.log('  node upcoming-cli.js');
        console.log('  node upcoming-cli.js --team Arsenal');
        console.log('  node upcoming-cli.js --league laliga --days 3');
        console.log('  node upcoming-cli.js --team "Real Madrid" --league laliga --back 2');
        process.exit(1);
    }
    
    const parsed = parseArgs(args);
    
    if (parsed.league && !validateLeague(parsed.league)) {
        console.error('❌ Error: Invalid league. Use: premiere, ligue1, laliga, bundesliga, or seriea');
        process.exit(1);
    }
    
    const agent = new ScheduleAgent();
    
    console.log('📅 Fetching football fixtures...\n');
    
    try {
        const fixtures = await agent.searchSchedule(parsed.team, parsed.league, parsed.days, parsed.back);
        
        if (fixtures.length === 0) {
            console.log('❌ No fixtures found. Try a different search term or date range.');
            return;
        }
        
        console.log(`✅ Found ${fixtures.length} fixtures:\n`);
        
        fixtures.forEach((fixture, index) => {
            console.log(`${index + 1}. ${fixture.homeTeam} vs ${fixture.awayTeam}`);
            if (fixture.date) {
                console.log(`   📅 ${fixture.date}`);
            }
            if (fixture.time) {
                console.log(`   ⏰ ${fixture.time}`);
            }
            if (fixture.competition) {
                console.log(`   🏆 ${fixture.competition}`);
            }
            if (fixture.status) {
                console.log(`   📊 ${fixture.status}`);
            }
            if (fixture.score) {
                console.log(`   ⚽ ${fixture.score}`);
            }
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();