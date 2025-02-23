const express = require('express');
const axios = require('axios');
const app = express();
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 3, // limit each IP to 3 requests per windowMs
    message: 'Too many requests, please try again later.'
});

app.use('/proxy', limiter);

app.get('/proxy', async (req, res) => {
    const { url, country, browser } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        const headers = {
            'User-Agent': browser || 'Mozilla/5.0',
            'X-Forwarded-For': country || 'VN',
        };

        const response = await axios.get(url, { headers });
        res.send(response.data);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/winfo', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('URL is required');
    }

    try {
        // Add protocol if missing and validate URL
        let fullUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            fullUrl = `https://${url}`;
        }

        // Validate and parse URL
        let parsedUrl;
        try {
            parsedUrl = new URL(fullUrl);
        } catch (e) {
            return res.status(400).send('Invalid URL format');
        }

        // Get response from the full URL including subdomain
        const response = await axios.get(fullUrl);
        const html = response.data;
        
        const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '';
        const description = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] || 
                          html.match(/<meta[^>]*content="([^"]*)"[^>]*name="description"[^>]*>/i)?.[1] || '';
        
        // Enhanced favicon detection
        const faviconMatches = [
            // Check subdomain-specific favicon
            html.match(/<link[^>]*rel="icon"[^>]*href="([^"]*)"[^>]*>/i)?.[1],
            html.match(/<link[^>]*rel="shortcut icon"[^>]*href="([^"]*)"[^>]*>/i)?.[1],
            html.match(/<link[^>]*href="([^"]*)"[^>]*rel="icon"[^>]*>/i)?.[1],
            // Default favicon path
            '/favicon.ico'
        ];

        // Get the first valid favicon URL
        const faviconPath = faviconMatches.find(f => f) || '/favicon.ico';
        
        // Construct absolute favicon URL while preserving subdomain
        let faviconUrl;
        try {
            // Handle absolute and relative paths
            faviconUrl = new URL(faviconPath, fullUrl).href;
        } catch (e) {
            // Fallback to default favicon at the current domain
            faviconUrl = `${parsedUrl.protocol}//${parsedUrl.host}/favicon.ico`;
        }

        res.send({
            title,
            description,
            favicon: faviconUrl,
            domain: parsedUrl.hostname,
            subdomain: parsedUrl.hostname.split('.')[0],
            fullUrl: fullUrl
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});