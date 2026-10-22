export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const TYPOLOGY: Record<string, { en: string; hi: string }> = {
  digital_arrest: { en: "Digital arrest scam", hi: "डिजिटल अरेस्ट धोखा" },
  fake_rbi_safe_account: { en: "Fake RBI 'safe account'", hi: "नकली RBI 'सेफ अकाउंट'" },
  courier_narcotics: { en: "Courier / parcel scam", hi: "कूरियर / पार्सल धोखा" },
  grandparent_voice_clone: { en: "Family emergency scam", hi: "परिवार इमरजेंसी धोखा" },
  government_impersonation_us: { en: "US government impersonation", hi: "US सरकारी अफ़सर बनकर धोखा" },
  none: { en: "No scam pattern found", hi: "कोई धोखे का पैटर्न नहीं" },
};
