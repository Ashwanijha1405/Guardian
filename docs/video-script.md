# Guardian — Demo Video Script

> **DRAFT — fact-check before recording (P7).** Known problems: Guardian does not listen to calls live (Dadi tells
> Alexa what happened); demo case A fires 5 flags, not 6, with evidence "cbi", "digital arrest", "rbi safe account",
> "kisi ko batana mat", "video call"; there is no mock video-call or US-kitchen footage. Use real simulator and
> dashboard screen captures only.

Target runtime: 2:45. Hard limit: under 3:00.

| Time | On screen | Voiceover |
| --- | --- | --- |
| 0:00–0:15 | Black screen. White text: "There is no such thing as 'digital arrest' in Indian law." Cut to a mock video call: a man in a police uniform, slightly blurred, "CBI" caption. A fake arrest notice fills the frame. Lower third: `[VERIFIED STAT — fill in with source]`. | This is a video call. The man says he is from the CBI. He says you are under digital arrest. Do not tell anyone. Pay now. In Indian law, digital arrest does not exist. Guardian does. |
| 0:15–0:25 | Split screen. Left: simulator, Dadi's phone ringing in Lucknow. Right: Rahul's dashboard in Bengaluru, idle and calm. | Meet Dadi. She lives alone in Lucknow. She speaks Hindi and Hinglish. Her grandson Rahul is in Bengaluru. Tonight, her phone rings. |
| 0:25–0:40 | Left: the call connects, transcript building line by line. Right: a Guardian card appears and the risk score climbs to Critical. Four red flags expand to show the exact phrase that triggered each one: "CBI officer", "do not tell anyone", "arrest warrant", "transfer the money now". | Guardian reads the call as it happens. Six red flags. Critical risk. Every flag shows the exact phrase that triggered it. No guessing. No black box. |
| 0:40–0:55 | Echo Show screen: a calm guidance card in Hindi. Slow, large text. Dadi listens, hand still on the phone. | The Echo Show speaks to Dadi. Calm. In Hindi. Slow. It does not order her around. A real officer never demands secrecy. A real case is never settled on a video call. |
| 0:55–1:05 | Right side: Rahul's dashboard turns red. One-line summary with the same flagged phrases. No transcript. His phone buzzes. | In Bengaluru, Rahul's dashboard turns red. He sees why. The same phrases. One line. Not a transcript. |
| 1:05–1:20 | Close on Rahul's phone: Guardian asks one question. He taps the button: "No case — it's a scam". | Guardian asks him one question. Is this real? He taps: no case, it is a scam. |
| 1:20–1:30 | Left: a verification card renders on the Echo Show, next to the risk score. Alexa speaks. On-screen text: helpline 1930, cybercrime.gov.in. | A verification card appears on Dadi's screen. Alexa tells her plainly: this is a scam. End the call. Then call 1930, or report at cybercrime.gov.in. |
| 1:30–1:50 | New simulator window: a US kitchen. A grandmother on a landline. Caption of the caller's words: "Grandma, I'm in jail. Send gift cards. Don't tell Mom." Risk card fires on different phrases: urgency, secrecy, gift cards, voice clone. | Same engine. Different country. A grandmother in the US hears her grandson. He is in jail. He needs gift cards. It is a cloned voice. Guardian catches the urgency, the secrecy, the payment method. Same rules. Same explanation. |
| 1:50–2:20 | Developer panel: server logs and live tool calls scrolling — `assess_scam_risk`, `get_safety_guidance`, `get_household_context`, `notify_family`, `verify_with_family`, `check_verification`. Cut to architecture slide: self-hosted MCP server, MCP spec 2025-11-25, Streamable HTTP, TypeScript SDK v2, six tools. Cut to MCP Apps cards: `ui://` resources rendering the risk score and the family verification result on the Echo Show. Cut to test results: 23 of 23 scam cases caught, 0 of 14 benign look-alike cases flagged. | Under the hood: one self-hosted MCP server. Streamable HTTP. TypeScript SDK v2. Six tools. One scores the call. One speaks the guidance. Two close the family loop. The engine is deterministic. Rules and weights, not a language model. English, Hinglish, Devanagari Hindi. The cards are MCP Apps. The score and the verification result render on the Echo Show. Twenty-three scam cases. All twenty-three caught. Fourteen benign look-alikes. None flagged. |
| 2:20–2:45 | Three design cards, one at a time: "No call recording", "One-line summaries, never transcripts", "Dadi stays in control". Then a short roadmap list: real Alexa+ MCP integration, SMS and WhatsApp channel for family, more Indian languages. End card: Guardian, with the 1930 helpline. | The design rule is dignity. No call recording. Family sees one-line summaries, never transcripts. Dadi stays in control. Next: real Alexa+ MCP integration. An SMS and WhatsApp channel for family. More Indian languages. Guardian. Because no one should be arrested by a video call. |

## Recording checklist

- OBS: screen capture plus a clean voice track. Separate audio and video sources, so either can be fixed in the edit.
- Two windows side by side: simulator on the left, Rahul's dashboard on the right. Same layout for the US segment, with the US simulator in place of the Indian one.
- No copyrighted music. No background music at all is fine. Voice only.
- Voiceover in English. Keep the Hindi lines short and correctly pronounced.
- Keep the final cut under 3:00. Trim the developer panel first if it runs long.
- Upload to YouTube as public. Title it clearly as a "Build, Ship, Shape" hackathon submission, Alexa+ track.
