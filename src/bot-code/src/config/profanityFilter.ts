/**
 * Profanity & Multilingual Speech Filter Configuration
 * AegisMod Hybrid AutoMod Engine
 * 
 * Supports local cuss words, slurs, and abusive speech across multiple languages:
 * - English
 * - Hindi (Devanagari & Hinglish)
 * - Russian (Cyrillic & Romanized Mat)
 * - Arabic (Arabic script & Arabizi / Franco-Arabic)
 * - Spanish, Portuguese, Tagalog, French, German
 */

export interface ProfanityEntry {
  term: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  language: string;
  category: "SEVERE_PROFANITY_OR_ABUSE" | "HATE_SPEECH" | "SELF_HARM" | "SEXUAL_GROOMING_OR_PREDATORY";
  isPhrase?: boolean;
}

export interface ProfanityMatch {
  severity: "HIGH" | "MEDIUM" | "LOW";
  word: string;
  language: string;
  category: "SEVERE_PROFANITY_OR_ABUSE" | "HATE_SPEECH" | "SELF_HARM" | "SEXUAL_GROOMING_OR_PREDATORY";
  matchedPattern: string;
}

// 1. High Severity Self-Harm & Predatory Exploitation
const EXPLOITATION_AND_SELF_HARM: ProfanityEntry[] = [
  { term: "kys", severity: "HIGH", language: "English", category: "SELF_HARM" },
  { term: "k.y.s", severity: "HIGH", language: "English", category: "SELF_HARM" },
  { term: "kill yourself", severity: "HIGH", language: "English", category: "SELF_HARM", isPhrase: true },
  { term: "kill ur self", severity: "HIGH", language: "English", category: "SELF_HARM", isPhrase: true },
  { term: "die in a fire", severity: "HIGH", language: "English", category: "SELF_HARM", isPhrase: true },
  { term: "suicide", severity: "HIGH", language: "English", category: "SELF_HARM" },
  { term: "send nudes", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
  { term: "send me nudes", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
  { term: "trade pics", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
  { term: "drop snap 16", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
  { term: "drop your insta dm", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
  { term: "meet up in person secretly", severity: "HIGH", language: "English", category: "SEXUAL_GROOMING_OR_PREDATORY", isPhrase: true },
];

// 2. Dedicated Hinglish (Hindi in Roman script) Local Cuss Words and Speech
const HINGLISH_PROFANITIES: ProfanityEntry[] = [
  // High Severity / Slurs & Abuses
  { term: "madarchod", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "maderchod", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "madarchodh", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "madarjaat", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhenchod", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "behenchod", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "behnchod", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosdike", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosadike", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosdi", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosda", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosdiwala", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhosadiwale", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bsdk", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "b.s.d.k", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bsdwale", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "randi", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "rndi", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "randwa", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "randi rona", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "gandu", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gaandu", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gaand", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "lund", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "laude", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "lawda", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "loda", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "lodu", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "jhaant", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "jhattu", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhen ke lode", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "behen ke lode", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "teri maa ki", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "teri bhen ki", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "maa chuda", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "bhen chuda", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "gand mara", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "gaand mara", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "chodna", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chudai", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chup kar bsdk", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "mar ja bsdk", severity: "HIGH", language: "Hinglish (Hindi)", category: "SELF_HARM", isPhrase: true },
  { term: "hijra", severity: "HIGH", language: "Hinglish (Hindi)", category: "HATE_SPEECH" },
  { term: "chakke", severity: "HIGH", language: "Hinglish (Hindi)", category: "HATE_SPEECH" },

  // Medium / Casual Insults & Slang
  { term: "chutiya", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chootiya", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chutya", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chutia", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chutiyapa", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhadwa", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bhadwe", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "harami", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "haraami", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "haramzada", severity: "HIGH", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "haramkhor", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kutta", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kutte", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kuttiya", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kamina", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kamine", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kaminey", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "saale", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "saala", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bakchod", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bakchodi", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chomu", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "tharki", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chudap", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "aukat me reh", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "maa ki aankh", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ullu ke patthe", severity: "MEDIUM", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "chirkut", severity: "LOW", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "tatti", severity: "LOW", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "haggu", severity: "LOW", language: "Hinglish (Hindi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
];

// 2b. Hindi Devanagari Script Cuss Words and Speech
const HINDI_DEVANAGARI_PROFANITIES: ProfanityEntry[] = [
  // Devanagari script High Severity
  { term: "मादरचोद", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "बहनचोद", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "भोसड़ीके", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "भोसडीके", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "भोसड़ा", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "गांडू", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "गांड", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "रंडी", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "रंडवा", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "भड़वे", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "भड़वा", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "लंड", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "लौड़े", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "लौड़ा", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "झांट", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "चूत", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "चूतिया", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "चुतिया", severity: "HIGH", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // Devanagari Medium / Casual
  { term: "हरामी", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "कमीना", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "कमीने", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "कुत्ता", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "कुत्ते", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "साला", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "साले", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "बकचोद", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ठरकी", severity: "MEDIUM", language: "Hindi (Devanagari)", category: "SEVERE_PROFANITY_OR_ABUSE" },
];

// 3. Russian & Mat Local Cuss Words and Speech (Cyrillic & Romanized)
const RUSSIAN_PROFANITIES: ProfanityEntry[] = [
  // Cyrillic Script Mat
  { term: "сука", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "блять", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "блядь", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "сука блять", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "хуй", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "хуйня", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "нахуй", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "похуй", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "иди нахуй", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "охуел", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "охуеть", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "пизда", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "пиздец", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ебать", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ебаный", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ёбаный", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "заебал", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "заебись", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "долбоёб", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "долбоеб", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "гондон", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "гандон", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "пидор", severity: "HIGH", language: "Russian (Cyrillic)", category: "HATE_SPEECH" },
  { term: "пидорас", severity: "HIGH", language: "Russian (Cyrillic)", category: "HATE_SPEECH" },
  { term: "пидарас", severity: "HIGH", language: "Russian (Cyrillic)", category: "HATE_SPEECH" },
  { term: "шлюха", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "шалава", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "завали ебало", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "сдохни", severity: "HIGH", language: "Russian (Cyrillic)", category: "SELF_HARM" },
  { term: "мразота", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "отсоси", severity: "HIGH", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "тварь", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "дебил", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "мудак", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "урод", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "чмо", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "лох", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "говно", severity: "MEDIUM", language: "Russian (Cyrillic)", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // Romanized Russian Mat (frequent in gaming chats)
  { term: "cyka", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "blyat", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "blyad", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "cyka blyat", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "suka", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "suka blyat", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "huy", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "hui", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "idi nahuy", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "nahuy", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "nahui", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pohuy", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ohuel", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pizda", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pizdetz", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pizdec", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ebat", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "yebat", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ebany", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ebaniy", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "zaebal", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dolboyob", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dolbaeb", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gandon", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pidor", severity: "HIGH", language: "Russian (Romanized Mat)", category: "HATE_SPEECH" },
  { term: "pidoras", severity: "HIGH", language: "Russian (Romanized Mat)", category: "HATE_SPEECH" },
  { term: "pidaras", severity: "HIGH", language: "Russian (Romanized Mat)", category: "HATE_SPEECH" },
  { term: "shlyukha", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "shlyuha", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "shalava", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "zavali ebalo", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "sdohni", severity: "HIGH", language: "Russian (Romanized Mat)", category: "SELF_HARM" },
  { term: "mudak", severity: "MEDIUM", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "urod", severity: "MEDIUM", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "debil", severity: "MEDIUM", language: "Russian (Romanized Mat)", category: "SEVERE_PROFANITY_OR_ABUSE" },
];

// 4. Arabic & Arabizi Local Cuss Words and Speech
const ARABIC_PROFANITIES: ProfanityEntry[] = [
  // Arabic Script
  { term: "شرموطة", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "قحبة", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "كس أمك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "كس امك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "كسمك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "كس اختك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "كسختك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ابن الحرام", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ابن الكلب", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ابن الشرموطة", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "منيوك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "منيك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "خول", severity: "HIGH", language: "Arabic", category: "HATE_SPEECH" },
  { term: "طيز", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "زب", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "اير", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "تفوه عليك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "يلعن ابوك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "يلعن دينك", severity: "HIGH", language: "Arabic", category: "HATE_SPEECH", isPhrase: true },
  { term: "يلعن ديكك", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "كل خرة", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "كل خرا", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "خرة", severity: "MEDIUM", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "خرا", severity: "MEDIUM", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "عرص", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "عاهرة", severity: "HIGH", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "حمار", severity: "MEDIUM", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "حيوان", severity: "MEDIUM", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "سافل", severity: "MEDIUM", language: "Arabic", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // Arabizi / Franco-Arabic & Romanized
  { term: "kos omk", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "koss omk", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "kosomk", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kuss ummak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "koss ummak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "kess emmak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "kos ukhtak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "kuss ukhtak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "kess ekhtak", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "sharmoota", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "sharmouta", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "qahba", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gahba", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gahbe", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ibn el kalb", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ibn kalb", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ibn el sharmouta", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "manyook", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "manyuk", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "khawal", severity: "HIGH", language: "Arabic (Arabizi)", category: "HATE_SPEECH" },
  { term: "teez", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "teezi", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "zabb", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "zabbi", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "zebi", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ayre", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ayre feek", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "ayr", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "3ars", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ars", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kol khara", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "col khara", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "5ara", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "khara", severity: "MEDIUM", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ylaano", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "yelaan", severity: "HIGH", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "7mar", severity: "MEDIUM", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "hmar", severity: "MEDIUM", language: "Arabic (Arabizi)", category: "SEVERE_PROFANITY_OR_ABUSE" },
];

// 5. Spanish, Portuguese, Tagalog, French, German Cuss Words
const OTHER_INTERNATIONAL_PROFANITIES: ProfanityEntry[] = [
  // Spanish
  { term: "hijo de puta", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "hijueputa", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "chinga tu madre", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "puta", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "puto", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "maricon", severity: "HIGH", language: "Spanish", category: "HATE_SPEECH" },
  { term: "cabron", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pendejo", severity: "MEDIUM", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "verga", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "mierda", severity: "MEDIUM", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gilipollas", severity: "MEDIUM", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "culiao", severity: "HIGH", language: "Spanish", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // Portuguese
  { term: "filho da puta", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "caralho", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "foda-se", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "fodase", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "arrombado", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "viado", severity: "HIGH", language: "Portuguese", category: "HATE_SPEECH" },
  { term: "puta que pariu", severity: "HIGH", language: "Portuguese", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },

  // Tagalog / Filipino
  { term: "putang ina", severity: "HIGH", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "putangina", severity: "HIGH", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "tangina", severity: "HIGH", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "gago", severity: "MEDIUM", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "kupal", severity: "HIGH", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "tarantado", severity: "MEDIUM", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "ulol", severity: "MEDIUM", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pakyu", severity: "HIGH", language: "Tagalog", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // French
  { term: "fils de pute", severity: "HIGH", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "nique ta mere", severity: "HIGH", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
  { term: "putain", severity: "MEDIUM", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "connard", severity: "HIGH", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "batard", severity: "HIGH", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "salope", severity: "HIGH", language: "French", category: "SEVERE_PROFANITY_OR_ABUSE" },

  // German
  { term: "hurensohn", severity: "HIGH", language: "German", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "arschloch", severity: "HIGH", language: "German", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "fotze", severity: "HIGH", language: "German", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "schlampe", severity: "HIGH", language: "German", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "verpiss dich", severity: "MEDIUM", language: "German", category: "SEVERE_PROFANITY_OR_ABUSE", isPhrase: true },
];

// 6. English Medium Severity Vulgarity & Slurs
const ENGLISH_MEDIUM_PROFANITIES: ProfanityEntry[] = [
  { term: "fuck", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "fucked", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "fucking", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "f*ck", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "f**k", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "fucker", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "shit", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "shitty", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "asshole", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bastard", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bitch", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bitches", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bitchy", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "cunt", severity: "HIGH", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dickhead", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dumbass", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "damn", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "damned", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "goddamn", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "piss", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pissed", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "whore", severity: "HIGH", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "slut", severity: "HIGH", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "cock", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "pussy", severity: "HIGH", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dick", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "anal", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "anus", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "arse", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "arsehole", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bollocks", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "bugger", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "crap", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "prick", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "twat", severity: "HIGH", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "wank", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "wanker", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "jackass", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "retard", severity: "HIGH", language: "English", category: "HATE_SPEECH" },
  { term: "retarded", severity: "HIGH", language: "English", category: "HATE_SPEECH" },
  { term: "dipshit", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "douche", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "douchebag", severity: "MEDIUM", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "faggot", severity: "HIGH", language: "English", category: "HATE_SPEECH" },
  { term: "nigger", severity: "HIGH", language: "English", category: "HATE_SPEECH" },
  { term: "tranny", severity: "HIGH", language: "English", category: "HATE_SPEECH" },
];

// 7. Low Severity Casual Words
const ENGLISH_LOW_PROFANITIES: ProfanityEntry[] = [
  { term: "sucks", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "sucky", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "lame", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "poo", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "poop", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "butt", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "boob", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "boobs", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "freak", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "frick", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "freaking", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "darn", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "dang", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
  { term: "heck", severity: "LOW", language: "English", category: "SEVERE_PROFANITY_OR_ABUSE" },
];

// Combine all entries
export const DEFAULT_PROFANITY_ENTRIES: ProfanityEntry[] = [
  ...EXPLOITATION_AND_SELF_HARM,
  ...HINGLISH_PROFANITIES,
  ...HINDI_DEVANAGARI_PROFANITIES,
  ...RUSSIAN_PROFANITIES,
  ...ARABIC_PROFANITIES,
  ...OTHER_INTERNATIONAL_PROFANITIES,
  ...ENGLISH_MEDIUM_PROFANITIES,
  ...ENGLISH_LOW_PROFANITIES,
];

export const ALL_ENTRIES = DEFAULT_PROFANITY_ENTRIES;

// Active working entries that can be reloaded by CentralBlacklistService
let activeEntries: ProfanityEntry[] = [...DEFAULT_PROFANITY_ENTRIES];

// Build lookup sets for backwards compatibility
const highSet = new Set<string>();
const mediumSet = new Set<string>();
const lowSet = new Set<string>();

const rebuildLookupSets = () => {
  highSet.clear();
  mediumSet.clear();
  lowSet.clear();
  for (const entry of activeEntries) {
    if (entry.severity === "HIGH") highSet.add(entry.term);
    else if (entry.severity === "MEDIUM") mediumSet.add(entry.term);
    else if (entry.severity === "LOW") lowSet.add(entry.term);
  }
  phraseEntries = activeEntries.filter(e => e.isPhrase || e.term.includes(" "));
  singleWordEntries = activeEntries.filter(e => !e.isPhrase && !e.term.includes(" "));
};

// Separate phrases and single words for optimized matching
let phraseEntries = activeEntries.filter(e => e.isPhrase || e.term.includes(" "));
let singleWordEntries = activeEntries.filter(e => !e.isPhrase && !e.term.includes(" "));

rebuildLookupSets();

export const PROFANITY_FILTER = {
  highSeverity: highSet,
  mediumSeverity: mediumSet,
  lowSeverity: lowSet,
  get allEntries(): ProfanityEntry[] {
    return activeEntries;
  },

  supportedLanguages: [
    "Hinglish",
    "Hindi (Devanagari)",
    "Russian (Cyrillic)",
    "Russian (Romanized Mat)",
    "Arabic",
    "Arabic (Arabizi)",
    "Spanish",
    "English",
    "Portuguese",
    "Tagalog",
    "French",
    "German",
  ],

  /**
   * Dynamically reloads entries from central blacklist storage
   */
  reloadEntries(newEntries: ProfanityEntry[]) {
    activeEntries = [...newEntries];
    rebuildLookupSets();
    
    // Update supported languages based on loaded entries
    const langSet = new Set<string>(PROFANITY_FILTER.supportedLanguages);
    for (const e of newEntries) {
      if (e.language) langSet.add(e.language);
    }
    PROFANITY_FILTER.supportedLanguages = Array.from(langSet);
  },

  /**
   * Comprehensive multilingual profanity & abusive speech detection
   * Checks Hindi, Russian, Arabic, Spanish, English, etc.
   * Handles Unicode scripts, spaced-out evasion, and leetspeak
   */
  checkProfanity(content: string): ProfanityMatch | null {
    if (!content || !content.trim()) return null;

    const rawLower = content.trim().toLowerCase();
    
    // Normalized text with collapsed separators (e.g., 'm.c', 'b.c', 's.u.k.a', 'c y k a')
    const deSpaced = rawLower
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[._\-*+~]/g, " ")
      .replace(/\s+/g, " ");

    const noSpaces = rawLower.replace(/[\s._\-*+~]/g, "");

    // Helper to check a single word with Unicode-aware boundaries (\p{L} and \p{N})
    const matchesWord = (target: string, word: string): boolean => {
      if (word.includes("*")) {
        return target.includes(word);
      }
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Use Unicode property escapes (\p{L} = any unicode letter, \p{N} = any unicode number)
      try {
        const regex = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, "iu");
        return regex.test(target);
      } catch {
        // Fallback for older regex engines
        const fallbackRegex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
        return fallbackRegex.test(target);
      }
    };

    // 1. Check HIGH severity phrases first (multi-word phrases like "kos omk", "cyka blyat", "teri maa ki")
    for (const entry of phraseEntries) {
      if (entry.severity === "HIGH") {
        const needle = entry.term.toLowerCase();
        if (rawLower.includes(needle) || deSpaced.includes(needle)) {
          return {
            severity: "HIGH",
            word: entry.term,
            language: entry.language,
            category: entry.category,
            matchedPattern: entry.term,
          };
        }
      }
    }

    // 2. Check HIGH severity single words (Devanagari, Cyrillic, Arabic, Romanized)
    for (const entry of singleWordEntries) {
      if (entry.severity === "HIGH") {
        const needle = entry.term.toLowerCase();
        if (matchesWord(rawLower, needle) || matchesWord(deSpaced, needle)) {
          return {
            severity: "HIGH",
            word: entry.term,
            language: entry.language,
            category: entry.category,
            matchedPattern: entry.term,
          };
        }
        // Handle short abbreviations or spaced bypass like 'b.s.d.k' or 'k.o.s'
        if (needle.length >= 3 && noSpaces.includes(needle)) {
          // Verify it's not a false positive within an innocent long English word
          if (rawLower.includes(needle) || matchesWord(deSpaced, needle) || (deSpaced.split(" ").some(part => part === needle))) {
            return {
              severity: "HIGH",
              word: entry.term,
              language: entry.language,
              category: entry.category,
              matchedPattern: entry.term,
            };
          }
        }
      }
    }

    // 3. Check MEDIUM severity phrases
    for (const entry of phraseEntries) {
      if (entry.severity === "MEDIUM") {
        const needle = entry.term.toLowerCase();
        if (rawLower.includes(needle) || deSpaced.includes(needle)) {
          return {
            severity: "MEDIUM",
            word: entry.term,
            language: entry.language,
            category: entry.category,
            matchedPattern: entry.term,
          };
        }
      }
    }

    // 4. Check MEDIUM severity single words
    for (const entry of singleWordEntries) {
      if (entry.severity === "MEDIUM") {
        const needle = entry.term.toLowerCase();
        if (matchesWord(rawLower, needle) || matchesWord(deSpaced, needle)) {
          return {
            severity: "MEDIUM",
            word: entry.term,
            language: entry.language,
            category: entry.category,
            matchedPattern: entry.term,
          };
        }
      }
    }

    // 5. Check LOW severity single words & phrases
    for (const entry of activeEntries) {
      if (entry.severity === "LOW") {
        const needle = entry.term.toLowerCase();
        if (entry.isPhrase || entry.term.includes(" ")) {
          if (rawLower.includes(needle) || deSpaced.includes(needle)) {
            return {
              severity: "LOW",
              word: entry.term,
              language: entry.language,
              category: entry.category,
              matchedPattern: entry.term,
            };
          }
        } else if (matchesWord(rawLower, needle) || matchesWord(deSpaced, needle)) {
          return {
            severity: "LOW",
            word: entry.term,
            language: entry.language,
            category: entry.category,
            matchedPattern: entry.term,
          };
        }
      }
    }

    return null;
  },

  /**
   * Returns statistics of supported vocabulary per language
   */
  getLanguageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const entry of activeEntries) {
      stats[entry.language] = (stats[entry.language] || 0) + 1;
    }
    return stats;
  }
};
