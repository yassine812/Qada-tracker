/**
 * Verified Islamic Names Database for Qada.
 * Strictly adheres to verified Qur'anic text, Prophet references, and Companion history.
 * Never hallucinated or invented.
 * Ayah numbers use Western numerals (1, 2, 3...) per application convention.
 */

export interface QuranicVerse {
  text: string;
  surahName: string;
  ayahRef: string;
}

export interface IslamicNameData {
  canonicalName: string;
  aliases: string[];
  type: 'quranic' | 'prophet' | 'companion' | 'general';
  welcomeLead?: string;
  connection?: string;
  verse?: QuranicVerse;
  closingDua: string;
}

export interface WelcomeResult {
  displayName: string;
  type: 'quranic' | 'prophet' | 'companion' | 'general';
  welcomeTitle: string;
  welcomeLead: string;
  connection?: string;
  verse?: QuranicVerse;
  closingDua: string;
}

export const ISLAMIC_NAMES_DATABASE: IslamicNameData[] = [
  // 1. ياسين / يس
  {
    canonicalName: 'ياسين',
    aliases: ['يس', 'ياسين', 'ياسيـن'],
    type: 'quranic',
    welcomeLead: 'ياسين، اسمٌ يحمل صدىً من كتاب الله.',
    connection: 'فقد افتُتحت به سورة يس المباركة:',
    verse: {
      text: 'يس 1 وَالْقُرْآنِ الْحَكِيمِ 2',
      surahName: 'سورة يس',
      ayahRef: 'الآيتان 1–2',
    },
    closingDua: 'نسأل الله أن يجعل هذه الرحلة بدايةً جميلة للعودة إليه، خطوةً بخطوة.',
  },

  // 2. محمد
  {
    canonicalName: 'محمد',
    aliases: ['محمد', 'محمّد', 'المحمد'],
    type: 'prophet',
    welcomeLead: 'محمد، اسمُ خاتم الأنبياء وإمام المرسلين نبينا محمد ﷺ.',
    connection: 'الذي أرسله ربه رحمةً للعالمين وهاديًا وسراجًا منيرًا.',
    verse: {
      text: 'مُّحَمَّدٌ رَّسُولُ اللَّهِ 29',
      surahName: 'سورة الفتح',
      ayahRef: 'الآية 29',
    },
    closingDua: 'نسأل الله أن يجعل لك من هديه وخلقه وشفاعته نصيبًا طيبًا في مسيرتك.',
  },

  // 3. أحمد
  {
    canonicalName: 'أحمد',
    aliases: ['احمد', 'أحمد'],
    type: 'prophet',
    welcomeLead: 'أحمد، اسمٌ من أسماء المصطفى ﷺ ذكره الله في كتابه.',
    verse: {
      text: 'وَمُبَشِّرًا بِرَسُولٍ يَأْتِي مِن بَعْدِي اسْمُهُ أَحْمَدُ 6',
      surahName: 'سورة الصف',
      ayahRef: 'الآية 6',
    },
    closingDua: 'نسأل الله أن يجعل أيامك عامرةً بالحمد، وأن يرزقك التوفيق في كل خطوة.',
  },

  // 4. إبراهيم
  {
    canonicalName: 'إبراهيم',
    aliases: ['ابراهيم', 'إبراهيم', 'ابراهام'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبيٍ كريم ذكره الله في كتابه، خليل الرحمن إبراهيم عليه السلام.',
    connection: 'إمام الحنفاء، والداعي ربه بإقامة الصلاة واليقين.',
    verse: {
      text: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي 40',
      surahName: 'سورة إبراهيم',
      ayahRef: 'الآية 40',
    },
    closingDua: 'نسأل الله أن يجعل لك في رحلتك من الثبات واليقين وإقامة الصلاة نصيبًا.',
  },

  // 5. عمر
  {
    canonicalName: 'عمر',
    aliases: ['عمر', 'عمرو', 'الفاروق'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بعمر بن الخطاب رضي الله عنه، أحد أعلام الصحابة والخلفاء الراشدين.',
    closingDua: 'نسأل الله أن يجعل لك في طريقك أثرًا طيبًا، وهمّةً صادقة في طاعته.',
  },

  // 6. علي
  {
    canonicalName: 'علي',
    aliases: ['علي', 'على', 'المرتضى'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بأمير المؤمنين علي بن أبي طالب رضي الله عنه، رابع الخلفاء الراشدين وباب مدينة العلم.',
    closingDua: 'نسأل الله أن ينير بصيرتك، ويرزقك ثباتًا وشجاعةً في طاعته وإقبالًا على رضاه.',
  },

  // 7. عثمان
  {
    canonicalName: 'عثمان',
    aliases: ['عثمان', 'ذو النورين'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بذي النورين عثمان بن عفان رضي الله عنه، جامع المصحف الشريف وصاحب الحياء والجود.',
    closingDua: 'نسأل الله أن يرزقك السكينة، وأن يجعل القرآن العظيم نورًا لقلبك وطريقك.',
  },

  // 8. أبو بكر
  {
    canonicalName: 'أبو بكر',
    aliases: ['ابو بكر', 'أبو بكر', 'ابوبكر', 'أبوبكر', 'الصديق'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بالصديق الأكبر عبد الله بن أبي قحافة رضي الله عنه، صاحب رسول الله ﷺ ورفيقه في الغار.',
    closingDua: 'نسأل الله أن يرزقك صدق اليقين، والسبق الدائم إلى كل خير وبر.',
  },

  // 9. مريم
  {
    canonicalName: 'مريم',
    aliases: ['مريم', 'مريام'],
    type: 'quranic',
    welcomeLead: 'مريم، اسمٌ طيب لسيدةٍ اصطفاها الله وطهرها وخَصَّها بسورة كاملة في القرآن الكريم.',
    connection: 'رمز العفة والعبادة والقنوت الخالص لله تعالى:',
    verse: {
      text: 'يَا مَرْيَمُ اقْنُتِي لِرَبِّكِ وَاسْجُدِي وَارْكَعِي مَعَ الرَّاكِعِينَ 43',
      surahName: 'سورة آل عمران',
      ayahRef: 'الآية 43',
    },
    closingDua: 'نسأل الله أن يفيض عليكِ من السكينة والطهارة، وحسن القنوت والإقبال عليه.',
  },

  // 10. يوسف
  {
    canonicalName: 'يوسف',
    aliases: ['يوسف', 'جوزيف'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله يوسف الصديق عليه السلام، وصاحب أحسن القصص في كتاب الله.',
    connection: 'الذي ضرب أروع الأمثلة في الصبر على البلاء والاعتصام برحمة الله.',
    verse: {
      text: 'إِنَّهُ مَن يَتَّقِ وَيَصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ 90',
      surahName: 'سورة يوسف',
      ayahRef: 'الآية 90',
    },
    closingDua: 'نسأل الله أن يرزقك الصبر الجميل، وأن يبدل كل مشقةٍ في مسيرتك يسرًا.',
  },

  // 11. موسى
  {
    canonicalName: 'موسى',
    aliases: ['موسى', 'موسي'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بكليم الله موسى عليه السلام، ذكره الله مرارًا في محكم تنزيله.',
    connection: 'نبي الصدع بالحق والتوكل العظيم على الله:',
    verse: {
      text: 'وَأَقِمِ الصَّلَاةَ لِذِكْرِي 14',
      surahName: 'سورة طه',
      ayahRef: 'الآية 14',
    },
    closingDua: 'نسأل الله أن يشرح صدرك، وييسر أمرك، وينير دربك بأنوار هدايته.',
  },

  // 12. عيسى
  {
    canonicalName: 'عيسى',
    aliases: ['عيسى', 'عيسي', 'المسيح'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله وكلمته وروحه عيسى ابن مريم عليه السلام.',
    connection: 'وجيهًا في الدنيا والآخرة ومن المقربين:',
    verse: {
      text: 'وَأَوْصَانِي بِالصَّلَاةِ وَالزَّكَاةِ مَا دُمْتُ حَيًّا 31',
      surahName: 'سورة مريم',
      ayahRef: 'الآية 31',
    },
    closingDua: 'نسأل الله أن يجعلك مباركًا أينما كنت، مقبلًا على طاعته ورضوانه.',
  },

  // 13. طه
  {
    canonicalName: 'طه',
    aliases: ['طه', 'طـه'],
    type: 'quranic',
    welcomeLead: 'طه، اسمٌ استفتحت به سورة كريمة تنزلت بالبشرى وتثبيت فؤاد النبي ﷺ.',
    verse: {
      text: 'طه 1 مَا أَنزَلْنَا عَلَيْكَ الْقُرْآنَ لِتَشْقَىٰ 2',
      surahName: 'سورة طه',
      ayahRef: 'الآيتان 1–2',
    },
    closingDua: 'نسأل الله أن يجعل القرآن ربيع قلبك، وأن يرفع عنك المشقة في طاعته.',
  },

  // 14. يونس
  {
    canonicalName: 'يونس',
    aliases: ['يونس', 'ذا النون'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله يونس عليه السلام، صاحب التسبيح والرجوع المستجاب.',
    verse: {
      text: 'لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ 87',
      surahName: 'سورة الأنبياء',
      ayahRef: 'الآية 87',
    },
    closingDua: 'نسأل الله أن يفرّج همك، وأن يجعل لسانك رطبًا بذكره وحسن الإنابة إليه.',
  },

  // 15. أيوب
  {
    canonicalName: 'أيوب',
    aliases: ['ايوب', 'أيوب'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله أيوب عليه السلام، المثل الأعلى في الصبر وعظيم اللجوء إلى الله.',
    verse: {
      text: 'أَنِّي مَسَّنِيَ الضُّرُّ وَأَنتَ أَرْحَمُ الرَّاحِمِينَ 83',
      surahName: 'سورة الأنبياء',
      ayahRef: 'الآية 83',
    },
    closingDua: 'نسأل الله أن يثبتك على الصبر، وأن يكتب لك القبول وتمام العافية.',
  },

  // 16. داود
  {
    canonicalName: 'داود',
    aliases: ['داود', 'داوود'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله داود عليه السلام، الذي آتاه الله الحكمة وكان عبدًا أوّابًا مسبحًا.',
    verse: {
      text: 'وَاذْكُرْ عَبْدَنَا دَاوُودَ ذَا الْأَيْدِ إِنَّهُ أَوَّابٌ 17',
      surahName: 'سورة ص',
      ayahRef: 'الآية 17',
    },
    closingDua: 'نسأل الله أن يرزقك قلبًا خاشعًا أوّابًا، مقبلًا على ذكره وشكره.',
  },

  // 17. سليمان
  {
    canonicalName: 'سليمان',
    aliases: ['سليمان', 'سليمن'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله سليمان عليه السلام، الذي آتاه الله الملك وسأله شكر النعمة الخالص.',
    verse: {
      text: 'رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ 19',
      surahName: 'سورة النمل',
      ayahRef: 'الآية 19',
    },
    closingDua: 'نسأل الله أن يرزقك دوام شكر نعمه، والتوفيق لما يحب ويرضى.',
  },

  // 18. زكريا
  {
    canonicalName: 'زكريا',
    aliases: ['زكريا', 'زكرياء'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله زكريا عليه السلام، صاحب الدعاء الخفي والرجاء الصادق بمولاه.',
    verse: {
      text: 'إِذْ نَادَىٰ رَبَّهُ نِدَاءً خَفِيًّا 3',
      surahName: 'سورة مريم',
      ayahRef: 'الآية 3',
    },
    closingDua: 'نسأل الله ألا يجعلك بدعائه شقيًا، وأن يبلّغك مرادك في رضوانه وطاعته.',
  },

  // 19. يحيى
  {
    canonicalName: 'يحيى',
    aliases: ['يحيى', 'يحيي'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله يحيى عليه السلام، الذي سمّاه الله وآتاه الحكمة والقوة في دينه.',
    verse: {
      text: 'يَا يَحْيَىٰ خُذِ الْكِتَابَ بِقُوَّةٍ 12',
      surahName: 'سورة مريم',
      ayahRef: 'الآية 12',
    },
    closingDua: 'نسأل الله أن يؤتيك القوة والعزيمة في أداء الطاعات، والحرص على ما يقرّبك إليه.',
  },

  // 20. إسماعيل
  {
    canonicalName: 'إسماعيل',
    aliases: ['اسماعيل', 'إسماعيل'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله إسماعيل عليه السلام، الصادق الوعد الذي كان يأمر أهله بالصلاة والزكاة.',
    verse: {
      text: 'وَكَانَ يَأْمُرُ أَهْلَهُ بِالصَّلَاةِ وَالزَّكَاةِ وَكَانَ عِندَ رَبِّهِ مَرْضِيًّا 55',
      surahName: 'سورة مريم',
      ayahRef: 'الآية 55',
    },
    closingDua: 'نسأل الله أن يجعلك عند ربك مرضيًا، ومقيمًا لصلاتك في كل حين.',
  },

  // 21. إسحاق
  {
    canonicalName: 'إسحاق',
    aliases: ['اسحاق', 'إسحاق'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله إسحاق عليه السلام، من خيرة عباد الله الصالحين ذوي القوة والأبصار.',
    verse: {
      text: 'وَبَشَّرْنَاهُ بِإِسْحَاقَ نَبِيًّا مِّنَ الصَّالِحِينَ 112',
      surahName: 'سورة الصافات',
      ayahRef: 'الآية 112',
    },
    closingDua: 'نسأل الله أن يكتب لك البشرى في مسيرتك، وأن يلحقك بعباده الصالحين.',
  },

  // 22. يعقوب
  {
    canonicalName: 'يعقوب',
    aliases: ['يعقوب', 'إسرائيل'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله يعقوب عليه السلام، إمام الصابرين والمفوّضين أمرهم إلى الله.',
    verse: {
      text: 'إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ 86',
      surahName: 'سورة يوسف',
      ayahRef: 'الآية 86',
    },
    closingDua: 'نسأل الله أن يلهمك الصبر واليقين، وأن يجعل رجاءك معلقًا به سبحانه وحده.',
  },

  // 23. هارون
  {
    canonicalName: 'هارون',
    aliases: ['هارون', 'هرون'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله هارون عليه السلام، أخي موسى ووزيره في نصرة الحق والدعوة.',
    verse: {
      text: 'وَوَهَبْنَا لَهُ مِن رَّحْمَتِنَا أَخَاهُ هَارُونَ نَبِيًّا 53',
      surahName: 'سورة مريم',
      ayahRef: 'الآية 53',
    },
    closingDua: 'نسأل الله أن يشدّ أزرك بالصالحين، وأن يجعل مسعاك محفوفًا بالرحمة والتوفيق.',
  },

  // 24. نوح
  {
    canonicalName: 'نوح',
    aliases: ['نوح'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بشيخ المرسلين نبي الله نوح عليه السلام، الذي امتدحه ربه بالعبودية والشكر.',
    verse: {
      text: 'إِنَّهُ كَانَ عَبْدًا شَكُورًا 3',
      surahName: 'سورة الإسراء',
      ayahRef: 'الآية 3',
    },
    closingDua: 'نسأل الله أن يرزقك ثبات الأنبياء، وأن يجعلك من عباده الشاكرين في كل حال.',
  },

  // 25. آدم
  {
    canonicalName: 'آدم',
    aliases: ['ادم', 'آدم'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بأبي البشر ونبي الله آدم عليه السلام، الذي تلقّى من ربه كلمات التوبة والإنابة.',
    verse: {
      text: 'فَتَلَقَّىٰ آدَمُ مِن رَّبِّهِ كَلِمَاتٍ فَتَابَ عَلَيْهِ 37',
      surahName: 'سورة البقرة',
      ayahRef: 'الآية 37',
    },
    closingDua: 'نسأل الله أن يفتح لك أبواب عفوه وقبوله، ويجعل هذه الرحلة مستهلّ عودةٍ صادقة إليه.',
  },

  // 26. صالح
  {
    canonicalName: 'صالح',
    aliases: ['صالح'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله صالح عليه السلام، ويحمل في لغتنا معنى الصلاح والاستقامة.',
    closingDua: 'نسأل الله أن يجعل لك من اسمك نصيبًا وافرًا في الصلاح والتقى والعمل المقبول.',
  },

  // 27. شعيب
  {
    canonicalName: 'شعيب',
    aliases: ['شعيب'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله شعيب عليه السلام، خطيب الأنبياء والداعي إلى الإصلاح بالتوكل على الله.',
    verse: {
      text: 'إِنْ أُرِيدُ إِلَّا الْإِصْلَاحَ مَا اسْتَطَعْتُ وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ 88',
      surahName: 'سورة هود',
      ayahRef: 'الآية 88',
    },
    closingDua: 'نسأل الله أن يوفقك في طريق إصلاح نفسك وعبادتك، خطوةً بخطوة.',
  },

  // 28. هود
  {
    canonicalName: 'هود',
    aliases: ['هود'],
    type: 'prophet',
    welcomeLead: 'اسمٌ ارتبط بنبي الله هود عليه السلام، الداعي إلى الاستغفار والرجوع الصادق إلى ربه.',
    verse: {
      text: 'وَيَا قَوْمِ اسْتَغْفِرُوا رَبَّكُمْ ثُمَّ تُوبُوا إِلَيْهِ 52',
      surahName: 'سورة هود',
      ayahRef: 'الآية 52',
    },
    closingDua: 'نسأل الله أن يملأ قلبك طمأنينة، وأن يجعلك من المستغفرين المنيبين إليه.',
  },

  // 29. لقمان
  {
    canonicalName: 'لقمان',
    aliases: ['لقمان'],
    type: 'quranic',
    welcomeLead: 'لقمان، اسمٌ اقترن بالحكمة في كتاب الله، وخُصَّ بسورة عظيمة توصي بالصلاة والصبر.',
    verse: {
      text: 'يَا بُنَيَّ أَقِمِ الصَّلَاةَ وَأْمُرْ بِالْمَعْرُوفِ وَانْهَ عَنِ الْمُنكَرِ وَاصْبِرْ عَلَىٰ مَا أَصَابَكَ 17',
      surahName: 'سورة لقمان',
      ayahRef: 'الآية 17',
    },
    closingDua: 'نسأل الله أن يؤتيك الحكمة، وأن يجعل إقامة الصلاة قرة عينك.',
  },

  // 30. بلال
  {
    canonicalName: 'بلال',
    aliases: ['بلال'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بمؤذن رسول الله ﷺ بلال بن رباح رضي الله عنه، رمز الثبات ونداء الصلاة الخالد.',
    closingDua: 'نسأل الله أن يجعل الصلاة راحةً لقلبك ونورًا لروحك في كل يوم.',
  },

  // 31. حمزة
  {
    canonicalName: 'حمزة',
    aliases: ['حمزة', 'حمزه'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بأسد الله وسيد الشهداء حمزة بن عبد المطلب رضي الله عنه.',
    closingDua: 'نسأل الله أن يهبك قوةً وعزيمةً في مسيرتك وثباتًا صادقًا على الطاعة.',
  },

  // 32. خالد
  {
    canonicalName: 'خالد',
    aliases: ['خالد'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بسيف الله المسلول خالد بن الوليد رضي الله عنه، القائد المخلص لدين الله.',
    closingDua: 'نسأل الله أن يمنحك العزيمة والهمّة العالية في مدارج القرب منه.',
  },

  // 33. عائشة
  {
    canonicalName: 'عائشة',
    aliases: ['عائشة', 'عائشه', 'ام المؤمنين'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بأم المؤمنين عائشة الصديقة رضي الله عنها، الفقيهة العالمة وأحب الناس إلى رسول الله ﷺ.',
    closingDua: 'نسأل الله أن يفيض عليكِ من العلم والبركة والهدى، وأن يسدد كل خطاكِ.',
  },

  // 34. فاطمة
  {
    canonicalName: 'فاطمة',
    aliases: ['فاطمة', 'فاطمه', 'الزهراء'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بسيدة نساء أهل الجنة فاطمة الزهراء رضي الله عنها، بضعة النبي المصطفى ﷺ.',
    closingDua: 'نسأل الله أن يكسوكِ نورًا وسكينة، وأن يجعل دربكِ محفوفًا بالطهر والرضا.',
  },

  // 35. خديجة
  {
    canonicalName: 'خديجة',
    aliases: ['خديجة', 'خديجه'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بأم المؤمنين الأولى خديجة بنت خويلد رضي الله عنها، ناصرة النبي ﷺ وسيدة الوفاء والإيمان.',
    closingDua: 'نسأل الله أن يرزقكِ طمأنينة القلب وحسن التوكل والسبق في ميادين الخير.',
  },

  // 36. حفصة
  {
    canonicalName: 'حفصة',
    aliases: ['حفصة', 'حفصه'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بأم المؤمنين حفصة بنت عمر رضي الله عنهما، حارسة المصحف الشريف والصوّامة القوّامة.',
    closingDua: 'نسأل الله أن يجعل لكِ من العبادة والحرص على كتاب الله نصيبًا طيبًا.',
  },

  // 37. زينب
  {
    canonicalName: 'زينب',
    aliases: ['زينب'],
    type: 'companion',
    welcomeLead: 'اسمٌ مبارك لكبرى بنات رسول الله ﷺ، ولأم المؤمنين زينب بنت جحش رضي الله عنهن أجمعين.',
    closingDua: 'نسأل الله أن يملأ أيامكِ بركةً وبهاءً، وأن يتقبل منكِ صالح العمل.',
  },

  // 38. أسماء
  {
    canonicalName: 'أسماء',
    aliases: ['اسماء', 'أسماء', 'ذات النطاقين'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بذات النطاقين أسماء بنت أبي بكر رضي الله عنهما، عنوان الصبر والشجاعة والثبات.',
    closingDua: 'نسأل الله أن يكتب لكِ الثبات والسداد والتوفيق في رحلتكِ هذه.',
  },

  // 39. سلمان
  {
    canonicalName: 'سلمان',
    aliases: ['سلمان'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بالصحابي الجليل سلمان الفارسي رضي الله عنه، الباحث الصادق عن الحقيقة ونور الهدى.',
    closingDua: 'نسأل الله أن يهديك سبل السلام، وأن يبارك في سعيك وسيرك إليه.',
  },

  // 40. عبد الله
  {
    canonicalName: 'عبد الله',
    aliases: ['عبد الله', 'عبدالله'],
    type: 'general',
    welcomeLead: 'عبد الله، اسمٌ من أحب الأسماء إلى الله تعالى، يحمل شرف العبودية الخالصة له.',
    closingDua: 'نسأل الله أن يجعلك من عباده المقربين، المنيبين إليه بالرجاء والمحبة.',
  },

  // 41. عبد الرحمن
  {
    canonicalName: 'عبد الرحمن',
    aliases: ['عبد الرحمن', 'عبدالرحمن'],
    type: 'general',
    welcomeLead: 'عبد الرحمن، اسمٌ من أحب الأسماء إلى الله تعالى، ارتبط برحمته الواسعة التي وسعت كل شيء.',
    closingDua: 'نسأل الله أن يفيض عليك من رحمته وبركاته، ويغمر طريقك بالسكينة والتوفيق.',
  },

  // 42. أنس
  {
    canonicalName: 'أنس',
    aliases: ['أنس', 'انس'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بخادم رسول الله ﷺ أنس بن مالك رضي الله عنه، صاحب البركة والملازمة الصادقة للنبي ﷺ.',
    closingDua: 'نسأل الله أن يبارك في عمرك وعملك، وأن يملأ قلبك أنسًا بذكره.',
  },

  // 43. معاذ
  {
    canonicalName: 'معاذ',
    aliases: ['معاذ'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بالصحابي الجليل معاذ بن جبل رضي الله عنه، إمام العلماء والمحبوب لدى رسول الله ﷺ.',
    closingDua: 'نسأل الله أن يرزقك فقهًا في دينه، ومحبةً دائمة لذكره وشكره وحسن عبادته.',
  },

  // 44. سعد
  {
    canonicalName: 'سعد',
    aliases: ['سعد'],
    type: 'companion',
    welcomeLead: 'اسمٌ يذكّر بسعد بن أبي وقاص رضي الله عنه، أحد العشرة المبشرين بالجنة ومستجاب الدعوة.',
    closingDua: 'نسأل الله أن يجعل دعاءك مستجابًا، وأن يرزقك السعادة في الدارين.',
  },

  // 45. طارق
  {
    canonicalName: 'طارق',
    aliases: ['طارق'],
    type: 'quranic',
    welcomeLead: 'طارق، اسمٌ استفتحت به سورة كريمة في محكم كتاب الله:',
    verse: {
      text: 'وَالسَّمَاءِ وَالطَّارِقِ 1',
      surahName: 'سورة الطارق',
      ayahRef: 'الآية 1',
    },
    closingDua: 'نسأل الله أن ينير دربك بنور هدايته، وأن يجعل القرآن لك رفيقًا وهاديًا.',
  },
];

/**
 * Normalizes Arabic string for lookup.
 * Trims, removes tatweel, diacritics, normalizes Alef and Taa Marbouta.
 */
export function normalizeArabicName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا') // Normalize alef
    .replace(/ة/g, 'ه') // Normalize taa marbouta
    .replace(/ى/g, 'ي') // Normalize yaa
    .toLowerCase();
}

/**
 * Looks up an Islamic connection for the given name.
 * If no verified connection exists, gracefully returns a generic warm Islamic welcome.
 */
export function getPersonalizedWelcome(rawName: string): WelcomeResult {
  const trimmed = (rawName || '').trim();
  const displayName = trimmed || 'يا عبد الله';

  if (!trimmed) {
    return {
      displayName: 'ضيفنا الكريم',
      type: 'general',
      welcomeTitle: 'أهلًا بك في قضاء 🌿',
      welcomeLead: 'سعيدون بانضمامك إلى قضاء.',
      connection: 'هذه رحلتك، وخطوتك الأولى نحو إتمام ما فاتك والاقتراب من الله، خطوةً بخطوة.',
      closingDua: 'نسأل الله أن يكتب لك التوفيق والقبول، وأن يجعل هذا التطبيق عونًا لك على طاعته.',
    };
  }

  const normalizedInput = normalizeArabicName(trimmed);

  // Check direct alias matches
  const match = ISLAMIC_NAMES_DATABASE.find((entry) => {
    if (normalizeArabicName(entry.canonicalName) === normalizedInput) return true;
    return entry.aliases.some((alias) => normalizeArabicName(alias) === normalizedInput);
  });

  if (match) {
    return {
      displayName: trimmed,
      type: match.type,
      welcomeTitle: `أهلًا بك يا ${trimmed} 🌿`,
      welcomeLead: match.welcomeLead || `سعيدون بانضمامك يا ${trimmed}.`,
      connection: match.connection,
      verse: match.verse,
      closingDua: match.closingDua,
    };
  }

  // Fallback: Generic, warm and sincere Islamic welcome without inventing facts
  return {
    displayName: trimmed,
    type: 'general',
    welcomeTitle: `أهلًا بك يا ${trimmed} 🌿`,
    welcomeLead: 'سعيدون بانضمامك إلى قضاء.',
    connection: 'هذه رحلتك، وخطوتك الأولى نحو إتمام ما فاتك والاقتراب من الله، خطوةً بخطوة.',
    closingDua: 'نسأل الله أن يكتب لك التوفيق والقبول، وأن يجعل هذا التطبيق عونًا لك على طاعته.',
  };
}
