require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");

const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = Number(process.env.PORT) || 3002;

// Internal service ports
const PORTS = {
  RECTIFICATION: 3001,
  CARNE: 5000,
  VALIDATOR: 8000
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to handle redirects from proxied services
const handleRedirects = (proxyRes, req, res) => {
  if (proxyRes.headers['location']) {
    const originalLocation = proxyRes.headers['location'];
    // Prevent double prefixing and absolute URL issues
    if (originalLocation.startsWith('/') && !originalLocation.startsWith('//')) {
      const prefix = req.baseUrl;
      proxyRes.headers['location'] = prefix + originalLocation;
    }
  }
};

// --- Reverse Proxy Configuration ---

// Proxy for Rectification service
app.use('/services/rectification', createProxyMiddleware({
  target: `http://localhost:${PORTS.RECTIFICATION}`,
  changeOrigin: true,
  pathRewrite: {
    '^/services/rectification': '',
  },
  onProxyRes: handleRedirects
}));

// Proxy for Carne Universitario service
app.use('/services/carne', createProxyMiddleware({
  target: `http://localhost:${PORTS.CARNE}`,
  changeOrigin: true,
  pathRewrite: {
    '^/services/carne': '',
  },
  onProxyRes: handleRedirects
}));

// Proxy for Photo Validator
app.use('/services/validator', createProxyMiddleware({
  target: `http://localhost:${PORTS.VALIDATOR}`,
  changeOrigin: true,
  pathRewrite: {
    '^/services/validator': '',
  },
  onProxyRes: handleRedirects
}));

app.use(express.static(path.join(__dirname, "public")));

// Health check (useful for Docker/Nginx)
app.get("/health", (req, res) => {
  res.json({ ok: true, services: 'proxy-enabled' });
});

// IMPORTANT: bind to 0.0.0.0 for Docker
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Dashboard running on port ${PORT}`);
});
