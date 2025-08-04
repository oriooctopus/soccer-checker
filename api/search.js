// Serverless function for Vercel/Netlify to handle CORS and API calls
const { spawn } = require('child_process');
const path = require('path');

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    const { type, team, league, days } = req.query;
    
    try {
        if (type === 'highlights') {
            // Use the CLI to search for highlights
            const result = await runCLI('search', { team, league, days });
            return res.json({ success: true, highlights: result });
        } else if (type === 'fixtures') {
            // Use the CLI to get fixtures
            const result = await runCLI('upcoming', { team, league, days });
            return res.json({ success: true, fixtures: result });
        } else {
            return res.status(400).json({ error: 'Invalid type parameter' });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

function runCLI(command, params) {
    return new Promise((resolve, reject) => {
        const args = [];
        if (params.team) args.push('--team', params.team);
        if (params.league) args.push('--league', params.league);
        if (params.days) args.push('--days', params.days);
        
        const scriptPath = command === 'search' ? 
            path.join(process.cwd(), 'cli.js') : 
            path.join(process.cwd(), 'upcoming-cli.js');
            
        const child = spawn('node', [scriptPath, ...args]);
        
        let output = '';
        let error = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            error += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                try {
                    // Parse the CLI output
                    const result = parseCLIOutput(output, command);
                    resolve(result);
                } catch (parseError) {
                    reject(new Error(`Parse error: ${parseError.message}`));
                }
            } else {
                reject(new Error(`CLI error: ${error || 'Unknown error'}`));
            }
        });
    });
}

function parseCLIOutput(output, command) {
    // Parse the CLI output to extract structured data
    const lines = output.split('\n').filter(line => line.trim());
    
    if (command === 'search') {
        // Parse highlights output
        const highlights = [];
        let currentVideo = null;
        
        for (const line of lines) {
            if (line.includes('✅ Found')) continue;
            if (line.includes('⭐') || line.includes('📺')) {
                if (currentVideo) highlights.push(currentVideo);
                currentVideo = {
                    title: line.replace(/^⭐\s*/, '').trim(),
                    isPreferred: line.includes('⭐'),
                    url: '', // Extract from next line if available
                    channel: '',
                    duration: ''
                };
            } else if (currentVideo && line.includes('https://')) {
                currentVideo.url = line.trim();
            }
        }
        if (currentVideo) highlights.push(currentVideo);
        
        return highlights;
    } else {
        // Parse fixtures output  
        const fixtures = [];
        let currentFixture = null;
        
        for (const line of lines) {
            if (line.includes('vs')) {
                if (currentFixture) fixtures.push(currentFixture);
                const match = line.match(/(.+?) vs (.+?)$/);
                if (match) {
                    currentFixture = {
                        homeTeam: match[1].trim(),
                        awayTeam: match[2].trim(),
                        date: '',
                        time: '',
                        competition: '',
                        status: 'Scheduled'
                    };
                }
            }
        }
        if (currentFixture) fixtures.push(currentFixture);
        
        return fixtures;
    }
}