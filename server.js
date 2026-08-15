const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: ['chrome-extension://*', 'https://playvortex.io']
}));

app.get('/', (req, res) => {
    res.send(`<h1>PlayVortex Bio Proxy is Running!</h1>`);
});

// --- SERVER-SIDE PARSER ---
function parseBioToHTML(text) {
    if (!text) return "";

    // 1. Replace :hackergif: with Tenor GIF
    const HACKER_GIF_URL = "https://media.tenor.com/xT2K_qHzB2AAAAAC/hacker-pc-meme.gif";
    let processed = text.replace(/:hackergif:/g, 
        `<div class="hacker-gif-container" style="display:inline-block; border:4px solid #000; border-radius:8px; overflow:hidden; background:#000; box-shadow:0 4px 10px rgba(0,0,0,0.3); width:auto; height:auto;">
            <img src="${HACKER_GIF_URL}" style="display:block; width:auto; height:auto; max-height:200px; max-width:300px; object-fit:contain;">
         </div>`
    );

    // 2. Convert [typewrite](message){speed} to HTML
    processed = processed.replace(/\[typewrite\]\(([^)]*)\)\{(\d+)\}/g, 
        `<span class="typewriter-target" data-message="$1" data-speed="$2"></span>`
    );

    // 3. Convert **bold** to <b>
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

    // 4. Convert *italic* to <i>
    processed = processed.replace(/\*([^*]+)\*/g, '<i>$1</i>');

    return processed;
}

// --- PROXY ENDPOINT ---
app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
        const response = await axios.get(`https://playvortex.io/api/users/${userId}`);
        const userData = response.data;

        // If there is a bio, parse it into HTML on the SERVER
        if (userData.bio) {
            userData.bio = parseBioToHTML(userData.bio);
        }

        res.json(userData);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).json({ error: "Failed to fetch profile data from PlayVortex" });
    }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
