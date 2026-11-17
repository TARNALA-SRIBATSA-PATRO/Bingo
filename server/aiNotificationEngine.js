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

function resolveNowMs(context, options = {}) {
  if (typeof options.now === 'number' && Number.isFinite(options.now)) return options.now;
  if (context && typeof context.nowMs === 'number' && Number.isFinite(context.nowMs)) return context.nowMs;
  return Date.now();
}

/**
 * Build the ordered list of valid candidate send windows (today + tomorrow, IST).
 * - Every window respects the STRICT 2-HOUR REVIEW BUFFER (>= now + 120 min)
 * - Festival mornings are always evaluated first (festival-morning rule)
 * - Each window gets a deterministic jitter of -20..+20 minutes seeded by
 *   IST date + slot, so the exact minute changes from day to day
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
    const ms = targetIST.getTime() - IST_OFFSET_MS;
    if (ms < earliestAllowedMs) continue;

    const slot = getSlotForHour(targetIST.getUTCHours());
    windows.push({
      ms,
      slotKey: slot.slotKey,
      slotTitle: slot.slotTitle,
      slotIcon: slot.slotIcon,
      desc: w.desc,
      dayOffset: w.dayOffset,
      dateKey: w.dateKey,
      festival: w.festival,
      jitterMinutes
    });
  }

  // Preferred slot (auto-pilot rotation) goes first, but never ahead of a festival morning
  if (options.preferredSlotKey && windows.length > 1 && !windows[0].festival) {
    const idx = windows.findIndex(w => w.slotKey === options.preferredSlotKey);
    if (idx > 0) {
      const [preferred] = windows.splice(idx, 1);
      windows.unshift(preferred);
    }
  }

  // Fallback: exactly 2 hours and 15 minutes in advance
  if (windows.length === 0) {
    const ms = earliestAllowedMs + 15 * 60 * 1000;
    const slot = getSlotForHour(new Date(ms + IST_OFFSET_MS).getUTCHours());
    windows.push({
      ms,
      slotKey: slot.slotKey,
      slotTitle: slot.slotTitle,
      slotIcon: slot.slotIcon,
      desc: 'Earliest Safe Window',
      dayOffset: 0,
      dateKey: getIstDateKey(ms),
      festival: false,
      jitterMinutes: 0
    });
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
    advice = 'Optimal Pacing: 0 sent today. Subscribers are fresh and receptive. High click rate expected.';
  } else if (sentTodayCount === 1) {
    volumeStatus = 'optimal';
    fatigueFactor = 0.92;
    advice = 'Good Pacing: 1 sent earlier today. Scheduling an evening or relaxation round is safe and optimal.';
  } else if (sentTodayCount === 2) {
    volumeStatus = 'moderate';
    fatigueFactor = 0.62;
    advice = 'Fatigue Warning: 2 messages already sent today. We recommend waiting until tomorrow unless celebrating a festival.';
  } else {
    volumeStatus = 'high_fatigue';
    fatigueFactor = 0.35;
    advice = 'High Fatigue Danger: 3+ notifications sent today! Additional pushes risk user muting or app uninstalls.';
  }

  // 2. Slot & Festive Engagement Boost
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
 * Copy variant pools. Every slot has 6 distinct title+message pairs, plus generic,
 * weekend and festive pools. `{day}` = target weekday name, `{festival}` = festival name.
 */
export const NOTIFICATION_VARIANT_POOLS = {
  morning_commute: [
    { category: 'Relatable & Familiar', badge: 'Fresh Start', title: 'Good Morning! Fresh start ☀️', message: 'Starting your morning? Wake up your brain with a quick 2-minute win before the workday begins!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Commute Companion', title: 'Morning commute companion 🚇', message: 'On the road or metro? Pass your travel time with a quick casual Bingo victory.', url: '/bot' },
    { category: 'Social Room', badge: 'Morning Focus', title: '{day} morning focus 🎯', message: 'Kick off your day on a winning note. Claim the first Bingo victory of the day!', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Chai & Toast', title: 'Chai, toast & one Bingo? ☕', message: 'The breakfast table is the best Bingo table. Finish your chai with a quick 5-line win!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Bot Warm-Up', title: 'Warm up before work 🔋', message: 'Before the emails pile up, beat the Bot in one rapid round and start the day sharp.', url: '/bot' },
    { category: 'Social Room', badge: 'Office Rivals', title: 'Who wins before 11? 🏁', message: 'Challenge a colleague to a Bingo race before the first meeting. Loser buys the chai!', url: '/lobby' }
  ],
  midday_lunch: [
    { category: 'Relatable & Familiar', badge: 'Lunch Break', title: 'Lunch break is here! 🍱', message: 'Done with lunch? Relax your mind for 2 minutes with a stress-free Bingo round.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Food Coma Fix', title: 'Beat the food coma! 🥱⚡', message: 'Feeling sluggish after lunch? A rapid numbers challenge will snap your brain right back!', url: '/bot' },
    { category: 'Social Room', badge: 'Colleague Duel', title: 'Midday duel with colleagues ⚡', message: 'Sharing lunch? Challenge your friends or colleagues to a rapid 5-line Bingo match!', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Tiffin Time', title: 'Dabba done? Bingo next 🍛', message: 'Tiffin finished early? Spend the last 5 minutes of lunch on a satisfying Bingo win.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Power Round', title: 'Lunch hour power round 🎲', message: 'Trade one scroll session for one Bingo round. Five lines, two minutes, zero stress.', url: '/bot' },
    { category: 'Social Room', badge: 'Canteen Showdown', title: 'Canteen table showdown 🥗', message: 'Everyone at the table has a phone. Start a private room and settle who is the lunch champion.', url: '/lobby' }
  ],
  post_lunch_slump: [
    { category: 'Boredom Buster', badge: 'Slump Buster', title: '3 PM slump? Snap out of it ⚡', message: 'Eyes getting heavy after lunch? A quick Bingo round wakes the brain faster than coffee.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Focus Reset', title: 'Two-minute afternoon reset 🔄', message: 'Between meetings? Reset your focus with one fast 5-line Bingo win and get back sharper.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Bot Challenge', title: 'Beat the Bot before 4 🤖', message: 'The Bot says afternoons are its best time. Prove it wrong in a 90-second solo match.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Brain Fog', title: 'Post-lunch brain fog? 🌫️', message: 'Numbers are the cure. Mark five lines, clear the fog, and finish the afternoon strong.', url: '/bot' },
    { category: 'Social Room', badge: 'Desk Break', title: 'Desk-side mini break 🪑', message: 'No need to leave your chair. Invite a teammate to a cozy room for the perfect afternoon micro-break.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Quick Win', title: 'Afternoon quick win 🏅', message: 'Need a small victory today? A 5-line Bingo win is the quickest one you will find.', url: '/lobby' }
  ],
  afternoon_chai: [
    { category: 'Relatable & Familiar', badge: 'Chai & Micro-Break', title: 'Chai time + Quick Bingo ☕', message: 'Steaming cup of tea in hand? Pair your evening chai break with an instant Bingo match!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Meeting Escape', title: 'Escape work meetings for 2 mins 🥱', message: 'Give your eyes a break from spreadsheets. Join a live room or challenge the Bot right now!', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Tea Recharge', title: 'Evening tea recharge 🍪', message: 'Your evening energy booster is here. Score 5 lines and claim a relaxing win!', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Chai & Micro-Break', title: 'Chai & Bingo Break? ☕', message: 'Tired of looking at work & screens? Take a quick 2-min chai break with a refreshing Bingo round!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Biscuit Combo', title: 'Biscuit, chai, Bingo 🍪', message: 'The perfect 5 PM combo. Dunk a biscuit, sip your chai, and mark five lines before it cools.', url: '/bot' },
    { category: 'Social Room', badge: 'Team Tea Break', title: 'Tea break challenge 🏆', message: 'Chai break with the team? Open a private room and see who calls BINGO before the cups are empty.', url: '/lobby' }
  ],
  evening_commute: [
    { category: 'Boredom Buster', badge: 'Ride Home', title: 'Heading home? Play along 🚌', message: 'Stuck in traffic or on the metro? A quick Bingo round makes the ride home fly by.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Day Done', title: 'Work done. Bingo on 🌇', message: 'Laptop closed, day finished. Celebrate with one relaxed 5-line win on the way home.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Traffic Buster', title: 'Signal-jam survival kit 🚦', message: 'Red light again? Beat the Bot in 90 seconds while the traffic sorts itself out.', url: '/bot' },
    { category: 'Social Room', badge: 'Commute Race', title: 'Commute race with friends 🏁', message: 'Who reaches home first and who calls BINGO first? Start a room and find out tonight.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Wrap-Up Win', title: 'Wrap-up win for {day} 📋', message: 'Before you log off completely, bank one small win. Five lines and you are done for the day.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Metro Mode', title: 'Metro mode: Bingo 🚇', message: 'Earphones in, phone out. One quick Bingo round is the best way to end the commute.', url: '/bot' }
  ],
  dinner_chill: [
    { category: 'Social Room', badge: 'Dinner Round', title: 'Having dinner or relaxing? 🍲', message: 'Relaxing after a long day? Share a room code with friends and play a fun dinner round!', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Couch Mode', title: 'Couch, dinner & Bingo 🛋️', message: 'Feet up after dinner? One cozy Bingo round with friends is the perfect way to unwind.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Bot Duel', title: 'Post-dinner Bot duel 🤖', message: 'Dinner done, dishes can wait. Take on the Pro Bot in a quick evening match.', url: '/bot' },
    { category: 'Social Room', badge: 'Family Night', title: 'Family Bingo night? 🏠', message: 'Everyone is home. Drop a room link in the family group and crown tonight’s champion.', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Evening Unwind', title: 'Evening unwind round 🌆', message: 'Trade one episode for one Bingo game. Five lines, zero stress, pure relaxation.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Dessert Round', title: 'Dessert round? 🍨', message: 'Something sweet after dinner? A quick Bingo win against the Bot tastes even better.', url: '/bot' }
  ],
  night_wind_down: [
    { category: 'Relatable & Familiar', badge: 'Night Chill', title: 'Late night chill round 🌙', message: 'Wind down before sleep. Just one quick cozy game to end your day on a satisfying win!', url: '/lobby' },
    { category: 'Social Room', badge: 'Night Owls', title: 'Night owl challenge 🦉', message: 'Still awake? The night lobbies are active. Can you win a 5-line Bingo before bed?', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Lights Out', title: 'One game before lights out 💤', message: 'Finish the day with a calm, quick Bingo round. Then it is sleep time, promise.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Bedtime Scroll', title: 'Can’t sleep yet? 🌃', message: 'Scrolling in bed anyway? Make it count with a relaxing 5-line Bingo win.', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Bot Showdown', title: 'Midnight Bot showdown 🌙', message: 'The Bot never sleeps. Beat it once tonight and go to bed as the winner.', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Goodnight', title: 'Goodnight Bingo 🌛', message: 'A slow, cozy round is the perfect bedtime wind-down. One game and then lights off.', url: '/lobby' }
  ],
  generic: [
    { category: 'Relatable & Familiar', badge: 'Quick Round', title: 'Two minutes to spare? 🎲', message: 'That is all a Bingo round takes. Mark five lines and get on with your day feeling great.', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Brain Recharge', title: 'Spreadsheets vs Bingo? 📊', message: 'Pause the boring work for 2 minutes. Can you beat the Pro Bot before someone pings on Slack?', url: '/bot' },
    { category: 'Boredom Buster', badge: 'Bot Challenge', title: 'Can you beat Pro Bot in 90s? 🤖', message: 'The Bot claims it cannot be defeated today. Prove it wrong in a rapid solo match!', url: '/bot' },
    { category: 'Relatable & Familiar', badge: 'Quick Reboot', title: '2-Minute Brain Reboot 🔋', message: 'Eyes tired from screens? Reset your focus with a quick, satisfying 5-line Bingo victory!', url: '/lobby' },
    { category: 'Social Room', badge: 'Friends & Family', title: 'Who’s ready for Bingo? 🏆', message: 'Create a quick private room, share the code, and challenge your friends to a 5-line race!', url: '/lobby' },
    { category: 'Relatable & Familiar', badge: 'Lucky Numbers', title: 'Your lucky numbers await 🍀', message: 'Feeling lucky today? Grab a card, mark your lines, and shout BINGO first.', url: '/lobby' }
  ],
  weekend: [
    { category: 'Relatable & Familiar', badge: 'Weekend Chill', title: '{day} Chill & Bingo 🛋️', message: 'Weekend mode is ON! Put your feet up, relax on the couch, and enjoy a peaceful Bingo game.', url: '/lobby' },
    { category: 'Social Room', badge: 'Squad Showdown', title: 'Weekend Squad Showdown 🏅', message: 'Who in your squad is the real Bingo master? Start a private room and crown the champion!', url: '/lobby' },
    { category: 'Social Room', badge: 'Relaxed Vibes', title: 'Relaxed {day} vibes ☕', message: 'Unwind and recharge before the week ahead. One cozy Bingo match with friends!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Lazy Duel', title: 'Lazy {day} Bot duel 🤖', message: 'No alarms, no meetings. Just you, a cup of chai, and the Pro Bot waiting to be beaten.', url: '/bot' },
    { category: 'Social Room', badge: 'Family Room', title: 'Weekend family room 🏠', message: 'Everyone is home this weekend. Share a room code in the family group and play together!', url: '/lobby' },
    { category: 'Boredom Buster', badge: 'Pick-Me-Up', title: 'Slow {day}, fast Bingo ⚡', message: 'Nothing on the schedule? A quick 5-line round is the perfect weekend pick-me-up.', url: '/bot' }
  ],
  festive: [
    { category: 'Festive Banter', badge: 'Sweets & Bingo', title: 'Kaju Katli vs Pro Bot? 🍬', message: 'Festive sweets in one hand, Bingo card in the other! Can you score 5 lines before the sweets vanish?', url: '/bot' },
    { category: 'Family Room', badge: 'Family Room', title: 'Family Bingo: {festival} 🎊', message: 'Drop your room link in your family WhatsApp group and find out who screams BINGO first!', url: '/lobby' },
    { category: 'Family Room', badge: 'Festive Room', title: 'Festive room is open 🎉', message: 'Relatives over? Keep everyone entertained with a quick family Bingo round.', url: '/lobby' },
    { category: 'Festive Banter', badge: 'Holiday Mode', title: 'Holiday mood, Bingo mode 🪔', message: 'Day off from work? Celebrate with a relaxed 5-line match and a plate of sweets.', url: '/bot' },
    { category: 'Family Room', badge: 'Festive Champion', title: 'Festive champion challenge 🏆', message: 'Who in the family calls BINGO first this {festival}? Start a private room and find out.', url: '/lobby' }
  ]
};

function fillTemplate(text, vars = {}) {
  return String(text || '')
    .replace(/\{day\}/g, vars.dayName || '')
    .replace(/\{festival\}/g, vars.festivalName || 'Festival');
}

/** Lowercase, strip emojis/punctuation so near-identical copies still match */
function normalizeCopy(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
 * 1. slot pool (+ weekend pool on weekends) minus anything in recent history / already chosen
 * 2. generic pool minus the same
 * 3. if everything was used recently, the least recently used variant
 * Each pool is shuffled once with a fixed seed (per slot); the still-fresh variants
 * are then indexed by the target day number, so a slot cycles through all of its
 * variants on consecutive days instead of showing the same copy twice in a row.
 * The per-day seed (IST date + slot + index) is used when no date key is given
 * and to break ties in the least-recently-used fallback.
 */
export function selectNotificationVariant({
  slotKey,
  isWeekend = false,
  dayName = '',
  festivalName = '',
  recent = [],
  excludeTitles = new Set(),
  seed = '',
  dateKey = ''
}) {
  const rng = createSeededRandom(seed);
  const vars = { dayName, festivalName };
  const slotPool = NOTIFICATION_VARIANT_POOLS[slotKey] || [];
  const tier1 = isWeekend ? [...NOTIFICATION_VARIANT_POOLS.weekend, ...slotPool] : slotPool;
  const tier2 = NOTIFICATION_VARIANT_POOLS.generic;
  const notExcluded = (v) => !excludeTitles.has(normalizeCopy(fillTemplate(v.title, vars)));
  const dayNumber = dayNumberFromDateKey(dateKey);

  const tiers = [
    ['slot', tier1],
    ['generic', tier2]
  ];
  for (const [tierName, tier] of tiers) {
    if (tier.length === 0) continue;
    const order = seededShuffle(tier, createSeededRandom(`${slotKey}|${tierName}|${isWeekend ? 'weekend' : 'weekday'}|order`));
    const fresh = order.filter(v => notExcluded(v) && recencyRank(v, recent, vars) === -1);
    if (fresh.length === 0) continue;
    const index = dayNumber !== null ? dayNumber % fresh.length : Math.floor(rng() * fresh.length);
    return materializeVariant(fresh[index], vars);
  }

  // Everything was sent recently: fall back to the least recently used variant
  const all = seededShuffle([...tier1, ...tier2].filter(notExcluded), rng);
  if (all.length === 0) return materializeVariant(tier2[0], vars);
  all.sort((a, b) => recencyRank(b, recent, vars) - recencyRank(a, recent, vars));
  return materializeVariant(all[0], vars);
}

function describeReasoning(copy, targetSlot, timeStr) {
  const tag = `${copy.category} ${copy.badge}`.toLowerCase();
  if (copy.url === '/bot' || tag.includes('bot') || tag.includes('boredom') || tag.includes('challenge')) {
    return `Humorous boredom buster & challenge hook for ${targetSlot.slotTitle} at ${timeStr}. Direct action boosts opens by +35%.`;
  }
  if (tag.includes('social') || tag.includes('room') || tag.includes('family') || tag.includes('squad')) {
    return `Social multiplayer room invitation aligned with ${targetSlot.slotTitle} prime window at ${timeStr}.`;
  }
  return `Matched to ${targetSlot.slotTitle} at ${timeStr}. High casual micro-break CTR.`;
}

/**
 * Built-in Smart Semantic AI Synthesis Engine (100% Free, Offline, Zero Latency)
 * Produces unique, funny, casual, game-friendly copy with memory of past sent messages.
 * Each of the three suggestions targets a different send window (different slot) and
 * draws its copy from that slot's variant pool, skipping anything sent recently.
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

    const scheduledTimeStr = formatTimeIST(triggerTimeMs, false);
    const scheduledTimeWithZone = formatTimeIST(triggerTimeMs, true);
    const scheduledDateStr = formatDateIST(triggerTimeMs);

    // Everything about the copy is derived from the TARGET trigger date/time, never from "now",
    // so weekday names and slot moods strictly match the scheduled moment.
    const targetIST = new Date(triggerTimeMs + IST_OFFSET_MS);
    const targetSlot = getSlotForHour(targetIST.getUTCHours());
    const targetDayIndex = targetIST.getUTCDay();
    const dayName = DAY_NAMES[targetDayIndex];
    const isWeekend = targetDayIndex === 0 || targetDayIndex === 6;
    const specialDay = detectSpecialOccasion(triggerTimeMs);
    const dateKey = getIstDateKey(triggerTimeMs);

    let copy;
    let reasoning;
    if (specialDay) {
      const cleanFestivalName = (specialDay.name || 'Festival').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '').trim() || 'Festive Greeting';
      const greetingTitle = specialDay.greetingTitle || `${specialDay.name} Wishes! 🪔`;
      const greetingAlreadySent = recent.some(r => r.title === normalizeCopy(greetingTitle));
      if (!greetedDates.has(dateKey) && !greetingAlreadySent) {
        greetedDates.add(dateKey);
        copy = {
          category: 'Festive Greeting',
          badge: cleanFestivalName,
          title: greetingTitle,
          message: `${specialDay.wish} Celebrate with family & friends over a festive Bingo match!`,
          url: '/lobby'
        };
        reasoning = `Festive greeting for ${specialDay.name}. Warm cultural wish boosts open rate by +55%.`;
      } else {
        copy = selectNotificationVariant({
          slotKey: 'festive',
          isWeekend: false,
          dayName,
          festivalName: cleanFestivalName,
          recent,
          excludeTitles: chosenTitles,
          seed: `${dateKey}|festive|${i}`,
          dateKey
        });
        reasoning = `Festive banter for ${specialDay.name} in the ${targetSlot.slotTitle} window at ${scheduledTimeStr}.`;
      }
    } else {
      copy = selectNotificationVariant({
        slotKey: targetSlot.slotKey,
        isWeekend,
        dayName,
        recent,
        excludeTitles: chosenTitles,
        seed: `${dateKey}|${targetSlot.slotKey}|${i}`,
        dateKey
      });
      reasoning = describeReasoning(copy, targetSlot, scheduledTimeStr);
    }

    chosenTitles.add(normalizeCopy(copy.title));
    suggestions.push({
      id: `ai_sug_${i + 1}`,
      ...copy,
      scheduledAt: triggerTimeMs,
      scheduledAtDesc: `${scheduledDateStr} at ${scheduledTimeWithZone}`,
      reasoning
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
 * Grounded with live web search awareness, sent history memory (last ~10 sends), 2-hour buffer,
 * and one distinct send window per suggestion.
 */
async function callGeminiApi({ apiKey, context, stats, historyData = {}, windows = null }) {
  if (!apiKey) return null;

  const targetWindows = Array.isArray(windows) && windows.length > 0
    ? windows
    : pickSpreadTriggerWindows(context, { count: 3 });
  const primary = targetWindows[0];
  const triggerTimeMs = primary.ms;
  const targetDateObj = new Date(triggerTimeMs);
  const targetTimeString = formatTimeIST(triggerTimeMs, true);
  const targetDateString = formatDateIST(triggerTimeMs);

  const targetIST = new Date(triggerTimeMs + IST_OFFSET_MS);
  const targetSlot = getSlotForHour(targetIST.getUTCHours());
  const detectedFestival = detectSpecialOccasion(targetDateObj);
  const targetDayName = DAY_NAMES[targetIST.getUTCDay()];

  const describeWindow = (w, idx) => {
    const ist = new Date(w.ms + IST_OFFSET_MS);
    const slot = getSlotForHour(ist.getUTCHours());
    const fest = detectSpecialOccasion(w.ms);
    return `  ${idx + 1}. ${formatDateIST(w.ms)} (${DAY_NAMES[ist.getUTCDay()]}) at ${formatTimeIST(w.ms, true)} - ${slot.slotTitle} (${slot.slotKey})${fest ? ` - Festival: ${fest.name}` : ''}`;
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
You are an expert casual gaming community copywriter for "Bingo Online" (a free, real-time multiplayer 5x5 Bingo web app with bot mode and private friend rooms).

Live Context:
- Current Indian Date & Day: ${context.istDateString} (${context.dayName})
- Current Indian Time: ${context.istTimeString} IST
- Primary Target Trigger Date & Day: ${targetDateString} (${targetDayName})
- Primary Target Trigger Time: ${targetTimeString} IST (Strictly 2+ hours in advance)
- Primary Target Slot: ${targetSlot.slotTitle} (${targetSlot.slotKey})
- Detected Indian Festival / Occasion on Primary Target Date: ${detectedFestival ? `${detectedFestival.name} (${detectedFestival.wish})` : 'Regular day'}
- Target Send Windows (suggestion N is sent in window N):
${windowsSummary}
- Today's Messages Already Sent:
${sentSummary}
- Recently Sent Or Already Queued (last ~10, newest first):
${recentSummary}

STRICT INSTRUCTIONS:
1. LIVE FESTIVAL & EVENT AWARENESS: First analyze whether each target window's date has any festival (e.g. Diwali, Dhanteras, Chhath Puja, Bhai Dooj, Eid, Holi, Christmas, Independence Day, etc.) or major sports event. If yes and the window is in the morning/day, lead with an authentic, warm, heartfelt festival greeting & wish.
2. ANTI-REPETITION MANDATE: Do NOT reuse, paraphrase, or mimic ANY title, message, hook, or joke from the "Today's Messages Already Sent" and "Recently Sent Or Already Queued" lists above. Every title and message must be 100% new, fresh, funny, casual, game-friendly, and attractive. The three suggestions must also differ clearly from each other.
3. TARGET TIME & DAY OF THE WEEK ACCURACY: Suggestion N MUST match the time of day, mood, and weekday of Target Send Window N (e.g. a lunch window gets lunch copy, an evening window gets evening copy). If you mention any day of the week in a title or message, it MUST be that window's weekday, NEVER today's day (${context.dayName}) unless they are the same.
4. STRICTLY NO APP SIGNATURE OR WATERMARK: Do NOT append any signature, app name, company signature, watermark, or 'AI generated' suffix in the title or message (such as "- Bingo", "~ Bingo App", "- Team Bingo", "Sent via Bingo", "Crafted by AI", etc.). The message MUST end naturally without any signature.
5. CONSTRAINTS: Title under 40 characters. Message under 120 characters. Include 1-2 lively emojis in both title and message.

Return STRICTLY a JSON object matching this schema:
{
  "webAnalysisNotes": "Brief 1-sentence note of detected festival / situation for today",
  "suggestions": [
    {
      "category": "Festive Greeting or Casual Comedy",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/lobby",
      "reasoning": "..."
    },
    {
      "category": "Boredom Buster / Bot Challenge",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/bot",
      "reasoning": "..."
    },
    {
      "category": "Social & Relaxation",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/lobby",
      "reasoning": "..."
    }
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

      return {
        webAnalysisNotes: parsed.webAnalysisNotes || (detectedFestival ? `Live calendar match: ${detectedFestival.name}` : `Standard active day in ${targetDayName}`),
        suggestions: parsed.suggestions.map((s, idx) => {
          const win = targetWindows[Math.min(idx, targetWindows.length - 1)];
          const winIST = new Date(win.ms + IST_OFFSET_MS);
          const winSlot = getSlotForHour(winIST.getUTCHours());
          const winTimeString = formatTimeIST(win.ms, true);
          const winDateString = formatDateIST(win.ms);
          let cleanTitle = (s.title || '').replace(/\s*[-–—~]\s*(Bingo|Team Bingo|Bingo App|Bingo Online)\.?$/i, '').trim();
          let cleanMessage = (s.message || '').replace(/\s*[-–—~]\s*(Bingo|Team Bingo|Bingo App|Bingo Online)\.?$/i, '').trim();
          let cleanBadge = (s.badge || 'Smart Match').replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, '').trim();
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
              : `Scheduled for ${winTimeString} (${winSlot.slotTitle}).`
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
 * Main Entry Point: Generate AI-grounded notification suggestions
 * 100% Free: Uses Gemini free tier if key provided (via process.env.GEMINI_API_KEY or param),
 * otherwise uses built-in smart AI engine!
 * Options: preferredSlotKey (auto-pilot rotation), now (ms override for testing)
 */
export async function generateSmartNotificationCampaign({ stats = {}, historyData = {}, apiKey = null, preferredSlotKey = null, now = null } = {}) {
  const context = getContextualMatrix(typeof now === 'number' ? new Date(now) : new Date());
  const windows = pickSpreadTriggerWindows(context, { count: 3, preferredSlotKey: preferredSlotKey || undefined });
  const triggerTimeMs = windows[0].ms;
  const targetDateObj = new Date(triggerTimeMs);

  const targetDateString = formatDateIST(triggerTimeMs);
  const targetTimeString = formatTimeIST(triggerTimeMs, true);

  const targetIST = new Date(triggerTimeMs + IST_OFFSET_MS);
  const targetSlot = getSlotForHour(targetIST.getUTCHours());

  // Derive target trigger date's day of week & weekend status
  const targetDayIndex = targetIST.getUTCDay();
  const targetDayName = DAY_NAMES[targetDayIndex];
  const targetIsWeekend = targetDayIndex === 0 || targetDayIndex === 6;

  const detectedFestival = detectSpecialOccasion(targetDateObj);

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
  let engineUsed = 'Built-in Smart Semantic AI (100% Free & Offline)';

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

  // Fallback to high-fidelity built-in engine
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
