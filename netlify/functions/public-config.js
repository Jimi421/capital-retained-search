const safeConfig = {
  apiUrl: process.env.PUBLIC_API_URL || null,
  formEndpoint: process.env.PUBLIC_FORM_ENDPOINT || '/.netlify/functions/web3forms-proxy',
  analyticsId: process.env.PUBLIC_ANALYTICS_ID || null,
  recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || null,
  web3formsUrl: process.env.PUBLIC_WEB3FORMS_PROXY_URL || '/.netlify/functions/web3forms-proxy'
};

exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store'
    },
    body: `window.CRS_CONFIG = window.CRS_CONFIG || {}; Object.assign(window.CRS_CONFIG, ${JSON.stringify(safeConfig)});`
  };
};
