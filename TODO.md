# TODO

## Firebase session cookie creation failing (ERR_OSSL_UNSUPPORTED)
- [ ] Confirm Node version and firebase-admin version compatibility
- [ ] Fix dependency mismatch (firebase-admin version vs package.json)
- [ ] Retry after cleaning node_modules + reinstall
- [ ] If still failing, try NODE_OPTIONS=--openssl-legacy-provider workaround
- [ ] Ensure FIREBASE_ADMIN_PRIVATE_KEY is correctly formatted in .env.local
- [ ] Retest POST /api/auth/session

