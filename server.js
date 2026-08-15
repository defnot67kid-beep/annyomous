const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow cross-origin requests
app.use(cors({
    origin: ['chrome-extension://*', 'https://playvortex.io']
}));

// --- PARSER FUNCTIONS ---

function parseTypewriter(text) {
    const regex = /\[typewrite\]\(([^)]*)\)\{(\d+)\}/g;
    let match;
    let lastIndex = 0;
    let result = '';

    while ((match = regex.exec(text)) !== null) {
        result += text.substring(lastIndex, match.index);
        const message = match[1];
        const speed = parseInt(match[2], 10);
        const uniqueId = 'tw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        result += `<span id="${uniqueId}" class="typewriter-target" data-message="${message.replace(/"/g, '&quot;')}" data-speed="${speed}"></span>`;
        lastIndex = match.index + match[0].length;
    }
    result += text.substring(lastIndex);
    return result;
}

function parseItalic(text) {
    let parsed = text.replace(/\*([^*]+)\*/g, '<i>$1</i>');
    parsed = parsed.replace(/_([^_]+)_/g, '<i>$1</i>');
    return parsed;
}

function parseBold(text) {
    return text.replace(/\*\*\*\*([^*]+)\*\*\*\*/g, '<b>$1</b>');
}

function parseMarkdown(text) {
    let parsed = parseTypewriter(text);
    parsed = parseBold(parsed);
    parsed = parseItalic(parsed);
    return parsed;
}

// --- GIF REPLACEMENT FUNCTION ---

function processBio(bioText) {
    if (!bioText) return bioText;
    
    let processed = bioText;

    // 🔥 YOUR DIRECT TENOR GIF URL
    const HACKER_GIF_URL = "https://media.tenor.com/xT2K_qHzB2AAAAAC/hacker-pc-meme.gif";

    if (processed.includes(':hackergif:')) {
        processed = processed.replace(/:hackergif:/g, 
            `<div class="hacker-gif-container" style="display:inline-block; border:4px solid #000; border-radius:8px; overflow:hidden; background:#000; box-shadow:0 4px 10px rgba(0,0,0,0.3); width:auto; height:auto;"><img src="${HACKER_GIF_URL}" style="display:block; width:auto; height:auto; max-height:200px; max-width:300px; object-fit:contain;"></div>`
        );
    }

    if (processed.includes('[typewrite]') || processed.includes('****') || processed.includes('*') || processed.includes('_')) {
        processed = parseMarkdown(processed);
    }

    return processed;
}

// --- ROOT ROUTE (Fixes the "Cannot GET /" error) ---
app.get('/', (req, res) => {
    res.send(`
        <h1>PlayVortex Bio Proxy is Running!</h1>
        <p>This server is actively intercepting and formatting bios.</p>
        <p>To use it, your Chrome extension should fetch from: <code>https://annyomous.onrender.com/api/users/&lt;USER_ID&gt;</code></p>
        <hr>
        <h3>Test it manually:</h3>
        <p><a href="/api/users/29286">View processed bio for User 29286</a></p>
    `);
});

// --- MAIN PROXY ROUTE ---
app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
        const response = await axios.get(`https://playvortex.io/api/users/${userId}`);
        const userData = response.data;

        if (userData.bio) {
            userData.bio = processBio(userData.bio);
        }

        res.json(userData);
    } catch (error) {
        console.error("Error proxying request:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data from PlayVortex" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Bio Render Proxy running on port ${PORT}`);
});
