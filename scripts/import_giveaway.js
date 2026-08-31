/**
 * Helper script to upload Play Console promo codes CSV to Firebase Giveaway
 * 
 * Usage:
 *   node scripts/import_giveaway.js <path-to-promocodes.csv> "<Watch Face Name>" "<com.package.name>" [iconUrl]
 * 
 * Example:
 *   node scripts/import_giveaway.js codes.csv "Ultra 2 Watch Face" "com.amoledwatchfaces.ultra2"
 */

const fs = require('fs');
const https = require('https');

const GIVEAWAY_API_URL = "https://giveawayapi-66490687416.europe-west1.run.app?action=import";
const ADMIN_SECRET = process.env.GIVEAWAY_ADMIN_SECRET || "awf-giveaway-secret-2026";

async function uploadGiveaway() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(`
Usage:
  node scripts/import_giveaway.js <csv_path> "<title>" "[package_name]" "[icon_url]"

Example:
  node scripts/import_giveaway.js promo_codes.csv "Ultra 2 Watch Face" "com.amoledwatchfaces.ultra2"
    `);
    process.exit(1);
  }

  const csvPath = args[0];
  const title = args[1];
  const packageName = args[2] || "";
  const iconUrl = args[3] || "assets/logo_notification.webp";

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: File not found: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf8');

  const payload = JSON.stringify({
    action: "import",
    adminSecret: ADMIN_SECRET,
    title: title,
    packageName: packageName,
    iconUrl: iconUrl,
    codesCsv: csvContent
  });

  const url = new URL(GIVEAWAY_API_URL);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
      'x-admin-secret': ADMIN_SECRET
    }
  };

  console.log(`Uploading promo codes for '${title}'...`);

  const req = https.request(options, (res) => {
    let responseData = '';
    res.on('data', (chunk) => { responseData += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(responseData);
        if (res.statusCode === 200 && json.success) {
          console.log(`\n🎉 Success! ${json.message}`);
          console.log(`Total Codes: ${json.totalCodes}`);
        } else {
          console.error(`\n❌ Upload failed (${res.statusCode}):`, json.error || responseData);
        }
      } catch (e) {
        console.error(`\n❌ Error parsing response (${res.statusCode}):`, responseData);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Network request error:`, e.message);
  });

  req.write(payload);
  req.end();
}

uploadGiveaway();
