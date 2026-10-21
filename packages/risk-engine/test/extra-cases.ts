import type { Band, TypologyId } from "../src/types.js";

export interface Case {
  name: string;
  text: string;
  locale?: "hi-IN" | "en-IN" | "en-US";
  minBand?: Band;
  maxBand?: Band;
  typology?: TypologyId | "none";
  scam: boolean;
}

export const extraCases: Case[] = [
  // ---- digital_arrest ----
  {
    name: "digital-arrest-cbi-video-call-en",
    text: "A CBI officer called me on video and said I am under digital arrest for money laundering, and he told me to keep it secret and transfer fifty thousand rupees to clear my name.",
    locale: "en-IN",
    minBand: "high",
    typology: "digital_arrest",
    scam: true,
  },
  {
    name: "digital-arrest-cbi-video-call-hinglish",
    text: "CBI officer ne video call pe bola ki mera digital arrest ho gaya hai aur money laundering ka case hai, kisi ko mat batana aur paise transfer kar do warna giraftaar ho jaoge.",
    locale: "en-IN",
    minBand: "high",
    typology: "digital_arrest",
    scam: true,
  },
  {
    name: "digital-arrest-ed-officer-hindi",
    text: "ईडी अधिकारी ने वीडियो कॉल पर कहा कि मेरा डिजिटल अरेस्ट हो गया है और गिरफ्तारी से बचने के लिए पचास हज़ार रुपये जमा करने होंगे, किसी को बताना मत।",
    locale: "hi-IN",
    minBand: "high",
    typology: "digital_arrest",
    scam: true,
  },
  {
    name: "digital-arrest-ed-officer-mixed-script",
    text: "ED officer ne video call kiya aur bola mera digital arrest hai, FIR हो जाएगी agar main ek lakh नहीं भेजता, और family ko बिल्कुल मत बताना.",
    locale: "en-IN",
    minBand: "high",
    typology: "digital_arrest",
    scam: true,
  },

  // ---- fake_rbi_safe_account ----
  {
    name: "rbi-safe-account-verification-en",
    text: "An RBI officer said my account is compromised and I must move all my savings into a safe verification account today, or my money will be frozen.",
    locale: "en-IN",
    minBand: "high",
    typology: "fake_rbi_safe_account",
    scam: true,
  },
  {
    name: "rbi-safe-account-verification-hinglish",
    text: "RBI se phone aaya ki mere account mein fraud hua hai, paisa safe verification account mein daal do warna account freeze ho jayega.",
    locale: "en-IN",
    minBand: "high",
    typology: "fake_rbi_safe_account",
    scam: true,
  },
  {
    name: "rbi-safe-account-verification-hindi",
    text: "आरबीआई अधिकारी ने कहा कि मेरे खाते में धोखाधड़ी हुई है, इसलिए पूरी रकम सुरक्षित सत्यापन खाते में डालनी होगी वरना खाता बंद हो जाएगा।",
    locale: "hi-IN",
    minBand: "high",
    typology: "fake_rbi_safe_account",
    scam: true,
  },

  // ---- courier_narcotics ----
  {
    name: "courier-drugs-fedex-en",
    text: "FedEx called and said a parcel in my name was caught with drugs inside, and customs will arrest me unless I pay a fine right now.",
    locale: "en-IN",
    minBand: "medium",
    typology: "courier_narcotics",
    scam: true,
  },
  {
    name: "courier-drugs-customs-hinglish",
    text: "Courier company ne bola mere naam se parcel mein drugs mile hain aur customs police giraftar karegi, isliye abhi fine bhar do.",
    locale: "en-IN",
    minBand: "medium",
    typology: "courier_narcotics",
    scam: true,
  },
  {
    name: "courier-drugs-customs-hindi",
    text: "कूरियर वाले ने कहा कि मेरे नाम के पार्सल में ड्रग्स मिले हैं और सीमा शुल्क विभाग मुझे गिरफ्तार करेगा, तुरंत जुर्माना भरना होगा।",
    locale: "hi-IN",
    minBand: "medium",
    typology: "courier_narcotics",
    scam: true,
  },

  // ---- grandparent_voice_clone ----
  {
    name: "grandparent-jail-gift-cards-en",
    text: "My grandson called from jail and said he had an accident, he needs eight thousand dollars in gift cards today, and he made me promise not to tell his parents.",
    locale: "en-US",
    minBand: "high",
    typology: "grandparent_voice_clone",
    scam: true,
  },
  {
    name: "grandparent-bail-wire-en",
    text: "A girl was crying on the phone and said she is my granddaughter, she was arrested and needs bail money wired right away, and I must not tell her mother.",
    locale: "en-US",
    minBand: "high",
    typology: "grandparent_voice_clone",
    scam: true,
  },
  {
    name: "grandparent-beta-jail-hinglish",
    text: "Mera beta phone par ro raha tha, bola usko accident ho gaya hai aur woh jail mein hai, paise bhej do aur kisi ko mat batana.",
    locale: "en-IN",
    minBand: "high",
    typology: "grandparent_voice_clone",
    scam: true,
  },

  // ---- government_impersonation_us ----
  {
    name: "irs-back-taxes-warrant-en",
    text: "An IRS agent said I owe back taxes and a warrant will be issued if I don't pay with gift cards today.",
    locale: "en-US",
    minBand: "medium",
    typology: "government_impersonation_us",
    scam: true,
  },
  {
    name: "ssa-suspended-number-en",
    text: "Someone from Social Security said my number is suspended and I have to confirm my bank details to avoid arrest.",
    locale: "en-US",
    minBand: "medium",
    typology: "government_impersonation_us",
    scam: true,
  },
  {
    name: "fbi-warrant-fine-en",
    text: "An FBI agent told me there is a warrant out for me and I must pay the fine immediately over the phone.",
    locale: "en-US",
    minBand: "medium",
    typology: "government_impersonation_us",
    scam: true,
  },

  // ---- benign ----
  {
    name: "benign-police-society-meeting",
    text: "A police officer came to our society meeting last night to talk about safety in the neighbourhood, and he was very polite.",
    locale: "en-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-cbi-crime-show",
    text: "I am watching a crime show about the CBI on television this evening.",
    locale: "en-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-courier-medicine-hinglish",
    text: "Courier wala aaj subah meri dawa le aaya aur maine usko paanch rupaye tip diye.",
    locale: "en-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-son-money-for-bills",
    text: "My son transferred two thousand rupees for the monthly bills and I told him it was not needed.",
    locale: "en-US",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-grandson-coming-home-hindi",
    text: "मेरा पोता आज छुट्टी में घर आ रहा है, मैंने उसके लिए खीर बनाई है।",
    locale: "hi-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-paying-electricity-bill",
    text: "I paid the electricity bill at the bank counter today and the clerk gave me a receipt.",
    locale: "en-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-pension-credit-sms",
    text: "The bank sent an SMS saying my pension has been credited and the balance is now twelve thousand rupees.",
    locale: "en-IN",
    maxBand: "low",
    scam: false,
  },
  {
    name: "benign-jail-museum-story-hindi",
    text: "मेरी भतीजी ने जेल संग्रहालय की एक मज़ेदार कहानी सुनाई, जहाँ पर्यटक पुरानी कोठरी में बैठ सकते हैं।",
    locale: "hi-IN",
    maxBand: "low",
    scam: false,
  },
];
