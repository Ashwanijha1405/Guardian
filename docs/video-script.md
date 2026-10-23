# Guardian: demo video script

Target runtime: 2:45. Hard limit: under 3:00. Everything on screen is a real capture of the deployed app:
simulator on the left, Rahul's dashboard on the right (phone width, about 390 px). No mock footage.

Before recording: open https://guardian-simulator.onrender.com and https://guardian-server-mt1b.onrender.com/dashboard/
a minute early so the free instances wake up. Then run one throwaway Digital arrest turn and tap the dashboard
button, so the live take isn't the first call after a cold start.

| Time | On screen | Voiceover |
| --- | --- | --- |
| 0:00–0:15 | Black screen, white text: "₹1,935 crore lost to 'digital arrest' scams in India in 2024." Small caption: "1,23,672 complaints · Ministry of Home Affairs, Rajya Sabha, March 2025". Then: "There is no such thing as digital arrest in Indian law." | A caller says he is from the CBI. He says you are under digital arrest. Don't tell anyone, and pay now. In 2024, Indians lost over nineteen hundred crore rupees this way. And digital arrest doesn't exist in Indian law. |
| 0:15–0:25 | Split screen. Left: the simulator's Echo Show, idle. Right: the dashboard, green, "Dadi is safe". | This is Dadi. She lives alone in Lucknow and speaks Hindi and Hinglish. Her grandson Rahul lives in Bengaluru. Guardian connects them through Alexa. |
| 0:25–0:45 | Click **Digital arrest**. Dadi's words appear on the Echo Show. The red risk card renders: score 100, "धोखे का खतरा", and five red flags, each showing the phrase that triggered it: "cbi", "digital arrest", "rbi safe account", "kisi ko batana mat", "video call". | Dadi tells Alexa what the caller is saying. Alexa calls Guardian, a self-hosted MCP server. Its risk engine finds five red flags and shows the exact phrase behind each one. Score: a hundred out of a hundred. It's rules and weights, not a guess. |
| 0:45–1:00 | Alexa speaks the Hindi guidance. The reply text stays on screen. | Alexa answers calmly, in Hindi. The fact she reads comes word for word from Guardian's fact file, and every fact links to an official source. Here it's the Prime Minister's own warning: there is no digital arrest in law. Hang up. Don't pay. |
| 1:00–1:15 | Right side: the dashboard turns red: "CBI caller: does Dadi have a case?" with one big button, "No case — it's a scam". On the left, Alexa says "Main abhi Rahul se pooch rahi hoon." | At the same moment, Rahul's phone gets one question. No transcript, no recording. Just: does Dadi have a case? |
| 1:15–1:30 | Rahul taps **No case — it's a scam**. The dashboard turns green: "Dadi knows it's a scam". On the left, the verification card renders, "Rahul ने बताया: यह धोखा है", and Alexa tells Dadi to end the call and report at 1930. | He taps once. Alexa tells Dadi her family has confirmed it: this is a scam. End the call, and report it at 1930, the national cybercrime helpline. |
| 1:30–1:45 | Toggle **Ask silently**, then run the preset again or type a short line. The "Silent · चुपचाप" badge shows and the reply appears as text only. | And if the fake officer is watching her on video, Dadi can ask silently. Alexa shows the answer on screen instead of saying it out loud. |
| 1:45–2:00 | Click **Grandson**. English risk card: "Scam alert", typology family emergency, flags "jail", "gift cards", "don't tell", "thousand dollars". The dashboard shows "Caller says you're in jail. Safe?". Tap "I'm safe — it's a scam". Alexa replies in English. | The same engine catches the US grandparent scam, where an AI-cloned voice says your grandson is in jail and needs gift cards. Different country, different words, same explanation. |
| 2:00–2:25 | Open the simulator's **Developer panel**: the six MCP tool calls in order (`get_household_context`, `assess_scam_risk`, `get_safety_guidance`, `notify_family`, `verify_with_family`, `check_verification`). Cut to the README's architecture diagram. Cut to a terminal: `npm test`, 63 passed. | Under the hood: one MCP server, spec 2025-11-25, Streamable HTTP, TypeScript SDK v2. Six tools. The risk card and the verification card are MCP Apps, rendered from ui resources. The engine is tested on thirty-nine labelled cases in English, Hinglish and Hindi. All twenty-four scams are caught, and none of the fifteen harmless look-alikes is flagged. |
| 2:25–2:45 | Three title cards in turn: "No call recording", "Family sees one line, never a transcript", "Dadi stays in control". Then: "Next: real Alexa+ integration · SMS and WhatsApp alerts · more Indian languages". End card: "Guardian · Report scams: 1930 · cybercrime.gov.in". | Guardian is built for dignity. It never records calls. Family sees one line, never a transcript. And Dadi stays in control. Next: a real Alexa+ device, alerts on SMS and WhatsApp, and more Indian languages. Because nobody should be arrested by a video call. |

## Say this honestly (judges will check)

- This is an Alexa+ **simulator** in the browser, not an Echo device. Guardian itself is a standard MCP server that
  any MCP host can call.
- Guardian doesn't listen to the call. Dadi tells Alexa what's happening.

## Sources for on-screen claims

- ₹1,935.51 crore and 1,23,672 complaints in 2024: MHA reply in the Rajya Sabha, March 2025 (National Cybercrime
  Reporting Portal data). The same figures appear in the I4C/MHA status report to the Supreme Court, as reported by
  [Free Press Journal](https://www.freepressjournal.in/tech/digital-arrest-fraud-over-21900-complaints-involving-647-crore-registered-in-2026-centre-tells-supreme-court).
  [ThePrint](https://theprint.in/india/governance/after-465-spike-in-2024-mha-data-shows-digital-arrest-scams-are-on-a-decline-in-india/2857002/)
  gives ₹1,918 crore for the same year from I4C data. If you want the primary source, check the figure on
  [sansad.in](https://sansad.in/rs/questions) before uploading.
- "No system like digital arrest in the law": [PM's address, 115th Mann Ki Baat, 27 Oct 2024](https://www.pmindia.gov.in/en/news_updates/pms-address-in-the-115th-episode-of-mann-ki-baat/).
- 24/24 and 0/15: `npm test -w @guardian/risk-engine`.

## Recording checklist

- OBS: screen capture plus a separate voice track, so either can be fixed in the edit.
- Browser zoom so the risk card's flags are readable at 1080p.
- No music, or royalty-free only. Voiceover in English. Keep Hindi on screen as text.
- Keep the final cut under 3:00. If it runs long, trim the Ask silently segment first, then the developer panel.
- Upload to YouTube as **public**. Title: "Guardian: stopping digital arrest scams with Alexa+ and MCP | Build, Ship, Shape (Alexa+ track)".
