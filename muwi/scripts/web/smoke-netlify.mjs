const baseUrl = process.env.MUWI_SMOKE_URL || 'https://uddesa.netlify.app';
const routes = ['/', '/academic', '/drafts/draft-123', '/not-a-route'];

function isHtmlResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('text/html');
}

async function main() {
  for (const route of routes) {
    const url = new URL(route, baseUrl).toString();
    const response = await fetch(url, { redirect: 'follow' });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`${url} returned HTTP ${response.status}`);
    }

    if (!isHtmlResponse(response)) {
      throw new Error(`${url} did not return HTML`);
    }

    if (!body.includes('<div id="root"></div>')) {
      throw new Error(`${url} response does not look like the MUWI app shell`);
    }

    console.log(`[smoke-netlify] PASS ${route} -> ${response.status}`);
  }
}

main().catch((error) => {
  console.error('[smoke-netlify] FAIL', error);
  process.exit(1);
});
