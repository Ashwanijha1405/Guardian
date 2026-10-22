import type { FlagId } from "../types.js";

/**
 * Each pattern is a regex source matched against normalized text (lowercase, Latin diacritics and
 * Devanagari nukta removed, curly quotes straightened). Word boundaries are added by the matcher,
 * so patterns only need to describe the phrase itself. Spelling variants live here as regex.
 */
export interface FlagDefinition {
  id: FlagId;
  label: string;
  /** What the user should learn from this signal, in plain words. Shown on the risk card ("teach-back"). */
  lesson: { en: string; hi: string };
  weight: number;
  patterns: string[];
}

const RELATIVE =
  "(?:grandson|granddaughter|grandchild|son|daughter|nephew|niece|beta|beti|pota|poti|naati|naatin|nati|पोता|पोती|बेटा|बेटी|नाती|नातिन)";
const DISTRESS =
  "(?:jail|lock ?up|arrested|accident|hospital|in trouble|kidnapped|hawalat|जेल|हवालात|अस्पताल|एक्सीडेंट|हादसा|मुसीबत)";

export const FLAGS: FlagDefinition[] = [
  {
    id: "authority_impersonation",
    label: "Claims to be police or a government officer",
    lesson: {
      en: "Anyone can say they are police or CBI. A uniform or badge on video proves nothing.",
      hi: "कोई भी खुद को पुलिस या CBI बता सकता है। वीडियो पर वर्दी या बैज कोई सबूत नहीं है।",
    },
    weight: 20,
    patterns: [
      "cbi", "ed officer", "enforcement directorate", "customs", "narcotics", "ncb", "trai", "rbi",
      "reserve bank", "irs", "fbi", "social security", "ssa", "police", "cyber ?cell", "crime branch",
      "officer", "inspector", "dcp", "sir from \\w+ police",
      "सीबीआई", "पुलिस", "अधिकारी", "ऑफिसर", "इंस्पेक्टर", "कस्टम", "आरबीआई",
    ],
  },
  {
    id: "arrest_threat",
    label: "Threatens arrest or legal action",
    lesson: {
      en: "Threatening arrest on a call is a pressure trick. Police do not arrest anyone over a phone or video call.",
      hi: "फ़ोन पर गिरफ़्तारी की धमकी डराने की चाल है। पुलिस फ़ोन या वीडियो कॉल पर किसी को गिरफ़्तार नहीं करती।",
    },
    weight: 20,
    patterns: [
      "digital arrest", "arrest (?:kar|ho|warrant)\\w*", "under arrest", "(?:will|going to|gonna) (?:be )?arrest\\w*",
      "be arrested", "get arrested", "arrest you", "avoid (?:an? )?arrest", "warrant", "jail", "giraft?aa?r\\w*",
      "case darj", "fir",
      "डिजिटल अरेस्ट", "अरेस्ट", "गिरफ्तार\\w*", "वारंट", "जेल", "केस दर्ज", "एफआईआर",
    ],
  },
  {
    id: "secrecy_demand",
    label: "Asks you to keep it secret",
    lesson: {
      en: "Real officials never ask you to hide things from your family. Secrecy is the scammer's tool.",
      hi: "असली अधिकारी कभी नहीं कहते कि परिवार से छुपाओ। राज़ रखवाना ठग की चाल है।",
    },
    weight: 15,
    patterns: [
      "don'?t tell", "do not tell", "(?:must|should) not tell", "promise not to tell", "not tell anyone",
      "keep (?:this|it) (?:confidential|secret|between us)",
      "kisi ko (?:bhi )?(?:mat|na|nahi) bata\\w*", "kisi ko bata\\w* mat", "ghar (?:pe|par|walon ko) mat bata\\w*",
      "किसी को (?:भी )?(?:मत|न|नहीं) बता\\w*", "किसी को बता\\w* मत",
    ],
  },
  {
    id: "isolation_or_continuous_call",
    label: "Wants you to stay on the call",
    lesson: {
      en: "They keep you on the call so you can't check with anyone. You can always hang up.",
      hi: "आपको कॉल पर रोके रखते हैं ताकि आप किसी से पूछ न सकें। आप कभी भी फ़ोन काट सकती हैं।",
    },
    weight: 12,
    patterns: [
      "stay on (?:the )?(?:video )?(?:call|line)", "don'?t (?:disconnect|hang up|cut the call)", "do not (?:disconnect|hang up)",
      "camera on rakh\\w*", "call mat kaat\\w*", "phone mat kaat\\w*", "call band mat kar\\w*",
      "कॉल मत काट\\w*", "फोन मत काट\\w*", "कैमरा (?:ऑन|चालू) रख\\w*",
    ],
  },
  {
    id: "money_demand",
    label: "Asks for money or bank details",
    lesson: {
      en: "A call that ends in 'send money' or 'share your OTP' is the biggest warning sign. Ask family first.",
      hi: "जिस कॉल में 'पैसे भेजो' या 'OTP बताओ' कहा जाए, वही सबसे बड़ा खतरा है। पहले परिवार से पूछिए।",
    },
    weight: 15,
    patterns: [
      "send (?:the |some )?money", "transfer", "pay (?:a |the )?(?:fine|fee|amount|penalty|now|immediately)",
      "(?:need|needs|needed) (?:\\w+ ){0,2}money", "bail money", "move (?:all )?(?:my |your |the )?(?:money|savings|funds)",
      "(?:bank|account) details", "otp",
      "paise? bhej\\w*", "paisa bhej\\w*", "paise transfer", "paise de\\w*", "(?:paisa|paise|rakam)[^.]{0,30}daal\\w*",
      "fine bhar\\w*", "jurmana bhar\\w*",
      "₹ ?\\d[\\d,]*", "rs\\.? ?\\d[\\d,]*", "\\$ ?\\d[\\d,]*", "\\d[\\d,]* ?(?:rupees|rupaye|lakh|crore|dollars)",
      "(?:hundred|thousand|lakh|crore) (?:rupees|rupaye|dollars)",
      "पैसे? भेज\\w*", "पैसे ट्रांसफर", "रकम[^।.]{0,30}डाल\\w*", "जुर्माना भर\\w*", "रुपये भेज\\w*",
      "\\d+ ?(?:लाख|करोड़|हजार|रुपये)",
    ],
  },
  {
    id: "unusual_payment_rail",
    label: "Unusual way to pay",
    lesson: {
      en: "There is no 'safe account'. Money sent by gift card, crypto or to a stranger's account rarely comes back.",
      hi: "'सेफ अकाउंट' जैसा कुछ नहीं होता। गिफ़्ट कार्ड, क्रिप्टो या अनजान खाते में गया पैसा मुश्किल से लौटता है।",
    },
    weight: 18,
    patterns: [
      "gift ?cards?", "crypto\\w*", "bitcoin", "(?:rbi )?safe account", "verification account", "secure account",
      "wire (?:transfer|the money)", "money wired", "wired? (?:it|the money|money)", "western union",
      "upi to (?:this|unknown)", "suraksha khata",
      "सेफ अकाउंट", "सुरक्षित (?:सत्यापन )?खात\\w*", "सत्यापन खात\\w*", "गिफ्ट कार्ड", "क्रिप्टो",
    ],
  },
  {
    id: "urgency",
    label: "Rushes you",
    lesson: {
      en: "Rushing you is a trick so you don't stop to think. Anything real can wait an hour.",
      hi: "जल्दबाज़ी इसलिए कराते हैं ताकि आप सोच न सकें। सच्चा मामला एक घंटा रुक सकता है।",
    },
    weight: 8,
    patterns: [
      "right now", "right away", "immediately", "urgent\\w*", "within (?:an?|one|\\d+) (?:hour|minute)s?",
      "(?:money|savings|account) (?:will be |is being )?(?:frozen|blocked|seized)", "freeze ho\\w*",
      "abhi ke abhi", "turant", "jaldi",
      "अभी के अभी", "तुरंत", "जल्दी", "वरना खाता बंद",
    ],
  },
  {
    id: "family_in_distress",
    label: "Says a relative is in trouble",
    lesson: {
      en: "Voices can be copied with AI. Hang up and call your family on the number you already have.",
      hi: "AI से आवाज़ की नकल हो सकती है। फ़ोन काटें और परिवार को उनके पुराने नंबर पर कॉल करें।",
    },
    weight: 18,
    patterns: [`${RELATIVE}[^.?!]{0,40}?${DISTRESS}`],
  },
  {
    id: "parcel_or_courier_pretext",
    label: "Mentions a parcel or courier",
    lesson: {
      en: "Couriers don't call to say police found drugs in your parcel.",
      hi: "कूरियर वाले फ़ोन करके नहीं कहते कि आपके पार्सल में ड्रग्स मिले हैं।",
    },
    weight: 10,
    patterns: [
      "parcel", "courier", "fedex", "dhl", "package (?:with|containing|in your name)", "drugs found",
      "aapke naam (?:pe|par|se) parcel", "पार्सल", "कूरियर",
    ],
  },
  {
    id: "money_laundering_accusation",
    label: "Accuses you of money laundering",
    lesson: {
      en: "Big words like 'money laundering' are used to frighten you into obeying.",
      hi: "'मनी लॉन्ड्रिंग' जैसे भारी शब्द आपको डराने के लिए बोले जाते हैं।",
    },
    weight: 15,
    patterns: [
      "money laundering", "aadhaa?r (?:card )?(?:is |was |has been )?(?:used|misused|linked)", "your account (?:is |was )?used for",
      "hawala", "illegal transactions?", "मनी लॉन्ड्रिंग", "हवाला", "आधार (?:कार्ड )?(?:का )?(?:गलत )?इस्तेमाल",
    ],
  },
  {
    id: "video_call_interrogation",
    label: "Interrogation on a video call",
    lesson: {
      en: "Police do not question people on WhatsApp or Skype video calls.",
      hi: "पुलिस WhatsApp या Skype वीडियो कॉल पर पूछताछ नहीं करती।",
    },
    weight: 10,
    patterns: [
      "video call", "skype", "whatsapp video", "in uniform", "police station (?:on|in the) video",
      "वीडियो कॉल", "स्काइप",
    ],
  },
];
