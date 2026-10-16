
import config from './config.js';

/**
 * Register the Cyber Securet Linked Role metadata.
 * Run once after configuring the environment variables.
 */
const url = `https://discord.com/api/v10/applications/${config.DISCORD_CLIENT_ID}/role-connections/metadata`;

const body = [
  {
    key: 'cybersecuretapproved',
    name: 'Cyber Securet Freigabe',
    description: 'Wurde von Cyber Securet freigegeben',
    type: 7,
  },
];

const response = await fetch(url, {
  method: 'PUT',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bot ${config.DISCORD_TOKEN}`,
  },
});

const data = await response.text();

if (response.ok) {
  console.log('Cyber Securet Linked Role Metadaten registriert.');
  console.log(data);
} else {
  console.error(`Fehler beim Registrieren: ${response.status}`);
  console.error(data);
  process.exitCode = 1;
}
