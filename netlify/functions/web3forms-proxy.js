const WEB3FORMS_URL = process.env.WEB3FORMS_URL || 'https://api.web3forms.com/submit';
const WEB3FORMS_ACCESS_KEY = process.env.WEB3FORMS_ACCESS_KEY;

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const parseBody = (event) => {
  if (!event.body) return {};
  const bodyString = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';

  try {
    if (contentType.includes('application/json')) {
      return JSON.parse(bodyString);
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      return Object.fromEntries(new URLSearchParams(bodyString));
    }
  } catch (error) {
    console.warn('Failed to parse request body', error);
  }

  return {};
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: defaultHeaders };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: defaultHeaders,
      body: JSON.stringify({ success: false, message: 'Method not allowed' })
    };
  }

  if (!WEB3FORMS_ACCESS_KEY) {
    return {
      statusCode: 500,
      headers: defaultHeaders,
      body: JSON.stringify({ success: false, message: 'Web3Forms access key is not configured' })
    };
  }

  const payload = parseBody(event);
  const errors = [];

  const botcheckValue = `${payload.botcheck || ''}`.trim();
  if (botcheckValue) {
    errors.push('Bot check failed.');
  }

  const requiredFields = ['first', 'last', 'email', 'message'];
  requiredFields.forEach((field) => {
    if (!payload[field] || !`${payload[field]}`.trim()) {
      errors.push(`${field} is required.`);
    }
  });

  if (payload.email && !isValidEmail(payload.email)) {
    errors.push('Email is invalid.');
  }

  if (errors.length) {
    return {
      statusCode: 400,
      headers: defaultHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Validation failed',
        errors
      })
    };
  }

  const formData = new FormData();
  formData.set('access_key', WEB3FORMS_ACCESS_KEY);
  formData.set('from_name', payload.from_name || 'Capital Retained Search Website');
  formData.set('subject', payload.subject || 'New Capital Retained Search inquiry');
  formData.set('page', payload.page || event.headers.referer || 'https://capitalretainedsearch.com');
  formData.set('timestamp', new Date().toISOString());
  formData.set('source', payload.source || 'contact-form');

  Object.entries(payload).forEach(([key, value]) => {
    if (!value || key === 'botcheck') return;
    formData.set(key, value);
  });

  let response;
  let json;

  try {
    response = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: formData
    });

    json = await response.json().catch(() => null);
  } catch (error) {
    console.error('Error forwarding to Web3Forms', error);
    return {
      statusCode: 502,
      headers: defaultHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Failed to reach Web3Forms',
        error: error.message
      })
    };
  }

  const success = json?.success ?? response.ok;

  return {
    statusCode: response.status,
    headers: defaultHeaders,
    body: JSON.stringify({
      success,
      status: json?.status ?? response.status,
      message: json?.message || (success
        ? 'Message sent successfully.'
        : 'Failed to submit form. Please email kathryn@capitalretainedsearch.com directly.'),
      data: json?.data ?? null
    })
  };
};
