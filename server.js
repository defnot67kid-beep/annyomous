const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Allow your Chrome extension to access this API
app.use(cors({
    origin: ['chrome-extension://*', 'http://localhost:3000']
}));

// Helper: Parser functions (same as your content.js)
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

// FUNCTION TO PROCESS BIO
function processBio(bioText) {
    if (!bioText) return bioText;
    
    let processed = bioText;
    
    // 1. Replace :hackergif: with direct HTML <img>
    // Since this is server-side, we can't use chrome.runtime.getURL, so we use a CDN or direct URL
    // NOTE: You will need to host your hacker.gif on a public URL (e.g., Imgur or your own server)
    const HACKER_GIF_PUBLIC_URL = "https://i.imgur.com/YOUR_HACKER_GIF_ID.gif"; // <--- REPLACE THIS
    if (processed.includes(':hackergif:')) {
        processed = processed.replace(/:hackergif:/g, 
            `<div class="hacker-gif-container"><img src="${HACKER_GIF_PUBLIC_URL}" class="hacker-gif" alt="hacker"></div>`
        );
    }

    // 2. Parse markdown (typewriter, bold, italic)
    if (processed.includes('[typewrite]') || processed.includes('****') || processed.includes('*') || processed.includes('_')) {
        processed = parseMarkdown(processed);
    }

    return processed;
}

// PROXY ROUTE: /api/users/:id
app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
        // 1. Fetch the real data from PlayVortex
        const response = await axios.get(`https://playvortex.io/api/users/${userId}`);
        const userData = response.data;

        // 2. Modify the bio
        if (userData.bio) {
            userData.bio = processBio(userData.bio);
        }

        // 3. Send back the modified data
        res.json(userData);
    } catch (error) {
        console.error("Error proxying request:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data from PlayVortex" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Bio Render Proxy running on http://localhost:${PORT}`);
    console.log(`📡 Intercepting /api/users/:id`);
});
