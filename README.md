# VNV Site — site engineer app

React Native CLI app (RN 0.83, New Architecture, no Expo) for VNV Engineers' site engineers. It replaces the paper **V.N.V Engineers Visit Form**: the engineer signs in, sees the cases assigned to them, opens a case, takes site photos, fills the visit form and submits it back to the office.

Structure, styling and data layer mirror `trend-digital/merchant-mobile-app`.

## Commands

```bash
pnpm install
cp .env.example .env        # set API_BASE_URL (must include /api/v1)
pnpm start                  # Metro
pnpm pod-install            # iOS pods (works even when Xcode is at a path with spaces)
pnpm android                # or: pnpm ios (simulator; IOS_SIMULATOR="iPhone 17" to pick one, pnpm ios:device for a phone)
pnpm test
pnpm lint
pnpm typecheck
```

On a real phone, `API_BASE_URL` must be reachable from the device (LAN IP or deployed URL, not `localhost`).

## Flow and backend endpoints

| Step | App | Backend (`vnv-valupro-backend`) |
| --- | --- | --- |
| Login | Email → 6-digit OTP (email or WhatsApp) | `POST /auth/mobile/login/send-otp`, `POST /auth/mobile/login/verify-otp` with `client: site_engineer_app` |
| Session | Stored in Keychain; validated on launch | `POST /auth/refresh` (refresh token in body) |
| Case list | "To visit" / "Submitted" tabs, search | `GET /cases` (backend scopes a SITE_ENGINEER to `assignedToId = me`) |
| Case detail | Call customer, directions, office query note | `GET /cases/:id`, `GET /cases/:id/timeline` |
| Start visit | ASSIGNED → IN_PROGRESS, creates the valuation | `POST /cases/:id/survey/start`, `POST /valuations { caseId }` |
| Photos | In-app geo camera only (no gallery), stamped and uploaded immediately, 4 min / 10 max | `POST /valuations/:id/photos?section=SITE_VISIT`, `GET …/photos`, `DELETE …/photos/:photoId` |
| Save draft | Form saved without finishing the visit | `PATCH /valuations/:id` |
| Submit | Form saved + visit completed | `PATCH /valuations/:id`, `POST /cases/:id/survey/complete` |

## Where the form data goes

Everything on the paper form is stored verbatim in `ValuationReport.siteVisit` (JSON), so the office/Excel step can read every field. Fields the admin valuation editor already has columns for are also written there:

- `boundaries.{east,west,north,south}.asPerSite`: site boundaries, merged with the office's `asPerDocs`
- `dimensions.{…}.asPerSite`: plot side lengths in feet (converted if the valuation is in metres)
- `gpsCoordinates`: `"lat, lng"` captured on the phone
- `engineerNotes`: remarks

The form is also autosaved on the phone (AsyncStorage) as the engineer types, since sites often have no signal. The phone draft is cleared on submit and on sign-out.

## Code map

- `src/navigation/`: `RootNavigator` switches on `authStore.status` (Splash / Auth / App)
- `src/stores/authStore.ts`: external store for the session (same pattern as the merchant app)
- `src/services/api/client.ts`: axios clients, bearer token, single-flight refresh on 401, error envelope parsing
- `src/queries/cases`, `src/mutations/site-visit`: TanStack Query hooks per domain
- `src/schemas/site-visit.schema.ts`: Zod schema of the visit form (field list and option lists)
- `src/utils/site-visit.utils.ts`: visit stage rules, form ⇄ valuation payload mapping
- `src/screens/SiteVisitScreen`: the form, photo grid, GPS capture, floors
- `src/screens/GeoCameraScreen`, `src/components/geo-camera`: in-app GPS map camera

## Geo camera

Site photos can only be taken in the app; there is no gallery picker. The viewfinder shows the live stamp, and each shot is flattened into the JPEG before upload (`react-native-view-shot`), so the office receives the photo with the stamp burnt in:

- a compass dial with degrees and quadrant (`166° SE`) and "Facing South" (`react-native-compass-heading`)
- place and full address, via OpenStreetMap Nominatim reverse geocoding (keyless; shows "Locating address…" when offline)
- latitude/longitude, date and time, altitude and GPS accuracy
- a satellite thumbnail (Esri World Imagery tiles, keyless) with a pin and a view cone turned to the heading

The shutter stays disabled until there is a GPS fix within 100 m. Camera: `react-native-camera-kit`.

