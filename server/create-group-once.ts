/**
 * سكريبت لإنشاء مجموعة "درس كتاب مارمرقس" مرة واحدة.
 * التشغيل:  DATABASE_URL=... npx tsx server/create-group-once.ts
 */
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { readingGroups, groupMembers } from '../shared/schema.js';

const GROUP_CODE   = 'AZK3P';
const GROUP_NAME   = 'درس كتاب مارمرقس';
const CHURCH_NAME  = 'مجموعات مدارس الاحد';
const LEADER_NAME  = 'ابونا متى';
const LEADER_PHONE = '01200801212';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌  يجب تعيين DATABASE_URL أولاً');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db   = drizzle(pool);

  // تحقق من عدم وجود الكود مسبقاً
  const existing = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, GROUP_CODE));
  if (existing.length > 0) {
    console.log('✅  المجموعة موجودة بالفعل:', existing[0]);
    await pool.end();
    return;
  }

  const leaderKey = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  const [group] = await db.insert(readingGroups).values({
    groupCode:   GROUP_CODE,
    name:        GROUP_NAME,
    churchName:  CHURCH_NAME,
    leaderName:  LEADER_NAME,
    leaderKey,
  }).returning();

  await db.insert(groupMembers).values({
    groupId:   group.id,
    userName:  LEADER_NAME,
    memberKey: leaderKey,
    phone:     LEADER_PHONE,
    isAdmin:   true,
  });

  console.log('✅  تم إنشاء المجموعة بنجاح!');
  console.log('   الاسم    :', GROUP_NAME);
  console.log('   الكود    :', GROUP_CODE);
  console.log('   الأدمن   :', LEADER_NAME, '-', LEADER_PHONE);
  console.log('   leaderKey:', leaderKey, '(احتفظ به لتسجيل دخول الأدمن)');

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
