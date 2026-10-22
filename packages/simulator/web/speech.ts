// Browser speech: recognition (Chrome/Edge only) and synthesis. Both degrade gracefully; the text is always shown.

const DEVANAGARI = /[ऀ-ॿ]/;
// Common Hinglish words: replies in Roman-script Hindi still sound right in a hi-IN voice.
const HINGLISH = /\b(aap|aapko|hai|hain|mat|kijiye|dijiye|nahi|nahin|paise|kaat|theek|ghabraiye|abhi|bhejiye|batana|rahi|raha|hoon)\b/i;

export function replyLanguage(text: string): "hi-IN" | "en-IN" {
  return DEVANAGARI.test(text) || HINGLISH.test(text) ? "hi-IN" : "en-IN";
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
}

export function speak(text: string): Promise<void> {
  if (!("speechSynthesis" in window) || !text) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = replyLanguage(text);
    const voice = pickVoice(u.lang);
    if (voice) u.voice = voice;
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

export function stopSpeaking(): void {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

type Recognition = SpeechRecognition;
const RecognitionCtor: (new () => Recognition) | undefined =
  (window as unknown as { SpeechRecognition?: new () => Recognition }).SpeechRecognition ??
  (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;

export const canListen = Boolean(RecognitionCtor);

/** Listens once. onInterim shows live words; resolves with the final transcript, or "" if nothing was heard. */
export function listen(lang: string, onInterim: (text: string) => void): { done: Promise<string>; stop: () => void } {
  const rec = new RecognitionCtor!();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  let finalText = "";
  const done = new Promise<string>((resolve, reject) => {
    rec.onresult = (e) => {
      let interim = "";
      for (const r of Array.from(e.results)) {
        if (r.isFinal) finalText += r[0]!.transcript;
        else interim += r[0]!.transcript;
      }
      onInterim(finalText + interim);
    };
    rec.onerror = (e) => (e.error === "no-speech" || e.error === "aborted" ? resolve("") : reject(new Error(e.error)));
    rec.onend = () => resolve(finalText.trim());
  });
  rec.start();
  return { done, stop: () => rec.stop() };
}
