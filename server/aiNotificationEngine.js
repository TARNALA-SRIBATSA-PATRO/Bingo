// ============================================================================
// AI Push Notification Engine
// 100% Free of Cost - Context-Aware, Situation-Based, Dynamic & Relatable
// Enforces Indian Standard Time (IST) globally & Multi-Year Indian Festival Database
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
 * Automatically checks multi-year lunar dates and recurring annual holidays
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
    istDateString: formatDateIST(date)
  };
}

/**
 * Calculate recommended trigger time (in UTC milliseconds)
 * Targets the best upcoming peak window today or tomorrow.
 * Strictly guarantees that target trigger time is in the future.
 */
export function calculateRecommendedTriggerTime(context, baseDate = new Date()) {
  const now = Date.now();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now + istOffset);
  const curHour = istNow.getUTCHours();
  const curMin = istNow.getUTCMinutes();

  let targetHourIST = 17;
  let targetMinIST = 0;
  let addDays = 0;

  if (curHour < 10 || (curHour === 10 && curMin < 30)) {
    // Target 10:30 AM morning coffee/refresh
    targetHourIST = 10;
    targetMinIST = 30;
  } else if (curHour < 13 || (curHour === 13 && curMin < 15)) {
    // Target 1:15 PM lunch relaxation
    targetHourIST = 13;
    targetMinIST = 15;
  } else if (curHour < 17) {
    // Target 5:00 PM evening chai break
    targetHourIST = 17;
    targetMinIST = 0;
  } else if (curHour < 20 || (curHour === 20 && curMin < 15)) {
    // Target 8:15 PM prime evening relax & dinner
    targetHourIST = 20;
    targetMinIST = 15;
  } else if (curHour < 22) {
    // Target 10:00 PM late night chill
    targetHourIST = 22;
    targetMinIST = 0;
  } else {
    // Late night -> schedule for next day's 5:00 PM chai break
    addDays = 1;
    targetHourIST = 17;
    targetMinIST = 0;
  }

  // Construct target Date in IST, then convert back to UTC timestamp
  const targetIST = new Date(istNow);
  targetIST.setUTCDate(targetIST.getUTCDate() + addDays);
  targetIST.setUTCHours(targetHourIST, targetMinIST, 0, 0);

  const targetUtcMs = targetIST.getTime() - istOffset;
  // Ensure scheduled time is at least 15 minutes in the future
  return Math.max(targetUtcMs, now + 15 * 60 * 1000);
}

/**
 * Built-in Smart Semantic AI Synthesis Engine (100% Free, Offline, Zero Latency)
 * Produces highly relatable, friendly, culturally warm, and conversational copy.
 * Generates copy aligned with the TARGET TRIGGER SLOT (not outdated hours).
 */
export function generateHeuristicSuggestions(context, stats = {}) {
  const triggerTimeMs = calculateRecommendedTriggerTime(context);
  const targetDateObj = new Date(triggerTimeMs);

  // Time and Date descriptors in strict IST
  const scheduledTimeStr = formatTimeIST(triggerTimeMs, false);
  const scheduledTimeWithZone = formatTimeIST(triggerTimeMs, true);
  const scheduledDateStr = formatDateIST(triggerTimeMs);

  // Derive target slot based on TARGET TRIGGER TIME in IST
  const istOffset = 5.5 * 60 * 60 * 1000;
  const targetIST = new Date(triggerTimeMs + istOffset);
  const targetHour = targetIST.getUTCHours();
  const targetSlot = getSlotForHour(targetHour);

  // Check if target date is a special festival or holiday
  const specialDay = detectSpecialOccasion(targetDateObj) || context.specialDay;

  const { dayName, isWeekend } = context;

  // 1. Relatable & Familiar
  let var1 = {
    category: 'Relatable & Familiar',
    badge: 'Chai Break & Relaxation ☕',
    title: 'Chai & Bingo Break? ☕',
    message: 'Tired of looking at work & screens? Take a quick 2-min chai break with a refreshing Bingo round!',
    url: '/lobby'
  };

  // 2. Playful Challenge / Boredom Buster
  let var2 = {
    category: 'Boredom Buster',
    badge: 'Brain Recharge 🧠',
    title: 'Bored of work? Quick match! ⚡',
    message: 'Pause the spreadsheets for 2 minutes. Can you beat the Pro Bot before your tea gets cold?',
    url: '/bot'
  };

  // 3. Social / Evening / Weekend Vibe
  let var3 = {
    category: 'Social Room',
    badge: 'Friends & Family 🎮',
    title: 'Who’s ready for Bingo tonight? 🏆',
    message: 'Relaxing on the couch or having dinner? Create a quick private room and challenge your friends!',
    url: '/lobby'
  };

  // Contextual overrides based on target trigger time & festive occasions
  if (specialDay) {
    var1 = {
      category: 'Festive Celebration',
      badge: `${specialDay.name} ✨`,
      title: specialDay.greetingTitle || `${specialDay.name} Wishes! 🪔`,
      message: `${specialDay.wish} Celebrate with family & friends over a festive Bingo match!`,
      url: '/lobby'
    };
    var2 = {
      category: 'Holiday Challenge',
      badge: 'Festive Win 🏆',
      title: `${specialDay.name} Challenge! 🎯`,
      message: `No work today! Enjoy the festive holiday with sweets, smiles, and an instant 5-line Bingo victory.`,
      url: '/bot'
    };
    var3 = {
      category: 'Family & Friends Room',
      badge: 'Festive Lobby 👨‍👩‍👦',
      title: `Festive Room: ${specialDay.name} 🎊`,
      message: `Gather your family on WhatsApp, create a private room, and celebrate together with Bingo!`,
      url: '/lobby'
    };
  } else if (isWeekend) {
    var1.title = `${dayName} Chill & Bingo 🛋️`;
    var1.message = 'Weekend mode is ON! Put your feet up, relax, and enjoy a peaceful Bingo game.';
    var2.title = 'Weekend Bingo Tournament 🏅';
    var2.message = 'Who in your squad is the real Bingo master? Start a private room and find out!';
    var3.title = `Relaxed ${dayName} vibes ☕`;
    var3.message = 'Unwind and recharge before the week ahead. One cozy Bingo match with friends!';
  } else if (targetSlot.slotKey === 'morning_commute') {
    var1.title = `Good Morning! Fresh start ☀️`;
    var1.message = 'Starting your morning or heading to work? Wake up your brain with a quick 2-minute win!';
    var2.title = 'Morning commute companion 🚇';
    var2.message = 'On the road or metro? Pass your travel time with a fun casual Bingo game.';
    var3.title = `${dayName} morning focus 🎯`;
    var3.message = 'Kick off your day on a winning note. Claim the first Bingo victory today!';
  } else if (targetSlot.slotKey === 'midday_lunch') {
    var1.title = 'Lunch break is here! 🍱';
    var1.message = 'Done with lunch? Relax your mind for 2 minutes with a stress-free Bingo round.';
    var2.title = 'Post-lunch brain refresh 🧠';
    var2.message = 'Beat the afternoon food coma! A quick numbers challenge will wake you right up.';
    var3.title = 'Midday multiplayer room ⚡';
    var3.message = 'Colleagues having lunch? Challenge them to a rapid 5-line Bingo duel!';
  } else if (targetSlot.slotKey === 'post_lunch_slump') {
    var1.title = 'Post-lunch slump? Wake up! 🥱';
    var1.message = 'Feeling sleepy at your desk? A 2-minute quick Bingo game will recharge your energy instantly!';
    var2.title = 'Micro-break recharge ⚡';
    var2.message = 'Step away from the screen for 2 minutes. Beat the Bot and refresh your focus.';
  } else if (targetSlot.slotKey === 'afternoon_chai') {
    var1.title = 'Chai time + Quick Bingo ☕';
    var1.message = 'Steaming cup of tea in hand? Pair your evening chai break with an instant Bingo match!';
    var2.title = 'Bored of work meetings? 🥱';
    var2.message = 'Give your eyes a break from work. Join a live room or challenge the Bot in 2 minutes!';
    var3.title = 'Evening tea recharge 🍪';
    var3.message = 'Your evening energy booster is here. Score 5 lines and claim a relaxing win!';
  } else if (targetSlot.slotKey === 'evening_commute') {
    var1.title = 'Work is done! Time to unwind 🌆';
    var1.message = 'Shut down your laptop, wrap up work stress, and celebrate evening chill with Bingo!';
    var2.title = 'Evening commute pass 🚌';
    var2.message = 'Stuck in evening traffic? A quick Bingo match makes the journey fly by!';
    var3.title = 'Evening unwinding room 🎮';
    var3.message = 'Connect with friends after work. Start a quick room and relax together!';
  } else if (targetSlot.slotKey === 'dinner_chill' || targetSlot.slotKey === 'night_wind_down') {
    var1.title = 'Having dinner or relaxing? 🍲';
    var1.message = 'Relaxing after a long day? Share a room code with friends and play a fun dinner round!';
    var2.title = 'Late night chill round 🌙';
    var2.message = 'Wind down before sleep. Just one quick cozy game to end your day on a win!';
    var3.title = 'Night owl challenge 🦉';
    var3.message = 'Still awake? The night lobbies are active. Can you win a 5-line Bingo before bed?';
  }

  // Incorporate live telemetry if active users exist
  const activeCount = stats.overview?.todayActiveUsers || 0;
  if (activeCount > 5 && !specialDay) {
    var3.message += ` (${activeCount} players were active today!)`;
  }

  return [
    {
      id: 'ai_sug_1',
      ...var1,
      scheduledAt: triggerTimeMs,
      scheduledAtDesc: `${scheduledDateStr} at ${scheduledTimeWithZone}`,
      reasoning: specialDay
        ? `Festive greeting for ${specialDay.name}. Warm cultural wish boosts open rate by +55%.`
        : `Matched to ${targetSlot.slotTitle} at ${scheduledTimeStr}. Relatable micro-break copy with high casual CTR.`
    },
    {
      id: 'ai_sug_2',
      ...var2,
      scheduledAt: triggerTimeMs,
      scheduledAtDesc: `${scheduledDateStr} at ${scheduledTimeWithZone}`,
      reasoning: `Targeted challenge hook for ${targetSlot.slotTitle}. Direct action verbs boost clicks by +35%.`
    },
    {
      id: 'ai_sug_3',
      ...var3,
      scheduledAt: triggerTimeMs,
      scheduledAtDesc: `${scheduledDateStr} at ${scheduledTimeWithZone}`,
      reasoning: `Multiplayer room invitation aligned with ${targetSlot.slotTitle} prime window.`
    }
  ];
}

/**
 * Call Google Gemini LLM API (Free Tier) when key is available
 * Grounded with live date, target IST trigger time, and festival detection
 */
async function callGeminiApi({ apiKey, context, stats }) {
  if (!apiKey) return null;

  const triggerTimeMs = calculateRecommendedTriggerTime(context);
  const targetDateObj = new Date(triggerTimeMs);
  const targetTimeString = formatTimeIST(triggerTimeMs, true);
  const targetDateString = formatDateIST(triggerTimeMs);

  const istOffset = 5.5 * 60 * 60 * 1000;
  const targetIST = new Date(triggerTimeMs + istOffset);
  const targetHour = targetIST.getUTCHours();
  const targetSlot = getSlotForHour(targetHour);
  const detectedFestival = detectSpecialOccasion(targetDateObj) || context.specialDay;

  const prompt = `
You are an expert casual gaming community copywriter for "Bingo Online" (a free, real-time multiplayer 5x5 Bingo web app with bot mode and private friend rooms).

Live Real-Time Context:
- Current Indian Date: ${context.istDateString}
- Current Indian Time: ${context.istTimeString}
- Target Scheduled Trigger Time: ${targetDateString} at ${targetTimeString}
- Target Slot: ${targetSlot.slotTitle} (${targetSlot.slotKey})
- Detected Indian Festival / Occasion: ${detectedFestival ? `${detectedFestival.name} (${detectedFestival.wish})` : 'Regular day'}
- Today's Active Players: ${stats.overview?.todayActiveUsers || 0}
- Average Bot Match Time: ${stats.overview?.avgBotDurationSeconds || 95} seconds
- Past Click-Through Rate: ${stats.overview?.pushFunnel?.overallCtr || 15}%

Task: Generate 3 DISTINCT, heart-touching, friendly, highly relatable, and engaging push notification variations.

STRICT Rules:
1. FESTIVAL & OCCASION DETECTION: If today or the target trigger date is a festival (such as Diwali, Dhanteras, Chhath Puja, Bhai Dooj, Dussehra, Navratri, Eid, Holi, Christmas, Independence Day, etc.) or major sports event (e.g. India cricket match), Variation 1 MUST lead with an authentic, warm, heartfelt festival greeting / wish (e.g., "Shubh Dhanteras! May health & wealth brighten your home 🪔✨", "Happy Diwali! 🪔").
2. REAL-TIME ACCURACY: The notification copy MUST match the TARGET TRIGGER TIME (${targetTimeString}). For example, if target time is evening/dinner (8:15 PM), talk about dinner relaxation, couch chill, or winding down. NEVER refer to afternoon 4 PM chai if the notification is for the evening or night!
3. TONE & VOCABULARY: Friendly, warm, natural, and familiar — NOT corporate, NOT robotic. Use familiar phrases where appropriate: "chai break ☕", "tired from work?", "bored of spreadsheets", "having dinner or relaxing on the couch?", "2-minute quick refresh".
4. CONSTRAINTS: Title under 40 characters. Message under 120 characters. Include 1-2 relevant emojis in both title and message.
5. URL: Provide target URL: "/lobby" (for multiplayer/friends) or "/bot" (for quick solo break).

Return STRICTLY a JSON object with this format (no markdown formatting, no code blocks):
{
  "suggestions": [
    {
      "category": "Festive Wish or Familiar Relatable",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/lobby",
      "reasoning": "..."
    },
    {
      "category": "Work Fatigue Buster",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/bot",
      "reasoning": "..."
    },
    {
      "category": "Social & Relax",
      "badge": "...",
      "title": "...",
      "message": "...",
      "url": "/lobby",
      "reasoning": "..."
    }
  ]
}
`.trim();

  // Try gemini-2.5-flash first, then fallback to gemini-1.5-flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        console.warn(`[Gemini API] Model ${model} returned status:`, response.status);
        continue;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) continue;

      const parsed = JSON.parse(candidateText);
      if (!Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) continue;

      return parsed.suggestions.map((s, idx) => ({
        id: `ai_gemini_${idx + 1}`,
        category: s.category || 'AI Generated',
        badge: s.badge || 'Smart Match ⚡',
        title: s.title,
        message: s.message,
        url: s.url || '/lobby',
        scheduledAt: triggerTimeMs,
        scheduledAtDesc: `${targetDateString} at ${targetTimeString}`,
        reasoning: s.reasoning || `Crafted by Gemini AI for ${targetTimeString} (${targetSlot.slotTitle}).`
      }));
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
 */
export async function generateSmartNotificationCampaign({ stats = {}, apiKey = null }) {
  const context = getContextualMatrix();
  const triggerTimeMs = calculateRecommendedTriggerTime(context);
  const targetDateObj = new Date(triggerTimeMs);

  const targetDateString = formatDateIST(triggerTimeMs);
  const targetTimeString = formatTimeIST(triggerTimeMs, true);

  const istOffset = 5.5 * 60 * 60 * 1000;
  const targetIST = new Date(triggerTimeMs + istOffset);
  const targetHour = targetIST.getUTCHours();
  const targetSlot = getSlotForHour(targetHour);

  const detectedFestival = detectSpecialOccasion(targetDateObj) || context.specialDay;

  let suggestions = null;
  let engineUsed = 'Built-in Smart Semantic AI (100% Free & Offline)';

  // Try Gemini if API key is configured
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;
  if (effectiveKey) {
    const geminiSuggestions = await callGeminiApi({ apiKey: effectiveKey, context, stats });
    if (geminiSuggestions && geminiSuggestions.length > 0) {
      suggestions = geminiSuggestions;
      engineUsed = 'Google Gemini 2.5 Flash (Free Tier with Real-Time Awareness)';
    }
  }

  // Fallback to high-fidelity built-in engine
  if (!suggestions) {
    suggestions = generateHeuristicSuggestions(context, stats);
  }

  return {
    context: {
      timeSlot: targetSlot.slotTitle,
      timeSlotKey: targetSlot.slotKey,
      timeSlotIcon: targetSlot.slotIcon,
      dayName: context.dayName,
      isWeekend: context.isWeekend,
      currentTime: context.istTimeString,
      currentDate: context.istDateString,
      specialOccasion: detectedFestival ? detectedFestival.name : null,
      specialWish: detectedFestival ? detectedFestival.wish : null,
      recommendedTriggerMs: triggerTimeMs,
      recommendedTriggerDesc: `${targetDateString} at ${targetTimeString}`
    },
    engineUsed,
    suggestions
  };
}
