// ============================================================================
// AI Push Notification Engine
// 100% Free of Cost - Context-Aware, Situation-Based, Dynamic & Relatable
// Enforces:
// 1. Live Web / Multi-Year Festival Check (Morning Wishes & Festive Cheer)
// 2. Sent History Memory (Strict Anti-Repetition & 100% Unique Funny/Casual Copy)
// 3. Predictive User Reaction Probabilities (% Open, % View, % Ignore, % Churn Risk)
// 4. Optimal Daily Frequency & Fatigue Control (1-2 messages max)
// 5. Strict 2-Hour Minimum Advance Buffer (Admin Review/Cancel/Edit Safety Window)
// 6. Token & Resource Optimization (Compact, Fast, Zero Latency Fallback)
// ============================================================================

/**
 * Format timestamp into Indian Standard Time (IST) 12-hour format
 * e.g. "5:16 PM IST" or "8:15 PM IST"
 */
export function formatTimeIST(dateOrMs, includeZone = true) {
  const d = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  const formatted = d.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  return includeZone ? `${formatted} IST` : formatted;
}

/**
 * Format timestamp into Indian Standard Time (IST) date string
 * e.g. "Wed, Oct 14"
 */
export function formatDateIST(dateOrMs) {
  const d = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  return d.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Multi-Year Indian Festival Database (2024–2030)
 * Keys are strictly YYYY-MM-DD (evaluated in IST)
 */
export const MULTI_YEAR_FESTIVALS = {
  // --- 2024 ---
  '2024-10-29': {
    name: 'Dhanteras 🪔',
    greetingTitle: 'Shubh Dhanteras! 🪔✨',
    wish: 'Shubh Dhanteras! May Goddess Lakshmi & Lord Dhanvantari bless you with abundant health, wealth & prosperity.',
    mood: 'festival_lights'
  },
  '2024-10-30': {
    name: 'Choti Diwali 🪔',
    greetingTitle: 'Happy Choti Diwali! 🪔',
    wish: 'Happy Choti Diwali! May divine light fill your home and bring peace to your family.',
    mood: 'festival_lights'
  },
  '2024-10-31': {
    name: 'Diwali (Lakshmi Puja) 🪔',
    greetingTitle: 'Happy Diwali! 🪔✨',
    wish: 'Happy Diwali! May this festival of lights illuminate your life with infinite joy, good health, and success.',
    mood: 'diwali'
  },
  '2024-11-01': {
    name: 'Diwali Celebrations 🪔',
    greetingTitle: 'Happy Diwali Celebrations! 🪔✨',
    wish: 'Happy Diwali! Celebrate the light of joy, festive sweets, and togetherness with your loved ones.',
    mood: 'diwali'
  },
  '2024-11-02': {
    name: 'Govardhan Puja 🌿',
    greetingTitle: 'Shubh Govardhan Puja! 🌿',
    wish: 'Shubh Govardhan Puja! May nature’s blessings and divine grace protect and nourish your family.',
    mood: 'festival_harvest'
  },
  '2024-11-03': {
    name: 'Bhai Dooj 👫',
    greetingTitle: 'Happy Bhai Dooj! 👫✨',
    wish: 'Happy Bhai Dooj! Celebrating the eternal and precious bond of love between brothers and sisters.',
    mood: 'family_bond'
  },
  '2024-11-07': {
    name: 'Chhath Puja (Sandhya Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! May Chhathi Maiya and Surya Dev bestow endless peace, health, and prosperity upon your family.',
    mood: 'chhath'
  },
  '2024-11-08': {
    name: 'Chhath Puja (Usha Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! Greetings on the auspicious morning Arghya. May the rising Sun bring new hopes and joy.',
    mood: 'chhath'
  },
  '2024-11-15': {
    name: 'Guru Nanak Jayanti 🪔',
    greetingTitle: 'Happy Gurpurab! 🪔✨',
    wish: 'Happy Guru Nanak Jayanti! May Guru Nanak Dev Ji inspire you towards compassion, truth, and inner peace.',
    mood: 'peace'
  },

  // --- 2025 ---
  '2025-01-14': {
    name: 'Makar Sankranti & Pongal 🪁',
    greetingTitle: 'Happy Makar Sankranti & Pongal! 🪁✨',
    wish: 'Happy Makar Sankranti & Pongal! May your life soar high like colorful kites in the festive sky.',
    mood: 'harvest'
  },
  '2025-02-26': {
    name: 'Maha Shivratri 🔱',
    greetingTitle: 'Har Har Mahadev! 🔱✨',
    wish: 'Wishing you peace, strength, and divine blessings on the auspicious occasion of Maha Shivratri.',
    mood: 'spiritual'
  },
  '2025-03-13': {
    name: 'Holika Dahan 🔥',
    greetingTitle: 'Shubh Holika Dahan! 🔥',
    wish: 'Shubh Holika Dahan! May the holy fire burn away all worries and bring warmth into your life.',
    mood: 'holi'
  },
  '2025-03-14': {
    name: 'Holi (Festival of Colors) 🎨',
    greetingTitle: 'Happy Holi! 🎨🎉',
    wish: 'Happy Holi! May your day be filled with vibrant colors of joy, sweet gujiyas, and laughter with friends.',
    mood: 'holi'
  },
  '2025-03-31': {
    name: 'Eid ul-Fitr 🌙',
    greetingTitle: 'Eid Mubarak! 🌙✨',
    wish: 'Eid Mubarak! Wishing you and your loved ones peace, happiness, and sweet sheer khurma on this blessed day.',
    mood: 'eid'
  },
  '2025-06-07': {
    name: 'Eid al-Adha (Bakrid) 🌙',
    greetingTitle: 'Eid Mubarak! 🌙✨',
    wish: 'Eid Mubarak! Warm wishes of devotion, harmony, and prosperity on Eid al-Adha.',
    mood: 'eid'
  },
  '2025-08-09': {
    name: 'Raksha Bandhan 👫',
    greetingTitle: 'Happy Raksha Bandhan! 👫💖',
    wish: 'Happy Raksha Bandhan! Celebrating the sweet, protective bond of love between siblings.',
    mood: 'family_bond'
  },
  '2025-08-16': {
    name: 'Krishna Janmashtami 🦚',
    greetingTitle: 'Happy Janmashtami! 🦚✨',
    wish: 'Jai Shri Krishna! May Lord Krishna fill your heart and home with joy, love, and sweet blessings.',
    mood: 'festive'
  },
  '2025-08-27': {
    name: 'Ganesh Chaturthi 🐘',
    greetingTitle: 'Ganpati Bappa Morya! 🐘✨',
    wish: 'Happy Ganesh Chaturthi! May Lord Ganesha remove all obstacles and shower wisdom and prosperity upon you.',
    mood: 'festive'
  },
  '2025-09-22': {
    name: 'Navratri Begins 🌺',
    greetingTitle: 'Shubh Navratri! 🌺✨',
    wish: 'Jai Mata Di! May Maa Durga bless you with strength, courage, and auspicious joy throughout Navratri.',
    mood: 'navratri'
  },
  '2025-10-02': {
    name: 'Dussehra (Vijayadashami) 🏹',
    greetingTitle: 'Happy Dussehra! 🏹✨',
    wish: 'Happy Dussehra! May truth and righteousness always triumph. Wishing you joy and festive victory.',
    mood: 'dussehra'
  },
  '2025-10-10': {
    name: 'Karwa Chauth 🌕',
    greetingTitle: 'Happy Karwa Chauth! 🌕✨',
    wish: 'Happy Karwa Chauth! Celebrating love, devotion, and lifelong harmony for all couples.',
    mood: 'family_bond'
  },
  '2025-10-18': {
    name: 'Dhanteras 🪔',
    greetingTitle: 'Shubh Dhanteras! 🪔✨',
    wish: 'Shubh Dhanteras! May Goddess Lakshmi & Lord Dhanvantari bless your home with health, wealth, and prosperity.',
    mood: 'diwali'
  },
  '2025-10-19': {
    name: 'Choti Diwali 🪔',
    greetingTitle: 'Happy Choti Diwali! 🪔✨',
    wish: 'Happy Choti Diwali! May the divine lamps illuminate every corner of your life with happiness.',
    mood: 'diwali'
  },
  '2025-10-20': {
    name: 'Diwali (Lakshmi Puja) 🪔',
    greetingTitle: 'Happy Diwali! 🪔✨',
    wish: 'Happy Diwali! May this festival of lights fill your life with warmth, sweetness, success, and prosperity.',
    mood: 'diwali'
  },
  '2025-10-22': {
    name: 'Govardhan Puja 🌿',
    greetingTitle: 'Shubh Govardhan Puja! 🌿',
    wish: 'Shubh Govardhan Puja! May nature and divinity bless you with health and endless abundance.',
    mood: 'festival_harvest'
  },
  '2025-10-23': {
    name: 'Bhai Dooj 👫',
    greetingTitle: 'Happy Bhai Dooj! 👫✨',
    wish: 'Happy Bhai Dooj! Warmest wishes to brothers and sisters celebrating their everlasting bond.',
    mood: 'family_bond'
  },
  '2025-10-27': {
    name: 'Chhath Puja (Nahay Khay) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! Salutations on the start of the holy festival of faith, purity, and devotion.',
    mood: 'chhath'
  },
  '2025-10-28': {
    name: 'Chhath Puja (Sandhya Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! May Surya Dev and Chhathi Maiya shower divine blessings of health and longevity on you.',
    mood: 'chhath'
  },
  '2025-10-29': {
    name: 'Chhath Puja (Usha Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! Morning blessings and devotion to the rising Sun. May your wishes be fulfilled.',
    mood: 'chhath'
  },
  '2025-11-05': {
    name: 'Guru Nanak Jayanti 🪔',
    greetingTitle: 'Happy Gurpurab! 🪔✨',
    wish: 'Happy Guru Nanak Jayanti! May Guru Nanak Dev Ji inspire you towards compassion, peace, and truth.',
    mood: 'peace'
  },

  // --- 2026 ---
  '2026-01-14': {
    name: 'Makar Sankranti & Pongal 🪁',
    greetingTitle: 'Happy Makar Sankranti & Pongal! 🪁✨',
    wish: 'Happy Makar Sankranti & Pongal! Sweet jaggery, til, and soaring festive joy for your family.',
    mood: 'harvest'
  },
  '2026-02-15': {
    name: 'Maha Shivratri 🔱',
    greetingTitle: 'Har Har Mahadev! 🔱✨',
    wish: 'Divine peace and auspicious blessings on Maha Shivratri. May Lord Shiva guide you.',
    mood: 'spiritual'
  },
  '2026-03-03': {
    name: 'Holika Dahan 🔥',
    greetingTitle: 'Shubh Holika Dahan! 🔥',
    wish: 'Shubh Holika Dahan! May all worries burn away in the sacred flame, leaving peace and joy.',
    mood: 'holi'
  },
  '2026-03-04': {
    name: 'Holi (Festival of Colors) 🎨',
    greetingTitle: 'Happy Holi! 🎨🎉',
    wish: 'Happy Holi! Wishing you a joyful splash of colors, sweet treats, and great times with loved ones.',
    mood: 'holi'
  },
  '2026-03-20': {
    name: 'Eid ul-Fitr 🌙',
    greetingTitle: 'Eid Mubarak! 🌙✨',
    wish: 'Eid Mubarak! Warm wishes of happiness, peace, and sweet blessings to you and your family.',
    mood: 'eid'
  },
  '2026-05-27': {
    name: 'Eid al-Adha 🌙',
    greetingTitle: 'Eid Mubarak! 🌙✨',
    wish: 'Eid Mubarak! May your prayers and sacrifices be blessed with peace and prosperity.',
    mood: 'eid'
  },
  '2026-08-28': {
    name: 'Raksha Bandhan 👫',
    greetingTitle: 'Happy Raksha Bandhan! 👫💖',
    wish: 'Happy Raksha Bandhan! Cherishing the beautiful, unbreakable bond of brothers and sisters.',
    mood: 'family_bond'
  },
  '2026-09-04': {
    name: 'Krishna Janmashtami 🦚',
    greetingTitle: 'Happy Janmashtami! 🦚✨',
    wish: 'Jai Shri Krishna! May Lord Krishna fill your home with happiness, divine love, and sweet flute melodies.',
    mood: 'festive'
  },
  '2026-09-14': {
    name: 'Ganesh Chaturthi 🐘',
    greetingTitle: 'Ganpati Bappa Morya! 🐘✨',
    wish: 'Ganpati Bappa Morya! May Lord Ganesha bestow good health, wisdom, and joy upon your life.',
    mood: 'festive'
  },
  '2026-10-11': {
    name: 'Navratri Begins 🌺',
    greetingTitle: 'Shubh Navratri! 🌺✨',
    wish: 'Jai Mata Di! May divine grace protect and uplift you during these 9 sacred days of Navratri.',
    mood: 'navratri'
  },
  '2026-10-19': {
    name: 'Maha Navami 🌺',
    greetingTitle: 'Shubh Maha Navami! 🌺✨',
    wish: 'Shubh Maha Navami! May the divine blessings of Maa Durga remain with your family forever.',
    mood: 'navratri'
  },
  '2026-10-20': {
    name: 'Dussehra (Vijayadashami) 🏹',
    greetingTitle: 'Happy Dussehra! 🏹✨',
    wish: 'Happy Dussehra! Celebrating the eternal triumph of good over evil. Wishing you prosperity and joy.',
    mood: 'dussehra'
  },
  '2026-10-29': {
    name: 'Karwa Chauth 🌕',
    greetingTitle: 'Happy Karwa Chauth! 🌕✨',
    wish: 'Happy Karwa Chauth! Celebrating love, devotion, and lifelong togetherness.',
    mood: 'family_bond'
  },
  '2026-11-06': {
    name: 'Dhanteras 🪔',
    greetingTitle: 'Shubh Dhanteras! 🪔✨',
    wish: 'Shubh Dhanteras! May Lord Dhanvantari and Goddess Lakshmi bless you with robust health and wealth.',
    mood: 'diwali'
  },
  '2026-11-07': {
    name: 'Choti Diwali 🪔',
    greetingTitle: 'Happy Choti Diwali! 🪔✨',
    wish: 'Happy Choti Diwali! Light up your home with diyas, warmth, and joyous celebrations.',
    mood: 'diwali'
  },
  '2026-11-08': {
    name: 'Diwali (Lakshmi Puja) 🪔',
    greetingTitle: 'Happy Diwali! 🪔✨',
    wish: 'Happy Diwali! May this festival of lights illuminate your life with joy, laughter, and endless prosperity.',
    mood: 'diwali'
  },
  '2026-11-09': {
    name: 'Govardhan Puja 🌿',
    greetingTitle: 'Shubh Govardhan Puja! 🌿',
    wish: 'Shubh Govardhan Puja! Wishing peace, good harvest, and nature’s divine blessings.',
    mood: 'festival_harvest'
  },
  '2026-11-10': {
    name: 'Bhai Dooj 👫',
    greetingTitle: 'Happy Bhai Dooj! 👫✨',
    wish: 'Happy Bhai Dooj! Sweet celebrations of brother-sister love, laughter, and lifelong protection.',
    mood: 'family_bond'
  },
  '2026-11-14': {
    name: 'Chhath Puja (Sandhya Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! May the Sun God shower divine blessings of good health and peace on your family.',
    mood: 'chhath'
  },
  '2026-11-15': {
    name: 'Chhath Puja (Usha Arghya) 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! Salutations to the rising Sun. May your home be blessed with radiant happiness.',
    mood: 'chhath'
  },
  '2026-11-24': {
    name: 'Guru Nanak Jayanti 🪔',
    greetingTitle: 'Happy Gurpurab! 🪔✨',
    wish: 'Happy Guru Nanak Jayanti! May Guru Nanak Dev Ji guide your life with light, peace, and selfless service.',
    mood: 'peace'
  },

  // --- 2027 ---
  '2027-01-14': {
    name: 'Makar Sankranti & Pongal 🪁',
    greetingTitle: 'Happy Makar Sankranti! 🪁✨',
    wish: 'Happy Makar Sankranti! May the harvest season bring sweetness, health, and bright hopes.',
    mood: 'harvest'
  },
  '2027-03-06': {
    name: 'Maha Shivratri 🔱',
    greetingTitle: 'Har Har Mahadev! 🔱✨',
    wish: 'May Lord Shiva bless you with peace, patience, and divine wisdom on Maha Shivratri.',
    mood: 'spiritual'
  },
  '2027-03-22': {
    name: 'Holi (Festival of Colors) 🎨',
    greetingTitle: 'Happy Holi! 🎨🎉',
    wish: 'Happy Holi! Wishing you a joyous festival of vibrant colors, music, and delicious sweets.',
    mood: 'holi'
  },
  '2027-10-09': {
    name: 'Dussehra (Vijayadashami) 🏹',
    greetingTitle: 'Happy Dussehra! 🏹✨',
    wish: 'Happy Dussehra! Celebrating the victory of good. May success and happiness follow you.',
    mood: 'dussehra'
  },
  '2027-10-27': {
    name: 'Dhanteras 🪔',
    greetingTitle: 'Shubh Dhanteras! 🪔✨',
    wish: 'Shubh Dhanteras! Wishing you good health, prosperity, and endless joy.',
    mood: 'diwali'
  },
  '2027-10-28': {
    name: 'Choti Diwali 🪔',
    greetingTitle: 'Happy Choti Diwali! 🪔✨',
    wish: 'Happy Choti Diwali! May the gentle glow of diyas bring peace to your home.',
    mood: 'diwali'
  },
  '2027-10-29': {
    name: 'Diwali (Lakshmi Puja) 🪔',
    greetingTitle: 'Happy Diwali! 🪔✨',
    wish: 'Happy Diwali! May the festival of lights bring radiant joy, health, and prosperity to your life.',
    mood: 'diwali'
  },
  '2027-10-30': {
    name: 'Govardhan Puja 🌿',
    greetingTitle: 'Shubh Govardhan Puja! 🌿',
    wish: 'Shubh Govardhan Puja! May divine abundance fill your days.',
    mood: 'festival_harvest'
  },
  '2027-10-31': {
    name: 'Bhai Dooj 👫',
    greetingTitle: 'Happy Bhai Dooj! 👫✨',
    wish: 'Happy Bhai Dooj! Warm wishes to brothers and sisters celebrating their sweet bond.',
    mood: 'family_bond'
  },
  '2027-11-04': {
    name: 'Chhath Puja 🌅',
    greetingTitle: 'Shubh Chhath Puja! 🌅🙏',
    wish: 'Shubh Chhath Puja! May Lord Surya bless your family with long life, strength, and happiness.',
    mood: 'chhath'
  }
};

/**
 * Fixed Annual National & Global Holidays (Evaluated every year)
 * Keys are strictly MM-DD (evaluated in IST)
 */
export const FIXED_ANNUAL_HOLIDAYS = {
  '01-01': {
    name: "New Year's Day 🎉",
    greetingTitle: 'Happy New Year! 🎉✨',
    wish: 'Happy New Year! Wishing you a fresh start filled with joy, new achievements, and great times.',
    mood: 'new_year'
  },
  '01-26': {
    name: 'Republic Day 🇮🇳',
    greetingTitle: 'Happy Republic Day! 🇮🇳',
    wish: 'Happy Republic Day! Saluting the spirit of India, our constitution, and national unity.',
    mood: 'patriotism'
  },
  '02-14': {
    name: "Valentine's Day 💖",
    greetingTitle: "Happy Valentine's Day! 💖",
    wish: "Happy Valentine's Day! Celebrate love, warmth, and friendly fun with those who matter most.",
    mood: 'love'
  },
  '03-08': {
    name: "International Women's Day 🌸",
    greetingTitle: "Happy Women's Day! 🌸✨",
    wish: "Happy Women's Day! Celebrating the courage, leadership, and brilliance of women everywhere.",
    mood: 'celebration'
  },
  '05-01': {
    name: 'May Day (Labour Day) 🛠️',
    greetingTitle: 'Happy Labour Day! 🛠️',
    wish: 'Happy Labour Day! Honoring the hard work and dedication of everyone. Enjoy a well-deserved break.',
    mood: 'holiday'
  },
  '08-15': {
    name: 'Independence Day 🇮🇳',
    greetingTitle: 'Happy Independence Day! 🇮🇳',
    wish: "Happy Independence Day! Saluting our glorious tricolor and the spirit of freedom across our nation.",
    mood: 'patriotism'
  },
  '10-02': {
    name: 'Gandhi Jayanti 🕊️',
    greetingTitle: 'Gandhi Jayanti Greetings 🕊️',
    wish: 'Remembering the teachings of truth, peace, and non-violence on Gandhi Jayanti.',
    mood: 'peace'
  },
  '10-31': {
    name: 'Halloween 🎃',
    greetingTitle: 'Happy Halloween! 🎃👻',
    wish: 'Happy Halloween! Spooky fun, tasty treats, and playful challenges tonight.',
    mood: 'halloween'
  },
  '11-14': {
    name: "Children's Day 🎈",
    greetingTitle: "Happy Children's Day! 🎈✨",
    wish: "Happy Children's Day! Relive the pure joy, nostalgic school memories, and fun of classic games.",
    mood: 'nostalgia'
  },
  '12-25': {
    name: 'Christmas Day 🎄',
    greetingTitle: 'Merry Christmas! 🎄✨',
    wish: 'Merry Christmas! Wishing you and your family peace, festive warmth, and joyous celebrations.',
    mood: 'christmas'
  },
  '12-31': {
    name: "New Year's Eve 🎆",
    greetingTitle: "Happy New Year's Eve! 🎆",
    wish: "Happy New Year's Eve! Bid farewell to the year with laughter, friends, and joyful countdowns.",
    mood: 'nye'
  }
};

/**
 * Detect if a date matches a known Indian festival or national holiday
 */
export function detectSpecialOccasion(dateOrMs = new Date()) {
  const d = dateOrMs instanceof Date ? dateOrMs : new Date(dateOrMs);
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffset);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');

  const fullKey = `${y}-${m}-${day}`;
  const monthDayKey = `${m}-${day}`;

  if (MULTI_YEAR_FESTIVALS[fullKey]) {
    return { ...MULTI_YEAR_FESTIVALS[fullKey], dateKey: fullKey };
  }
  if (FIXED_ANNUAL_HOLIDAYS[monthDayKey]) {
    return { ...FIXED_ANNUAL_HOLIDAYS[monthDayKey], dateKey: monthDayKey };
  }
  return null;
}

/**
 * Resolve contextual time slot details for a specific hour of the day (0-23 in IST)
 */
export function getSlotForHour(hour) {
  if (hour >= 6 && hour < 11) {
    return {
      slotKey: 'morning_commute',
      slotTitle: 'Morning Wake-Up & Commute',
      slotIcon: '🌅'
    };
  } else if (hour >= 11 && hour < 14) {
    return {
      slotKey: 'midday_lunch',
      slotTitle: 'Lunch Break & Midday De-stress',
      slotIcon: '🍱'
    };
  } else if (hour >= 14 && hour < 16) {
    return {
      slotKey: 'post_lunch_slump',
      slotTitle: 'Post-Lunch Lethargy Buster',
      slotIcon: '🥱'
    };
  } else if (hour >= 16 && hour < 18) {
    return {
      slotKey: 'afternoon_chai',
      slotTitle: 'Evening Chai Break & Micro-Break',
      slotIcon: '☕'
    };
  } else if (hour >= 18 && hour < 20) {
    return {
      slotKey: 'evening_commute',
      slotTitle: 'Evening Commute & Work Wrap-Up',
      slotIcon: '🌇'
    };
  } else if (hour >= 20 && hour < 22) {
    return {
      slotKey: 'dinner_chill',
      slotTitle: 'Dinner & Couch Relaxation',
      slotIcon: '🍲'
    };
  } else {
    return {
      slotKey: 'night_wind_down',
      slotTitle: 'Late Night Wind-Down',
      slotIcon: '🌙'
    };
  }
}

/**
 * Get current contextual parameters in Indian Standard Time (IST, UTC+5:30)
 */
export function getContextualMatrix(date = new Date()) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);

  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();
  const dayIndex = istDate.getUTCDay();
  const dayOfMonth = istDate.getUTCDate();
  const month = istDate.getUTCMonth() + 1;
  const year = istDate.getUTCFullYear();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[dayIndex];
  const isWeekend = dayIndex === 0 || dayIndex === 6;

  const slot = getSlotForHour(hour);
  const specialDay = detectSpecialOccasion(date);

  return {
    hour,
    minute,
    dayName,
    dayIndex,
    isWeekend,
    dayOfMonth,
    month,
    year,
    slotKey: slot.slotKey,
    slotTitle: slot.slotTitle,
    slotIcon: slot.slotIcon,
    specialDay,
    istTimeString: formatTimeIST(date, true),
    istDateString: formatDateIST(date),
    nowMs: date.getTime()
  };
}

/**
 * Candidate send windows (IST). Each window sits well inside exactly one contextual
 * slot so the -20..+20 minute jitter can never push it into a neighbouring slot.
 */
const DAILY_SEND_WINDOWS = [
  { hour: 10, minute: 30, slotKey: 'morning_commute', desc: 'Morning Coffee / Wake-up' },
  { hour: 13, minute: 15, slotKey: 'midday_lunch', desc: 'Lunch Break & Micro-break' },
  { hour: 14, minute: 50, slotKey: 'post_lunch_slump', desc: 'Post-Lunch Pick-me-up' },
  { hour: 17, minute: 0, slotKey: 'afternoon_chai', desc: 'Chai Time & Relax' },
  { hour: 18, minute: 45, slotKey: 'evening_commute', desc: 'Evening Commute & Wrap-up' },
  { hour: 20, minute: 30, slotKey: 'dinner_chill', desc: 'Dinner & Couch Relaxation' },
  { hour: 22, minute: 20, slotKey: 'night_wind_down', desc: 'Late Night Wind-down' }
];

const TRIGGER_JITTER_MINUTES = 20;
const MIN_LEAD_TIME_MS = 2 * 60 * 60 * 1000; // 2 HOURS STRICT REVIEW BUFFER
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Quiet hours (IST): nothing is ever sent from 23:00 up to 08:00; such sends move to 08:30. */
export const QUIET_HOURS_IST = { startHour: 23, endHour: 8, resumeHour: 8, resumeMinute: 30 };
/** A scheduled item that is later than this is not sent any more (server slept / restarted). */
export const MAX_LATE_DISPATCH_MS = 45 * 60 * 1000;

/** FNV-1a string hash -> 32-bit unsigned int */
function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic PRNG (mulberry32) seeded from any string. Same seed -> same sequence. */
export function createSeededRandom(seedStr) {
  let seed = hashString(String(seedStr));
  return function next() {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** YYYY-MM-DD in IST */
export function getIstDateKey(dateOrMs = Date.now()) {
  const ms = dateOrMs instanceof Date ? dateOrMs.getTime() : dateOrMs;
  const ist = new Date(ms + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMs(dateOrMs) {
  if (dateOrMs instanceof Date) return dateOrMs.getTime();
  if (typeof dateOrMs === 'number') return dateOrMs;
  const parsed = new Date(dateOrMs).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

/** True when the IST clock at `ms` is inside the quiet hours (23:00-07:59). */
export function isQuietHoursIST(dateOrMs = Date.now()) {
  const hour = new Date(toMs(dateOrMs) + IST_OFFSET_MS).getUTCHours();
  return hour >= QUIET_HOURS_IST.startHour || hour < QUIET_HOURS_IST.endHour;
}

/**
 * If `ms` falls in the quiet hours, return the next 08:30 IST (same day when it is
 * still before 08:00, otherwise the next day). Any other time is returned unchanged.
 */
export function nextAllowedSendTime(dateOrMs = Date.now()) {
  const ms = toMs(dateOrMs);
  if (!isQuietHoursIST(ms)) return ms;
  const ist = new Date(ms + IST_OFFSET_MS);
  if (ist.getUTCHours() >= QUIET_HOURS_IST.startHour) ist.setUTCDate(ist.getUTCDate() + 1);
  ist.setUTCHours(QUIET_HOURS_IST.resumeHour, QUIET_HOURS_IST.resumeMinute, 0, 0);
  return ist.getTime() - IST_OFFSET_MS;
}

/**
 * SINGLE SOURCE OF TRUTH for "what moment is this notification received in".
 * Everything about the copy (slot, weekday, weekend, festival, festival eve) is
 * derived from the send moment `ms`, never from "now" at generation time.
 * Festival detection keeps using detectSpecialOccasion() unchanged; it is simply
 * evaluated for the target date (and for the day after, to know festival eves).
 */
export function getMomentContext(dateOrMs = Date.now()) {
  const ms = toMs(dateOrMs);
  const ist = new Date(ms + IST_OFFSET_MS);
  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();
  const dayIndex = ist.getUTCDay();
  const slot = getSlotForHour(hour);
  const specialDay = detectSpecialOccasion(ms);
  const nextDayMs = ms + 24 * 60 * 60 * 1000;
  const eveOf = specialDay ? null : detectSpecialOccasion(nextDayMs);
  return {
    ms,
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
    dayIndex,
    dayName: DAY_NAMES[dayIndex],
    isWeekend: dayIndex === 0 || dayIndex === 6,
    dateKey: getIstDateKey(ms),
    nextDateKey: getIstDateKey(nextDayMs),
    slotKey: slot.slotKey,
    slotTitle: slot.slotTitle,
    slotIcon: slot.slotIcon,
    specialDay,
    eveOf,
    isQuietHours: isQuietHoursIST(ms),
    istTimeString: formatTimeIST(ms, true),
    istDateString: formatDateIST(ms)
  };
}

function resolveNowMs(context, options = {}) {
  if (typeof options.now === 'number' && Number.isFinite(options.now)) return options.now;
  if (context && typeof context.nowMs === 'number' && Number.isFinite(context.nowMs)) return context.nowMs;
  return Date.now();
}

function makeWindowFromMs(ms, extra = {}) {
  const m = getMomentContext(ms);
  return {
    ms,
    slotKey: m.slotKey,
    slotTitle: m.slotTitle,
    slotIcon: m.slotIcon,
    desc: extra.desc || m.slotTitle,
    dayOffset: extra.dayOffset ?? 0,
    dateKey: m.dateKey,
    festival: Boolean(extra.festival),
    jitterMinutes: extra.jitterMinutes || 0
  };
}

/**
 * Build the ordered list of valid candidate send windows (today + tomorrow, IST).
 * - Every window respects the STRICT 2-HOUR REVIEW BUFFER (>= now + 120 min)
 * - Festival mornings are always evaluated first (festival-morning rule)
 * - Each window gets a deterministic jitter of -20..+20 minutes seeded by
 *   IST date + slot, so the exact minute changes from day to day
 * - No window ever lands in the quiet hours (23:00-08:00 IST)
 * - options.preferredSlotKey moves that slot's earliest window to the front
 *   (unless a festival-morning window is already first)
 */
export function getCandidateTriggerWindows(context, options = {}) {
  const now = resolveNowMs(context, options);
  const earliestAllowedMs = now + MIN_LEAD_TIME_MS;
  const useJitter = options.jitter !== false;
  const istNow = new Date(now + IST_OFFSET_MS);

  const raw = [];
  for (const dayOffset of [0, 1]) {
    const dayNoonIST = new Date(istNow);
    dayNoonIST.setUTCDate(dayNoonIST.getUTCDate() + dayOffset);
    dayNoonIST.setUTCHours(12, 0, 0, 0);
    const dayNoonUtcMs = dayNoonIST.getTime() - IST_OFFSET_MS;
    const dateKey = getIstDateKey(dayNoonUtcMs);
    const occasion = detectSpecialOccasion(dayNoonUtcMs);

    if (occasion) {
      if (dayOffset === 0) {
        raw.push({ dayOffset, dateKey, hour: 10, minute: 0, slotKey: 'morning_commute', desc: 'Festival Morning Wish', festival: true });
      } else {
        raw.push({ dayOffset, dateKey, hour: 9, minute: 30, slotKey: 'morning_commute', desc: 'Festive Morning Greeting', festival: true });
        raw.push({ dayOffset, dateKey, hour: 10, minute: 30, slotKey: 'morning_commute', desc: 'Festive Morning Celebration', festival: true });
      }
    }
    for (const w of DAILY_SEND_WINDOWS) {
      // Festive mornings already cover the morning slot for tomorrow
      if (occasion && dayOffset === 1 && w.slotKey === 'morning_commute') continue;
      raw.push({
        dayOffset,
        dateKey,
        hour: w.hour,
        minute: w.minute,
        slotKey: w.slotKey,
        desc: dayOffset === 0 ? w.desc : `Tomorrow ${w.desc}`,
        festival: false
      });
    }
  }

  const windows = [];
  for (const w of raw) {
    let jitterMinutes = 0;
    if (useJitter) {
      const rng = createSeededRandom(`${w.dateKey}|${w.slotKey}|${w.hour}:${w.minute}|jitter`);
      jitterMinutes = Math.round(rng() * (TRIGGER_JITTER_MINUTES * 2)) - TRIGGER_JITTER_MINUTES;
    }
    const targetIST = new Date(istNow);
    targetIST.setUTCDate(targetIST.getUTCDate() + w.dayOffset);
    targetIST.setUTCHours(w.hour, w.minute + jitterMinutes, 0, 0);
    const ms = nextAllowedSendTime(targetIST.getTime() - IST_OFFSET_MS);
    if (ms < earliestAllowedMs) continue;
    windows.push(makeWindowFromMs(ms, { desc: w.desc, dayOffset: w.dayOffset, festival: w.festival, jitterMinutes }));
  }

  // Preferred slot (auto-pilot rotation) goes first, but never ahead of a festival morning
  if (options.preferredSlotKey && windows.length > 1 && !windows[0].festival) {
    const idx = windows.findIndex(w => w.slotKey === options.preferredSlotKey);
    if (idx > 0) {
      const [preferred] = windows.splice(idx, 1);
      windows.unshift(preferred);
    }
  }

  // Fallback: exactly 2 hours and 15 minutes in advance (moved out of the quiet hours if needed)
  if (windows.length === 0) {
    const ms = nextAllowedSendTime(earliestAllowedMs + 15 * 60 * 1000);
    windows.push(makeWindowFromMs(ms, { desc: 'Earliest Safe Window', dayOffset: 0 }));
  }

  return windows;
}

/**
 * Pick `count` windows for the suggestion cards, each in a DIFFERENT slot where
 * possible (falls back to the same slot on another day, then repeats the last).
 */
export function pickSpreadTriggerWindows(context, options = {}) {
  const count = options.count || 3;
  const all = getCandidateTriggerWindows(context, options);
  const picked = [];
  const seenSlots = new Set();
  for (const w of all) {
    if (picked.length >= count) break;
    if (seenSlots.has(w.slotKey)) continue;
    seenSlots.add(w.slotKey);
    picked.push(w);
  }
  for (const w of all) {
    if (picked.length >= count) break;
    if (!picked.includes(w)) picked.push(w);
  }
  while (picked.length > 0 && picked.length < count) picked.push(picked[picked.length - 1]);
  return picked;
}

/**
 * Calculate recommended trigger time (in UTC milliseconds)
 * Strictly enforces a MINIMUM 2-HOUR ADVANCE BUFFER (>= now + 120 minutes)
 * so admin has ample time to review, edit, or cancel scheduled notifications!
 * If today or tomorrow is a festival, automatically targets the morning festive window.
 */
export function calculateRecommendedTriggerTime(context, options = {}) {
  return getCandidateTriggerWindows(context, options)[0].ms;
}

/**
 * Auto-pilot slot rotation: weight by each slot's historical CTR when there is
 * enough delivery data, otherwise rotate through the slots by day-of-year.
 * `historyItems` are sent-history records ({ sentAt, deliveredCount, clicksCount }).
 */
export function selectAutoPilotSlotKey(historyItems = [], dateOrMs = Date.now()) {
  const nowMs = dateOrMs instanceof Date ? dateOrMs.getTime() : dateOrMs;
  const slotKeys = DAILY_SEND_WINDOWS.map(w => w.slotKey);
  const dateKey = getIstDateKey(nowMs);

  const perSlot = {};
  let totalDelivered = 0;
  let totalClicks = 0;
  for (const item of historyItems || []) {
    if (!item || !item.sentAt) continue;
    const delivered = Number(item.deliveredCount) || 0;
    if (delivered <= 0) continue;
    const sentMs = typeof item.sentAt === 'number' ? item.sentAt : new Date(item.sentAt).getTime();
    if (!Number.isFinite(sentMs)) continue;
    const hourIST = new Date(sentMs + IST_OFFSET_MS).getUTCHours();
    const slotKey = getSlotForHour(hourIST).slotKey;
    if (!perSlot[slotKey]) perSlot[slotKey] = { delivered: 0, clicks: 0 };
    perSlot[slotKey].delivered += delivered;
    perSlot[slotKey].clicks += Number(item.clicksCount) || 0;
    totalDelivered += delivered;
    totalClicks += Number(item.clicksCount) || 0;
  }

  const slotsWithData = Object.keys(perSlot);
  if (slotsWithData.length >= 2 && totalDelivered >= 10) {
    const avgCtr = (totalClicks / totalDelivered) * 100;
    const weights = slotKeys.map(k => {
      const s = perSlot[k];
      const ctr = s ? (s.clicks / s.delivered) * 100 : avgCtr; // unexplored slots get the average
      return 1 + ctr; // floor of 1 keeps every slot in rotation
    });
    const rng = createSeededRandom(`${dateKey}|autopilot-slot`);
    let roll = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < slotKeys.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return slotKeys[i];
    }
    return slotKeys[slotKeys.length - 1];
  }

  // No usable CTR data yet: plain day-of-year rotation
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const startOfYear = Date.UTC(ist.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - startOfYear) / 86400000);
  return slotKeys[dayOfYear % slotKeys.length];
}

/**
 * Predictive User Reaction & Frequency Modeling Engine
 * Grounded in historical app telemetry + daily fatigue indices.
 * Analyzes:
 * - How many messages sent today vs optimal frequency limit (1-2 max)
 * - % Probability of Open (Click), View/Glance, Swipe Away (Ignore), and App Delete / Mute Risk
 */
export function analyzeNotificationPacingAndProbabilities({
  stats = {},
  historyData = {},
  targetSlot = {},
  isSpecialOccasion = false
}) {
  const sentTodayCount = historyData.sentTodayCount || 0;
  const sentTodayList = historyData.sentTodayList || [];

  const funnel = stats.overview?.pushFunnel || {};
  const subscribers = stats.overview?.pushSubscribers || 12;
  const baseCtr = funnel.overallCtr ? Math.min(40, Math.max(10, funnel.overallCtr)) : 18.5;
  const baseConversionRate = funnel.overallConversionRate ? Math.min(80, Math.max(25, funnel.overallConversionRate)) : 52.0;

  // 1. Daily Volume & Fatigue Evaluation
  const maxOptimalDaily = isSpecialOccasion ? 3 : 2;
  let volumeStatus = 'optimal'; // 'optimal' | 'moderate' | 'high_fatigue'
  let fatigueFactor = 1.0;
  let advice = '';

  if (sentTodayCount === 0) {
    volumeStatus = 'optimal';
    fatigueFactor = 1.05;
    advice = 'Good pacing: nothing sent today yet. Subscribers are fresh, a good click rate is likely.';
  } else if (sentTodayCount === 1) {
    volumeStatus = 'optimal';
    fatigueFactor = 0.92;
    advice = 'Good pacing: 1 sent earlier today. One more in the evening or relaxation window is safe.';
  } else if (sentTodayCount === 2) {
    volumeStatus = 'moderate';
    fatigueFactor = 0.62;
    advice = 'Fatigue warning: 2 messages already sent today. Better to wait until tomorrow unless it is a festival.';
  } else {
    volumeStatus = 'high_fatigue';
    fatigueFactor = 0.35;
    advice = 'High fatigue: 3 or more notifications sent today. More pushes risk muting or uninstalls.';
  }

  // 2. Slot & Festive Lift
  let slotBoost = 1.0;
  if (isSpecialOccasion) slotBoost += 0.30;
  if (targetSlot.slotKey === 'dinner_chill') slotBoost += 0.22;
  else if (targetSlot.slotKey === 'afternoon_chai') slotBoost += 0.16;
  else if (targetSlot.slotKey === 'midday_lunch') slotBoost += 0.10;

  // 3. Probabilities (Clamped to realistic statistical bands)
  const openProbability = Math.round(Math.min(48, Math.max(7, baseCtr * fatigueFactor * slotBoost)) * 10) / 10;
  const viewProbability = Math.round(Math.min(96, Math.max(72, 91 + (sentTodayCount > 1 ? -6 : 2))) * 10) / 10;

  let baseChurn = 0.5;
  if (sentTodayCount === 0) baseChurn = 0.4;
  else if (sentTodayCount === 1) baseChurn = 0.8;
  else if (sentTodayCount === 2) baseChurn = 2.6;
  else baseChurn = 6.2 + (sentTodayCount - 3) * 2.8;

  const churnRiskProbability = Math.round(Math.min(22, Math.max(0.3, baseChurn)) * 10) / 10;
  const ignoreProbability = Math.round(Math.max(10, 100 - openProbability - churnRiskProbability) * 10) / 10;

  const projectedOpens = Math.max(1, Math.round(subscribers * (openProbability / 100)));
  const projectedPlayers = Math.max(1, Math.round(projectedOpens * (baseConversionRate / 100)));

  return {
    sentTodayCount,
    maxOptimalDaily,
    volumeStatus,
    fatigueIndex: sentTodayCount === 0 ? 'Zero (Fresh Audience)' : sentTodayCount === 1 ? 'Low (Safe)' : sentTodayCount === 2 ? 'Moderate Warning' : 'High Fatigue Alert',
    advice,
    openProbability,
    viewProbability,
    ignoreProbability,
    churnRiskProbability,
    projectedOpens,
    projectedPlayers,
    sentTodayTitles: sentTodayList.map(s => s.title)
  };
}

/**
 * Copy variant pools. Lines a friend would send, Indian everyday context.
 * `{day}` = target weekday name, `{festival}` = festival name (both from the TARGET date).
 *
 * Optional tags decide when a line may go out (all evaluated for the send moment):
 *   weekdayOnly  - office / commute / lunch-at-work wording, never on Saturday or Sunday
 *   weekendOnly  - weekend wording, never Monday-Friday
 *   days         - only on these weekday names (e.g. "end of the week" only on Friday)
 *   notBefore    - earliest IST clock time "HH:MM" (late-night wording only after 21:30)
 *   notAfter     - latest IST clock time "HH:MM" (morning greetings only before 11:30)
 *
 * Slot hours (IST): morning_commute 06-11, midday_lunch 11-14, post_lunch_slump 14-16,
 * afternoon_chai 16-18, evening_commute 18-20, dinner_chill 20-22, night_wind_down 22-06.
 */
export const NOTIFICATION_VARIANT_POOLS = {
  morning_commute: [
    { category: 'Relatable & Familiar', badge: 'Chai First', title: 'Chai first, then one round ☕', message: 'Morning. Finish the chai, mark five lines, and walk into the day already winning.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Five More Minutes', title: 'Still in "5 more minutes" mode? 😴', message: 'Same. One quick round of Bingo wakes the brain faster than the third alarm.', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Traffic', title: 'Traffic again? 🚦', message: 'Stuck at the same signal as yesterday? Mark a few lines while the light makes up its mind.', url: '/bot', weekdayOnly: true },
    { category: 'Boredom Buster', badge: 'Metro Mode', title: 'Metro mode on 🚇', message: 'Earphones in, phone out. A Bingo round makes the ride feel three stations shorter.', url: '/bot', weekdayOnly: true },
    { category: 'Boredom Buster', badge: 'Before The Emails', title: 'Before the emails pile up 📬', message: 'One round before the first meeting. Beat the Bot and the day cannot touch you.', url: '/bot', weekdayOnly: true },
    { category: 'Social Room', badge: 'Loser Buys Chai', title: 'Loser buys the chai ☕', message: 'One quick Bingo with a colleague before 11. The loser pays at the tea stall.', url: '/lobby', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Good Morning', title: 'Good morning, {day} 🌤️', message: 'New day, fresh card. Start it with a small win and a slightly smug smile.', url: '/lobby', notAfter: '11:30' },
    { category: 'Relatable & Familiar', badge: 'Breakfast Table', title: 'Breakfast table Bingo 🍳', message: 'Poha, toast or leftover roti, it all pairs well with five quick lines.', url: '/lobby' },
    { category: 'Social Room', badge: 'Say Good Morning', title: 'Say good morning properly 💛', message: 'Send a room code to the friend you only text on birthdays. Two minutes, no excuses.', url: '/lobby', notAfter: '11:30' },
    { category: 'Boredom Buster', badge: 'Cocky Bot', title: 'The Bot woke up cocky 🤖', message: 'It says mornings belong to it. Show it who had their chai first.', url: '/bot' }
  ],
  midday_lunch: [
    { category: 'Relatable & Familiar', badge: 'Dabba Time', title: 'Dabba open yet? 🍛', message: 'Lunch first, then one round. Five lines go down easier than the office dal.', url: '/lobby', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Lunch Break', title: 'Lunch break Bingo 🍱', message: 'Twenty minutes left of the break. Enough for one round and one more bite.', url: '/bot', weekdayOnly: true },
    { category: 'Social Room', badge: 'Best Dabba', title: 'Whose dabba is the best? 🥘', message: 'Settle it fairly: share a room code, play one round, the winner gets the last paratha.', url: '/lobby', weekdayOnly: true },
    { category: 'Social Room', badge: 'Canteen Table', title: 'Canteen table, phones out 📱', message: 'Everyone at the table has a phone anyway. One room, one round, one lunch champion.', url: '/lobby', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Half Day Done', title: 'Half the day done 🙌', message: 'Midday check-in. Mark five lines and the afternoon suddenly looks shorter.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Midday Reset', title: 'Midday reset 🔄', message: 'Two minutes away from the screen, then back sharper. The Bot is waiting.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Did You Eat', title: 'Mom asked if you ate 🍲', message: 'Say yes, eat properly, then play one calm round before the afternoon starts.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Hungry Bot', title: 'The Bot skipped lunch 🤖', message: 'It is hungry for a win. Feed it a loss in ninety seconds.', url: '/bot', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Exam Break', title: 'Exam break? 📚', message: 'Books down for five minutes. One round of Bingo, then back to chapter four.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Yawn Incoming', title: 'Afternoon yawn incoming 🥱', message: 'Beat it to the punch. One quick round before the sleepy part of the day starts.', url: '/bot' }
  ],
  post_lunch_slump: [
    { category: 'Boredom Buster', badge: '3 PM Eyes', title: '3 PM eyes? 😵', message: 'Heavy eyelids, light brain. A fast Bingo round works better than the fourth coffee.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Between Meetings', title: 'Between two meetings? 📅', message: 'Just enough time for five lines. Back on the call looking suspiciously refreshed.', url: '/bot', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Sunday Nap', title: 'Afternoon nap or Bingo? 😴', message: 'Sunday afternoon rules: nap allowed, but only after you beat the Bot once.', url: '/bot', days: ['Sunday'] },
    { category: 'Social Room', badge: 'Lazy Afternoon', title: 'Lazy {day} afternoon 🛋️', message: 'Nothing on the calendar, nowhere to be. Perfect conditions for a slow round with friends.', url: '/lobby', weekendOnly: true },
    { category: 'Boredom Buster', badge: 'Spreadsheet Hypnosis', title: 'Spreadsheet hypnosis? 📊', message: 'Blink. Mark five lines. Return to the cells a new person.', url: '/bot', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Brain Fog', title: 'Afternoon brain fog 🌫️', message: 'Numbers are the cure. One quick card and the fog lifts, mostly.', url: '/bot' },
    { category: 'Social Room', badge: 'Desk Break', title: 'Desk break, chair stays 🪑', message: 'No walk needed. Invite the person at the next desk to a two-minute room.', url: '/lobby', weekdayOnly: true },
    { category: 'Boredom Buster', badge: 'Cocky Bot', title: 'The Bot is getting cocky 🤖', message: 'Three afternoon wins in a row, it claims. Someone needs to humble it.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Small Win', title: 'Small win needed? 🏅', message: 'Afternoons are long. A five-line Bingo is the quickest win on the market.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Exam Prep', title: 'Exam prep break 📖', message: 'Revision done for the hour? Two minutes of Bingo, then back to the notes.', url: '/bot' }
  ],
  afternoon_chai: [
    { category: 'Relatable & Familiar', badge: 'Chai Time', title: 'Chai time ☕', message: 'Cup in one hand, phone in the other. Mark five lines before the chai goes cold.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Biscuit Combo', title: 'Biscuit, chai, Bingo 🍪', message: 'The holy afternoon trio. Dunk, sip, mark. Repeat until BINGO.', url: '/bot' },
    { category: 'Social Room', badge: 'Tea Stall Gang', title: 'Tea stall gang, assemble 🫖', message: 'Chai break with the team? One private room decides who pays for the samosas.', url: '/lobby', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Last Stretch', title: 'Last stretch of the workday 🏁', message: 'A couple of hours to go. One round now makes the rest feel shorter, probably scientifically.', url: '/bot', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Evening Chai', title: 'Evening chai, five lines ☕', message: 'The sun is softer, the chai is hotter. Good moment for a calm round with the Bot.', url: '/bot' },
    { category: 'Social Room', badge: 'Call Mom', title: 'Chai with mom? 📞', message: 'Call her while the water boils. Then one round of Bingo to celebrate the good deed.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Friday Chai', title: 'Friday chai hits different 🎉', message: 'End of the week, weekend two hours away. Warm up with a round before the plans begin.', url: '/lobby', days: ['Friday'] },
    { category: 'Relatable & Familiar', badge: 'Cutting Chai', title: 'Cutting chai, full Bingo ☕', message: 'Half a cup of tea, a full card of numbers. Fair trade for the five o’clock slump.', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Bot On Chai', title: 'The Bot ordered chai too 🤖', message: 'It says it plays better after tea. Test that theory in one quick round.', url: '/bot' },
    { category: 'Social Room', badge: 'Saturday Chai', title: 'Weekend chai, no rush 🫖', message: 'Nowhere to be tomorrow, no hurry today. A slow round with the family sounds right.', url: '/lobby', days: ['Saturday'] }
  ],
  evening_commute: [
    { category: 'Boredom Buster', badge: 'Heading Home', title: 'Heading home? 🚌', message: 'Bus, metro or stuck at the signal, one round makes the ride home shorter.', url: '/bot', weekdayOnly: true },
    { category: 'Relatable & Familiar', badge: 'Laptop Shut', title: 'Laptop shut, Bingo open 💻', message: 'Work is done for today. Bank one small win before dinner plans take over.', url: '/bot', weekdayOnly: true },
    { category: 'Social Room', badge: 'Friday Feeling', title: 'Friday feeling 🎉', message: 'End of the week, finally. Start the weekend with a round against friends.', url: '/lobby', days: ['Friday'] },
    { category: 'Boredom Buster', badge: 'Signal Jam', title: 'Signal jam survival kit 🚦', message: 'Red light again? Beat the Bot in ninety seconds while the traffic sorts itself out.', url: '/bot', weekdayOnly: true },
    { category: 'Social Room', badge: 'Call That Friend', title: 'Call that friend 💛', message: 'The one you keep meaning to call. Send a room code instead, it counts as catching up.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Evening Walk', title: 'Evening walk done? 🚶', message: 'Steps counted, sun setting. Reward yourself with five easy lines.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Sunset Round', title: 'Sunset round 🌇', message: 'Golden hour is better with a win. One calm card before the evening gets busy.', url: '/bot' },
    { category: 'Social Room', badge: 'Friends Online', title: 'Weekend evening, friends free 🛋️', message: 'Everyone is around tonight. Drop a room code in the group and see who shows up.', url: '/lobby', weekendOnly: true },
    { category: 'Boredom Buster', badge: 'Bot Clocked Out', title: 'The Bot clocked out early 🤖', message: 'It claims evenings are its best time. Nobody has checked. Be the one who checks.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Dinner Not Ready', title: 'Dinner is not ready yet 🍽️', message: 'Twenty minutes to kill before the food. Perfect length for a round.', url: '/bot' }
  ],
  dinner_chill: [
    { category: 'Relatable & Familiar', badge: 'Mom Is Calling', title: 'Mom is calling for dinner 🍲', message: 'Go eat first. Then come back for one cozy round, the dishes can wait.', url: '/lobby' },
    { category: 'Social Room', badge: 'Feet Up', title: 'Dinner done, feet up 🛋️', message: 'Best part of the day. One relaxed round with friends before the show starts.', url: '/lobby' },
    { category: 'Social Room', badge: 'Family Night', title: 'Family Bingo night? 🏠', message: 'Everyone is home. Drop a room link in the family group and crown tonight’s champion.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Episode Or Round', title: 'One episode or one round? 📺', message: 'Trade a single episode for a single card. Same relaxation, more bragging rights.', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Dessert Round', title: 'Dessert round 🍨', message: 'Something sweet after dinner? A quick win over the Bot tastes even better.', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Dishes Can Wait', title: 'Dishes can wait 🍽️', message: 'They are not going anywhere. Five lines first, then the sink.', url: '/bot' },
    { category: 'Social Room', badge: 'No Alarm Tomorrow', title: 'No alarm tomorrow 🌙', message: 'Nobody is sleepy yet. Start a room and let the whole gang play one more.', url: '/lobby', days: ['Friday', 'Saturday'] },
    { category: 'Boredom Buster', badge: 'Bot Ate Too Much', title: 'The Bot ate too much 🤖', message: 'It is slow tonight, it says. Perfect time to steal a win.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Long Day', title: 'Long day? 💛', message: 'You made it through. One calm round and a chat with a friend sounds about right.', url: '/lobby' },
    { category: 'Social Room', badge: 'Sunday Night', title: 'Tomorrow is Monday 😬', message: 'Do not think about it yet. One Sunday night round with friends, then sleep.', url: '/lobby', days: ['Sunday'] }
  ],
  night_wind_down: [
    { category: 'Boredom Buster', badge: 'Lights Out', title: 'One game before lights out 💤', message: 'A calm, quick round to close the day. Then sleep, promise.', url: '/bot', notBefore: '21:30' },
    { category: 'Relatable & Familiar', badge: 'Still Scrolling', title: 'Still scrolling? 🌃', message: 'Make the last scroll count. Five lines, one small win, then phone down.', url: '/bot', notBefore: '21:30' },
    { category: 'Social Room', badge: 'Night Owls', title: 'Night owls, assemble 🦉', message: 'A few friends are still up. Start a quiet room and finish the day with a win.', url: '/lobby', notBefore: '21:30' },
    { category: 'Relatable & Familiar', badge: 'Night Chill', title: 'Late night chill round 🌙', message: 'Lights low, volume lower. One slow card before bed.', url: '/lobby', notBefore: '21:30' },
    { category: 'Relatable & Familiar', badge: 'Goodnight Almost', title: 'Goodnight, almost 🌛', message: 'One more round, and this time you mean it.', url: '/bot', notBefore: '21:30' },
    { category: 'Boredom Buster', badge: 'Bot Never Sleeps', title: 'The Bot never sleeps 🤖', message: 'Beat it once tonight and go to bed as the winner. It will sulk till morning.', url: '/bot', notBefore: '21:30' },
    { category: 'Relatable & Familiar', badge: 'Cannot Sleep', title: 'Can’t sleep yet? 🛏️', message: 'Numbers are oddly calming. Mark five lines and let the brain slow down.', url: '/bot', notBefore: '21:30' },
    { category: 'Social Room', badge: 'Late Start Tomorrow', title: 'Weekend night, late start 🌙', message: 'Nobody has to wake up early. A relaxed round with friends, then bed whenever.', url: '/lobby', days: ['Friday', 'Saturday'], notBefore: '21:30' },
    { category: 'Social Room', badge: 'Goodnight Text', title: 'Text a goodnight 💛', message: 'Send a room code with it. Two minutes of Bingo beats two hours of scrolling.', url: '/lobby', notBefore: '21:30' }
  ],
  generic: [
    { category: 'Relatable & Familiar', badge: 'Two Minutes', title: 'Two minutes to spare? 🎲', message: 'That is all a round takes. Five lines, one small win, back to life.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Lucky Numbers', title: 'Your lucky numbers are waiting 🍀', message: 'Grab a card, mark your lines, shout BINGO before anyone else.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Bot In 90 Seconds', title: 'Beat the Bot in 90 seconds? 🤖', message: 'It says it cannot be beaten today. It says that every day.', url: '/bot' },
    { category: 'Social Room', badge: 'One Room One Winner', title: 'Friends, one room, one winner 🏆', message: 'Share the code, race to five lines, argue about it later.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Brain Reset', title: 'Quick brain reset 🔋', message: 'Eyes tired of the screen? Five calm lines and you are back.', url: '/bot' },
    { category: 'Social Room', badge: 'Miss Someone', title: 'Miss someone? 💛', message: 'A room code is a nice excuse to say hi. Two minutes of Bingo, a lifetime of trash talk.', url: '/lobby' }
  ],
  weekend: [
    { category: 'Relatable & Familiar', badge: 'Slow Mode', title: '{day} mode: slow 🛋️', message: 'No alarms, no plans. Just a cup of chai and one lazy round.', url: '/bot', weekendOnly: true },
    { category: 'Social Room', badge: 'Squad Showdown', title: 'Weekend squad showdown 🏅', message: 'Who in the group is the real Bingo master? One room, one round, settled.', url: '/lobby', weekendOnly: true },
    { category: 'Relatable & Familiar', badge: 'Sunday Nap Rules', title: 'Sunday afternoon nap rules 😴', message: 'Nap allowed only after one win against the Bot. House rules.', url: '/bot', days: ['Sunday'], notBefore: '13:00', notAfter: '17:00' },
    { category: 'Social Room', badge: 'Family Room', title: 'Family room is open 🏠', message: 'Everyone is home this weekend. Share a room code in the family group and play together.', url: '/lobby', weekendOnly: true },
    { category: 'Social Room', badge: 'No Plans', title: 'Saturday with no plans? 🙂', message: 'That is the best kind. One round with friends counts as a plan.', url: '/lobby', days: ['Saturday'] },
    { category: 'Boredom Buster', badge: 'Lazy Duel', title: 'Lazy {day} Bot duel 🤖', message: 'The Bot is bored too. Give it a game and a reason to lose.', url: '/bot', weekendOnly: true },
    { category: 'Social Room', badge: 'Call Home', title: 'Call home this weekend 💛', message: 'Then teach them Bingo over a room link. Grandparents are dangerously good at it.', url: '/lobby', weekendOnly: true },
    { category: 'Boredom Buster', badge: 'Pick-Me-Up', title: 'Slow {day}, fast Bingo ⚡', message: 'Nothing on the schedule? A quick card is the perfect weekend pick-me-up.', url: '/bot', weekendOnly: true },
    { category: 'Relatable & Familiar', badge: 'Weekend Chai', title: 'Weekend chai, extra sugar ☕', message: 'The good biscuits are out. Pair them with a round and a win.', url: '/bot', weekendOnly: true }
  ],
  festive: [
    { category: 'Festive Banter', badge: 'Sweets & Bingo', title: 'Kaju katli vs the Bot 🍬', message: 'Sweets in one hand, card in the other. Five lines before the box empties.', url: '/bot' },
    { category: 'Family Room', badge: 'Family Room', title: '{festival} family Bingo 🎊', message: 'Drop a room link in the family group and find out who shouts BINGO first.', url: '/lobby' },
    { category: 'Family Room', badge: 'Relatives Over', title: 'Relatives over? 🎉', message: 'Keep everyone busy and happy with one quick family round.', url: '/lobby' },
    { category: 'Festive Banter', badge: 'Holiday Mode', title: 'Holiday mood, Bingo mode 🪔', message: 'Day off and a plate of sweets. Add one relaxed round and the picture is complete.', url: '/bot' },
    { category: 'Family Room', badge: 'Festive Champion', title: '{festival} champion 🏆', message: 'Who in the family calls BINGO first today? Start a room and find out.', url: '/lobby' },
    { category: 'Festive Banter', badge: 'Wishes & Match', title: 'Festive wishes, friendly match 🎊', message: 'Send your {festival} wishes with a room code. Celebrating together counts, even online.', url: '/lobby' }
  ],
  festive_eve: [
    { category: 'Festive Banter', badge: 'Festival Tomorrow', title: '{festival} is tomorrow 🪔', message: 'Preparations done? Take a break with one calm round before the big day.', url: '/bot' },
    { category: 'Family Room', badge: 'Festival Eve', title: 'Eve of {festival} 🎊', message: 'The house is nearly ready. One round with family while the sweets set.', url: '/lobby' },
    { category: 'Festive Banter', badge: 'Early Wishes', title: 'Tomorrow is {festival} 🎉', message: 'Early wishes from us. Start the celebrations with a round against friends.', url: '/lobby' }
  ]
};

/** Hours (IST, [start, end) with end wrapping past midnight) in which each slot pool reads correctly. */
export const SLOT_HOURS = {
  morning_commute: [6, 11],
  midday_lunch: [11, 14],
  post_lunch_slump: [14, 16],
  afternoon_chai: [16, 18],
  evening_commute: [18, 20],
  dinner_chill: [20, 22],
  night_wind_down: [22, 30]
};

const EVENING_SLOTS = new Set(['evening_commute', 'dinner_chill', 'night_wind_down']);
const COPY_LIMITS = { titleChars: 40, messageChars: 110, maxExclamations: 1, maxTitleEmojis: 1 };
const BANNED_COPY_WORDS = [/\bboost/i, /\bengag/i, /\boptimi[sz]/i, /challenge hook/i, /\bAI\b/];
const EMOJI_RE = /\p{Extended_Pictographic}/gu;
const EMOJI_STRIP_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu;

function clockToMinutes(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/**
 * May this variant go out at `moment`? Day/time tags are evaluated for the moment
 * the notification is received, which is what the rules above are written for.
 */
export function variantAllowedAt(variant, moment = {}) {
  if (!variant) return false;
  if (variant.weekdayOnly && moment.isWeekend) return false;
  if (variant.weekendOnly && moment.isWeekend === false) return false;
  if (Array.isArray(variant.days) && moment.dayName && !variant.days.includes(moment.dayName)) return false;
  if (typeof moment.minuteOfDay === 'number') {
    const nb = clockToMinutes(variant.notBefore);
    const na = clockToMinutes(variant.notAfter);
    if (nb !== null && moment.minuteOfDay < nb) return false;
    if (na !== null && moment.minuteOfDay > na) return false;
  }
  return true;
}

function fillTemplate(text, vars = {}) {
  return String(text || '')
    .replace(/\{day\}/g, vars.dayName || '')
    .replace(/\{festival\}/g, vars.festivalName || 'Festival');
}

/** Lowercase, strip emojis/punctuation so near-identical copies still match */
function normalizeCopy(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function cleanFestivalName(specialDay) {
  return (specialDay?.name || 'Festival').replace(EMOJI_STRIP_RE, '').trim() || 'Festive Greeting';
}

/** Lint one line against the copy rules; returns a list of problems (empty = fine). */
export function lintCopy(title, message) {
  const problems = [];
  const t = String(title || '');
  const m = String(message || '');
  if ([...t].length > COPY_LIMITS.titleChars) problems.push(`title ${[...t].length} chars > ${COPY_LIMITS.titleChars}`);
  if ([...m].length > COPY_LIMITS.messageChars) problems.push(`message ${[...m].length} chars > ${COPY_LIMITS.messageChars}`);
  const bangs = (t.match(/!/g) || []).length + (m.match(/!/g) || []).length;
  if (bangs > COPY_LIMITS.maxExclamations) problems.push(`${bangs} exclamation marks`);
  const titleEmojis = (t.match(EMOJI_RE) || []).length;
  if (titleEmojis > COPY_LIMITS.maxTitleEmojis) problems.push(`${titleEmojis} emojis in title`);
  for (const re of BANNED_COPY_WORDS) {
    if (re.test(t) || re.test(m)) problems.push(`banned wording ${re}`);
  }
  return problems;
}

/**
 * Lint every pool variant (used by tests/scripts): limits, wording, tag sanity
 * (weekend/weekday tags that contradict `days`, night wording outside its hours).
 */
export function validateVariantPools() {
  const problems = [];
  const weekendDays = new Set(['Saturday', 'Sunday']);
  for (const [pool, list] of Object.entries(NOTIFICATION_VARIANT_POOLS)) {
    for (const v of list) {
      const where = `${pool} :: ${v.title}`;
      for (const p of lintCopy(fillTemplate(v.title, { dayName: 'Wednesday', festivalName: 'Makar Sankranti & Pongal' }), fillTemplate(v.message, { dayName: 'Wednesday', festivalName: 'Makar Sankranti & Pongal' }))) {
        problems.push(`${where}: ${p}`);
      }
      if (v.weekdayOnly && v.weekendOnly) problems.push(`${where}: both weekdayOnly and weekendOnly`);
      if (Array.isArray(v.days)) {
        if (v.weekdayOnly && v.days.some(d => weekendDays.has(d))) problems.push(`${where}: weekdayOnly but days include a weekend day`);
        if (v.weekendOnly && v.days.some(d => !weekendDays.has(d))) problems.push(`${where}: weekendOnly but days include a weekday`);
      }
      if (pool === 'weekend' && !v.weekendOnly && !(Array.isArray(v.days) && v.days.every(d => weekendDays.has(d)))) problems.push(`${where}: weekend pool line without weekend tag`);
      if (pool === 'night_wind_down' && clockToMinutes(v.notBefore) !== 21 * 60 + 30) problems.push(`${where}: late-night line must carry notBefore 21:30`);
      if (/good morning/i.test(v.title + ' ' + v.message) && !(pool === 'morning_commute' && clockToMinutes(v.notAfter) !== null && clockToMinutes(v.notAfter) <= 11 * 60 + 30)) problems.push(`${where}: morning greeting without notAfter 11:30`);
      if (/end of the week|friday/i.test(v.title + ' ' + v.message) && !(Array.isArray(v.days) && v.days.length === 1 && v.days[0] === 'Friday') && !(Array.isArray(v.days) && v.days.includes('Friday') && v.days.includes('Saturday'))) problems.push(`${where}: Friday wording not limited to Friday`);
      if (/lunch|dabba|colleague|office|canteen|desk|meeting|workday|spreadsheet|commute|metro|emails/i.test(v.title + ' ' + v.message) && !v.weekdayOnly && !(Array.isArray(v.days) && v.days.every(d => !weekendDays.has(d)))) problems.push(`${where}: work/lunch wording without weekdayOnly`);
      if (/late night|lights out|goodnight|bed\b/i.test(v.title + ' ' + v.message) && (clockToMinutes(v.notBefore) === null || clockToMinutes(v.notBefore) < 21 * 60 + 30)) problems.push(`${where}: late-night wording without notBefore 21:30`);
    }
  }
  return problems;
}

/**
 * Sent History Memory: everything recently sent or already queued, most relevant first
 * (pending scheduled -> today's sends -> last ~10 sends). Used for anti-repetition.
 */
export function collectRecentSentCopy(historyData = {}) {
  const items = [];
  const push = (list) => {
    for (const it of list || []) {
      if (!it || (!it.title && !it.message)) continue;
      items.push({
        title: normalizeCopy(it.title),
        message: normalizeCopy(it.message),
        rawTitle: it.title || '',
        rawMessage: it.message || ''
      });
    }
  };
  const today = [...(historyData.sentTodayList || [])].sort((a, b) => (b.sentAt || 0) - (a.sentAt || 0));
  push(historyData.pendingScheduledList);
  push(today);
  push(historyData.recentList);

  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.title}||${it.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

/** Index of the most recent sent item matching this variant's title or message, or -1 */
function recencyRank(variant, recent, vars) {
  const t = normalizeCopy(fillTemplate(variant.title, vars));
  const m = normalizeCopy(fillTemplate(variant.message, vars));
  for (let i = 0; i < recent.length; i++) {
    if ((t && recent[i].title === t) || (m && recent[i].message === m)) return i;
  }
  return -1;
}

function seededShuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function materializeVariant(v, vars) {
  return {
    category: v.category,
    badge: v.badge,
    title: fillTemplate(v.title, vars),
    message: fillTemplate(v.message, vars),
    url: v.url || '/lobby'
  };
}

/** Absolute day number (days since epoch, IST calendar) from a YYYY-MM-DD key, or null */
function dayNumberFromDateKey(dateKey) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
  if (!m) return null;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86400000);
}

/**
 * Pick one copy variant for a slot with anti-repetition:
 * 1. slot pool (+ weekend pool on weekends, + festival-eve pool on an eve evening) minus
 *    anything in recent history / already chosen / not allowed at this moment
 * 2. generic pool minus the same
 * 3. if everything was used recently, the least recently used allowed variant
 * Each pool is shuffled once with a fixed seed (per slot); the still-fresh variants
 * are then indexed by the target day number, so a slot cycles through all of its
 * variants on consecutive days instead of showing the same copy twice in a row.
 * `hour`/`minute` (IST, of the send moment) switch on the time-of-day tags.
 */
export function selectNotificationVariant({
  slotKey,
  isWeekend = false,
  dayName = '',
  festivalName = '',
  recent = [],
  excludeTitles = new Set(),
  seed = '',
  dateKey = '',
  hour = null,
  minute = 0,
  includeFestivalEve = false
}) {
  const rng = createSeededRandom(seed);
  const vars = { dayName, festivalName };
  const moment = {
    isWeekend,
    dayName,
    minuteOfDay: typeof hour === 'number' ? hour * 60 + (minute || 0) : null
  };
  const slotPool = NOTIFICATION_VARIANT_POOLS[slotKey] || [];
  let tier1 = isWeekend ? [...NOTIFICATION_VARIANT_POOLS.weekend, ...slotPool] : slotPool;
  if (includeFestivalEve && festivalName) tier1 = [...NOTIFICATION_VARIANT_POOLS.festive_eve, ...tier1];
  const tier2 = NOTIFICATION_VARIANT_POOLS.generic;
  const allowed = (v) => variantAllowedAt(v, moment) && !excludeTitles.has(normalizeCopy(fillTemplate(v.title, vars)));
  const dayNumber = dayNumberFromDateKey(dateKey);

  const tiers = [
    ['slot', tier1],
    ['generic', tier2]
  ];
  for (const [tierName, tier] of tiers) {
    if (tier.length === 0) continue;
    const order = seededShuffle(tier, createSeededRandom(`${slotKey}|${tierName}|${isWeekend ? 'weekend' : 'weekday'}|order`));
    const fresh = order.filter(v => allowed(v) && recencyRank(v, recent, vars) === -1);
    if (fresh.length === 0) continue;
    const index = dayNumber !== null ? dayNumber % fresh.length : Math.floor(rng() * fresh.length);
    return materializeVariant(fresh[index], vars);
  }

  // Everything was sent recently: fall back to the least recently used allowed variant
  const all = seededShuffle([...tier1, ...tier2].filter(allowed), rng);
  if (all.length === 0) return materializeVariant(tier2.find(v => variantAllowedAt(v, moment)) || tier2[0], vars);
  all.sort((a, b) => recencyRank(b, recent, vars) - recencyRank(a, recent, vars));
  return materializeVariant(all[0], vars);
}

function describeReasoning(copy, targetSlot, timeStr) {
  const tag = `${copy.category} ${copy.badge}`.toLowerCase();
  if (copy.url === '/bot' || tag.includes('bot') || tag.includes('boredom')) {
    return `Solo round against the Bot, written for ${targetSlot.slotTitle} at ${timeStr}.`;
  }
  if (tag.includes('social') || tag.includes('room') || tag.includes('family') || tag.includes('squad')) {
    return `Friends-room invite, written for ${targetSlot.slotTitle} at ${timeStr}.`;
  }
  return `Casual check-in, written for ${targetSlot.slotTitle} at ${timeStr}.`;
}

/** Template -> regex that matches the filled line (any {day}/{festival} value) */
function templateMatcher(template) {
  const raw = String(template || '').replace(/\{day\}|\{festival\}/g, '\u0001');
  const pieces = raw.split('\u0001').map(p => normalizeCopy(p)).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${pieces.join('.*')}$`);
}

/**
 * Recognise engine copy. Returns { kind, poolKey, variant } when the title/message
 * come from a pool or are a festival greeting, otherwise null (admin-written text).
 */
export function identifyEngineCopy(title, message = '') {
  const t = normalizeCopy(title);
  const m = normalizeCopy(message);
  if (!t) return null;
  for (const [poolKey, list] of Object.entries(NOTIFICATION_VARIANT_POOLS)) {
    for (const v of list) {
      if (templateMatcher(v.title).test(t) || (m && templateMatcher(v.message).test(m))) {
        return { kind: poolKey === 'festive' ? 'festive' : poolKey === 'festive_eve' ? 'festival_eve' : 'slot', poolKey, variant: v };
      }
    }
  }
  const greetingTitles = [...Object.values(MULTI_YEAR_FESTIVALS), ...Object.values(FIXED_ANNUAL_HOLIDAYS)].map(f => normalizeCopy(f.greetingTitle));
  if (greetingTitles.includes(t)) return { kind: 'festival_greeting', poolKey: null, variant: null };
  return null;
}

/**
 * Does this (engine) copy read correctly at `moment`? Admin-written copy returns
 * { origin: 'admin', fits: true } because we cannot judge it. Checks the pool against
 * the slot, the weekend/weekday/day/time tags, and that festival text is only used on
 * the festival date (eve text only on the eve).
 */
export function assessCopyForMoment(title, message, moment) {
  const found = identifyEngineCopy(title, message);
  if (!found) return { origin: 'admin', fits: true, reason: null };
  const m = moment || getMomentContext(Date.now());
  const fail = (reason) => ({ origin: 'engine', fits: false, kind: found.kind, poolKey: found.poolKey, reason });
  if (found.kind === 'festival_greeting') {
    if (!m.specialDay) return fail('festival greeting but the send date is not a festival');
    if (normalizeCopy(m.specialDay.greetingTitle) !== normalizeCopy(title)) return fail(`greeting is for another festival than ${m.specialDay.name}`);
    return { origin: 'engine', fits: true, kind: found.kind, poolKey: null, reason: null };
  }
  if (found.kind === 'festive' && !m.specialDay) return fail('festive banter but the send date is not a festival');
  if (found.kind === 'festival_eve' && !(m.eveOf && !m.specialDay)) return fail('festival-eve text but the send date is not a festival eve');
  if (found.poolKey === 'weekend' && !m.isWeekend) return fail('weekend wording on a weekday');
  if (SLOT_HOURS[found.poolKey] && found.poolKey !== m.slotKey) return fail(`${found.poolKey} wording in the ${m.slotKey} slot`);
  if (!variantAllowedAt(found.variant, m)) return fail(`line is not allowed on ${m.dayName} at ${m.istTimeString}`);
  return { origin: 'engine', fits: true, kind: found.kind, poolKey: found.poolKey, reason: null };
}

/**
 * Compose the notification for ONE send moment. This is the single place that turns
 * a target time into copy; the suggestion generator, the scheduler and the dispatch-time
 * guard all go through it, so the text always belongs to the moment it is received in.
 * Festival handling is unchanged: greeting (existing wish text) once per festival date,
 * then festive banter; both only when the TARGET date is the festival.
 */
export function composeNotificationForMoment({
  ms,
  recent = [],
  excludeTitles = new Set(),
  greetedDates = new Set(),
  index = 0
}) {
  const m = getMomentContext(ms);
  const targetSlot = { slotKey: m.slotKey, slotTitle: m.slotTitle, slotIcon: m.slotIcon };
  const scheduledTimeStr = formatTimeIST(ms, false);

  let copy;
  let reasoning;
  let copyKind = 'slot';
  let festivalKey = null;
  if (m.specialDay) {
    const festivalName = cleanFestivalName(m.specialDay);
    const greetingTitle = m.specialDay.greetingTitle || `${m.specialDay.name} Wishes! 🪔`;
    const greetingAlreadySent = recent.some(r => r.title === normalizeCopy(greetingTitle));
    festivalKey = m.dateKey;
    if (!greetedDates.has(m.dateKey) && !greetingAlreadySent && !excludeTitles.has(normalizeCopy(greetingTitle))) {
      greetedDates.add(m.dateKey);
      copyKind = 'festival_greeting';
      copy = {
        category: 'Festive Greeting',
        badge: festivalName,
        title: greetingTitle,
        message: `${m.specialDay.wish} Celebrate with family & friends over a festive Bingo match!`,
        url: '/lobby'
      };
      reasoning = `Festive greeting for ${m.specialDay.name}, sent on the festival date itself.`;
    } else {
      copyKind = 'festive';
      copy = selectNotificationVariant({
        slotKey: 'festive',
        isWeekend: false,
        dayName: m.dayName,
        festivalName,
        recent,
        excludeTitles,
        seed: `${m.dateKey}|festive|${index}`,
        dateKey: m.dateKey,
        hour: m.hour,
        minute: m.minute
      });
      reasoning = `Festive banter for ${m.specialDay.name} in the ${m.slotTitle} window at ${scheduledTimeStr}.`;
    }
  } else {
    const isEveEvening = Boolean(m.eveOf) && EVENING_SLOTS.has(m.slotKey);
    copy = selectNotificationVariant({
      slotKey: m.slotKey,
      isWeekend: m.isWeekend,
      dayName: m.dayName,
      festivalName: isEveEvening ? cleanFestivalName(m.eveOf) : '',
      includeFestivalEve: isEveEvening,
      recent,
      excludeTitles,
      seed: `${m.dateKey}|${m.slotKey}|${index}`,
      dateKey: m.dateKey,
      hour: m.hour,
      minute: m.minute
    });
    const found = identifyEngineCopy(copy.title, copy.message);
    if (found && found.kind === 'festival_eve') {
      copyKind = 'festival_eve';
      festivalKey = m.nextDateKey;
      reasoning = `Festival-eve note for ${m.eveOf.name} (tomorrow) in the ${m.slotTitle} window at ${scheduledTimeStr}.`;
    } else {
      reasoning = describeReasoning(copy, targetSlot, scheduledTimeStr);
    }
  }

  return {
    ...copy,
    reasoning,
    slotKey: m.slotKey,
    slotTitle: m.slotTitle,
    slotIcon: m.slotIcon,
    targetDateKey: m.dateKey,
    targetDayName: m.dayName,
    isWeekend: m.isWeekend,
    copyKind,
    festivalKey
  };
}

/**
 * Built-in copy engine (offline, zero latency).
 * Each of the three suggestions targets a different send window (different slot) and
 * its copy is composed for THAT window's moment, skipping anything sent recently.
 */
export function generateHeuristicSuggestions(context, stats = {}, historyData = {}, options = {}) {
  const windows = Array.isArray(options.windows) && options.windows.length > 0
    ? options.windows
    : pickSpreadTriggerWindows(context, { ...options, count: 3 });
  const recent = collectRecentSentCopy(historyData);
  const chosenTitles = new Set();
  const greetedDates = new Set();
  const suggestions = [];

  for (let i = 0; i < 3; i++) {
    const win = windows[Math.min(i, windows.length - 1)];
    const triggerTimeMs = win.ms;
    const composed = composeNotificationForMoment({ ms: triggerTimeMs, recent, excludeTitles: chosenTitles, greetedDates, index: i });
    chosenTitles.add(normalizeCopy(composed.title));
    suggestions.push({
      id: `ai_sug_${i + 1}`,
      ...composed,
      scheduledAt: triggerTimeMs,
      scheduledAtDesc: `${formatDateIST(triggerTimeMs)} at ${formatTimeIST(triggerTimeMs, true)}`
    });
  }

  return suggestions;
}

/**
 * Resilient JSON extractor from model text output
 */
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const clean = fenceMatch ? fenceMatch[1].trim() : trimmed;
  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(clean.slice(start, end + 1));
      } catch {}
    }
    return null;
  }
}

/**
 * Call Google Gemini LLM API (Free Tier) when key is available
 * Grounded with live festival awareness per window, sent history memory (last ~10 sends),
 * 2-hour buffer, one distinct send window per suggestion and the same wording rules
 * as the built-in pools. Suggestion N is written for window N's moment.
 */
async function callGeminiApi({ apiKey, context, stats, historyData = {}, windows = null }) {
  if (!apiKey) return null;

  const targetWindows = Array.isArray(windows) && windows.length > 0
    ? windows
    : pickSpreadTriggerWindows(context, { count: 3 });
  const primary = targetWindows[0];
  const primaryMoment = getMomentContext(primary.ms);

  const describeWindow = (w, idx) => {
    const m = getMomentContext(w.ms);
    const fest = m.specialDay ? ` - FESTIVAL on this date: ${m.specialDay.name} (${m.specialDay.wish})` : '';
    const eve = !m.specialDay && m.eveOf ? ` - Eve of ${m.eveOf.name} (tomorrow)` : '';
    return `  ${idx + 1}. ${m.istDateString} (${m.dayName}, ${m.isWeekend ? 'WEEKEND' : 'weekday'}) at ${m.istTimeString} - slot: ${m.slotTitle} (${m.slotKey})${fest}${eve}`;
  };
  const windowsSummary = targetWindows.slice(0, 3).map(describeWindow).join('\n');

  // Sent History Memory for prompt: today's sends + last ~10 sends + anything already queued
  const sentToday = historyData.sentTodayList || [];
  const sentSummary = sentToday.length > 0
    ? sentToday.map((s, i) => `${i + 1}. "${s.title}" - ${s.message}`).join('\n')
    : 'None sent yet today.';
  const recentCopy = collectRecentSentCopy(historyData).slice(0, 12);
  const recentSummary = recentCopy.length > 0
    ? recentCopy.map((s, i) => `${i + 1}. "${s.rawTitle}" - ${s.rawMessage}`).join('\n')
    : 'No recent history.';

  const prompt = `
You write push notifications for "Bingo Online" (a free, real-time multiplayer 5x5 Bingo web app with a bot mode and private friend rooms). The audience is in India. Write like a friend texting, not like a brand.

Live Context:
- Current Indian Date & Day: ${context.istDateString} (${context.dayName})
- Current Indian Time: ${context.istTimeString}
- Primary Target: ${primaryMoment.istDateString} (${primaryMoment.dayName}) at ${primaryMoment.istTimeString} - ${primaryMoment.slotTitle} (${primaryMoment.slotKey})
- Festival on the primary target date: ${primaryMoment.specialDay ? `${primaryMoment.specialDay.name} (${primaryMoment.specialDay.wish})` : 'Regular day'}
- Target Send Windows (suggestion N is RECEIVED in window N; write each one for that exact moment):
${windowsSummary}
- Today's Messages Already Sent:
${sentSummary}
- Recently Sent Or Already Queued (last ~10, newest first):
${recentSummary}

STRICT INSTRUCTIONS:
1. MOMENT ACCURACY: Suggestion N must read correctly at the time, weekday and date of window N. Lunch copy only in the lunch slot, dinner copy only in the dinner slot, late-night wording only after 21:30, morning greetings only before 11:30. No lunch/colleague/office/commute wording on a Saturday or Sunday; no weekend wording on a weekday. "End of the week" / "Friday feeling" only when the window is on a Friday. Any weekday you mention must be the window's weekday, never today's.
2. FESTIVALS: If a window's date is marked FESTIVAL, lead that suggestion with a warm, authentic greeting for that festival. Festival-eve wording only for a window marked as an eve. Never greet a festival on any other date.
3. ANTI-REPETITION: Do not reuse, paraphrase or mimic any title, message or joke in the two history lists above. The three suggestions must also clearly differ from each other.
4. VOICE: Warm, natural, lightly funny, Indian everyday context (chai, dabba, traffic, "5 more minutes", mom calling for dinner, Sunday naps, exam breaks). Plain words. Do NOT use: boost, engage, optimize, challenge hook, AI, or any marketing phrasing. At most ONE exclamation mark per message (title + body together). No signature, app name or watermark at the end.
5. FORMAT: Title at most 40 characters with at most one emoji. Body at most 110 characters, plain text.

Return STRICTLY a JSON object matching this schema:
{
  "webAnalysisNotes": "One short sentence about the detected festival / situation",
  "suggestions": [
    { "category": "Festive Greeting or Relatable & Familiar", "badge": "...", "title": "...", "message": "...", "url": "/lobby", "reasoning": "..." },
    { "category": "Boredom Buster", "badge": "...", "title": "...", "message": "...", "url": "/bot", "reasoning": "..." },
    { "category": "Social Room", "badge": "...", "title": "...", "message": "...", "url": "/lobby", "reasoning": "..." }
  ]
}
`.trim();

  // Optimized call with 7-second abort timeout for fast execution
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 800
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`[Gemini API] Model ${model} returned status:`, response.status);
        continue;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) continue;

      const parsed = extractJsonFromText(candidateText);
      if (!parsed || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) continue;

      const recent = collectRecentSentCopy(historyData);
      const chosenTitles = new Set();
      const greetedDates = new Set();
      return {
        webAnalysisNotes: parsed.webAnalysisNotes || (primaryMoment.specialDay ? `Live calendar match: ${primaryMoment.specialDay.name}` : `Regular ${primaryMoment.dayName}`),
        suggestions: parsed.suggestions.slice(0, 3).map((s, idx) => {
          const win = targetWindows[Math.min(idx, targetWindows.length - 1)];
          const m = getMomentContext(win.ms);
          const winTimeString = formatTimeIST(win.ms, true);
          const winDateString = formatDateIST(win.ms);
          const cleanTitle = (s.title || '').replace(/\s*[-–—~]\s*(Bingo|Team Bingo|Bingo App|Bingo Online)\.?$/i, '').trim();
          const cleanMessage = (s.message || '').replace(/\s*[-–—~]\s*(Bingo|Team Bingo|Bingo App|Bingo Online)\.?$/i, '').trim();
          const cleanBadge = (s.badge || 'Smart Match').replace(EMOJI_STRIP_RE, '').trim();
          const problems = lintCopy(cleanTitle, cleanMessage);
          if (!cleanTitle || !cleanMessage || problems.length > 0) {
            // Model text broke the rules: use the built-in copy for this exact window instead
            const composed = composeNotificationForMoment({ ms: win.ms, recent, excludeTitles: chosenTitles, greetedDates, index: idx });
            chosenTitles.add(normalizeCopy(composed.title));
            return {
              id: `sug_${idx + 1}`,
              ...composed,
              scheduledAt: win.ms,
              scheduledAtDesc: `${winDateString} at ${winTimeString}`
            };
          }
          chosenTitles.add(normalizeCopy(cleanTitle));
          return {
            id: `sug_${idx + 1}`,
            category: s.category || 'Suggested Campaign',
            badge: cleanBadge || 'Smart Match',
            title: cleanTitle,
            message: cleanMessage,
            url: s.url || '/lobby',
            scheduledAt: win.ms,
            scheduledAtDesc: `${winDateString} at ${winTimeString}`,
            reasoning: s.reasoning
              ? s.reasoning.replace(/Crafted by Gemini AI for/gi, 'Suggested for').replace(/Gemini AI/gi, 'Automated scheduler')
              : `Scheduled for ${winTimeString} (${m.slotTitle}).`,
            slotKey: m.slotKey,
            slotTitle: m.slotTitle,
            slotIcon: m.slotIcon,
            targetDateKey: m.dateKey,
            targetDayName: m.dayName,
            isWeekend: m.isWeekend,
            copyKind: m.specialDay ? 'festive' : 'slot',
            festivalKey: m.specialDay ? m.dateKey : null
          };
        })
      };
    } catch (err) {
      console.warn(`[Gemini API] Error trying model ${model}:`, err.message);
    }
  }

  return null;
}

/**
 * Main Entry Point: Generate notification suggestions
 * Uses Gemini free tier if a key is provided (via process.env.GEMINI_API_KEY or param),
 * otherwise the built-in copy engine.
 * Options: preferredSlotKey (auto-pilot rotation), now (ms override for testing)
 */
export async function generateSmartNotificationCampaign({ stats = {}, historyData = {}, apiKey = null, preferredSlotKey = null, now = null } = {}) {
  const context = getContextualMatrix(typeof now === 'number' ? new Date(now) : new Date());
  const windows = pickSpreadTriggerWindows(context, { count: 3, preferredSlotKey: preferredSlotKey || undefined });
  const triggerTimeMs = windows[0].ms;
  const target = getMomentContext(triggerTimeMs);

  const targetDateString = target.istDateString;
  const targetTimeString = target.istTimeString;
  const targetSlot = { slotKey: target.slotKey, slotTitle: target.slotTitle, slotIcon: target.slotIcon };
  const targetDayName = target.dayName;
  const targetIsWeekend = target.isWeekend;
  const detectedFestival = target.specialDay;

  // Run predictive probability modeling
  const predictions = analyzeNotificationPacingAndProbabilities({
    stats,
    historyData,
    targetSlot,
    isSpecialOccasion: Boolean(detectedFestival)
  });

  let suggestions = null;
  let webAnalysisNotes = detectedFestival
    ? `Live festive match: ${detectedFestival.name}. Morning wishes & celebration recommended.`
    : `Target slot is ${targetSlot.slotTitle}. Minimum 2-hour safety review buffer active.`;
  let engineUsed = 'Built-in copy engine (offline)';

  // Try Gemini if API key is configured
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey) {
    const geminiResult = await callGeminiApi({
      apiKey: effectiveKey,
      context,
      stats,
      historyData,
      windows
    });
    if (geminiResult && geminiResult.suggestions && geminiResult.suggestions.length > 0) {
      suggestions = geminiResult.suggestions;
      webAnalysisNotes = geminiResult.webAnalysisNotes || webAnalysisNotes;
      engineUsed = 'Automated Scheduler';
    }
  }

  // Fallback to the built-in engine
  if (!suggestions) {
    suggestions = generateHeuristicSuggestions(context, stats, historyData, { windows });
  }

  return {
    context: {
      timeSlot: targetSlot.slotTitle,
      timeSlotKey: targetSlot.slotKey,
      timeSlotIcon: targetSlot.slotIcon,
      dayName: targetDayName,
      isWeekend: targetIsWeekend,
      currentTime: context.istTimeString,
      currentDate: context.istDateString,
      currentDayName: context.dayName,
      targetDayName,
      targetDate: targetDateString,
      targetTime: targetTimeString,
      specialOccasion: detectedFestival ? detectedFestival.name : null,
      specialWish: detectedFestival ? detectedFestival.wish : null,
      recommendedTriggerMs: triggerTimeMs,
      recommendedTriggerDesc: `${targetDateString} at ${targetTimeString}`,
      advanceReviewHours: 2
    },
    webAnalysisNotes,
    predictions,
    historyContext: {
      sentTodayCount: historyData.sentTodayCount || 0,
      sentTodayTitles: (historyData.sentTodayList || []).map(s => s.title)
    },
    engineUsed,
    suggestions
  };
}

/**
 * DISPATCH-TIME GUARD (pure decision, applied by the scheduler just before sending).
 * Looks at the ACTUAL current IST moment, not the moment the item was written for:
 *   - already sent / processing / cancelled  -> ignore
 *   - not due yet                             -> wait
 *   - more than MAX_LATE_DISPATCH_MS late     -> skip (server slept or restarted)
 *   - inside the quiet hours                  -> defer to the next 08:30 IST
 *   - engine copy that no longer fits the slot/date -> retext (fresh variant for now)
 *   - otherwise                               -> send
 */
export function evaluateScheduledDispatch(item, nowMs = Date.now()) {
  if (!item || item.status !== 'pending') return { action: 'ignore', reason: 'not pending' };
  const scheduledAt = Number(item.scheduledAt);
  if (!Number.isFinite(scheduledAt) || nowMs < scheduledAt) return { action: 'wait', reason: 'not due yet' };

  const lateMs = nowMs - scheduledAt;
  const lateMinutes = Math.round(lateMs / 60000);
  if (lateMs > MAX_LATE_DISPATCH_MS) {
    return {
      action: 'skip',
      lateMinutes,
      reason: `Skipped: ${lateMinutes} minutes late (server was asleep or restarted). It was written for ${formatDateIST(scheduledAt)} at ${formatTimeIST(scheduledAt, true)}.`
    };
  }

  if (isQuietHoursIST(nowMs)) {
    const deferToMs = nextAllowedSendTime(nowMs);
    return {
      action: 'defer',
      lateMinutes,
      deferToMs,
      reason: `Quiet hours (23:00-08:00 IST): moved to ${formatDateIST(deferToMs)} at ${formatTimeIST(deferToMs, true)}.`
    };
  }

  const moment = getMomentContext(nowMs);
  const mismatches = [];
  if (item.slotKey && item.slotKey !== moment.slotKey) mismatches.push(`written for ${item.slotKey}, now ${moment.slotKey}`);
  if (item.targetDateKey && item.targetDateKey !== moment.dateKey) mismatches.push(`written for ${item.targetDateKey}, now ${moment.dateKey}`);
  if (item.festivalKey) {
    const expected = item.copyKind === 'festival_eve' ? moment.nextDateKey : moment.dateKey;
    if (item.festivalKey !== expected) mismatches.push(`festival text for ${item.festivalKey}`);
  }
  const fit = assessCopyForMoment(item.title, item.message, moment);
  if (!fit.fits && fit.reason) mismatches.push(fit.reason);

  if (mismatches.length > 0) {
    // Auto-pilot items are always engine text, even when written by an older pool
    if (fit.origin === 'engine' || item.copyOrigin === 'engine') {
      return { action: 'retext', lateMinutes, moment, reason: `Re-texted for ${moment.slotTitle} on ${moment.dayName}: ${mismatches.join('; ')}.` };
    }
    // Admin-written text: we cannot rewrite it, send as is but say why nothing changed
    return { action: 'send', lateMinutes, moment, note: `Admin-written text kept although ${mismatches.join('; ')}.` };
  }
  return { action: 'send', lateMinutes, moment };
}
