import type { MedusaRequest, MedusaResponse } from '@medusajs/framework'

/**
 * GET /admin/seed/categories/ui
 * 
 * Simple HTML page to seed categories
 * Just navigate to this URL and it will automatically run the seeding
 * 
 * Example: http://localhost:9000/admin/seed/categories/ui
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seed Categories - Medusa Admin</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 800px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    h1 {
      font-size: 32px;
      margin-bottom: 10px;
      color: #1a202c;
    }
    
    .subtitle {
      color: #718096;
      margin-bottom: 30px;
      font-size: 16px;
    }
    
    .status {
      padding: 16px 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 500;
    }
    
    .status.loading {
      background: #ebf8ff;
      color: #2c5282;
      border: 2px solid #4299e1;
    }
    
    .status.success {
      background: #f0fff4;
      color: #22543d;
      border: 2px solid #48bb78;
    }
    
    .status.error {
      background: #fff5f5;
      color: #742a2a;
      border: 2px solid #f56565;
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid #e2e8f0;
      border-top-color: #4299e1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .results {
      background: #f7fafc;
      padding: 24px;
      border-radius: 12px;
      margin-top: 24px;
    }
    
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #667eea;
      margin-bottom: 4px;
    }
    
    .stat-label {
      color: #718096;
      font-size: 14px;
    }
    
    .list {
      max-height: 400px;
      overflow-y: auto;
      background: white;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    
    .list-item {
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .list-title {
      font-weight: 600;
      color: #1a202c;
      margin-bottom: 4px;
    }
    
    .list-subtitle {
      font-size: 14px;
      color: #718096;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: #edf2f7;
      color: #2d3748;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      margin: 4px;
    }
    
    button {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 16px;
      transition: background 0.2s;
    }
    
    button:hover {
      background: #5a67d8;
    }
    
    button:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🌱 Seed Categories</h1>
    <p class="subtitle">Automatically create product categories and types</p>
    
    <div id="status" class="status loading">
      <div class="spinner"></div>
      <span>Initializing seeding process...</span>
    </div>
    
    <div id="results" style="display: none;"></div>
    
    <button id="retryBtn" style="display: none;" onclick="runSeeding()">
      Run Again
    </button>
  </div>

  <script>
    async function runSeeding() {
      const statusEl = document.getElementById('status');
      const resultsEl = document.getElementById('results');
      const retryBtn = document.getElementById('retryBtn');
      
      // Show loading state
      statusEl.className = 'status loading';
      statusEl.innerHTML = '<div class="spinner"></div><span>Seeding categories and product types...</span>';
      resultsEl.style.display = 'none';
      retryBtn.style.display = 'none';
      
      try {
        const response = await fetch('/admin/seed/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to seed categories');
        }
        
        const data = await response.json();
        
        // Show success state
        statusEl.className = 'status success';
        statusEl.innerHTML = '<span>✅ Seeding completed successfully!</span>';
        
        // Show results
        resultsEl.style.display = 'block';
        resultsEl.innerHTML = \`
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value">\${data.data.categoriesCount}</div>
              <div class="stat-label">Categories Created</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">\${data.data.productTypesCount}</div>
              <div class="stat-label">Product Types Created</div>
            </div>
          </div>
          
          <h3 style="margin-bottom: 12px; color: #1a202c;">Categories</h3>
          <div class="list">
            \${data.data.categories.slice(0, 20).map(cat => \`
              <div class="list-item">
                <div class="list-title">\${cat.name}</div>
                <div class="list-subtitle">\${cat.handle}</div>
              </div>
            \`).join('')}
            \${data.data.categories.length > 20 ? \`
              <div class="list-item" style="text-align: center; color: #718096;">
                ... and \${data.data.categories.length - 20} more
              </div>
            \` : ''}
          </div>
          
          <h3 style="margin: 24px 0 12px; color: #1a202c;">Product Types</h3>
          <div>
            \${data.data.productTypes.map(pt => \`
              <span class="badge">\${pt.value}</span>
            \`).join('')}
          </div>
        \`;
        
        retryBtn.style.display = 'inline-block';
        
      } catch (error) {
        // Show error state
        statusEl.className = 'status error';
        statusEl.innerHTML = \`<span>❌ Error: \${error.message}</span>\`;
        retryBtn.style.display = 'inline-block';
      }
    }
    
    // Auto-run on page load
    window.addEventListener('load', () => {
      setTimeout(runSeeding, 500);
    });
  </script>
</body>
</html>
  `.trim()

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}

