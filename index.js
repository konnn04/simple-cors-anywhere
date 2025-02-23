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

app.listen(port, () => {
    console.log(`Proxy server running on port ${port}`);
});