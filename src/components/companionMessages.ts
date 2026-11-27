const rotatingMessages = {
  istighfar: ['أستغفر الله وأتوب إليه', 'اللهم اغفر لنا وارحمنا', 'زاد ذكرك اليوم، بارك الله فيك'],
  fasting: ['تقبّل الله صيامك', 'خطوة جميلة في قضاء الصيام', 'اللهم أعنّا على الطاعة'],
  quran: ['وقتٌ مع القرآن، وسكينةٌ للقلب', 'اقرأ على مهل وتدبّر', 'اللهم اجعل القرآن نور قلوبنا'],
  morning: ['ابدأ يومك بذكر الله', 'أذكار الصباح نورٌ ليومك'],
  evening: ['اختم يومك بذكر الله', 'أذكار المساء سكينةٌ للقلب'],
  sleep: ['اذكر الله قبل نومك', 'ليلة هادئة بذكر الله'],
  dua: ['ارفع يديك بالدعاء، والله قريب', 'اللهم تقبل دعاءنا'],
  settings: ['رتّب أهدافك على قدر استطاعتك', 'اختر ما يناسب رحلتك'],
  profile: ['شاهد تقدّمك، وكل خطوة تُحسب', 'رحلتك محفوظة هنا'],
  home: ['أهلًا بك، لنواصل رحلتنا', 'كل يوم فرصة لخطوة جديدة'],
  general: ['خطوة صغيرة تصنع فرقًا', 'اللهم بارك لنا في يومنا', 'معك، خطوة بخطوة'],
};

function rotate(category: keyof typeof rotatingMessages, sequence: number) {
  const messages = rotatingMessages[category];
  return messages[sequence % messages.length];
}

// Only visible interface labels are used. Names, email addresses and input values are never read.
export function companionMessage(label: string, sequence: number): string {
  const normalized = label.normalize('NFC')
    .replace(/[\u064B-\u0652\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .trim();

  const prayer = ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'].find(name => normalized.includes(name));
  if (prayer) return `خطوة مباركة لقضاء صلاة ${prayer}.`;
  if (/استغف|اغفر/.test(normalized)) return rotate('istighfar', sequence);
  if (/صيام|صوم|فطر|قضاء.*يوم/.test(normalized)) return rotate('fasting', sequence);
  if (/قران|مصحف|سورة|صفحة|تلاوة/.test(normalized)) return rotate('quran', sequence);
  if (/صباح/.test(normalized)) return rotate('morning', sequence);
  if (/مساء/.test(normalized)) return rotate('evening', sequence);
  if (/نوم/.test(normalized)) return rotate('sleep', sequence);
  if (/دعا/.test(normalized)) return rotate('dua', sequence);
  if (/ذكر|ذكار|تسبيح/.test(normalized)) return 'اذكر الله، يطمئن قلبك.';
  if (/ملف|حساب/.test(normalized)) return rotate('profile', sequence);
  if (/اعداد|المزيد|مظهر|فاتح|داكن|تنبيه/.test(normalized)) return rotate('settings', sequence);
  if (/الرئيسية/.test(normalized)) return rotate('home', sequence);
  return rotate('general', sequence);
}
