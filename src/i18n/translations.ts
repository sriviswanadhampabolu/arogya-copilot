export type Language = "en" | "te" | "hi";

export interface Translations {
  // Navigation
  nav_dashboard: string;
  nav_upload: string;
  nav_chat: string;
  nav_profile: string;
  nav_architecture: string;
  nav_reports: string;
  nav_login: string;
  nav_signup: string;
  nav_get_started: string;
  nav_sign_out: string;
  nav_my_profile: string;

  // Common buttons
  btn_upload_new: string;
  btn_browse_files: string;
  btn_take_photo: string;
  btn_analyze: string;
  btn_ask_copilot: string;
  btn_clear_chat: string;
  btn_view_original: string;
  btn_back_dashboard: string;
  btn_show_abnormal: string;
  btn_retry: string;
  btn_translate: string;
  btn_show_original: string;

  // Status badges
  status_normal: string;
  status_low: string;
  status_high: string;
  status_improved: string;
  status_worsened: string;
  status_stable: string;
  status_abha_not_linked: string;

  // Dashboard sections
  dash_welcome_title: string;
  dash_welcome_subtitle: string;
  dash_total_docs: string;
  dash_active_meds: string;
  dash_abnormal_latest: string;
  dash_timeline_title: string;
  dash_current_meds_title: string;
  dash_conditions_title: string;
  dash_trends_title: string;
  dash_trends_subtitle: string;
  dash_empty_title: string;
  dash_empty_desc: string;

  // Report viewer
  rep_summary_title: string;
  rep_key_findings: string;
  rep_biomarkers_title: string;
  rep_medications_title: string;
  rep_conditions_title: string;
  rep_doctor_questions_title: string;
  rep_hard_to_read: string;
  rep_schedule: string;
  rep_dose: string;
  rep_duration: string;
  rep_instructions: string;
  rep_purpose: string;
  rep_ref_range: string;
  rep_please_verify: string;

  // Disclaimers
  disclaimer_medical: string;
  disclaimer_chat: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    nav_dashboard: "Dashboard",
    nav_upload: "Upload",
    nav_chat: "Copilot Chat",
    nav_profile: "Profile",
    nav_architecture: "Architecture",
    nav_reports: "Reports",
    nav_login: "Log In",
    nav_signup: "Sign Up",
    nav_get_started: "Get Started Free",
    nav_sign_out: "Sign Out",
    nav_my_profile: "My Health Profile",

    btn_upload_new: "Upload New Document",
    btn_browse_files: "Browse Documents",
    btn_take_photo: "Take Photo",
    btn_analyze: "Analyze with AI",
    btn_ask_copilot: "Ask Copilot",
    btn_clear_chat: "Clear Chat",
    btn_view_original: "View Original Document",
    btn_back_dashboard: "Back to Dashboard",
    btn_show_abnormal: "Show only abnormal",
    btn_retry: "Retry",
    btn_translate: "Translate Report",
    btn_show_original: "Show Original (English)",

    status_normal: "Normal",
    status_low: "Low",
    status_high: "High",
    status_improved: "Improved",
    status_worsened: "Needs Attention",
    status_stable: "Stable",
    status_abha_not_linked: "ABHA not linked",

    dash_welcome_title: "Welcome to your Health Copilot",
    dash_welcome_subtitle: "Track biomarkers, review organized lab reports, and discuss health trends securely with your AI companion.",
    dash_total_docs: "Total Documents",
    dash_active_meds: "Active Medicines",
    dash_abnormal_latest: "Abnormal In Latest Lab",
    dash_timeline_title: "Health Timeline",
    dash_current_meds_title: "Current Medicines",
    dash_conditions_title: "Conditions & Diagnoses",
    dash_trends_title: "Biomarker Health Trends",
    dash_trends_subtitle: "Chronological progression with shaded normal reference range band",
    dash_empty_title: "Your Unified Health Record is Ready",
    dash_empty_desc: "Upload prescriptions, blood tests, discharge summaries, or diagnostic scans. Arogya automatically organizes clinical metrics.",

    rep_summary_title: "Plain Language Explanation",
    rep_key_findings: "Key Findings at a Glance",
    rep_biomarkers_title: "Diagnostic Biomarkers & Test Results",
    rep_medications_title: "Prescribed Medications",
    rep_conditions_title: "Documented Conditions & Diagnoses",
    rep_doctor_questions_title: "Helpful Questions to Ask Your Doctor",
    rep_hard_to_read: "Some details were hard to read. Please verify them against your original document.",
    rep_schedule: "Schedule",
    rep_dose: "Dose",
    rep_duration: "Duration",
    rep_instructions: "Instructions",
    rep_purpose: "Purpose",
    rep_ref_range: "Ref Range",
    rep_please_verify: "Please verify",

    disclaimer_medical: "Medical Disclaimer: Arogya Copilot is an AI health organizer and educational companion. It does not provide medical diagnoses, treatment decisions, or prescriptions. Always seek guidance from a qualified healthcare professional.",
    disclaimer_chat: "Arogya Copilot provides health literacy and personal organization. It is not medical advice. In an emergency, please dial 112 immediately.",
  },
  te: {
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_upload: "అప్‌లోడ్",
    nav_chat: "కోపైలట్ చాట్",
    nav_profile: "ప్రొఫైల్",
    nav_architecture: "ఆర్కిటెక్చర్",
    nav_reports: "రిపోర్టులు",
    nav_login: "లాగిన్",
    nav_signup: "సైన్ అప్",
    nav_get_started: "ఉచితంగా ప్రారంభించండి",
    nav_sign_out: "లాగౌట్",
    nav_my_profile: "నా ఆరోగ్య ప్రొఫైల్",

    btn_upload_new: "కొత్త పత్రం అప్‌లోడ్ చేయండి",
    btn_browse_files: "పత్రాలను ఎంచుకోండి",
    btn_take_photo: "ఫోటో తీయండి",
    btn_analyze: "AI తో విశ్లేషించండి",
    btn_ask_copilot: "కోపైలట్‌ను అడగండి",
    btn_clear_chat: "చాట్ క్లియర్ చేయండి",
    btn_view_original: "అసలు పత్రం చూడండి",
    btn_back_dashboard: "తిరిగి డాష్‌బోర్డ్‌కు",
    btn_show_abnormal: "అసాధారణమైనవి మాత్రమే చూపించు",
    btn_retry: "మళ్ళీ ప్రయత్నించండి",
    btn_translate: "తెలుగులోకి అనువదించండి",
    btn_show_original: "అసలు ఇంగ్లీష్ చూడండి",

    status_normal: "సాధారణం",
    status_low: "తక్కువ",
    status_high: "ఎక్కువ",
    status_improved: "మెరుగైంది",
    status_worsened: "శ్రద్ధ అవసరం",
    status_stable: "స్థిరంగా ఉంది",
    status_abha_not_linked: "ABHA అనుసంధానించబడలేదు",

    dash_welcome_title: "మీ ఆరోగ్య కోపైలట్‌కు స్వాగతం",
    dash_welcome_subtitle: "బయోమార్కర్లను ట్రాక్ చేయండి, ల్యాబ్ రిపోర్టులను పరిశీలించండి మరియు మీ ఆరోగ్య పురోగతిని తెలుసుకోండి.",
    dash_total_docs: "మొత్తం పత్రాలు",
    dash_active_meds: "ప్రస్తుత మందులు",
    dash_abnormal_latest: "తాజా రిపోర్టులో అసాధారణతలు",
    dash_timeline_title: "ఆరోగ్య కాలక్రమం",
    dash_current_meds_title: "ప్రస్తుతం వాడుతున్న మందులు",
    dash_conditions_title: "ఆరోగ్య సమస్యలు & నిర్ధారణలు",
    dash_trends_title: "ఆరోగ్య పోకడలు",
    dash_trends_subtitle: "సాధారణ పరిధితో కాలక్రమానుసార పురోగతి",
    dash_empty_title: "మీ ఆరోగ్య రికార్డు సిద్ధంగా ఉంది",
    dash_empty_desc: "ప్రిస్క్రిప్షన్లు, రక్త పరీక్షలు లేదా స్కాన్లను అప్‌లోడ్ చేయండి. ఆరోగ్య కోపైలట్ వాటిని సులభంగా వివరిస్తుంది.",

    rep_summary_title: "సరళమైన భాషలో వివరణ",
    rep_key_findings: "ముఖ్యమైన అంశాలు",
    rep_biomarkers_title: "పరీక్ష ఫలితాలు & బయోమార్కర్లు",
    rep_medications_title: "సూచించిన మందులు",
    rep_conditions_title: "గుర్తించిన ఆరోగ్య పరిస్థితులు",
    rep_doctor_questions_title: "డాక్టర్‌ను అడగవలసిన ముఖ్యమైన ప్రశ్నలు",
    rep_hard_to_read: "కొన్ని వివరాలు స్పష్టంగా లేవు. దయచేసి అసలు పత్రంతో సరిచూసుకోండి.",
    rep_schedule: "సమయం / షెడ్యూల్",
    rep_dose: "మోతాదు",
    rep_duration: "వ్యవధి",
    rep_instructions: "సూచనలు",
    rep_purpose: "ఉపయోగం",
    rep_ref_range: "సాధారణ పరిధి",
    rep_please_verify: "ధృవీకరించండి",

    disclaimer_medical: "వైద్య ప్రకటన: ఆరోగ్య కోపైలట్ ఆరోగ్య అవగాహన మరియు పత్రాల నిర్వహణకు మాత్రమే. ఇది వైద్య నిర్ధారణలు లేదా మందుల సిఫార్సులను అందించదు. ఎల్లప్పుడూ అర్హత కలిగిన వైద్యుడిని సంప్రదించండి.",
    disclaimer_chat: "ఆరోగ్య కోపైలట్ విద్యా సహాయకారి మాత్రమే. అత్యవసర పరిస్థితుల్లో వెంటనే 112 కి కాల్ చేయండి.",
  },
  hi: {
    nav_dashboard: "डैशबोर्ड",
    nav_upload: "अपलोड",
    nav_chat: "को-पायलट चैट",
    nav_profile: "प्रोफाइल",
    nav_architecture: "आर्किटेक्चर",
    nav_reports: "रिपोर्ट्स",
    nav_login: "लॉग इन",
    nav_signup: "साइन अप",
    nav_get_started: "मुफ्त में शुरू करें",
    nav_sign_out: "लॉग आउट",
    nav_my_profile: "मेरी स्वास्थ्य प्रोफाइल",

    btn_upload_new: "नया दस्तावेज़ अपलोड करें",
    btn_browse_files: "दस्तावेज़ चुनें",
    btn_take_photo: "फोटो लें",
    btn_analyze: "AI से विश्लेषण करें",
    btn_ask_copilot: "को-पायलट से पूछें",
    btn_clear_chat: "चैट साफ करें",
    btn_view_original: "मूल दस्तावेज़ देखें",
    btn_back_dashboard: "वापस डैशबोर्ड पर",
    btn_show_abnormal: "केवल असामान्य दिखाएं",
    btn_retry: "पुनः प्रयास करें",
    btn_translate: "हिंदी में अनुवाद करें",
    btn_show_original: "मूल अंग्रेजी देखें",

    status_normal: "सामान्य",
    status_low: "कम",
    status_high: "अधिक",
    status_improved: "सुधार हुआ",
    status_worsened: "ध्यान देने योग्य",
    status_stable: "स्थिर",
    status_abha_not_linked: "ABHA लिंक नहीं है",

    dash_welcome_title: "आपके आरोग्य को-पायलट में स्वागत है",
    dash_welcome_subtitle: "बायोमार्कर्स ट्रैक करें, लैब रिपोर्ट समझें, और अपनी सेहत पर निगरानी रखें।",
    dash_total_docs: "कुल दस्तावेज़",
    dash_active_meds: "सक्रिय दवाइयाँ",
    dash_abnormal_latest: "नवीनतम लैब में असामान्य परिणाम",
    dash_timeline_title: "स्वास्थ्य टाइमलाइन",
    dash_current_meds_title: "वर्तमान दवाइयाँ",
    dash_conditions_title: "स्वास्थ्य स्थितियां एवं निदान",
    dash_trends_title: "बायोमार्कर ट्रेंड्स",
    dash_trends_subtitle: "सामान्य संदर्भ सीमा के साथ समयबद्ध प्रगति",
    dash_empty_title: "आपका स्वास्थ्य रिकॉर्ड तैयार है",
    dash_empty_desc: "पर्चे, रक्त जांच या स्कैन रिपोर्ट अपलोड करें। आरोग्य को-पायलट उन्हें आसानी से समझाएगा।",

    rep_summary_title: "सरल भाषा में विवरण",
    rep_key_findings: "मुख्य बिंदु एक नज़र में",
    rep_biomarkers_title: "जांच परिणाम एवं बायोमार्कर्स",
    rep_medications_title: "निर्धारित दवाइयाँ",
    rep_conditions_title: "दर्ज की गई स्वास्थ्य स्थितियां",
    rep_doctor_questions_title: "डॉक्टर से पूछने योग्य महत्वपूर्ण प्रश्न",
    rep_hard_to_read: "कुछ लिखावट पढ़ने में कठिन थी। कृपया अपने मूल दस्तावेज़ से मिलान करें।",
    rep_schedule: "समय सारणी",
    rep_dose: "खुराक",
    rep_duration: "अवधि",
    rep_instructions: "निर्देश",
    rep_purpose: "उपयोग",
    rep_ref_range: "सामान्य सीमा",
    rep_please_verify: "सत्यापित करें",

    disclaimer_medical: "चिकित्सा अस्वीकरण: आरोग्य को-पायलट स्वास्थ्य साक्षरता और दस्तावेज़ प्रबंधन के लिए है। यह चिकित्सा निदान या पर्चा प्रदान नहीं करता है। हमेशा योग्य चिकित्सक से परामर्श लें।",
    disclaimer_chat: "आरोग्य को-पायलट केवल जानकारी के लिए है। किसी भी आपातकालीन स्थिति में तुरंत 112 डायल करें।",
  },
};
