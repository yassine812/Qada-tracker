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

import { AdhkarCategory, AdhkarItem } from '../types';

/**
 * ════════════════════════════════════════════════════════════════
 * VERIFIED ADHKAR COLLECTIONS (أذكار الصباح / المساء / النوم)
 *
 * Religious integrity policy:
 *  - Quranic text and hadith wording are reproduced EXACTLY as they
 *    appear in verified, published sources. Nothing is paraphrased.
 *  - Repetition counts and source references follow the widely
 *    published "Hisn al-Muslim" (حصن المسلم) codification.
 *  - No text here is AI-generated. Any future addition must be
 *    sourced from a verified reference.
 * ════════════════════════════════════════════════════════════════
 */

const QURAN_SOURCE = 'القرآن الكريم';

// ─── Shared Quranic verses used across collections ────────────────
const AYAT_AL_KURSI =
  'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ، لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ، لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ، مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ، يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ، وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ، وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ، وَلَا يَئُودُهُ حِفْظُهُمَا، وَهُوَ الْعَلِيُّ الْعَظِيمُ';

const SURAT_AL_IKHLAS =
  'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ';

const SURAT_AL_FALAQ =
  'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ، وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ، وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ';

const SURAT_AN_NAS =
  'قُلْ أَعُوذُ بِرَبِّ النَّاسِ، مَلِكِ النَّاسِ، إِلَٰهِ النَّاسِ، مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ، الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ، مِنَ الْجِنَّةِ وَالنَّاسِ';

const AAYAT_BAQARAH_LAST =
  'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ، كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ، لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ، وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ، لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا، لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ، رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا، رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا، رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ، وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا، أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ';

const SAYYID_AL_ISTIGHFAR =
  'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي، فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ';

const RADITU = 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا';

const BISMILLAH_ALADHI = 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ، وَهُوَ السَّمِيعُ الْعَلِيمُ';

const HASBIYALLAH =
  'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ، وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ';

const ALLAHUMMA_AFINI =
  'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَٰهَ إِلَّا أَنْتَ، اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَٰهَ إِلَّا أَنْتَ';

const SUBHANALLAH_WA_BIHAMDIH = 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ';

const LA_ILAHA_ILLALLAH =
  'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ';

const A_UDHU_BIKALIMAT =
  'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ';

export const ADHKAR_ITEMS: AdhkarItem[] = [
  // ──────────────────────────────────────────────────────────────
  // أَذْكَارُ الصَّبَاحِ (Morning)
  // ──────────────────────────────────────────────────────────────
  {
    id: 'morning-1',
    category: 'morning',
    title: 'آية الكرسي',
    arabicText: AYAT_AL_KURSI,
    repetitions: 1,
    source: QURAN_SOURCE,
    sourceReference: 'سورة البقرة: 255',
    sourceInfo: 'قراءة قرآنية ثابتة. وردت آثار عن قراءتها صباحًا ومساءً وعند النوم، وفي صحيح البخاري أنها حِفظ من الشيطان لمن قرأها عند منامه.',
    isQuran: true,
  },
  {
    id: 'morning-2',
    category: 'morning',
    title: 'سورة الإخلاص',
    arabicText: SURAT_AL_IKHLAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الإخلاص: 1-4',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'morning-3',
    category: 'morning',
    title: 'سورة الفلق',
    arabicText: SURAT_AL_FALAQ,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الفلق: 1-5',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'morning-4',
    category: 'morning',
    title: 'سورة الناس',
    arabicText: SURAT_AN_NAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الناس: 1-6',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'morning-5',
    category: 'morning',
    title: 'أصبحنا وأصبح الملك لله',
    arabicText:
      'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    repetitions: 1,
    source: 'صحيح مسلم',
    sourceReference: 'كتاب الذكر والدعاء',
    sourceInfo: 'ذكر جامع يُفتتح به اليوم؛ من ثم يأتي نظيره مساءً بصيغة «أمسينا وأمسى الملك لله».',
  },
  {
    id: 'morning-6',
    category: 'morning',
    title: 'اللهم بك أصبحنا',
    arabicText:
      'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
    repetitions: 1,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'إقرار بأن حياة العبد ومماته بيد الله تعالى وحده.',
  },
  {
    id: 'morning-7',
    category: 'morning',
    title: 'سيد الاستغفار',
    arabicText: SAYYID_AL_ISTIGHFAR,
    repetitions: 1,
    source: 'صحيح البخاري',
    sourceReference: 'حديث شَدَّاد بن أوس، رقم 6306',
    sourceInfo: 'قال النبي ﷺ: «من قالها موقنًا بها حين يمسي فمات، دخل الجنة، وكذلك إذا أصبح» — أخرجه البخاري.',
  },
  {
    id: 'morning-8',
    category: 'morning',
    title: 'رضيت بالله ربًا',
    arabicText: RADITU,
    repetitions: 3,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'من قالها حين يصبح وحين يمسي ثلاثًا كان حقًا على الله أن يرضيه يوم القيامة.',
  },
  {
    id: 'morning-9',
    category: 'morning',
    title: 'بسم الله الذي لا يضر',
    arabicText: BISMILLAH_ALADHI,
    repetitions: 3,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'من قالها ثلاث مرات صباحًا ومساءً: «لم يضره شيء» بإذن الله. أخرجه أبو داود والترمذي.',
  },
  {
    id: 'morning-10',
    category: 'morning',
    title: 'حسبي الله',
    arabicText: HASBIYALLAH,
    repetitions: 7,
    source: 'سنن أبي داود',
    sourceReference: 'رقم 5081',
    sourceInfo: 'من قالها حين يصبح وحين يمسي سبع مرات: «كفاه الله ما أهمه» — أخرجه أبو داود.',
  },
  {
    id: 'morning-11',
    category: 'morning',
    title: 'اللهم عافني في بدني',
    arabicText: ALLAHUMMA_AFINI,
    repetitions: 3,
    source: 'سنن أبي داود',
    sourceReference: 'رقم 5090',
    sourceInfo: 'طلب العافية في البدن والسمع والبصر والتعوذ من الكفر والفقر وعذاب القبر — ثلاث مرات صباحًا ومساءً.',
  },
  {
    id: 'morning-12',
    category: 'morning',
    title: 'سبحان الله وبحمده',
    arabicText: SUBHANALLAH_WA_BIHAMDIH,
    repetitions: 100,
    source: 'صحيح مسلم',
    sourceReference: 'رقم 2692',
    sourceInfo: '«من قال حين يصبح وحين يمسي: سبحان الله وبحمده مائة مرة، لم يأت أحد يوم القيامة بأفضل مما جاء به، إلا أحد قال مثل ما قال أو زاد عليه» — رواه مسلم.',
  },
  // ──────────────────────────────────────────────────────────────
  // أَذْكَارُ الْمَسَاءِ (Evening)
  // ──────────────────────────────────────────────────────────────
  {
    id: 'evening-1',
    category: 'evening',
    title: 'آية الكرسي',
    arabicText: AYAT_AL_KURSI,
    repetitions: 1,
    source: QURAN_SOURCE,
    sourceReference: 'سورة البقرة: 255',
    sourceInfo: 'قراءة قرآنية ثابتة. وردت آثار عن قراءتها صباحًا ومساءً وعند النوم، وفي صحيح البخاري أنها حِفظ من الشيطان لمن قرأها عند منامه.',
    isQuran: true,
  },
  {
    id: 'evening-2',
    category: 'evening',
    title: 'سورة الإخلاص',
    arabicText: SURAT_AL_IKHLAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الإخلاص: 1-4',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'evening-3',
    category: 'evening',
    title: 'سورة الفلق',
    arabicText: SURAT_AL_FALAQ,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الفلق: 1-5',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'evening-4',
    category: 'evening',
    title: 'سورة الناس',
    arabicText: SURAT_AN_NAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الناس: 1-6',
    sourceInfo: 'حديث عبد الله بن خُبيب: «قل: قل هو اللَّه أحد، والمعوذتين حين تمسي وحين تصبح ثلاث مرات، تكفيك من كل شيء» — أخرجه أبو داود والترمذي.',
    isQuran: true,
  },
  {
    id: 'evening-5',
    category: 'evening',
    title: 'أمسينا وأمسى الملك لله',
    arabicText:
      'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذِهِ اللَّيْلَةِ وَخَيْرَ مَا بَعْدَهَا، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذِهِ اللَّيْلَةِ وَشَرِّ مَا بَعْدَهَا، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ',
    repetitions: 1,
    source: 'صحيح مسلم',
    sourceReference: 'كتاب الذكر والدعاء',
    sourceInfo: 'ذكر جامع يُختم به اليوم؛ نظير ذكر الصباح بصيغة «أصبحنا وأصبح الملك لله».',
  },
  {
    id: 'evening-6',
    category: 'evening',
    title: 'اللهم بك أمسينا',
    arabicText:
      'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
    repetitions: 1,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'إقرار بأن حياة العبد ومماته بيد الله تعالى وحده، وأن إليه المصير.',
  },
  {
    id: 'evening-7',
    category: 'evening',
    title: 'سيد الاستغفار',
    arabicText: SAYYID_AL_ISTIGHFAR,
    repetitions: 1,
    source: 'صحيح البخاري',
    sourceReference: 'حديث شَدَّاد بن أوس، رقم 6306',
    sourceInfo: 'قال النبي ﷺ: «من قالها موقنًا بها حين يمسي فمات، دخل الجنة، وكذلك إذا أصبح» — أخرجه البخاري.',
  },
  {
    id: 'evening-8',
    category: 'evening',
    title: 'رضيت بالله ربًا',
    arabicText: RADITU,
    repetitions: 3,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'من قالها حين يصبح وحين يمسي ثلاثًا كان حقًا على الله أن يرضيه يوم القيامة.',
  },
  {
    id: 'evening-9',
    category: 'evening',
    title: 'بسم الله الذي لا يضر',
    arabicText: BISMILLAH_ALADHI,
    repetitions: 3,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار الصباح والمساء',
    sourceInfo: 'من قالها ثلاث مرات صباحًا ومساءً: «لم يضره شيء» بإذن الله. أخرجه أبو داود والترمذي.',
  },
  {
    id: 'evening-10',
    category: 'evening',
    title: 'أعوذ بكلمات الله التامات',
    arabicText: A_UDHU_BIKALIMAT,
    repetitions: 3,
    source: 'صحيح مسلم',
    sourceReference: 'رقم 2708',
    sourceInfo: 'من قالها حين يمسي ثلاث مرات لم تضره حَيَّةُ تلك الليلة — أخرجه مسلم.',
  },
  {
    id: 'evening-11',
    category: 'evening',
    title: 'حسبي الله',
    arabicText: HASBIYALLAH,
    repetitions: 7,
    source: 'سنن أبي داود',
    sourceReference: 'رقم 5081',
    sourceInfo: 'من قالها حين يصبح وحين يمسي سبع مرات: «كفاه الله ما أهمه» — أخرجه أبو داود.',
  },
  {
    id: 'evening-12',
    category: 'evening',
    title: 'اللهم عافني في بدني',
    arabicText: ALLAHUMMA_AFINI,
    repetitions: 3,
    source: 'سنن أبي داود',
    sourceReference: 'رقم 5090',
    sourceInfo: 'طلب العافية في البدن والسمع والبصر والتعوذ من الكفر والفقر وعذاب القبر — ثلاث مرات صباحًا ومساءً.',
  },
  {
    id: 'evening-13',
    category: 'evening',
    title: 'سبحان الله وبحمده',
    arabicText: SUBHANALLAH_WA_BIHAMDIH,
    repetitions: 100,
    source: 'صحيح مسلم',
    sourceReference: 'رقم 2692',
    sourceInfo: '«من قال حين يصبح وحين يمسي: سبحان الله وبحمده مائة مرة، لم يأت أحد يوم القيامة بأفضل مما جاء به، إلا أحد قال مثل ما قال أو زاد عليه» — رواه مسلم.',
  },
  {
    id: 'evening-14',
    category: 'evening',
    title: 'لا إله إلا الله وحده',
    arabicText: LA_ILAHA_ILLALLAH,
    repetitions: 100,
    source: 'متفق عليه',
    sourceReference: 'صحيح البخاري 3293 ومسلم 2691',
    sourceInfo: '«من قالها مائة مرة كانت له عِدْل عشر رقاب، وكتبت له مائة حسنة، ومُحيت عنه مائة سيئة، وكانت له حِرزًا من الشيطان يومه ذلك» — رواه البخاري ومسلم.',
  },
  // ──────────────────────────────────────────────────────────────
  // أَذْكَارُ النَّوْمِ (Sleep)
  // ──────────────────────────────────────────────────────────────
  {
    id: 'sleep-1',
    category: 'sleep',
    title: 'آية الكرسي',
    arabicText: AYAT_AL_KURSI,
    repetitions: 1,
    source: QURAN_SOURCE,
    sourceReference: 'سورة البقرة: 255',
    sourceInfo: '«من قرأ آية الكرسي عند منامه لم يزل عليه من الله حافظ، ولا يقربه شيطان حتى يصبح» — صحيح البخاري.',
    isQuran: true,
  },
  {
    id: 'sleep-2',
    category: 'sleep',
    title: 'سورة الإخلاص',
    arabicText: SURAT_AL_IKHLAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الإخلاص: 1-4',
    sourceInfo: 'كان النبي ﷺ إذا أوى إلى فراشه جمع كفيه وقرأ فيهما الإخلاص والمعوذتين، ثم نفث فيهما ومسح بهما جسده ثلاث مرات — صحيح البخاري برقم 5017 ومسلم برقم 2192.',
    isQuran: true,
  },
  {
    id: 'sleep-3',
    category: 'sleep',
    title: 'سورة الفلق',
    arabicText: SURAT_AL_FALAQ,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الفلق: 1-5',
    sourceInfo: 'كان النبي ﷺ إذا أوى إلى فراشه جمع كفيه وقرأ فيهما الإخلاص والمعوذتين، ثم نفث فيهما ومسح بهما جسده ثلاث مرات — صحيح البخاري برقم 5017 ومسلم برقم 2192.',
    isQuran: true,
  },
  {
    id: 'sleep-4',
    category: 'sleep',
    title: 'سورة الناس',
    arabicText: SURAT_AN_NAS,
    repetitions: 3,
    source: QURAN_SOURCE,
    sourceReference: 'سورة الناس: 1-6',
    sourceInfo: 'كان النبي ﷺ إذا أوى إلى فراشه جمع كفيه وقرأ فيهما الإخلاص والمعوذتين، ثم نفث فيهما ومسح بهما جسده ثلاث مرات — صحيح البخاري برقم 5017 ومسلم برقم 2192.',
    isQuran: true,
  },
  {
    id: 'sleep-5',
    category: 'sleep',
    title: 'آخر آيتين من سورة البقرة',
    arabicText: AAYAT_BAQARAH_LAST,
    repetitions: 1,
    source: QURAN_SOURCE,
    sourceReference: 'سورة البقرة: 285-286',
    sourceInfo: '«من قرأ بهما في ليلة كفتاه» — صحيح البخاري برقم 5009.',
    isQuran: true,
  },
  {
    id: 'sleep-6',
    category: 'sleep',
    title: 'باسمك ربي وضعت جنبي',
    arabicText:
      'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، اللَّهُمَّ إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    repetitions: 1,
    source: 'متفق عليه',
    sourceReference: 'صحيح البخاري ومسلم',
    sourceInfo: 'ورد في الصحيحين من حديث أبي هريرة عند ما يأوي إلى فراشه، وينفض فراشه ثلاثًا قبلها.',
  },
  {
    id: 'sleep-7',
    category: 'sleep',
    title: 'اللهم أسلمت نفسي إليك',
    arabicText:
      'اللَّهُمَّ أَسْلَمْتُ نَفْسِي إِلَيْكَ، وَفَوَّضْتُ أَمْرِي إِلَيْكَ، وَوَجَّهْتُ وَجْهِي إِلَيْكَ، وَأَلْجَأْتُ ظَهْرِي إِلَيْكَ، رَغْبَةً وَرَهْبَةً إِلَيْكَ، لَا مَلْجَأَ وَلَا مَنْجَى مِنْكَ إِلَّا إِلَيْكَ، آمَنْتُ بِكِتَابِكَ الَّذِي أَنْزَلْتَ، وَبِنَبِيِّكَ الَّذِي أَرْسَلْتَ',
    repetitions: 1,
    source: 'متفق عليه',
    sourceReference: 'صحيح البخاري 6313 ومسلم 2710',
    sourceInfo: 'قال النبي ﷺ: «من قالها فمات من ليلته مات على الفطرة» — أخرجه البخاري ومسلم.',
  },
  {
    id: 'sleep-8',
    category: 'sleep',
    title: 'اللهم قني عذابك',
    arabicText: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
    repetitions: 3,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار النوم',
    sourceInfo: 'كان النبي ﷺ إذا نام وضع يده اليمنى تحت خده وقالها، وفي رواية يستحب ذكرها ثلاث مرات.',
  },
  {
    id: 'sleep-9',
    category: 'sleep',
    title: 'باسمك اللهم أموت وأحيا',
    arabicText: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
    repetitions: 1,
    source: 'صحيح البخاري',
    sourceReference: 'أذكار النوم',
    sourceInfo: 'من حديث حذيفة بن اليمان: كان النبي ﷺ إذا أراد أن ينام قالها — أخرجه البخاري.',
  },
  {
    id: 'sleep-10',
    category: 'sleep',
    title: 'اللهم أنت خلقت نفسي',
    arabicText:
      'اللَّهُمَّ أَنْتَ خَلَقْتَ نَفْسِي وَأَنْتَ تَوَفَّاهَا، لَكَ مَمَاتُهَا وَمَحْيَاهَا، إِنْ أَحْيَيْتَهَا فَاحْفَظْهَا، وَإِنْ أَمَتَّهَا فَاغْفِرْ لَهَا، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَافِيَةَ',
    repetitions: 1,
    source: 'صحيح مسلم',
    sourceReference: 'أذكار النوم',
    sourceInfo: 'من أذكار النوم المأثورة عن النبي ﷺ — أخرجه مسلم.',
  },
  {
    id: 'sleep-11',
    category: 'sleep',
    title: 'الحمد لله الذي أطعمنا',
    arabicText:
      'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَكَفَانَا وَآوَانَا، فَكَمْ مِمَّنْ لَا كَافِيَ لَهُ وَلَا مُؤْوِيَ',
    repetitions: 1,
    source: 'صحيح مسلم',
    sourceReference: 'أذكار النوم',
    sourceInfo: 'من أذكار النوم المأثورة عن النبي ﷺ — أخرجه مسلم.',
  },
  {
    id: 'sleep-12',
    category: 'sleep',
    title: 'الكلمات التامات من غضبه',
    arabicText:
      'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ غَضَبِهِ وَعِقَابِهِ، وَشَرِّ عِبَادِهِ، وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ',
    repetitions: 1,
    source: 'سنن أبي داود والترمذي',
    sourceReference: 'أذكار النوم',
    sourceInfo: 'التعوذ عند الفزع أو النوم لدفع شر الشياطين وهَمزاتهم — أخرجه أبو داود، وأصله في صحيح مسلم.',
  },
];

export const ADHKAR_CATEGORY_LIST: { category: AdhkarCategory; title: string; description: string; icon: string }[] = [
  { category: 'morning', title: 'أذكار الصباح', description: 'أذكار تبدأ بها يومك', icon: '🌅' },
  { category: 'evening', title: 'أذكار المساء', description: 'أذكار تختم بها يومك', icon: '🌇' },
  { category: 'sleep', title: 'أذكار النوم', description: 'أذكار قبل النوم', icon: '🌙' },
];

export function getAdhkarItems(category: AdhkarCategory): AdhkarItem[] {
  return ADHKAR_ITEMS.filter((i) => i.category === category);
}

export function getAdhkarItemById(id: string): AdhkarItem | undefined {
  return ADHKAR_ITEMS.find((i) => i.id === id);
}

/**
 * Search across all adhkar by Arabic text, title, category or source.
 * Matches are trimmed, case-insensitive, and transliteration-of-diacritics tolerant.
 */
export function searchAdhkar(query: string): AdhkarItem[] {
  const q = query.trim().replace(/[\u064B-\u0652\u0670]/g, '').toLowerCase();
  if (!q) return [];
  return ADHKAR_ITEMS.filter((item) => {
    const text = item.arabicText.replace(/[\u064B-\u0652\u0670]/g, '').toLowerCase();
    const title = item.title.replace(/[\u064B-\u0652\u0670]/g, '').toLowerCase();
    const source = item.source.toLowerCase();
    const reference = item.sourceReference.toLowerCase();
    const categoryLabel = ADHKAR_CATEGORY_LIST.find((c) => c.category === item.category)?.title || '';
    return text.includes(q) || title.includes(q) || source.includes(q) || reference.includes(q) || categoryLabel.includes(q);
  });
}

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
