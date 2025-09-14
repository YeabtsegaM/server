const express = require('express');
const app = express();
const port = 5001;

// Basic JSON parsing
app.use(express.json());

// Test endpoint
app.post('/test', (req, res) => {
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({
    success: true,
    received: req.body
  });
});

app.listen(port, () => {
  console.log(`Minimal test server running on port ${port}`);
}); 