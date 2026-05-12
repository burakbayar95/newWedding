import { google } from 'googleapis';
import http from 'node:http';

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('GOOGLE_OAUTH_CLIENT_ID ve GOOGLE_OAUTH_CLIENT_SECRET env olarak verilmeli.');
  process.exit(1);
}

const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://127.0.0.1:53682/oauth2callback';
const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive'],
});

console.log('\n1. Bu URLyi tarayicida ac:');
console.log(authUrl);
console.log('\n2. Google hesabinla izin ver.');

const code = await new Promise((resolve) => {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || '/', redirectUri);
    const codeParam = url.searchParams.get('code');

    if (!codeParam) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Authorization code bulunamadi.');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Yetki alindi. Bu sekmeyi kapatabilirsiniz.');
    server.close();
    resolve(codeParam);
  });

  server.listen(53682, '127.0.0.1', async () => {
    console.log('\nIzin verdikten sonra bu terminal otomatik devam eder.');
  });
});

const { tokens } = await oauth2Client.getToken(code.trim());

if (!tokens.refresh_token) {
  console.error('Refresh token alinmadi. OAuth consent ekraninda prompt=consent ile tekrar deneyin.');
  process.exit(1);
}

console.log('\nGOOGLE_OAUTH_REFRESH_TOKEN=' + tokens.refresh_token);
