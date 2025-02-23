const express = require('express');
const axios = require('axios');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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