export type LanguageKey =
  | "en"
  | "hi"
  | "mr"
  | "bn"
  | "ta"
  | "te"
  | "gu"
  | "kn";

export type LanguageOption = {
  key: LanguageKey;
  label: string;
  nativeLabel: string;
};

export const DEFAULT_LANGUAGE_KEY: LanguageKey = "en";

export const indianLanguages: LanguageOption[] = [
  { key: "en", label: "English", nativeLabel: "English" },
  { key: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { key: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { key: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { key: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { key: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { key: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { key: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
];

type TranslationKey =
  | "language"
  | "city"
  | "publicRegistry"
  | "publicRegistrySubtitle"
  | "warrantyScanner"
  | "publicProof"
  | "publicIssueHistory"
  | "selectedCase"
  | "issueBefore"
  | "contractorProofAfter"
  | "openPublicProof"
  | "status"
  | "warranty"
  | "contractor"
  | "publicHash"
  | "notActive"
  | "pending"
  | "active"
  | "reportIssue"
  | "mapLocation"
  | "mapLocationSubtitle"
  | "useCurrentGps"
  | "openGoogleMaps"
  | "manualCoordinates"
  | "selectedAddress"
  | "analyzeIssue"
  | "createProof";

const translations: Record<LanguageKey, Record<TranslationKey, string>> = {
  en: {
    language: "Language",
    city: "City",
    publicRegistry: "Public Warranty Registry",
    publicRegistrySubtitle: "Citizens can see every reported issue, pending repair, contractor proof and active warranty.",
    warrantyScanner: "Warranty Scanner",
    publicProof: "Public Proof",
    publicIssueHistory: "Public Issue History",
    selectedCase: "Selected public case",
    issueBefore: "Citizen Issue Before",
    contractorProofAfter: "Contractor Proof After",
    openPublicProof: "Open Public Proof",
    status: "Status",
    warranty: "Warranty",
    contractor: "Contractor",
    publicHash: "Public Hash",
    notActive: "Not Active",
    pending: "Pending",
    active: "Active",
    reportIssue: "Report Issue",
    mapLocation: "Google Map Location",
    mapLocationSubtitle: "Use GPS or enter coordinates to pin the exact civic issue location.",
    useCurrentGps: "Use Current GPS",
    openGoogleMaps: "Open Google Maps",
    manualCoordinates: "Manual Coordinates",
    selectedAddress: "Selected Address",
    analyzeIssue: "Analyze Infrastructure Issue",
    createProof: "Create Blockchain Proof",
  },
  hi: {
    language: "भाषा",
    city: "शहर",
    publicRegistry: "सार्वजनिक वारंटी रजिस्ट्री",
    publicRegistrySubtitle: "नागरिक हर रिपोर्ट, लंबित मरम्मत, ठेकेदार प्रमाण और सक्रिय वारंटी देख सकते हैं।",
    warrantyScanner: "वारंटी स्कैनर",
    publicProof: "सार्वजनिक प्रमाण",
    publicIssueHistory: "सार्वजनिक समस्या इतिहास",
    selectedCase: "चयनित सार्वजनिक केस",
    issueBefore: "नागरिक समस्या फोटो",
    contractorProofAfter: "मरम्मत के बाद प्रमाण",
    openPublicProof: "सार्वजनिक प्रमाण खोलें",
    status: "स्थिति",
    warranty: "वारंटी",
    contractor: "ठेकेदार",
    publicHash: "सार्वजनिक हैश",
    notActive: "सक्रिय नहीं",
    pending: "लंबित",
    active: "सक्रिय",
    reportIssue: "समस्या रिपोर्ट करें",
    mapLocation: "गूगल मैप स्थान",
    mapLocationSubtitle: "सटीक स्थान पिन करने के लिए GPS या निर्देशांक दर्ज करें।",
    useCurrentGps: "मेरा GPS उपयोग करें",
    openGoogleMaps: "गूगल मैप खोलें",
    manualCoordinates: "मैनुअल निर्देशांक",
    selectedAddress: "चयनित पता",
    analyzeIssue: "इंफ्रास्ट्रक्चर समस्या विश्लेषण",
    createProof: "ब्लॉकचेन प्रमाण बनाएं",
  },
  mr: {
    language: "भाषा",
    city: "शहर",
    publicRegistry: "सार्वजनिक वारंटी नोंदणी",
    publicRegistrySubtitle: "नागरिक रिपोर्ट, प्रलंबित दुरुस्ती, कंत्राटदार पुरावा आणि सक्रिय वारंटी पाहू शकतात.",
    warrantyScanner: "वारंटी स्कॅनर",
    publicProof: "सार्वजनिक पुरावा",
    publicIssueHistory: "सार्वजनिक समस्या इतिहास",
    selectedCase: "निवडलेला सार्वजनिक केस",
    issueBefore: "नागरिक समस्या फोटो",
    contractorProofAfter: "दुरुस्तीनंतरचा पुरावा",
    openPublicProof: "सार्वजनिक पुरावा उघडा",
    status: "स्थिती",
    warranty: "वारंटी",
    contractor: "कंत्राटदार",
    publicHash: "सार्वजनिक हॅश",
    notActive: "सक्रिय नाही",
    pending: "प्रलंबित",
    active: "सक्रिय",
    reportIssue: "समस्या नोंदवा",
    mapLocation: "गूगल मॅप स्थान",
    mapLocationSubtitle: "अचूक स्थानासाठी GPS वापरा किंवा निर्देशांक द्या.",
    useCurrentGps: "माझा GPS वापरा",
    openGoogleMaps: "गूगल मॅप उघडा",
    manualCoordinates: "मॅन्युअल निर्देशांक",
    selectedAddress: "निवडलेला पत्ता",
    analyzeIssue: "समस्या विश्लेषण करा",
    createProof: "ब्लॉकचेन पुरावा तयार करा",
  },
  bn: {
    language: "ভাষা",
    city: "শহর",
    publicRegistry: "পাবলিক ওয়ারেন্টি রেজিস্ট্রি",
    publicRegistrySubtitle: "নাগরিকরা রিপোর্ট, মেরামতের অবস্থা, ঠিকাদারের প্রমাণ ও সক্রিয় ওয়ারেন্টি দেখতে পারেন।",
    warrantyScanner: "ওয়ারেন্টি স্ক্যানার",
    publicProof: "পাবলিক প্রুফ",
    publicIssueHistory: "সমস্যার ইতিহাস",
    selectedCase: "নির্বাচিত কেস",
    issueBefore: "সমস্যার ছবি",
    contractorProofAfter: "মেরামতের পর প্রমাণ",
    openPublicProof: "পাবলিক প্রুফ খুলুন",
    status: "অবস্থা",
    warranty: "ওয়ারেন্টি",
    contractor: "ঠিকাদার",
    publicHash: "পাবলিক হ্যাশ",
    notActive: "সক্রিয় নয়",
    pending: "অপেক্ষমাণ",
    active: "সক্রিয়",
    reportIssue: "সমস্যা রিপোর্ট করুন",
    mapLocation: "গুগল ম্যাপ লোকেশন",
    mapLocationSubtitle: "সঠিক লোকেশন পিন করতে GPS বা কোঅর্ডিনেট দিন।",
    useCurrentGps: "GPS ব্যবহার করুন",
    openGoogleMaps: "গুগল ম্যাপ খুলুন",
    manualCoordinates: "ম্যানুয়াল কোঅর্ডিনেট",
    selectedAddress: "নির্বাচিত ঠিকানা",
    analyzeIssue: "সমস্যা বিশ্লেষণ করুন",
    createProof: "ব্লকচেইন প্রুফ তৈরি করুন",
  },
  ta: {
    language: "மொழி",
    city: "நகரம்",
    publicRegistry: "பொது வாரண்டி பதிவு",
    publicRegistrySubtitle: "புகார், நிலுவை பழுது, ஒப்பந்ததாரர் ஆதாரம் மற்றும் செயலில் உள்ள வாரண்டி அனைத்தும் பொதுவாக தெரியும்.",
    warrantyScanner: "வாரண்டி ஸ்கேனர்",
    publicProof: "பொது ஆதாரம்",
    publicIssueHistory: "பொது பிரச்சனை வரலாறு",
    selectedCase: "தேர்ந்தெடுத்த பொது வழக்கு",
    issueBefore: "பிரச்சனை புகைப்படம்",
    contractorProofAfter: "பழுது பின் ஆதாரம்",
    openPublicProof: "பொது ஆதாரம் திற",
    status: "நிலை",
    warranty: "வாரண்டி",
    contractor: "ஒப்பந்ததாரர்",
    publicHash: "பொது ஹாஷ்",
    notActive: "செயலில் இல்லை",
    pending: "நிலுவை",
    active: "செயலில்",
    reportIssue: "பிரச்சனை தெரிவி",
    mapLocation: "கூகுள் மேப் இடம்",
    mapLocationSubtitle: "GPS அல்லது கோஆர்டினேட் மூலம் சரியான இடத்தை பின் செய்யுங்கள்.",
    useCurrentGps: "GPS பயன்படுத்து",
    openGoogleMaps: "கூகுள் மேப் திற",
    manualCoordinates: "கையேடு கோஆர்டினேட்",
    selectedAddress: "தேர்ந்தெடுத்த முகவரி",
    analyzeIssue: "பிரச்சனை பகுப்பாய்வு",
    createProof: "பிளாக்செயின் ஆதாரம் உருவாக்கு",
  },
  te: {
    language: "భాష",
    city: "నగరం",
    publicRegistry: "పబ్లిక్ వారంటీ రిజిస్ట్రీ",
    publicRegistrySubtitle: "ప్రజలు రిపోర్టులు, పెండింగ్ మరమ్మతులు, కాంట్రాక్టర్ ప్రూఫ్ మరియు యాక్టివ్ వారంటీని చూడగలరు.",
    warrantyScanner: "వారంటీ స్కానర్",
    publicProof: "పబ్లిక్ ప్రూఫ్",
    publicIssueHistory: "సమస్య చరిత్ర",
    selectedCase: "ఎంచుకున్న కేసు",
    issueBefore: "సమస్య ఫోటో",
    contractorProofAfter: "మరమ్మత్తు తర్వాత ప్రూఫ్",
    openPublicProof: "పబ్లిక్ ప్రూఫ్ తెరవండి",
    status: "స్థితి",
    warranty: "వారంటీ",
    contractor: "కాంట్రాక్టర్",
    publicHash: "పబ్లిక్ హ్యాష్",
    notActive: "యాక్టివ్ కాదు",
    pending: "పెండింగ్",
    active: "యాక్టివ్",
    reportIssue: "సమస్య రిపోర్ట్ చేయండి",
    mapLocation: "గూగుల్ మ్యాప్ స్థానం",
    mapLocationSubtitle: "సరిగ్గా పిన్ చేయడానికి GPS లేదా కోఆర్డినేట్లు వాడండి.",
    useCurrentGps: "GPS వాడండి",
    openGoogleMaps: "గూగుల్ మ్యాప్ తెరవండి",
    manualCoordinates: "మాన్యువల్ కోఆర్డినేట్లు",
    selectedAddress: "ఎంచుకున్న చిరునామా",
    analyzeIssue: "సమస్య విశ్లేషణ",
    createProof: "బ్లాక్‌చెయిన్ ప్రూఫ్ సృష్టించండి",
  },
  gu: {
    language: "ભાષા",
    city: "શહેર",
    publicRegistry: "જાહેર વોરંટી રજિસ્ટ્રી",
    publicRegistrySubtitle: "નાગરિકો રિપોર્ટ, પેન્ડિંગ રિપેર, કોન્ટ્રાક્ટર પુરાવો અને સક્રિય વોરંટી જોઈ શકે છે.",
    warrantyScanner: "વોરંટી સ્કેનર",
    publicProof: "જાહેર પુરાવો",
    publicIssueHistory: "સમસ્યા ઇતિહાસ",
    selectedCase: "પસંદ કરેલ કેસ",
    issueBefore: "સમસ્યાનો ફોટો",
    contractorProofAfter: "રિપેર પછીનો પુરાવો",
    openPublicProof: "જાહેર પુરાવો ખોલો",
    status: "સ્થિતિ",
    warranty: "વોરંટી",
    contractor: "કોન્ટ્રાક્ટર",
    publicHash: "જાહેર હેશ",
    notActive: "સક્રિય નથી",
    pending: "પેન્ડિંગ",
    active: "સક્રિય",
    reportIssue: "સમસ્યા રિપોર્ટ કરો",
    mapLocation: "ગૂગલ મેપ સ્થાન",
    mapLocationSubtitle: "ચોક્કસ સ્થાન માટે GPS અથવા કોઓર્ડિનેટ દાખલ કરો.",
    useCurrentGps: "GPS વાપરો",
    openGoogleMaps: "ગૂગલ મેપ ખોલો",
    manualCoordinates: "મેન્યુઅલ કોઓર્ડિનેટ",
    selectedAddress: "પસંદ કરેલ સરનામું",
    analyzeIssue: "સમસ્યા વિશ્લેષણ",
    createProof: "બ્લોકચેઇન પુરાવો બનાવો",
  },
  kn: {
    language: "ಭಾಷೆ",
    city: "ನಗರ",
    publicRegistry: "ಸಾರ್ವಜನಿಕ ವಾರಂಟಿ ನೋಂದಣಿ",
    publicRegistrySubtitle: "ನಾಗರಿಕರು ವರದಿ, ಬಾಕಿ ದುರಸ್ತಿ, ಗುತ್ತಿಗೆದಾರರ ಸಾಕ್ಷಿ ಮತ್ತು ಸಕ್ರಿಯ ವಾರಂಟಿ ನೋಡಬಹುದು.",
    warrantyScanner: "ವಾರಂಟಿ ಸ್ಕ್ಯಾನರ್",
    publicProof: "ಸಾರ್ವಜನಿಕ ಸಾಕ್ಷಿ",
    publicIssueHistory: "ಸಮಸ್ಯೆ ಇತಿಹಾಸ",
    selectedCase: "ಆಯ್ಕೆ ಮಾಡಿದ ಪ್ರಕರಣ",
    issueBefore: "ಸಮಸ್ಯೆ ಫೋಟೋ",
    contractorProofAfter: "ದುರಸ್ತಿ ನಂತರದ ಸಾಕ್ಷಿ",
    openPublicProof: "ಸಾರ್ವಜನಿಕ ಸಾಕ್ಷಿ ತೆರೆ",
    status: "ಸ್ಥಿತಿ",
    warranty: "ವಾರಂಟಿ",
    contractor: "ಗುತ್ತಿಗೆದಾರ",
    publicHash: "ಸಾರ್ವಜನಿಕ ಹ್ಯಾಶ್",
    notActive: "ಸಕ್ರಿಯವಿಲ್ಲ",
    pending: "ಬಾಕಿ",
    active: "ಸಕ್ರಿಯ",
    reportIssue: "ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ",
    mapLocation: "ಗೂಗಲ್ ಮ್ಯಾಪ್ ಸ್ಥಳ",
    mapLocationSubtitle: "ನಿಖರ ಸ್ಥಳಕ್ಕೆ GPS ಅಥವಾ ಕೋಆರ್ಡಿನೇಟ್ ಬಳಸಿ.",
    useCurrentGps: "GPS ಬಳಸಿ",
    openGoogleMaps: "ಗೂಗಲ್ ಮ್ಯಾಪ್ ತೆರೆ",
    manualCoordinates: "ಮ್ಯಾನುಯಲ್ ಕೋಆರ್ಡಿನೇಟ್",
    selectedAddress: "ಆಯ್ಕೆ ಮಾಡಿದ ವಿಳಾಸ",
    analyzeIssue: "ಸಮಸ್ಯೆ ವಿಶ್ಲೇಷಣೆ",
    createProof: "ಬ್ಲಾಕ್‌ಚೈನ್ ಸಾಕ್ಷಿ ರಚಿಸಿ",
  },
};

export function translate(language: string, key: TranslationKey) {
  const languageKey = isLanguageKey(language) ? language : DEFAULT_LANGUAGE_KEY;
  return translations[languageKey][key] ?? translations.en[key];
}

export function isLanguageKey(value: string): value is LanguageKey {
  return indianLanguages.some((language) => language.key === value);
}
