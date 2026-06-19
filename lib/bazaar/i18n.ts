export type BazaarLocale = 'en' | 'ku' | 'ar'

const translations = {
  // Navigation
  'nav.signin': { en: 'Sign in', ku: 'چوونە ژوورەوە', ar: 'تسجيل الدخول' },
  'nav.signup': { en: 'Sign up', ku: 'تۆمارکردن', ar: 'إنشاء حساب' },
  'nav.signout': { en: 'Sign out', ku: 'دەرچوون', ar: 'تسجيل الخروج' },

  // Landing
  'hero.badge': { en: 'Now in Amedi', ku: 'ئێستا لە ئامێدی', ar: 'الآن في العمادية' },
  'hero.title': { en: 'Shop from every market in Amedi.', ku: 'لە هەموو بازاڕێکی ئامێدی بکڕە.', ar: 'تسوق من كل سوق في العمادية.' },
  'hero.subtitle': { en: 'Compare prices across local shops, catch flash sales, and get everything delivered in one trip — from multiple stores, one driver.', ku: 'نرخەکان بەراورد بکە، ئۆفەرەکان بگرە، و هەموو شت بە یەک گەشت وەربگرە — لە چەندین فرۆشگا، یەک شۆفێر.', ar: 'قارن الأسعار بين المتاجر المحلية، اغتنم العروض السريعة، واحصل على كل شيء بتوصيلة واحدة — من متاجر متعددة، سائق واحد.' },
  'hero.cta.shop': { en: 'Start shopping', ku: 'دەست بکە بە کڕین', ar: 'ابدأ التسوق' },
  'hero.cta.sell': { en: 'List your shop', ku: 'فرۆشگاکەت تۆمار بکە', ar: 'أدرج متجرك' },

  // How it works
  'how.title': { en: 'Browse. Order. Delivered.', ku: 'بگەڕێ. داوا بکە. گەیاندرا.', ar: 'تصفح. اطلب. توصيل.' },
  'how.step1.title': { en: 'Browse all shops', ku: 'هەموو فرۆشگاکان بگەڕێ', ar: 'تصفح جميع المتاجر' },
  'how.step1.desc': { en: 'See every product from every market in Amedi. Filter by category, compare prices across shops side by side.', ku: 'هەموو بەرهەمەکان لە هەموو بازاڕێکی ئامێدی ببینە. بە پۆل فلتەر بکە، نرخەکان لای یەکتر بەراورد بکە.', ar: 'شاهد كل منتج من كل سوق في العمادية. فلتر حسب الفئة، قارن الأسعار جنباً إلى جنب.' },
  'how.step2.title': { en: 'One cart, many shops', ku: 'یەک سەبەتە، چەندین فرۆشگا', ar: 'سلة واحدة، متاجر عديدة' },
  'how.step2.desc': { en: 'Add items from multiple shops into one order. Kurdish honey from Ahmad, meat from Soran, vegetables from Dara — all in one cart.', ku: 'بەرهەم لە چەندین فرۆشگاوە زیاد بکە بۆ یەک داواکاری. هەنگوینی کوردی لە ئەحمەد، گۆشت لە سۆران، سەوزە لە دارا — هەموو لە یەک سەبەتەدا.', ar: 'أضف منتجات من متاجر متعددة في طلب واحد. عسل كردي من أحمد، لحم من سوران، خضار من دارا — الكل في سلة واحدة.' },
  'how.step3.title': { en: 'One driver delivers all', ku: 'یەک شۆفێر هەموو دەگەیەنێت', ar: 'سائق واحد يوصل الكل' },
  'how.step3.desc': { en: 'A local driver picks up from each shop and delivers everything to your door in one trip.', ku: 'شۆفێرێکی ناوخۆیی لە هەر فرۆشگایەک وەریدەگرێت و هەموو شت بە یەک گەشت دەگەیەنێتە دەرگاکەت.', ar: 'سائق محلي يستلم من كل متجر ويوصل كل شيء لبابك في رحلة واحدة.' },

  // Browse
  'browse.title': { en: "Browse Amedi's Markets", ku: 'بازاڕەکانی ئامێدی بگەڕێ', ar: 'تصفح أسواق العمادية' },
  'browse.subtitle': { en: 'Compare prices across shops and find the best deals.', ku: 'نرخەکان بەراورد بکە و باشترین ئۆفەر بدۆزەرەوە.', ar: 'قارن الأسعار بين المتاجر وجد أفضل العروض.' },
  'browse.all': { en: 'All', ku: 'هەموو', ar: 'الكل' },
  'browse.empty.title': { en: 'No products yet', ku: 'هێشتا بەرهەم نییە', ar: 'لا توجد منتجات بعد' },
  'browse.empty.desc': { en: 'Markets are still setting up. Check back soon.', ku: 'بازاڕەکان هێشتا ئامادە دەبن. دواتر سەردان بکەرەوە.', ar: 'الأسواق لا تزال تستعد. تحقق لاحقاً.' },

  // Cart
  'cart.title': { en: 'Your Cart', ku: 'سەبەتەکەت', ar: 'سلتك' },
  'cart.empty': { en: 'Your cart is empty', ku: 'سەبەتەکەت بەتاڵە', ar: 'سلتك فارغة' },
  'cart.checkout': { en: 'Place order', ku: 'داواکاری بکە', ar: 'أرسل الطلب' },
  'cart.delivery_fee': { en: 'Delivery fee', ku: 'کرێی گەیاندن', ar: 'رسوم التوصيل' },
  'cart.total': { en: 'Total', ku: 'کۆی گشتی', ar: 'المجموع' },
  'cart.address': { en: 'Delivery address', ku: 'ناونیشانی گەیاندن', ar: 'عنوان التوصيل' },
  'cart.note': { en: 'Note (optional)', ku: 'تێبینی (ئارەزوومەندانە)', ar: 'ملاحظة (اختياري)' },

  // Orders
  'orders.title': { en: 'Your Orders', ku: 'داواکاریەکانت', ar: 'طلباتك' },
  'orders.empty': { en: 'No orders yet', ku: 'هێشتا داواکاری نییە', ar: 'لا توجد طلبات بعد' },

  // Status
  'status.pending': { en: 'Pending', ku: 'چاوەڕوانی', ar: 'قيد الانتظار' },
  'status.confirmed': { en: 'Confirmed', ku: 'پشتڕاستکرایەوە', ar: 'مؤكد' },
  'status.picking_up': { en: 'Picking up', ku: 'وەرگرتن', ar: 'جاري الاستلام' },
  'status.delivering': { en: 'Delivering', ku: 'گەیاندن', ar: 'جاري التوصيل' },
  'status.delivered': { en: 'Delivered', ku: 'گەیێنرا', ar: 'تم التوصيل' },
  'status.cancelled': { en: 'Cancelled', ku: 'هەڵوەشاندنەوە', ar: 'ملغى' },

  // Signup
  'signup.customer': { en: 'Customer', ku: 'کڕیار', ar: 'عميل' },
  'signup.market_owner': { en: 'Market Owner', ku: 'خاوەنی بازاڕ', ar: 'صاحب متجر' },
  'signup.driver': { en: 'Driver', ku: 'شۆفێر', ar: 'سائق' },
  'signup.fullname': { en: 'Full name', ku: 'ناوی تەواو', ar: 'الاسم الكامل' },
  'signup.phone': { en: 'Phone number', ku: 'ژمارەی مۆبایل', ar: 'رقم الهاتف' },
  'signup.email': { en: 'Email', ku: 'ئیمەیڵ', ar: 'البريد الإلكتروني' },
  'signup.password': { en: 'Password', ku: 'وشەی نهێنی', ar: 'كلمة المرور' },
  'signup.neighborhood': { en: 'Neighborhood', ku: 'گەڕەک', ar: 'الحي' },
  'signup.create': { en: 'Create account', ku: 'هەژمار دروست بکە', ar: 'إنشاء حساب' },
  'signup.has_account': { en: 'Already have an account?', ku: 'هەژمارت هەیە؟', ar: 'لديك حساب بالفعل؟' },

  // Login
  'login.title': { en: 'Sign in', ku: 'چوونە ژوورەوە', ar: 'تسجيل الدخول' },
  'login.identifier': { en: 'Phone or email', ku: 'مۆبایل یان ئیمەیڵ', ar: 'الهاتف أو البريد' },
  'login.submit': { en: 'Sign in', ku: 'بچۆ ژوورەوە', ar: 'دخول' },
  'login.no_account': { en: "Don't have an account?", ku: 'هەژمارت نییە؟', ar: 'ليس لديك حساب؟' },

  // Shop dashboard
  'shop.dashboard': { en: 'Dashboard', ku: 'داشبۆرد', ar: 'لوحة التحكم' },
  'shop.products': { en: 'Products', ku: 'بەرهەمەکان', ar: 'المنتجات' },
  'shop.orders': { en: 'Orders', ku: 'داواکاریەکان', ar: 'الطلبات' },
  'shop.flash_sales': { en: 'Flash Sales', ku: 'ئۆفەرە کاتییەکان', ar: 'عروض سريعة' },
  'shop.settings': { en: 'Settings', ku: 'ڕێکخستنەکان', ar: 'الإعدادات' },

  // Driver
  'driver.title': { en: 'Driver Dashboard', ku: 'داشبۆردی شۆفێر', ar: 'لوحة السائق' },
  'driver.active': { en: 'Active deliveries', ku: 'گەیاندنە چالاکەکان', ar: 'توصيلات نشطة' },
  'driver.available': { en: 'Available orders', ku: 'داواکاریە بەردەستەکان', ar: 'طلبات متاحة' },
  'driver.accept': { en: 'Accept delivery', ku: 'گەیاندن قبوڵ بکە', ar: 'قبول التوصيل' },

  // Common
  'common.save': { en: 'Save', ku: 'پاشەکەوت', ar: 'حفظ' },
  'common.cancel': { en: 'Cancel', ku: 'هەڵوەشاندنەوە', ar: 'إلغاء' },
  'common.delete': { en: 'Delete', ku: 'سڕینەوە', ar: 'حذف' },
  'common.loading': { en: 'Loading...', ku: 'بارکردن...', ar: 'جاري التحميل...' },
  'common.error': { en: 'Something went wrong', ku: 'هەڵەیەک ڕوویدا', ar: 'حدث خطأ ما' },
} as const

export type TranslationKey = keyof typeof translations

export function t(key: TranslationKey, locale: BazaarLocale = 'en'): string {
  const entry = translations[key]
  return entry?.[locale] || entry?.en || key
}

export function isRtl(locale: BazaarLocale): boolean {
  return locale === 'ku' || locale === 'ar'
}
