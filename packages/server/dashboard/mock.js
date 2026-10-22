// Mock snapshots shaped exactly like GET /events ({ alerts, verifications, household }), so wiring live data
// later only swaps where the snapshot comes from. Times are relative to page load.
(() => {
  const ago = (ms) => new Date(Date.now() - ms).toISOString();
  const MIN = 60_000;
  const DAY = 24 * 60 * MIN;

  const household = {
    persona: { id: "dadi", displayName: "Dadi", preferredLanguage: "hi-IN", languages: ["hi-IN", "en-IN"], city: "Lucknow", livesAlone: true },
    contacts: [
      { id: "rahul", name: "Rahul", relationship: "grandson", relationshipHi: "पोता", city: "Bengaluru", primary: true },
      { id: "priya", name: "Priya", relationship: "daughter-in-law", relationshipHi: "बहू", city: "Lucknow", primary: false },
    ],
  };

  const olderAlerts = [
    { id: "a3", createdAt: ago(5 * DAY + 7 * 60 * MIN), severity: "info", typology: "digital_arrest", score: 18,
      summary: "Dadi asked about a CBI news story. Not a call, nothing to do." },
    { id: "a2", createdAt: ago(3 * DAY + 2 * 60 * MIN), severity: "info", typology: "fake_rbi_safe_account", score: 31,
      summary: "SMS about blocked KYC. Dadi asked Alexa, no money was sent." },
    { id: "a1", createdAt: ago(DAY + 5 * 60 * MIN), severity: "warning", typology: "courier_narcotics", score: 62,
      summary: "Caller said a parcel was seized, asked for Aadhaar. Dadi hung up." },
  ];

  const daAlert = { id: "a4", createdAt: ago(2 * MIN), severity: "critical", typology: "digital_arrest", score: 84,
    summary: "Video caller says he is CBI, told Dadi to keep it secret and send money." };
  const gpAlert = { id: "a5", createdAt: ago(2 * MIN), severity: "critical", typology: "grandparent_voice_clone", score: 92,
    summary: "Caller sounding like Rahul says he is in jail and needs money in gift cards." };

  const verification = (typology, status, extra = {}) => ({
    id: `v-${typology}`,
    contactId: "rahul",
    contactName: "Rahul",
    reason: typology === "digital_arrest"
      ? "Someone claiming to be CBI says Dadi is under 'digital arrest'."
      : "A caller who sounds like Rahul says he is in jail and needs money.",
    claimedPerson: typology === "digital_arrest" ? "CBI officer" : "Rahul",
    typology,
    status,
    createdAt: ago(24_000),
    ...extra,
  });

  const answered = { createdAt: ago(90_000), respondedAt: ago(30_000) };

  window.GUARDIAN_MOCK = {
    safe: { alerts: olderAlerts, verifications: [], household },
    "pending-da": { alerts: [...olderAlerts, daAlert], verifications: [verification("digital_arrest", "pending")], household },
    "pending-gp": { alerts: [...olderAlerts, gpAlert], verifications: [verification("grandparent_voice_clone", "pending")], household },
    confirmed: { alerts: [...olderAlerts, daAlert], verifications: [verification("digital_arrest", "confirmed_safe", answered)], household },
    help: { alerts: [...olderAlerts, gpAlert], verifications: [verification("grandparent_voice_clone", "needs_help", answered)], household },
    noresponse: { alerts: [...olderAlerts, daAlert], verifications: [verification("digital_arrest", "no_response", { createdAt: ago(2 * MIN) })], household },
  };
})();
