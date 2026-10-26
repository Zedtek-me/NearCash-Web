# NearCash Mobile

React Native app for Android and iOS, kept separate from the existing Webpack web app.

## Setup

1. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_NEARCASH_GRAPHQL_API_URL` and `EXPO_PUBLIC_SOCKET_URL`. Set `GOOGLE_MAPS_ANDROID_API_KEY` for Android map tiles.
2. Run `npm install` from this directory.
3. Run `npx expo start` to start Metro. Use an Expo development build for native modules.

Expo Go is not sufficient for React Native Firebase. To enable the native Firebase modules, add `google-services.json` and `GoogleService-Info.plist` in this directory, then rebuild the native app. These files are intentionally gitignored. The project does not yet request FCM permission or upload/refresh device tokens: the backend currently has no device-token registration API.

## Native builds

- Android: `npx expo run:android` locally, or `eas build --platform android` in the cloud.
- iOS: `npx expo run:ios` on macOS with Xcode, or `eas build --platform ios` in the cloud.
- Both: `eas build --platform all`.

An Android/iOS FCM token can be acquired after native Firebase configuration and permission are in place. The backend currently has no device-token registration endpoint/model, so this app does not pretend to register a token server-side. WebSocket notifications continue to work through the existing endpoint.

## Current mobile scope

- Email login/signup and persisted JWT session; Google auth URL/code exchange is wired to the `nearcash://auth/google` callback route.
- Client nearby vendor lookup, policy/assets, local cash request, transaction history and foreground WebSocket alerts.
- Vendor business creation/selection, analytics, transaction history, WebSocket cash/FX/vendor liquidity opportunities, opportunity acceptance, vendor-to-vendor liquidity requests and location sharing.
- FX client requests, live rate offers and acceptance; transaction policy create/edit; identity/settlement details; transaction actions, detail views and native maps.
- WebSocket connection uses the backend's existing `/notification/<user_id>/?token=...` contract, with `EXPO_PUBLIC_SOCKET_URL` set to the socket base URL (for example, the host plus `/ws` if that is how the backend is mounted).

The backend does not currently expose KYC document upload or FCM device-token registration. The mobile app includes BVN/NIN and settlement profile fields, but document capture and end-to-end push registration need those backend capabilities first.

Google sign-in uses the existing `login`/`signup` auth URL and `authorizeWithCode` GraphQL operations. The mobile callback route is `nearcash://auth/google`; the backend/Google OAuth redirect configuration must return the authorization code to that app link for the native flow to complete. The current backend development redirect targets the web callback, so that configuration is still required. No backend code was changed for this mobile integration.
