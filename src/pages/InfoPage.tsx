import React, { useEffect, type ReactNode } from 'react';
import { PublicFooter } from '../components/PublicFooter';
import { StarEightPoint } from '../components/landing/IslamicOrnaments';

interface InfoPageProps {
  path: string;
  children?: ReactNode;
  advertisingControls?: ReactNode;
}

const publicPages = {
  '/about': { eyebrow: 'تعرف علينا', title: 'أداة للتنظيم. مساحة للهدوء.', description: 'قضاء يساعدك على ترتيب سجلاتك ومتابعة التقدم، خطوة صغيرة كل يوم.' },
  '/privacy': { eyebrow: 'بوضوح وبدون مبالغة', title: 'خصوصيتك في قضاء', description: 'ما الذي يُحفظ على جهازك، ومتى يتصل الموقع بخدمات أخرى، وكيف تتحكم في بياناتك.' },
  '/guides': { eyebrow: 'دليل الاستخدام', title: 'استخدم قضاء بثقة.', description: 'إرشادات عملية للاستخدام دون اتصال وحفظ سجلاتك عند تغيير الهاتف أو المتصفح.' },
  '/guides/offline': { eyebrow: 'دليل الاستخدام · ٤ دقائق', title: 'كيف تستخدم قضاء دون إنترنت؟', description: 'تجهيز تلقائي في الزيارة الأولى، مع فهم ما يبقى متاحاً وما يحتاج إلى اتصال.' },
  '/guides/backup': { eyebrow: 'دليل الاستخدام · ٤ دقائق', title: 'احفظ سجلاتك قبل أن تحتاج إليها.', description: 'دليل النسخ الاحتياطي والاستعادة ونقل بيانات قضاء بين الأجهزة.' },
} as const;

const Section: React.FC<{ title: string; children: ReactNode; id?: string }> = ({ title, children, id }) => (
  <section id={id} className="scroll-mt-8 space-y-3">
    <h2 className="text-xl font-bold leading-relaxed text-[#26352A] sm:text-2xl">{title}</h2>
    <div className="space-y-4 text-[15px] leading-[2.05] text-[#4A584C] sm:text-base">{children}</div>
  </section>
);

const Note: React.FC<{ children: ReactNode }> = ({ children }) => (
  <aside className="rounded-2xl border border-[#C6A15B]/35 bg-[#E8DDD0]/40 px-5 py-4 text-sm leading-7 text-[#26352A]">{children}</aside>
);

const guideCards = [
  { href: '/guides/offline', number: '01', title: 'الاستخدام دون اتصال', description: 'الزيارة الأولى، علامة الجاهزية، وحدود تخزين الملفات في متصفح هاتفك.' },
  { href: '/guides/backup', number: '02', title: 'النسخ الاحتياطي ونقل البيانات', description: 'احفظ ملفاً من سجلاتك، واستعده بعناية على جهاز آخر دون إنشاء حساب.' },
];

function PublisherContact() {
  const name = import.meta.env.VITE_PUBLISHER_NAME?.trim();
  const email = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return <p className="mt-4">الناشر: {name}<br />للتواصل بخصوص الموقع والخصوصية: <a className="underline underline-offset-4" href={`mailto:${email}`} dir="ltr">{email}</a></p>;
}

function Guides() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {guideCards.map(guide => (
        <a key={guide.href} href={guide.href} className="group flex flex-col rounded-3xl border border-[#26352A]/15 bg-white/60 p-6 transition-colors hover:border-[#C6A15B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#26352A] sm:p-8">
          <span className="mb-8 font-serif text-3xl text-[#927035]" aria-hidden="true">{guide.number}</span>
          <h2 className="mb-3 text-xl font-bold leading-relaxed text-[#26352A]">{guide.title}</h2>
          <p className="mb-8 text-sm leading-7 text-[#4A584C]">{guide.description}</p>
          <span className="mt-auto text-sm font-bold text-[#26352A]">اقرأ الدليل <span aria-hidden="true">←</span></span>
        </a>
      ))}
      <p className="mt-3 text-sm leading-7 text-[#4A584C] sm:col-span-2">هذه الأدلة تشرح استخدام البرنامج وإدارة ملفاته فقط. قضاء ليس جهة إفتاء، والتقديرات المعروضة فيه لا تحل محل المشورة الشرعية المناسبة لحالتك.</p>
    </div>
  );
}

function About() {
  return (
    <div className="space-y-9">
      <Section title="لماذا قضاء؟">
        <p>قد تكون متابعة أرقام كثيرة في أوراق أو ملاحظات متفرقة مرهقة. يجمع قضاء عدادات الصلوات الفائتة والصيام والأذكار وقراءة القرآن في واجهة عربية واحدة، لتجد سجلك وتتابع ما أنجزته دون التنقل بين أدوات متعددة.</p>
        <p>لا تحتاج إلى حساب داخل التطبيق. تبدأ بتقديراتك الشخصية، ثم تسجل ما تنجزه وتراجع الأرقام عند الحاجة. الحسابات وسيلة تنظيم مبنية على مدخلاتك، وليست حكماً شرعياً أو إثباتاً لدقة التقدير الأول.</p>
      </Section>
      <Section title="سجلك يبقى في متصفحك">
        <p>يحفظ التطبيق سجلات المتابعة والإعدادات على جهازك. لا توجد مزامنة حسابات تلقائية بين الهواتف؛ لهذا نوفر تصدير نسخة احتياطية واستعادتها من الإعدادات. استخدام متصفح آخر أو مسح بيانات الموقع قد يجعلك ترى بداية جديدة بدلاً من سجلك القديم.</p>
      </Section>
      <Section title="كيف يستمر المشروع؟">
        <p>وظائف المتابعة الأساسية متاحة مجاناً. أُعدّت بعض صفحات دليل الاستخدام لاستقبال إعلانات بعد تفعيل الخدمة والموافقة عليها. لا نضع إعلانات داخل شاشة القرآن أو عدادات المتابعة، ولا نستخدم سجلات الصلاة لتخصيص الإعلانات.</p>
      </Section>
      <Section title="اقتراح أو مشكلة تقنية؟">
        <PublisherContact />
        <p>يمكنك الإبلاغ عن مشكلة في <a className="font-semibold underline underline-offset-4" href="https://github.com/yassine812/Qada-tracker/issues" target="_blank" rel="noopener noreferrer">صفحة دعم المشروع على GitHub</a>. قد يتطلب النشر حساب GitHub؛ استخدام قضاء نفسه لا يتطلب ذلك. البلاغات هناك عامة: لا ترفق نسخة سجلاتك أو معلوماتك الشخصية، واكتفِ بنوع الجهاز والمتصفح وخطوات المشكلة.</p>
      </Section>
    </div>
  );
}

function Privacy({ advertisingControls }: { advertisingControls?: ReactNode }) {
  return (
    <div className="space-y-9">
      <Note>تشرح هذه الصفحة سلوك النسخة الحالية من قضاء. حفظ سجلاتك محلياً لا يعني أن تصفح الإنترنت مجهول الهوية أو أن المتصفح سيحتفظ بالبيانات إلى الأبد.</Note>
      <Section title="١. بيانات المتابعة على جهازك">
        <p>يستخدم قضاء تخزين المتصفح (IndexedDB وlocalStorage) لحفظ إعداداتك، وتقديراتك التي تدخلها عند البداية، والعدادات والسجلات وتفضيلات القراءة. قد تتضمن مدخلاتك العمر وفترات العذر عند استخدام هذا الخيار. لا يرفع التطبيق هذه السجلات إلى خادم حسابات خاص بقضاء، ولا ينشئ لك حساباً أو يطلب كلمة مرور.</p>
        <p>تُحفظ ملفات تشغيل الموقع والخطوط وبيانات القراءة في ذاكرة التخزين المؤقت للمساعدة على العمل دون اتصال. قد يمسحها المتصفح عند نقص المساحة أو قد تختفي إذا حذفت بيانات الموقع. التصفح الخاص ليس مكاناً مناسباً لحفظ سجل طويل الأجل.</p>
      </Section>
      <Section title="٢. الاتصالات اللازمة لتشغيل الموقع">
        <p>عند فتح قضاء أو تحديث ملفاته، يتلقى مزود الاستضافة طلبات ويب عادية قد تتضمن عنوان IP ومعلومات المتصفح والصفحات المطلوبة. التخزين المحلي لسجلك لا يمنع هذه الاتصالات التقنية.</p>
        <p>يُحمَّل نص القرآن من ملفات الموقع أولاً. اختيار تلاوة صوتية أو تفسير غير محفوظ يؤدي إلى طلب خدمات خارجية، ومنها AlQuran Cloud وIslamic Network. قد يُستخدم المصدر الخارجي أيضاً إذا تعذر تحميل بعض بيانات القراءة المحلية. يتلقى مزود الخدمة تفاصيل الطلب وعنوان IP، ويعالجها وفق سياساته؛ لا يرسل قضاء إليه سجل صلواتك.</p>
      </Section>
      <Section title="٣. الإعلانات وخياراتك" id="advertising">
        <p>الإعلانات معطلة في الإعداد الافتراضي. تفعيلها يتطلب إعداد الناشر لخدمة Google AdSense ومراجعة الموقع وتهيئة إدارة الموافقة. لا تكفي زيارة الصفحة أو تنزيل التطبيق لتشغيلها. لا يضيف قضاء خدمة تحليلات مستقلة لتتبع استخدامك.</p>
        <p>عند تفعيل الخدمة، تقتصر المواضع المعدة للإعلانات على مقالي دليل الاستخدام، بعيداً عن سجلاتك وشاشات العبادة. لا تُرسل تقديرات الفوات أو بيانات المتابعة إلى خدمة الإعلانات ولا تُستخدم لاستهدافك. الإعلانات غير المخصصة قد تظل تستخدم التخزين المحلي أو ملفات تعريف الارتباط لأغراض مثل القياس ومنع الاحتيال؛ لا تعني عبارة «غير مخصصة» أنها بلا معالجة بيانات.</p>
        <p>حيث تكون خدمة الموافقة مفعلة، يمكنك مراجعة خياراتها أو سحب الموافقة من هذا القسم. رفض الإعلانات لا يمنعك من استخدام وظائف قضاء الأساسية. لمعرفة معالجة Google للبيانات، راجع <a className="font-semibold underline underline-offset-4" href="https://policies.google.com/technologies/partner-sites?hl=ar" target="_blank" rel="noopener noreferrer">كيفية استخدام Google للمعلومات من المواقع الشريكة</a>.</p>
        {advertisingControls}
      </Section>
      <Section title="٤. التصدير والحذف">
        <p>يمكنك تصدير ملف JSON من «الإعدادات ← البيانات والنسخ الاحتياطي». الملف قابل للقراءة وغير محمي بكلمة مرور داخل قضاء؛ احفظه في مكان آمن ولا تنشره. لا يرفعه التطبيق تلقائياً إلى خدمة نسخ سحابي.</p>
        <p>خيار «حذف وتصفير البيانات» يعيد ضبط بيانات المتابعة في التطبيق. لإزالة جميع ملفات الموقع وتفضيلاته أيضاً، استخدم إدارة بيانات المواقع في متصفحك. هذا لا يحذف النسخ التي صدّرتها بنفسك، وقد يمنع فتح التطبيق دون اتصال حتى تزوره بالإنترنت مرة أخرى.</p>
      </Section>
      <Section title="٥. التواصل والتغييرات">
        <PublisherContact />
        <p>للاستفسارات التقنية استخدم <a className="font-semibold underline underline-offset-4" href="https://github.com/yassine812/Qada-tracker/issues" target="_blank" rel="noopener noreferrer">صفحة دعم المشروع</a> دون إرفاق بيانات شخصية؛ البلاغات المنشورة هناك عامة. إذا تغيّرت طريقة عمل التخزين أو الخدمات الخارجية، ينبغي تحديث هذه الصفحة لتوضيح التغيير قبل تفعيله.</p>
      </Section>
    </div>
  );
}

function OfflineGuide() {
  return (
    <div className="space-y-9">
      <Section title="ابدأ بزيارة واحدة مع الإنترنت">
        <p>افتح رابط قضاء في المتصفح الذي ستستخدمه عادةً على هاتفك، ثم افتح التطبيق. لا تحتاج إلى حساب أو إلى تثبيت أي أداة على الكمبيوتر. تُحمَّل ملفات الواجهة والخطوط وبيانات القراءة تلقائياً في الخلفية. اترك الصفحة مفتوحة أثناء التجهيز، خصوصاً مع اتصال بطيء، وانتظر ظهور «جاهز بدون إنترنت» قبل الاعتماد عليه خارج الشبكة.</p>
      </Section>
      <Section title="ماذا يعني «جاهز»؟">
        <p>تعني الرسالة أن الملفات المطلوبة لهذه النسخة محفوظة في متصفحك وقت التحقق. لا تعني تنزيل تسجيلات جميع القراء أو كل التفاسير، ولا أنها نسخة احتياطية من سجلك. يختلف حجم التحميل الأول بحسب الملفات والنسخة. عند انقطاع الاتصال أثناء التجهيز، أعد المحاولة بعد عودته؛ ظهور الصفحة وحده لا يؤكد اكتمال التحميل.</p>
      </Section>
      <Section title="جرّب قبل أن تغادر الشبكة">
        <p>بعد الجاهزية، افصل الإنترنت مؤقتاً وأعد فتح الرابط نفسه في المتصفح نفسه. جرّب الانتقال إلى عداداتك ثم فتح سورة للقراءة. لست بحاجة إلى تسجيل إنجاز وهمي للاختبار. إذا فتحت التطبيق في متصفح آخر، أو من نافذة تصفح خاصة، فلا تفترض أن ملفات المتصفح الأول انتقلت إليه؛ لكل منهما مساحة تخزين مستقلة.</p>
      </Section>
      <Section title="ما الذي يعمل وما الذي ينتظر الاتصال؟">
        <p>يمكنك استخدام العدادات والسجلات والأذكار وقراءة نص القرآن بعد حفظ الملفات اللازمة. تستمر بيانات المتابعة في الحفظ محلياً، ولا تحتاج إلى رفعها إلى حساب عند عودة الإنترنت. أما بث التلاوة الصوتية وتحميل تفسير آية غير محفوظ فيحتاجان إلى اتصال؛ قد يظل تفسير سبق فتحه متاحاً من التخزين المحلي.</p>
        <p>عند تفعيل إعلانات الأدلة مستقبلاً، لن تكون مشاهدة إعلان شرطاً لدخول التطبيق أو تسجيل تقدمك. غياب الشبكة يعني غياب الإعلانات الجديدة، وليس توقف الوظائف المحلية. ولا تعتمد على استمرار تشغيل صوت جرى بثه سابقاً بوصفه دليلاً على توفر كل التلاوات دون إنترنت.</p>
      </Section>
      <Section title="لماذا قد أحتاج إلى الإنترنت مرة أخرى؟">
        <p>قد يحذف المتصفح ملفات موقع لا تستخدمه منذ مدة، أو يفرغها لتوفير المساحة. كما أن مسح بيانات التصفح أو تغيير عنوان الموقع يمكن أن يفصل بينك وبين النسخة المحفوظة. في هذه الحالات افتح العنوان الصحيح مع الإنترنت وانتظر التجهيز مجدداً. لا تكرر مسح بيانات الموقع لمحاولة إصلاح مشكلة تحميل؛ فقد تفقد سجلك المحلي أيضاً.</p>
      </Section>
      <Note>العمل دون اتصال ميزة مرتبطة بتخزين المتصفح، وليس ضماناً دائماً. قبل السفر أو تغيير هاتفك، اختبر الفتح دون شبكة وصدّر سجلك. دليل النسخ الاحتياطي يوضح الفرق بين ملفات تشغيل التطبيق وبياناتك التي لا يمكن إعادة تنزيلها من خادم.</Note>
    </div>
  );
}

function BackupGuide() {
  return (
    <div className="space-y-9">
      <Section title="لماذا تحتاج إلى نسخة مستقلة؟">
        <p>سجلك في قضاء محفوظ في متصفح جهازك، وليس في حساب سحابي يمكن تسجيل الدخول إليه لاحقاً. هذا يجعل البداية بسيطة، لكنه يعني أن فقدان الهاتف أو مسح بيانات الموقع قد يفقدك السجل. ملف النسخ الاحتياطي نسخة تختار حفظها أنت خارج مساحة الموقع، ولا ينشئها التطبيق تلقائياً كل يوم.</p>
      </Section>
      <Section title="صدّر الملف من الإعدادات">
        <p>افتح التطبيق، وانتقل إلى «الإعدادات»، ثم قسم «البيانات والنسخ الاحتياطي». اضغط «تصدير نسخة احتياطية» وانتظر رسالة النجاح. ينشئ قضاء ملفاً بصيغة JSON يبدأ اسمه بـ qada_backup ويتضمن تاريخ التصدير. قد يظهر في التنزيلات أو يطلب المتصفح اختيار مكان حفظه؛ مكان الملف يتوقف على جهازك ومتصفحك.</p>
        <p>تأكد أنك تستطيع العثور على الملف، ولا تكتفِ بتذكر أنك ضغطت الزر. يُفضّل حفظ نسخة إضافية في مكان آمن تختاره، خصوصاً قبل تغيير هاتفك. يتضمن التصدير الإعدادات والعدادات وسجلات المتابعة التي يدعمها إصدار التطبيق، وليس ملفات الصوت أو نسخة كاملة من كل تخزين المتصفح.</p>
      </Section>
      <Section title="عامله كملف شخصي">
        <p>ملف JSON نص قابل للقراءة، وليس ملفاً مشفراً أو محمياً بكلمة مرور من قضاء. لا ترفعه إلى بلاغ عام ولا ترسله إلى شخص لا تثق به. إذا اخترت خدمة تخزين سحابية بنفسك، يصبح حفظ الملف فيها خاضعاً لإعداداتك وسياسات تلك الخدمة؛ التطبيق لا يرفع النسخة إليها نيابةً عنك.</p>
      </Section>
      <Section title="استعد السجل على الجهاز الآخر">
        <p>افتح رابط قضاء على الجهاز الجديد واتبع البداية للوصول إلى الإعدادات. انقل الملف بالطريقة الآمنة التي تناسبك، ثم اختر «استعادة نسخة احتياطية» وحدد ملف JSON الذي صدّرته من قضاء. انتظر رسالة النجاح ثم راجع العدادات وبعض تواريخ السجل للتأكد من أنك اخترت النسخة المطلوبة.</p>
        <p>الاستعادة ليست مزامنة مستمرة بين هاتفين، وقد تستبدل إعداداتك وعداداتك وسجلات حالية ببيانات الملف. لذلك صدّر بيانات الجهاز المستهدف أولاً إذا كان يحتوي على تقدم تريد الاحتفاظ به. لا تفترض أن نسختين مختلفتين ستندمجان تلقائياً أو أن تقدم الأمس سيظهر في نسخة صدّرتها الأسبوع الماضي.</p>
      </Section>
      <Section title="إذا رفض التطبيق الملف">
        <p>تأكد أن الملف نسخة قضاء بصيغة JSON وليس صورة أو ملفاً مضغوطاً، وأنه اكتمل عند التنزيل أو النقل. لا تعدّل الأرقام داخل الملف لتجاوز التحقق؛ فقد تصبح السجلات غير متسقة. احتفظ بالنسخة الأصلية وجرّب تصديراً جديداً من الجهاز الذي ما زال يعرض بياناتك. وإذا أبلغت عن المشكلة، اذكر رسالة الخطأ دون نشر الملف الشخصي.</p>
      </Section>
      <Note>اجعل التصدير عادة بعد تقدم مهم وقبل مسح المتصفح أو تحديث الجهاز. تنزيل ملفات التطبيق للعمل دون إنترنت لا يحمي سجلك من الحذف، والملفات التي صدّرتها تبقى مسؤوليتك حتى بعد تصفير التطبيق.</Note>
    </div>
  );
}

export const InfoPage: React.FC<InfoPageProps> = ({ path, children, advertisingControls }) => {
  const page = publicPages[path as keyof typeof publicPages] ?? publicPages['/guides'];
  const isArticle = path === '/guides/offline' || path === '/guides/backup';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${page.title} | قضاء`;
    return () => { document.title = previousTitle; };
  }, [page.title]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F6F1E7] text-[#1D211E] selection:bg-[#C6A15B]/25" style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
      <a href="#public-content" className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-white focus:px-5 focus:py-3">انتقل إلى المحتوى</a>
      <header className="border-b border-[#26352A]/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-10">
          <a href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#26352A]" aria-label="قضاء — الصفحة الرئيسية">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#26352A]" aria-hidden="true"><StarEightPoint size={20} color="#C6A15B" /></span>
            <span className="text-2xl font-bold font-landing-display text-[#26352A]">قضاء</span>
          </a>
          <a href="/app" className="rounded-full bg-[#26352A] px-5 py-2.5 text-sm font-semibold text-[#F6F1E7] transition-colors hover:bg-[#18231C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#26352A]">افتح التطبيق <span aria-hidden="true">←</span></a>
        </div>
      </header>

      <main id="public-content" className="mx-auto max-w-3xl px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
        <nav aria-label="مسار الصفحة" className="mb-10 flex flex-wrap items-center gap-3 text-xs text-[#4A584C]">
          <a href="/" className="underline-offset-4 hover:underline">الرئيسية</a>
          <span aria-hidden="true">/</span>
          {isArticle ? <a href="/guides" className="underline-offset-4 hover:underline">دليل الاستخدام</a> : <span aria-current="page">{path === '/about' ? 'عن قضاء' : path === '/privacy' ? 'الخصوصية' : 'دليل الاستخدام'}</span>}
        </nav>
        <div className="mb-12 border-b border-[#C6A15B]/30 pb-10">
          <p className="mb-5 text-xs font-semibold text-[#806130]">{page.eyebrow}</p>
          <h1 className="mb-5 text-3xl font-bold leading-[1.55] font-landing-display text-[#26352A] sm:text-4xl">{page.title}</h1>
          <p className="max-w-2xl text-base leading-8 text-[#4A584C] sm:text-lg">{page.description}</p>
        </div>

        {path === '/about' && <About />}
        {path === '/privacy' && <Privacy advertisingControls={advertisingControls} />}
        {path === '/guides' && <Guides />}
        {isArticle && (
          <article aria-label={page.title}>
            {path === '/guides/offline' ? <OfflineGuide /> : <BackupGuide />}
            {children}
            <div className="mt-12 border-t border-[#C6A15B]/30 pt-8">
              <p className="mb-3 text-xs text-[#4A584C]">اقرأ أيضاً</p>
              <a className="text-lg font-bold leading-relaxed text-[#26352A] underline decoration-[#C6A15B] underline-offset-8" href={path === '/guides/offline' ? '/guides/backup' : '/guides/offline'}>{path === '/guides/offline' ? 'احفظ سجلاتك وانقلها بين الأجهزة' : 'جهّز قضاء للاستخدام دون إنترنت'} <span aria-hidden="true">←</span></a>
            </div>
          </article>
        )}
      </main>
      <PublicFooter />
    </div>
  );
};
