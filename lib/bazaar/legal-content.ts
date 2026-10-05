// Terms of Use and Privacy Policy text in all three site languages.
// Kurdish is Badini, written in Arabic script. Bump LEGAL_UPDATED when the text changes.

import type { BazaarLocale } from './i18n'

export type LegalDoc = 'terms' | 'privacy'

export interface LegalSection {
  heading: string
  body: string[]
}

export interface LegalText {
  title: string
  updatedLabel: string
  intro: string
  sections: LegalSection[]
  contact: string
}

export const LEGAL_UPDATED = '2026-10-05'

export const LEGAL: Record<LegalDoc, Record<BazaarLocale, LegalText>> = {
  terms: {
    en: {
      title: 'Terms of Use',
      updatedLabel: 'Last updated',
      intro: 'These terms apply to everyone who uses Kela (kela.live): customers, shop owners and drivers. By creating an account you agree to them.',
      sections: [
        { heading: '1. What Kela is', body: [
          'Kela is an online marketplace that connects customers in Amedi with local shops and local drivers.',
          'Kela does not make or own the products sold. Each shop is responsible for its own products, prices, quality and descriptions.',
        ] },
        { heading: '2. Accounts', body: [
          'You must give your real name and a working phone number. One person, one account.',
          'New accounts may need approval by the Kela team before they can order, sell or deliver.',
          'You are responsible for keeping your password private and for everything done with your account.',
        ] },
        { heading: '3. Orders and payment', body: [
          'Payment is cash on delivery. You pay the driver when your order arrives.',
          'Prices and delivery fees are shown before you place an order. The total at checkout is what you pay.',
          'A shop may reject an order if a product is unavailable. You can cancel an order before a shop confirms it.',
          'If something is missing or wrong, contact the shop or Kela support within 24 hours of delivery.',
        ] },
        { heading: '4. Shop owners', body: [
          'Shops must sell only legal products and describe them honestly, with correct prices.',
          'Shops must prepare confirmed orders on time and keep their stock up to date.',
          'Kela may charge shops a commission or a monthly subscription. Fees are agreed with each shop in advance.',
        ] },
        { heading: '5. Drivers', body: [
          'Drivers must handle orders with care, collect the exact amount shown, and hand the cash over as agreed with Kela.',
          'Drivers must follow traffic laws. Kela may charge drivers a service fee, agreed in advance.',
          'Drivers who work for a delivery company receive orders from that company and cannot accept orders themselves. The company is responsible for its drivers and settles fees with Kela.',
        ] },
        { heading: '6. Not allowed', body: [
          'Fake accounts or fake orders, abusive messages, selling illegal or dangerous goods, or trying to break or misuse the website.',
        ] },
        { heading: '7. Suspension', body: [
          'Kela may refuse, suspend or close any account that breaks these terms, to protect customers, shops and drivers.',
        ] },
        { heading: '8. Liability', body: [
          'Kela works to keep the service running and accurate but cannot guarantee it will always be available or error-free. Kela is not responsible for the products themselves; the selling shop is.',
        ] },
        { heading: '9. Changes', body: [
          'We may update these terms. We will show the date of the latest change on this page. Continuing to use Kela means you accept the updated terms.',
        ] },
      ],
      contact: 'Questions? Use the Support page in the app or message us at kela.live.',
    },
    ar: {
      title: 'شروط الاستخدام',
      updatedLabel: 'آخر تحديث',
      intro: 'تنطبق هذه الشروط على كل من يستخدم كيلا (kela.live): الزبائن وأصحاب المتاجر والسائقين. بإنشاء حساب فإنك توافق عليها.',
      sections: [
        { heading: '١. ما هي كيلا', body: [
          'كيلا سوق إلكتروني يربط الزبائن في العمادية بالمتاجر المحلية والسائقين المحليين.',
          'كيلا لا تصنع المنتجات ولا تملكها. كل متجر مسؤول عن منتجاته وأسعارها وجودتها ووصفها.',
        ] },
        { heading: '٢. الحسابات', body: [
          'يجب أن تستخدم اسمك الحقيقي ورقم هاتف يعمل. شخص واحد، حساب واحد.',
          'قد تحتاج الحسابات الجديدة إلى موافقة فريق كيلا قبل الطلب أو البيع أو التوصيل.',
          'أنت مسؤول عن الحفاظ على سرية كلمة المرور وعن كل ما يتم من خلال حسابك.',
        ] },
        { heading: '٣. الطلبات والدفع', body: [
          'الدفع نقداً عند الاستلام. تدفع للسائق عند وصول طلبك.',
          'تظهر الأسعار ورسوم التوصيل قبل تأكيد الطلب. المبلغ الإجمالي عند الدفع هو ما تدفعه.',
          'يحق للمتجر رفض الطلب إذا كان المنتج غير متوفر. يمكنك إلغاء الطلب قبل أن يؤكده المتجر.',
          'إذا كان هناك نقص أو خطأ، تواصل مع المتجر أو دعم كيلا خلال ٢٤ ساعة من التوصيل.',
        ] },
        { heading: '٤. أصحاب المتاجر', body: [
          'يجب على المتاجر بيع منتجات قانونية فقط ووصفها بصدق وبأسعار صحيحة.',
          'يجب على المتاجر تجهيز الطلبات المؤكدة في الوقت المحدد وتحديث المخزون باستمرار.',
          'قد تفرض كيلا عمولة أو اشتراكاً شهرياً على المتاجر، ويُتفق على الرسوم مع كل متجر مسبقاً.',
        ] },
        { heading: '٥. السائقون', body: [
          'يجب على السائقين التعامل مع الطلبات بعناية، واستلام المبلغ الظاهر بالضبط، وتسليم النقود حسب الاتفاق مع كيلا.',
          'يجب على السائقين الالتزام بقوانين المرور. قد تفرض كيلا رسوم خدمة على السائقين يُتفق عليها مسبقاً.',
          'السائقون الذين يعملون لدى شركة توصيل يستلمون الطلبات من الشركة ولا يمكنهم قبول الطلبات بأنفسهم. الشركة مسؤولة عن سائقيها وتسوّي الرسوم مع كيلا.',
        ] },
        { heading: '٦. الممنوعات', body: [
          'الحسابات أو الطلبات الوهمية، الرسائل المسيئة، بيع البضائع غير القانونية أو الخطرة، أو محاولة تخريب الموقع أو إساءة استخدامه.',
        ] },
        { heading: '٧. إيقاف الحساب', body: [
          'يحق لكيلا رفض أو إيقاف أو إغلاق أي حساب يخالف هذه الشروط، لحماية الزبائن والمتاجر والسائقين.',
        ] },
        { heading: '٨. المسؤولية', body: [
          'تعمل كيلا على إبقاء الخدمة متاحة ودقيقة لكنها لا تضمن أن تكون متاحة دائماً أو خالية من الأخطاء. كيلا ليست مسؤولة عن المنتجات نفسها؛ المسؤول هو المتجر البائع.',
        ] },
        { heading: '٩. التعديلات', body: [
          'قد نحدّث هذه الشروط، وسنعرض تاريخ آخر تعديل في هذه الصفحة. استمرارك في استخدام كيلا يعني قبولك للشروط المحدّثة.',
        ] },
      ],
      contact: 'لديك سؤال؟ استخدم صفحة الدعم في التطبيق أو راسلنا عبر kela.live.',
    },
    ku: {
      title: 'مەرجێت بکارئینانێ',
      updatedLabel: 'دوماهیک نووکرن',
      intro: 'ئەڤ مەرجە بۆ هەمی ئەوێت کێلا (kela.live) بکاردئینن دهێنە جێبەجێکرن: کڕیار، خودانێت دوکانان و شوفێر. ب دروستکرنا هژمارەکێ تو ڕازی دبی ب ڤان مەرجان.',
      sections: [
        { heading: '١. کێلا چییە', body: [
          'کێلا بازاڕەکێ ئۆنلاینە کڕیارێت ئامێدیێ ب دوکانێت ناڤخۆیی و شوفێرێت ناڤخۆیی ڤە گرێددەت.',
          'کێلا بەرهەمان چێناکەت و نە خودانێ وانە. هەر دوکانەک بەرپرسیارە ژ بەرهەمێت خۆ، بها، کوالیتی و پێناسەیا وان.',
        ] },
        { heading: '٢. هژمار', body: [
          'دڤێت ناڤێ خۆ یێ دروست و ژمارا تەلەفۆنەکا کاردکەت بنڤیسی. ئێک کەس، ئێک هژمار.',
          'دبیت هژمارێت نوو پێدڤی ب قەبوولکرنا تیما کێلا هەبن بەری داخوازکرن، فرۆتن یان گەهاندنێ.',
          'تو بەرپرسیاری ژ ڤەشارتنا پەیڤا نهێنی و ژ هەمی کارێت ب هژمارا تە دهێنە کرن.',
        ] },
        { heading: '٣. داخواز و پارەدان', body: [
          'پارەدان ب کاش دەمێ گەهاندنێیە. دەمێ داخوازا تە دگەهیت، پارەی ددەیە شوفێری.',
          'بها و کرێیا گەهاندنێ بەری داخوازکرنێ دیار دبن. کۆیێ دوماهیێ ئەوە یێ تو ددەی.',
          'دوکان دشێت داخوازێ ڕەت بکەت ئەگەر بەرهەم نەبیت. تو دشێی داخوازێ هەلوەشینی بەری دوکان پشتڕاست بکەت.',
          'ئەگەر تشتەک کێم یان خەلەت بیت، د ماوێ ٢٤ دەمژمێران دا پشتی گەهاندنێ پەیوەندیێ ب دوکانێ یان پشتەڤانیا کێلا بکە.',
        ] },
        { heading: '٤. خودانێت دوکانان', body: [
          'دڤێت دوکان تنێ بەرهەمێت یاسایی بفرۆشن و ب ڕاستی و ب بهایێت دروست پێناسە بکەن.',
          'دڤێت دوکان داخوازێت پشتڕاستکری د دەمێ خۆ دا ئامادە بکەن و کۆگەها خۆ نوو بکەن.',
          'دبیت کێلا کۆمیسیۆن یان بەشداریا هەیڤانە ل سەر دوکانان دانیت. کرێ بەری هینگێ دگەل هەر دوکانەکێ دهێتە ڕێککەفتن.',
        ] },
        { heading: '٥. شوفێر', body: [
          'دڤێت شوفێر ب هشیاری داخوازان بگەهینن، هەمان بڕێ پارەی یێ دیار وەربگرن، و پارەی وەکی ڕێککەفتنا دگەل کێلا ڕادەست بکەن.',
          'دڤێت شوفێر یاسایێت هاتووچوونێ بپارێزن. دبیت کێلا کرێیا خزمەتێ ل سەر شوفێران دانیت، بەری هینگێ دهێتە ڕێککەفتن.',
          'ئەو شوفێرێت بۆ کۆمپانیەکا گەهاندنێ کار دکەن، داخوازان ژ کۆمپانیێ وەردگرن و نەشێن ب خۆ داخوازان قەبوول بکەن. کۆمپانی بەرپرسیارە ژ شوفێرێت خۆ و کرێیان دگەل کێلا ڕێک دئێخیت.',
        ] },
        { heading: '٦. تشتێت قەدەغە', body: [
          'هژمار یان داخوازێت درەو، نامەیێت خراب، فرۆتنا کەلوپەلێت نەیاسایی یان مەترسیدار، یان هەولدان بۆ تێکدان یان خراب بکارئینانا مالپەڕی.',
        ] },
        { heading: '٧. ڕاگرتنا هژمارێ', body: [
          'کێلا دشێت هەر هژمارەکا ڤان مەرجان بشکێنیت ڕەت بکەت، ڕاگریت یان بگریت، بۆ پاراستنا کڕیاران، دوکانان و شوفێران.',
        ] },
        { heading: '٨. بەرپرسیاریەتی', body: [
          'کێلا کار دکەت دا خزمەت هەردەم بەردەست و دروست بیت، بەلێ گەرەنتی ناکەت کو هەردەم بەردەست یان بێ خەلەتی بیت. کێلا ژ بەرهەمان ب خۆ بەرپرسیار نینە؛ دوکانا فرۆشیار بەرپرسیارە.',
        ] },
        { heading: '٩. گوهۆڕین', body: [
          'دبیت ئەم ڤان مەرجان نوو بکەین و دێ دیرۆکا دوماهیک گوهۆڕینێ ل ڤێ پەڕێ نیشان دەین. بەردەوامبوونا تە ل سەر بکارئینانا کێلا ب واتا قەبوولکرنا مەرجێت نوویە.',
        ] },
      ],
      contact: 'پسیارەک هەیە؟ پەڕا پشتەڤانیێ د ئەپی دا بکاربینە یان ل kela.live نامەیەکێ بۆ مە بهنێرە.',
    },
  },

  privacy: {
    en: {
      title: 'Privacy Policy',
      updatedLabel: 'Last updated',
      intro: 'This policy explains what information Kela collects, why, and who can see it. We collect only what we need to deliver your orders.',
      sections: [
        { heading: '1. What we collect', body: [
          'Account details: your name, phone number, email and password (stored encrypted, we cannot read it).',
          'Delivery details: your address, neighbourhood and, if you choose to share it, your location on the map.',
          'Order details: what you ordered, from which shops, prices and order history.',
          'Messages you send in order chats and to support, and reviews you write.',
          'For drivers: vehicle type, availability, ID number and online status. For shops: shop name, location and products.',
        ] },
        { heading: '2. Why we use it', body: [
          'To create your account, deliver your orders, let you talk to the shop and driver, send you order notifications, prevent fake accounts and fraud, and improve Kela.',
        ] },
        { heading: '3. Who can see it', body: [
          'The shop you order from sees your name, phone and order. The driver delivering your order sees your name, phone, address and location.',
          'The Kela team can see account and order details to approve accounts, give support and resolve problems.',
          'We do not sell your information and do not share it for advertising.',
        ] },
        { heading: '4. Services we use', body: [
          'Your data is stored with Supabase (database and login) and the website runs on Vercel. Maps use OpenStreetMap. These services store data on servers outside Iraq.',
        ] },
        { heading: '5. Cookies', body: [
          'We use only necessary cookies: to keep you signed in and to remember your language. No advertising cookies.',
        ] },
        { heading: '6. How long we keep it', body: [
          'We keep your information while your account is active. Order records may be kept longer for accounting and to resolve disputes.',
        ] },
        { heading: '7. Your choices', body: [
          'You can view and edit your profile and saved addresses at any time. You can ask us to delete your account through the Support page.',
        ] },
        { heading: '8. Security', body: [
          'We use encrypted connections and access rules so each user sees only their own data. No system is perfectly secure, so keep your password private.',
        ] },
        { heading: '9. Changes', body: [
          'We may update this policy and will show the date of the latest change on this page.',
        ] },
      ],
      contact: 'Questions about your data? Contact us through the Support page.',
    },
    ar: {
      title: 'سياسة الخصوصية',
      updatedLabel: 'آخر تحديث',
      intro: 'توضح هذه السياسة المعلومات التي تجمعها كيلا ولماذا ومن يمكنه رؤيتها. نجمع فقط ما نحتاجه لتوصيل طلباتك.',
      sections: [
        { heading: '١. ما نجمعه', body: [
          'بيانات الحساب: اسمك ورقم هاتفك وبريدك الإلكتروني وكلمة المرور (محفوظة مشفّرة ولا يمكننا قراءتها).',
          'بيانات التوصيل: عنوانك والحي، وموقعك على الخريطة إذا اخترت مشاركته.',
          'بيانات الطلبات: ما طلبته ومن أي متاجر والأسعار وسجل الطلبات.',
          'الرسائل التي ترسلها في محادثات الطلبات وللدعم، والتقييمات التي تكتبها.',
          'للسائقين: نوع المركبة والتوفر ورقم الهوية وحالة الاتصال. للمتاجر: اسم المتجر وموقعه ومنتجاته.',
        ] },
        { heading: '٢. لماذا نستخدمها', body: [
          'لإنشاء حسابك، وتوصيل طلباتك، وتمكينك من التواصل مع المتجر والسائق، وإرسال إشعارات الطلبات، ومنع الحسابات الوهمية والاحتيال، وتحسين كيلا.',
        ] },
        { heading: '٣. من يمكنه رؤيتها', body: [
          'المتجر الذي تطلب منه يرى اسمك وهاتفك وطلبك. السائق الذي يوصل طلبك يرى اسمك وهاتفك وعنوانك وموقعك.',
          'يمكن لفريق كيلا رؤية بيانات الحسابات والطلبات للموافقة على الحسابات وتقديم الدعم وحل المشاكل.',
          'لا نبيع معلوماتك ولا نشاركها لأغراض إعلانية.',
        ] },
        { heading: '٤. الخدمات التي نستخدمها', body: [
          'تُحفظ بياناتك لدى Supabase (قاعدة البيانات وتسجيل الدخول) ويعمل الموقع على Vercel. الخرائط من OpenStreetMap. هذه الخدمات تحفظ البيانات على خوادم خارج العراق.',
        ] },
        { heading: '٥. ملفات تعريف الارتباط', body: [
          'نستخدم فقط الملفات الضرورية: لإبقائك مسجلاً للدخول ولتذكّر لغتك. لا توجد ملفات إعلانية.',
        ] },
        { heading: '٦. مدة الاحتفاظ', body: [
          'نحتفظ بمعلوماتك طالما حسابك نشط. قد تُحفظ سجلات الطلبات لفترة أطول لأغراض المحاسبة وحل النزاعات.',
        ] },
        { heading: '٧. خياراتك', body: [
          'يمكنك عرض ملفك الشخصي وعناوينك المحفوظة وتعديلها في أي وقت. يمكنك طلب حذف حسابك عبر صفحة الدعم.',
        ] },
        { heading: '٨. الأمان', body: [
          'نستخدم اتصالات مشفّرة وقواعد وصول بحيث لا يرى كل مستخدم إلا بياناته. لا يوجد نظام آمن تماماً، لذا حافظ على سرية كلمة المرور.',
        ] },
        { heading: '٩. التعديلات', body: [
          'قد نحدّث هذه السياسة وسنعرض تاريخ آخر تعديل في هذه الصفحة.',
        ] },
      ],
      contact: 'لديك سؤال عن بياناتك؟ تواصل معنا عبر صفحة الدعم.',
    },
    ku: {
      title: 'سیاسەتا تایبەتمەندیێ',
      updatedLabel: 'دوماهیک نووکرن',
      intro: 'ئەڤ سیاسەتە ڕوون دکەت کێلا چ پێزانینان کۆم دکەت، بۆچی، و کی دشێت ببینیت. ئەم تنێ ئەوێ پێدڤی بۆ گەهاندنا داخوازێت تە کۆم دکەین.',
      sections: [
        { heading: '١. ئەم چ کۆم دکەین', body: [
          'پێزانینێت هژمارێ: ناڤ، ژمارا تەلەفۆنێ، ئیمەیل و پەیڤا نهێنی (ب شێوەیەکێ کۆدکری دهێتە پاراستن، ئەم نەشێین بخوینین).',
          'پێزانینێت گەهاندنێ: ناڤونیشانێ تە، گەڕەک، و جهێ تە ل سەر نەخشەی ئەگەر تو بڤێی پارڤە بکەی.',
          'پێزانینێت داخوازان: تە چ داخواز کریە، ژ کیژ دوکانان، بها و دیرۆکا داخوازان.',
          'ئەو نامەیێت تو د چاتا داخوازان دا و بۆ پشتەڤانیێ دهنێری، و ئەو هەلسەنگاندنێت تو دنڤیسی.',
          'بۆ شوفێران: جۆرێ ترۆمبێلێ، بەردەستبوون، ژمارا ناسنامێ و دۆخێ ئۆنلاین. بۆ دوکانان: ناڤ، جه و بەرهەمێت دوکانێ.',
        ] },
        { heading: '٢. بۆچی بکاردئینین', body: [
          'بۆ دروستکرنا هژمارا تە، گەهاندنا داخوازێت تە، ئاخفتنا تە دگەل دوکان و شوفێری، هنارتنا ئاگەهداریێت داخوازان، ڕێگریکرن ل هژمارێت درەو و فێلێ، و باشترکرنا کێلا.',
        ] },
        { heading: '٣. کی دشێت ببینیت', body: [
          'ئەو دوکانا تو ژێ داخواز دکەی ناڤ، تەلەفۆن و داخوازا تە دبینیت. ئەو شوفێرێ داخوازا تە دگەهینیت ناڤ، تەلەفۆن، ناڤونیشان و جهێ تە دبینیت.',
          'تیما کێلا دشێت پێزانینێت هژمار و داخوازان ببینیت بۆ قەبوولکرنا هژماران، پشتەڤانیێ و چارەسەرکرنا ئاریشان.',
          'ئەم پێزانینێت تە نافرۆشین و بۆ ڕیکلامێ پارڤە ناکەین.',
        ] },
        { heading: '٤. ئەو خزمەتێت ئەم بکاردئینین', body: [
          'پێزانینێت تە ل Supabase (داتابەیس و چوونەژوور) دهێنە پاراستن و مالپەڕ ل سەر Vercel کار دکەت. نەخشە ژ OpenStreetMap ن. ئەڤ خزمەتە داتایان ل سەر سێرڤەرێت دەرڤەی عیراقێ دپارێزن.',
        ] },
        { heading: '٥. کووکیز', body: [
          'ئەم تنێ کووکیزێت پێدڤی بکاردئینین: بۆ هێلانا تە د ژوور دا و بیرهاتنا زمانێ تە. چ کووکیزێت ڕیکلامێ نینن.',
        ] },
        { heading: '٦. چەند دەمان دپارێزین', body: [
          'ئەم پێزانینێت تە دپارێزین هەتا هژمارا تە چالاک بیت. دبیت تۆمارێت داخوازان بۆ ژمێریاری و چارەسەرکرنا ناکۆکیان پتر بهێنە پاراستن.',
        ] },
        { heading: '٧. هەلبژارتنێت تە', body: [
          'تو دشێی هەر دەمەکێ پرۆفایلا خۆ و ناڤونیشانێت پاراستی ببینی و دەستکاری بکەی. تو دشێی ب ڕێکا پەڕا پشتەڤانیێ داخوازا ژێبرنا هژمارا خۆ بکەی.',
        ] },
        { heading: '٨. پاراستن', body: [
          'ئەم پەیوەندیێت کۆدکری و یاسایێت دەستپێگەهشتنێ بکاردئینین دا هەر بکارئینەرەک تنێ پێزانینێت خۆ ببینیت. چ سیستەم ب تەمامی پارێزراو نینە، لەوما پەیڤا نهێنی ڤەشێرە.',
        ] },
        { heading: '٩. گوهۆڕین', body: [
          'دبیت ئەم ڤێ سیاسەتێ نوو بکەین و دێ دیرۆکا دوماهیک گوهۆڕینێ ل ڤێ پەڕێ نیشان دەین.',
        ] },
      ],
      contact: 'پسیارەک دەربارەی پێزانینێت خۆ هەیە؟ ب ڕێکا پەڕا پشتەڤانیێ پەیوەندیێ ب مە بکە.',
    },
  },
}
