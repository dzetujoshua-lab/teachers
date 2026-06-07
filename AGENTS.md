# Commands

## Development

Run dev server with OpenSSL legacy provider (required for Node.js 17+):

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"; npm run dev
```

Or upgrade firebase-admin to v13+ for native OpenSSL 3.0 support:

```powershell
npm install firebase-admin@^13
```