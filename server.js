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

// REPLACE ONLY :hackergif:
app.get('/api/users/:id', async (req, res) => {
    const userId = req.params.id;
    
    try {
        const response = await axios.get(`https://playvortex.io/api/users/${userId}`);
        const userData = response.data;

        if (userData.bio && userData.bio.includes(':hackergif:')) {
            // Direct Tenor URL
            const HACKER_GIF_URL = "https://media.tenor.com/xT2K_qHzB2AAAAAC/hacker-pc-meme.gif";
            
            // Replace the text with the HTML
            userData.bio = userData.bio.replace(/:hackergif:/g, 
                `<div class="hacker-gif-container" style="display:inline-block; border:4px solid #000; border-radius:8px; overflow:hidden; background:#000; box-shadow:0 4px 10px rgba(0,0,0,0.3); width:auto; height:auto;"><img src="${HACKER_GIF_URL}" style="display:block; width:auto; height:auto; max-height:200px; max-width:300px; object-fit:contain;"></div>`
            );
        }

        res.json(userData);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch profile data from PlayVortex" });
    }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
