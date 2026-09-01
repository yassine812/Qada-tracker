export interface DhikrItem {
  id: string;
  text: string;
  category: 'استغفار' | 'تسبيح' | 'دعاء الصلاة' | 'شكر وحمد' | 'ذكر عام';
  source: string;
  benefit?: string;
  recommendedCount: number;
}

export const ADHKAR_LIST: DhikrItem[] = [
  {
    id: 'dhikr-1',
    text: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، وَأَتُوبُ إِلَيْهِ',
    category: 'استغفار',
    source: 'سنن أبي داود والترمذي',
    benefit: 'مكفر للذنوب ويشرح الصدر ويجلب التوفيق في قضاء ما فات.',
    recommendedCount: 3,
  },
  {
    id: 'dhikr-2',
    text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ',
    category: 'تسبيح',
    source: 'متفق عليه',
    benefit: 'كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-3',
    text: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
    category: 'دعاء الصلاة',
    source: 'سنن أبي داود',
    benefit: 'وصية النبي ﷺ لمعاذ بن جبل دبر كل صلاة لطلب العون على الطاعة.',
    recommendedCount: 1,
  },
  {
    id: 'dhikr-4',
    text: 'رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ',
    category: 'استغفار',
    source: 'سنن أبي داود',
    benefit: 'كان النبي ﷺ يعد له في المجلس الواحد مائة مرة.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-5',
    text: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    category: 'ذكر عام',
    source: 'متفق عليه',
    benefit: 'كنز من كنوز الجنة وباب من أبواب تفريج الكرب وتيسير القضاء.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-6',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
    category: 'استغفار',
    source: 'صحيح البخاري (سيد الاستغفار)',
    benefit: 'من قالها موقناً بها حين يمسي فمات دخل الجنة، وكذلك إذا أصبح.',
    recommendedCount: 1,
  },
  {
    id: 'dhikr-7',
    text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ',
    category: 'شكر وحمد',
    source: 'صحيح مسلم',
    benefit: 'تملأ الميزان بالخيرات وتديم النعم وتشرح الفؤاد.',
    recommendedCount: 3,
  },
  {
    id: 'dhikr-8',
    text: 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    category: 'تسبيح',
    source: 'متفق عليه',
    benefit: 'حرز وأمان وأعظم ما قاله النبيون عليهم السلام.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-9',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
    category: 'ذكر عام',
    source: 'صحيح مسلم',
    benefit: 'من صلى عليّ صلاة صلى الله عليه بها عشراً وحُطت عنه عشر خطايا.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-10',
    text: 'رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ وَتُبْ عَلَيْنَا إِنَّكَ أَنتَ التَّوَّابُ الرَّحِيمُ',
    category: 'دعاء الصلاة',
    source: 'سورة البقرة',
    benefit: 'دعاء إبراهيم وإسماعيل عليهما السلام لطلب قبول العمل الصالح.',
    recommendedCount: 3,
  },
  {
    id: 'dhikr-11',
    text: 'سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    category: 'تسبيح',
    source: 'صحيح مسلم',
    benefit: 'أحب الكلام إلى الله تعالى والباقيات الصالحات.',
    recommendedCount: 10,
  },
  {
    id: 'dhikr-12',
    text: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ',
    category: 'دعاء الصلاة',
    source: 'المستدرك للترمذي والنسائي',
    benefit: 'دعاء الكرب وإصلاح الحال والتوفيق في العبادة.',
    recommendedCount: 3,
  },
];

/**
 * Gets a deterministic daily dhikr based on current calendar date (YYYY-MM-DD)
 */
export function getDailyDhikr(): DhikrItem {
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = Math.abs(dateSeed) % ADHKAR_LIST.length;
  return ADHKAR_LIST[index];
}

/**
 * Gets a random dhikr item different from current index
 */
export function getRandomDhikr(currentId?: string): DhikrItem {
  const available = ADHKAR_LIST.filter((d) => d.id !== currentId);
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex] || ADHKAR_LIST[0];
}
