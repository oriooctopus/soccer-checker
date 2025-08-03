const YouTubeSearchAgent = require('./youtube-agent');

async function main() {
    const agent = new YouTubeSearchAgent();
    
    console.log('=== Testing YouTube Soccer Highlights Agent ===\n');
    
    try {
        console.log('Searching for Arsenal highlights...');
        const results = await agent.searchSoccerHighlights('Arsenal', null, 'Premier League');
        
        console.log(`\nFound ${results.length} spoiler-free results:\n`);
        
        results.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title}`);
            console.log(`   Channel: ${video.channel} ${video.isPreferred ? '⭐ (Preferred)' : ''}`);
            console.log(`   URL: ${video.url}`);
            console.log(`   Duration: ${video.duration}\n`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

if (require.main === module) {
    main();
}