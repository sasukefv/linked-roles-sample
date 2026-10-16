
import express from 'express';
import cookieParser from 'cookie-parser';

import config from './config.js';
import * as discord from './discord.js';
import * as storage from './storage.js';

const app = express();
app.use(express.json());
app.use(cookieParser(config.COOKIE_SECRET));

// HIER die erlaubten Discord-User-IDs eintragen.
const ALLOWED_USERS = [
  '1434946939597881384',
  // 'WEITERE_DISCORD_USER_ID',
];

app.get('/', (req, res) => {
  res.send('Cyber Securet Linked Roles läuft.');
});

app.get('/linked-role', async (req, res) => {
  try {
    const { url, state } = discord.getOAuthUrl();

    res.cookie('clientState', state, {
      maxAge: 1000 * 60 * 5,
      signed: true,
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
    });

    res.redirect(url);
  } catch (error) {
    console.error('Linked-Role-Start fehlgeschlagen:', error);
    res.sendStatus(500);
  }
});

app.get('/discord-oauth-callback', async (req, res) => {
  try {
    const code = req.query.code;
    const discordState = req.query.state;
    const { clientState } = req.signedCookies;

    res.clearCookie('clientState');

    if (!code || !discordState || clientState !== discordState) {
      return res.status(403).send('Ungültige Anmeldung. Bitte erneut versuchen.');
    }

    const tokens = await discord.getOAuthTokens(code);
    const meData = await discord.getUserData(tokens);
    const userId = meData.user.id;

    await storage.storeDiscordTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    });

    await updateMetadata(userId);

    res.send(
      ALLOWED_USERS.includes(userId)
        ? 'Cyber Securet: Du bist freigeschaltet! Kehre zu Discord zurück.'
        : 'Cyber Securet: Du bist nicht für diese Linked Role freigeschaltet. Kehre zu Discord zurück.'
    );
  } catch (error) {
    console.error('Linked-Role-Callback fehlgeschlagen:', error);
    res.status(500).send('Die Verifizierung ist fehlgeschlagen. Bitte Logs prüfen.');
  }
});

app.post('/update-metadata', async (req, res) => {
  // Dieser Endpunkt darf nicht öffentlich Änderungen für beliebige Nutzer auslösen.
  // Die Metadaten werden nach der sicheren Discord-Anmeldung aktualisiert.
  return res.sendStatus(403);
});

async function updateMetadata(userId) {
  const tokens = await storage.getDiscordTokens(userId);

  const metadata = {
    cybersecuretapproved: ALLOWED_USERS.includes(userId) ? 1 : 0,
  };

  await discord.pushMetadata(userId, tokens, metadata);
}

const port = process.env.PORT || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Cyber Securet Linked Roles läuft auf Port ${port}`);
});
