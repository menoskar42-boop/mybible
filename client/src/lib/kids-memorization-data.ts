export type AgeGroup = '4-6' | '7-9' | '10-12';

export interface MemorizationVerse {
  id: string;
  ageGroup: AgeGroup;
  reference: string;
  text: string;
  theme: string;
  emoji: string;
}

export interface KidsBadge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  colorClass: string;
}

export const memorizationVerses: MemorizationVerse[] = [
  // 4-6 سنوات
  { id: 'mv-01', ageGroup: '4-6', reference: 'يوحنا 11:35', text: 'بكى يسوع.', theme: 'محبة يسوع', emoji: '💙' },
  { id: 'mv-02', ageGroup: '4-6', reference: 'مزمور 118:1', text: 'اشكروا الرب لأنه صالح، لأن إلى الأبد رحمته.', theme: 'الشكر', emoji: '🙏' },
  { id: 'mv-03', ageGroup: '4-6', reference: 'مرقس 10:14', text: 'دعوا الأولاد يأتون إليَّ ولا تمنعوهم.', theme: 'محبة يسوع للأطفال', emoji: '👶' },
  { id: 'mv-04', ageGroup: '4-6', reference: 'مزمور 23:1', text: 'الرب راعيَّ فلا يعوزني شيء.', theme: 'الثقة بالله', emoji: '🐑' },
  { id: 'mv-05', ageGroup: '4-6', reference: 'لوقا 2:14', text: 'المجد لله في الأعالي وعلى الأرض السلام وبالناس المسرة.', theme: 'الميلاد', emoji: '⭐' },
  { id: 'mv-06', ageGroup: '4-6', reference: 'متى 5:9', text: 'طوبى لصانعي السلام لأنهم أبناء الله يُدعَون.', theme: 'السلام', emoji: '🕊️' },
  { id: 'mv-07', ageGroup: '4-6', reference: 'أمثال 17:17', text: 'الصديق يُحبُّ في كل وقت.', theme: 'الصداقة', emoji: '🤝' },
  { id: 'mv-08', ageGroup: '4-6', reference: 'يوحنا 15:12', text: 'هذه هي وصيتي أن تُحبوا بعضكم بعضاً كما أحببتكم.', theme: 'المحبة', emoji: '❤️' },

  // 7-9 سنوات
  { id: 'mv-09', ageGroup: '7-9', reference: 'يوحنا 3:16', text: 'لأنه هكذا أحب الله العالم حتى بذل ابنه الوحيد لكي لا يهلك كل من يؤمن به بل تكون له الحياة الأبدية.', theme: 'محبة الله', emoji: '🌍' },
  { id: 'mv-10', ageGroup: '7-9', reference: 'مزمور 27:1', text: 'الرب نوري وخلاصي ممن أخاف؟ الرب حصن حياتي ممن أرتعب؟', theme: 'الشجاعة', emoji: '💪' },
  { id: 'mv-11', ageGroup: '7-9', reference: 'أمثال 3:5', text: 'ثق بالرب من كل قلبك وعلى فهمك لا تتكل. في كل طرقك اعترف به وهو يُقوّم سُبُلك.', theme: 'الثقة بالله', emoji: '🌟' },
  { id: 'mv-12', ageGroup: '7-9', reference: 'يوحنا 14:6', text: 'أنا هو الطريق والحق والحياة. ليس أحد يأتي إلى الآب إلا بي.', theme: 'يسوع طريقنا', emoji: '✨' },
  { id: 'mv-13', ageGroup: '7-9', reference: 'متى 22:37', text: 'تُحبُّ الرب إلهك من كل قلبك ومن كل نفسك ومن كل فكرك.', theme: 'الوصية الأولى', emoji: '💖' },
  { id: 'mv-14', ageGroup: '7-9', reference: 'مزمور 119:11', text: 'في قلبي خبأتُ كلامك لكي لا أخطئ إليك.', theme: 'كلمة الله', emoji: '📖' },
  { id: 'mv-15', ageGroup: '7-9', reference: 'يشوع 1:9', text: 'تشجع وتقوَّ. لا ترهب ولا تخف لأن الرب إلهك معك أينما ذهبت.', theme: 'الشجاعة', emoji: '🦁' },
  { id: 'mv-16', ageGroup: '7-9', reference: 'غلاطية 5:22', text: 'أما ثمر الروح فهو: محبة فرح سلام طول أناة لطف صلاح إيمان وداعة تعفف.', theme: 'ثمر الروح', emoji: '🍇' },

  // 10-12 سنة
  { id: 'mv-17', ageGroup: '10-12', reference: 'رومية 8:28', text: 'ونعلم أن كل الأشياء تعمل معاً للخير للذين يُحبون الله الذين هم مدعوون حسب قصده.', theme: 'عناية الله', emoji: '🕊️' },
  { id: 'mv-18', ageGroup: '10-12', reference: 'فيلبي 4:13', text: 'أستطيع كل شيء في المسيح الذي يُقوّيني.', theme: 'القوة في المسيح', emoji: '💪' },
  { id: 'mv-19', ageGroup: '10-12', reference: 'يوحنا 15:5', text: 'أنا الكرمة وأنتم الأغصان. من يثبت فيَّ وأنا فيه يأتي بثمر كثير لأنكم بدوني لا تستطيعون أن تفعلوا شيئاً.', theme: 'الثبات في المسيح', emoji: '🌿' },
  { id: 'mv-20', ageGroup: '10-12', reference: 'رومية 12:21', text: 'لا يغلبنَّك الشر بل اغلب الشر بالخير.', theme: 'الانتصار بالخير', emoji: '✝️' },
  { id: 'mv-21', ageGroup: '10-12', reference: 'عبرانيين 11:1', text: 'الإيمان هو الثقة بما يُرجى والتحقق من أمور لا تُرى.', theme: 'الإيمان', emoji: '🌈' },
  { id: 'mv-22', ageGroup: '10-12', reference: 'متى 5:16', text: 'فليُضئ نوركم هكذا قدام الناس لكي يروا أعمالكم الحسنة ويمجدوا أباكم الذي في السماوات.', theme: 'نور العالم', emoji: '💡' },
  { id: 'mv-23', ageGroup: '10-12', reference: '1 يوحنا 4:8', text: 'من لا يُحبَّ لم يعرف الله لأن الله محبة.', theme: 'الله محبة', emoji: '❤️' },
  { id: 'mv-24', ageGroup: '10-12', reference: 'مزمور 46:1', text: 'الله لنا ملجأ وقوة عوناً في الضيقات وُجد مُختَبَراً جداً.', theme: 'الله ملجأنا', emoji: '🏰' },
];

export const kidsBadges: KidsBadge[] = [
  { id: 'badge-first', title: 'أول خطوة', description: 'حفظت أول آية', emoji: '🌱', colorClass: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800' },
  { id: 'badge-5', title: 'قارئ نشيط', description: 'حفظت 5 آيات', emoji: '📚', colorClass: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800' },
  { id: 'badge-10', title: 'نجم الكتاب', description: 'حفظت 10 آيات', emoji: '⭐', colorClass: 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800' },
  { id: 'badge-allages', title: 'حكيم صغير', description: 'حفظت آية من كل فئة عمرية', emoji: '👑', colorClass: 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800' },
  { id: 'badge-quiz10', title: 'متسابق ذكي', description: 'أجبت على 10 أسئلة صحيحة', emoji: '🎯', colorClass: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800' },
  { id: 'badge-perfect', title: 'بطل المسابقة', description: 'حصلت على 10/10 في المسابقة', emoji: '🏆', colorClass: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  { id: 'badge-all', title: 'صديق يسوع', description: 'حفظت جميع الآيات', emoji: '✝️', colorClass: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800' },
];

export function computeEarnedBadges(memorized: string[], totalQuizCorrect: number, hadPerfectQuiz: boolean): string[] {
  const earned: string[] = [];
  if (memorized.length >= 1) earned.push('badge-first');
  if (memorized.length >= 5) earned.push('badge-5');
  if (memorized.length >= 10) earned.push('badge-10');
  if (memorized.length >= memorizationVerses.length) earned.push('badge-all');
  const allAgesRepresented = (['4-6', '7-9', '10-12'] as AgeGroup[]).every(ag =>
    memorizationVerses.filter(v => v.ageGroup === ag).some(v => memorized.includes(v.id))
  );
  if (allAgesRepresented) earned.push('badge-allages');
  if (totalQuizCorrect >= 10) earned.push('badge-quiz10');
  if (hadPerfectQuiz) earned.push('badge-perfect');
  return earned;
}
