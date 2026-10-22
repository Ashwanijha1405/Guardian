# Guardian — Manual End-to-End Demo Script

Run the four scenarios in order. Each scenario uses a preset button in the simulator, so no typing or microphone is required.

## Setup

1. Terminal 1: `npm run dev:server`. This starts the Guardian MCP server on http://localhost:3000, with the family dashboard at http://localhost:3000/dashboard/.
2. Terminal 2: `npm run dev:simulator`. This starts the simulator at http://localhost:5173. It requires `GEMINI_API_KEY` in the root `.env`.
3. Arrange the windows for recording: simulator on the left, dashboard on the right sized to a phone (390px wide).
4. Open the "Developer panel" in the simulator so MCP tool calls are visible as they happen.

## Scenario 1 — Benign

1. Click the preset button "Benign".
2. Text sent: "Rahul called, he's coming home for Diwali".
3. Expected: Alexa replies with a short friendly answer. Usually no Guardian tool is called (nothing suspicious), so no card appears; if the model does call `assess_scam_risk`, it returns band `low`.
4. Dashboard stays "Dadi is safe".

## Scenario 2 — Digital arrest

1. Click the preset button "Digital arrest".
2. Text sent: "Alexa, ek CBI officer video call pe hai, bol raha hai main digital arrest mein hoon, kisi ko batana mat, aur paise RBI safe account mein bhejne ko bol raha hai".
3. Expected tool order and results:
   1. `assess_scam_risk` → `critical`. Risk card turns red, score 100, typology `digital_arrest`, flags with evidence such as "digital arrest" and "kisi ko batana mat".
   2. `get_safety_guidance` → Alexa speaks calm Hindi guidance.
   3. `notify_family` → alert appears on the dashboard.
   4. `verify_with_family` → dashboard turns red with "CBI caller: does Dadi have a case?"; Alexa says she is checking with Rahul.
4. On the dashboard, tap "No case — it's a scam".
5. `check_verification` → `confirmed_safe`. Verification card reads "Rahul confirmed: it's a scam".
6. Alexa tells Dadi to end the call and that she can report at 1930.
7. Dashboard shows "Dadi knows it's a scam".

## Scenario 3 — US grandparent voice clone

1. Click the preset button "Grandson".
2. Text sent: "My grandson just called crying, he's in jail and needs three thousand dollars in gift cards, he said don't tell his mom".
3. Expected: `critical` with typology `grandparent_voice_clone`.
4. Dashboard shows "Caller says you're in jail. Safe?".
5. Tap "I'm safe — it's a scam".
6. Alexa replies in English.

## Scenario 4 (optional) — No response

1. Run Scenario 2 again, but do not tap anything on the dashboard.
2. After 90 seconds, `check_verification` returns `no_response`.
3. Alexa tells Dadi to end the call and to call 1930 if she is unsure.

## Reset between runs

1. Restart `npm run dev:server` to clear verifications.
2. Delete `data/events.json` to clear alert history.

## Troubleshooting

1. Microphone not working: use the preset buttons or the text box. Speech recognition needs Chrome or Edge.
2. No Hindi voice: install a Hindi TTS voice in OS settings. The reply text is still shown.
3. Gemini errors: check `GEMINI_API_KEY` and the account quota.

## Acceptance

Run all scenarios 3 times in a row without errors.
