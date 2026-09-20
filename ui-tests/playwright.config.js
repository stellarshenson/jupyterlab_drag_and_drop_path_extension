/**
 * Configuration for Playwright using default from @jupyterlab/galata
 */
const baseConfig = require('@jupyterlab/galata/lib/playwright-config');

// Galata resolves its baseURL as use.baseURL -> TARGET_URL -> hardcoded :8888, and its
// base config sets no use.baseURL, so this file must supply it. One variable feeds both
// ends: here and jupyter_server_test_config.py.
const PORT = process.env.JUPYTER_TEST_PORT || '8888';
const BASE_URL = `http://localhost:${PORT}`;

module.exports = {
  ...baseConfig,
  // One JupyterLab server is shared by every worker, so parallel workers
  // contend for it and galata's page-readiness probe starts timing out under
  // the load. Serial is slower and deterministic, which is the right trade
  // for a suite whose failures are supposed to mean something.
  workers: 1,
  use: {
    ...baseConfig.use,
    baseURL: BASE_URL
  },
  webServer: {
    command: 'jlpm start',
    url: `${BASE_URL}/lab`,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI
  }
};
