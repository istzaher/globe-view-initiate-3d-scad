import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
  console.log(`🌐 SPA Route requested: ${req.path}`);
  
  // Don't intercept API calls or static assets
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/assets') || 
      req.path.startsWith('/data') ||
      req.path.includes('.')) {
    console.log(`❌ Static asset or API call: ${req.path}`);
    res.status(404).send('Not Found');
  } else {
    console.log(`✅ Serving index.html for SPA route: ${req.path}`);
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on port ${port}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'dist')}`);
  console.log(`🌐 React Router SPA mode enabled`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});
