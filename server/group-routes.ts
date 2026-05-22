import type { Express } from "express";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  readingGroups, groupMembers, groupReadingLogs, groupMessages, groupMissions,
  challengeParticipants, churchChallenges,
  groupAssignments, assignmentReadings, groupJoinRequests,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateKey(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

async function isAdminMember(groupId: number, memberKey: string): Promise<boolean> {
  const members = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.memberKey, memberKey)));
  return members.length > 0 && members[0].isAdmin === true;
}

async function isAdminByLeaderKey(group: any, memberKey: string): Promise<boolean> {
  if (memberKey === group.leaderKey) return true;
  return isAdminMember(group.id, memberKey);
}

export function registerGroupRoutes(app: Express) {

  // ── معلومات الدعوة (endpoint عام بدون auth) ──
  app.get('/api/groups/:code/invite-info', async (req, res) => {
    try {
      const [group] = await db.select({
        groupCode: readingGroups.groupCode,
        name: readingGroups.name,
        churchName: readingGroups.churchName,
        leaderName: readingGroups.leaderName,
        linkJoinMode: readingGroups.linkJoinMode,
      }).from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));

      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });
      res.json({ group });
    } catch (err) {
      res.status(500).json({ error: 'فشل تحميل بيانات المجموعة' });
    }
  });

  // ── الانضمام عبر رابط الدعوة ──
  app.post('/api/groups/:code/invite-join', async (req, res) => {
    try {
      const { userName, phone } = req.body;
      const code = req.params.code.toUpperCase();

      if (!userName || !phone) return res.status(400).json({ error: 'الاسم ورقم الموبايل مطلوبان' });
      if (phone.trim().length < 10) return res.status(400).json({ error: 'رقم الموبايل غير صحيح' });

      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, code));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      // هل هو عضو بالفعل؟
      const [existing] = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, userName.trim())));
      if (existing) {
        if (!existing.phone && phone) {
          await db.update(groupMembers).set({ phone: phone.trim() }).where(eq(groupMembers.id, existing.id));
        }
        return res.json({ group, member: existing, status: 'already_member' });
      }

      if (group.linkJoinMode === 'auto') {
        // في وضع auto: إذا كان هناك طلب معلق نلغيه ونضيف العضو مباشرة
        await db.delete(groupJoinRequests)
          .where(and(eq(groupJoinRequests.groupId, group.id), eq(groupJoinRequests.userName, userName.trim())));
        // انضمام مباشر — نتحقق مرة أخرى بـ INSERT WHERE NOT EXISTS لمنع التكرار
        const memberKey = generateKey();
        const result = await pool.query(
          `INSERT INTO group_members (group_id, user_name, member_key, phone, is_admin, is_muted)
           SELECT $1, $2, $3, $4, false, false
           WHERE NOT EXISTS (
             SELECT 1 FROM group_members WHERE group_id = $1 AND (user_name = $2 OR phone = $4)
           )
           RETURNING *`,
          [group.id, userName.trim(), memberKey, phone.trim()]
        );
        if (result.rows.length === 0) {
          const [dup] = await db.select().from(groupMembers)
            .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, userName.trim())));
          return res.json({ group, member: dup, status: 'already_member' });
        }
        return res.json({ group, member: result.rows[0], status: 'joined', memberKey });
      }

      // وضع الموافقة — هل يوجد طلب معلق؟
      const [pending] = await db.select().from(groupJoinRequests)
        .where(and(eq(groupJoinRequests.groupId, group.id), eq(groupJoinRequests.userName, userName.trim()), eq(groupJoinRequests.status, 'pending')));
      if (pending) return res.json({ group, status: 'pending', request: pending });

      // إنشاء طلب انضمام جديد
      const [request] = await db.insert(groupJoinRequests).values({
        groupId: group.id,
        userName: userName.trim(),
        phone: phone.trim(),
        status: 'pending',
      }).returning();
      res.json({ group, status: 'pending', request });
    } catch (err) {
      console.error('[groups] invite-join error:', err);
      res.status(500).json({ error: 'فشل الانضمام' });
    }
  });

  // ── تغيير وضع الانضمام عبر الرابط ──
  app.put('/api/groups/:code/link-mode', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, mode } = req.body;
      if (!['auto', 'approval'].includes(mode)) return res.status(400).json({ error: 'وضع غير صحيح' });

      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      await db.update(readingGroups).set({ linkJoinMode: mode }).where(eq(readingGroups.id, group.id));
      res.json({ success: true, mode });
    } catch (err) {
      console.error('[groups] link-mode error:', err);
      res.status(500).json({ error: 'فشل تحديث الإعداد' });
    }
  });

  // endpoint مؤقت لإنشاء مجموعة بكود محدد مسبقاً (للاستخدام الإداري فقط)
  app.post('/api/groups/seed-once', async (req, res) => {
    try {
      const { secret, groupCode, name, churchName, admins } = req.body;
      if (secret !== 'MYBIBLE_SEED_2026') {
        return res.status(403).json({ error: 'غير مسموح' });
      }
      if (!groupCode || !name || !admins?.length) {
        return res.status(400).json({ error: 'بيانات ناقصة' });
      }
      const existing = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, groupCode.toUpperCase()));
      if (existing.length > 0) {
        return res.json({ status: 'already_exists', group: existing[0] });
      }
      const leaderKey = generateKey();
      const [group] = await db.insert(readingGroups).values({
        groupCode: groupCode.toUpperCase(),
        name,
        churchName: churchName || null,
        leaderName: admins[0].name,
        leaderKey,
      }).returning();
      const members = admins.map((a: { name: string; phone: string }, i: number) => ({
        groupId:   group.id,
        userName:  a.name,
        memberKey: i === 0 ? leaderKey : generateKey(),
        phone:     a.phone,
        isAdmin:   true,
      }));
      await db.insert(groupMembers).values(members);
      res.json({ status: 'created', group });
    } catch (err) {
      console.error('[groups] seed-once error:', err);
      res.status(500).json({ error: 'فشل إنشاء المجموعة' });
    }
  });

  app.post('/api/groups', async (req, res) => {
    try {
      const { name, churchName, leaderName, phone } = req.body;
      if (!name || !leaderName) {
        return res.status(400).json({ error: 'اسم المجموعة واسم الخادم مطلوبان' });
      }
      if (!phone || String(phone).trim().length < 10) {
        return res.status(400).json({ error: 'رقم الموبايل مطلوب' });
      }
      const groupCode = generateCode();
      const leaderKey = generateKey();

      const [group] = await db.insert(readingGroups).values({
        groupCode,
        name,
        churchName: churchName || null,
        leaderName,
        leaderKey,
      }).returning();

      await db.insert(groupMembers).values({
        groupId: group.id,
        userName: leaderName,
        memberKey: leaderKey,
        isAdmin: true,
        phone: String(phone).trim(),
      });

      res.json({ group, leaderKey });
    } catch (err) {
      console.error('[groups] create error:', err);
      res.status(500).json({ error: 'فشل إنشاء المجموعة' });
    }
  });

  app.post('/api/groups/join', async (req, res) => {
    try {
      const { groupCode, userName, phone } = req.body;
      if (!groupCode || !userName) {
        return res.status(400).json({ error: 'الكود واسم المستخدم مطلوبان' });
      }
      if (!phone || phone.trim().length < 10) {
        return res.status(400).json({ error: 'رقم الموبايل مطلوب (10 أرقام على الأقل)' });
      }

      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, groupCode.toUpperCase()));
      if (!group) {
        return res.status(404).json({ error: 'المجموعة غير موجودة' });
      }

      const existing = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, userName)));
      if (existing.length > 0) {
        // Update phone if missing
        if (!existing[0].phone && phone) {
          await db.update(groupMembers).set({ phone: phone.trim() })
            .where(eq(groupMembers.id, existing[0].id));
        }
        return res.json({ group, member: { ...existing[0], phone: phone.trim() }, status: 'already_member' });
      }

      const pendingRequest = await db.select().from(groupJoinRequests)
        .where(and(
          eq(groupJoinRequests.groupId, group.id),
          eq(groupJoinRequests.userName, userName),
          eq(groupJoinRequests.status, 'pending')
        ));
      if (pendingRequest.length > 0) {
        return res.json({ group, status: 'pending', request: pendingRequest[0] });
      }

      const [request] = await db.insert(groupJoinRequests).values({
        groupId: group.id,
        userName,
        phone: phone.trim(),
        status: 'pending',
      }).returning();

      res.json({ group, status: 'pending', request });
    } catch (err) {
      console.error('[groups] join error:', err);
      res.status(500).json({ error: 'فشل الانضمام' });
    }
  });

  app.get('/api/groups/:code/join-requests', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const requests = await db.select().from(groupJoinRequests)
        .where(and(eq(groupJoinRequests.groupId, group.id), eq(groupJoinRequests.status, 'pending')))
        .orderBy(desc(groupJoinRequests.createdAt));

      res.json({ requests });
    } catch (err) {
      console.error('[groups] join-requests error:', err);
      res.status(500).json({ error: 'فشل جلب الطلبات' });
    }
  });

  app.post('/api/groups/:code/join-requests/:requestId/approve', async (req, res) => {
    try {
      const { leaderKey } = req.body;
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const adminMember = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.memberKey, leaderKey), eq(groupMembers.isAdmin, true)));
      if (adminMember.length === 0) return res.status(403).json({ error: 'غير مصرح' });

      const requestId = parseInt(req.params.requestId);
      const [request] = await db.select().from(groupJoinRequests).where(eq(groupJoinRequests.id, requestId));
      if (!request || request.groupId !== group.id || request.status !== 'pending') {
        return res.status(404).json({ error: 'الطلب غير موجود' });
      }

      await db.update(groupJoinRequests).set({ status: 'approved' }).where(eq(groupJoinRequests.id, requestId));

      const memberKey = generateKey();
      const [member] = await db.insert(groupMembers).values({
        groupId: group.id,
        userName: request.userName,
        memberKey,
        phone: request.phone || null,
        isAdmin: false,
      }).returning();

      res.json({ member });
    } catch (err) {
      console.error('[groups] approve error:', err);
      res.status(500).json({ error: 'فشل الموافقة' });
    }
  });

  app.post('/api/groups/:code/join-requests/:requestId/reject', async (req, res) => {
    try {
      const { leaderKey } = req.body;
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const adminMember = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.memberKey, leaderKey), eq(groupMembers.isAdmin, true)));
      if (adminMember.length === 0) return res.status(403).json({ error: 'غير مصرح' });

      const requestId = parseInt(req.params.requestId);
      await db.update(groupJoinRequests).set({ status: 'rejected' }).where(eq(groupJoinRequests.id, requestId));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] reject error:', err);
      res.status(500).json({ error: 'فشل الرفض' });
    }
  });

  app.get('/api/groups/:code', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
      const today = new Date().toISOString().split('T')[0];

      // عداد "قرأوا اليوم" — يجمع من group_reading_logs (الأساس) و assignment_readings (احتياطي)
      const readTodayResult = await pool.query(
        `SELECT DISTINCT user_name FROM (
           SELECT user_name FROM group_reading_logs
           WHERE group_id = $1 AND date = $2
           UNION
           SELECT user_name FROM assignment_readings
           WHERE group_id = $1 AND completed = true
             AND COALESCE(completed_date, TO_CHAR(completed_at, 'YYYY-MM-DD')) = $2
         ) t`,
        [group.id, today]
      );
      const readTodayNames = new Set<string>(readTodayResult.rows.map((r: any) => r.user_name));
      const readTodayCount: number = readTodayNames.size;

      const membersWithStatus = members.map((m: any) => ({
        ...m,
        readToday: readTodayNames.has(m.userName),
        log: null,
      }));

      const allLogs = await db.select().from(groupReadingLogs)
        .where(eq(groupReadingLogs.groupId, group.id));
      const uniqueChaptersRead = new Set(allLogs.map(l => `${l.book}-${l.chapter}`)).size;

      res.json({
        group,
        members: membersWithStatus,
        stats: {
          totalMembers: members.length,
          readToday: readTodayCount,
          chaptersRead: uniqueChaptersRead,
        },
      });
    } catch (err) {
      console.error('[groups] get error:', err);
      res.status(500).json({ error: 'فشل تحميل المجموعة' });
    }
  });

  app.post('/api/groups/:code/reading', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { userName, book, chapter, timeSpent, scrollPercent } = req.body;
      const date = new Date().toISOString().split('T')[0];

      let quality = 'unknown';
      if (timeSpent < 30) quality = 'fast';
      else if (scrollPercent > 70 && timeSpent > 60) quality = 'genuine';
      else quality = 'normal';

      const existing = await db.select().from(groupReadingLogs)
        .where(and(
          eq(groupReadingLogs.groupId, group.id),
          eq(groupReadingLogs.userName, userName),
          eq(groupReadingLogs.date, date),
          eq(groupReadingLogs.book, book),
          eq(groupReadingLogs.chapter, chapter),
        ));

      if (existing.length > 0) {
        return res.json({ log: existing[0], alreadyLogged: true });
      }

      const [log] = await db.insert(groupReadingLogs).values({
        groupId: group.id,
        userName,
        book,
        chapter,
        date,
        timeSpent,
        scrollPercent,
        quality,
      }).returning();

      try {
        const cps = await db.select().from(challengeParticipants)
          .where(eq(challengeParticipants.groupId, group.id));
        for (const cp of cps) {
          const [ch] = await db.select().from(churchChallenges)
            .where(eq(churchChallenges.id, cp.challengeId));
          if (ch && ch.isActive && ch.bookName === book && chapter >= ch.startChapter && chapter <= ch.endChapter) {
            await db.update(challengeParticipants)
              .set({ totalChaptersRead: (cp.totalChaptersRead || 0) + 1 })
              .where(eq(challengeParticipants.id, cp.id));
          }
        }
      } catch (e) {
        console.log('[groups] challenge progress update error (non-critical):', e);
      }

      res.json({ log });
    } catch (err) {
      console.error('[groups] reading log error:', err);
      res.status(500).json({ error: 'فشل تسجيل القراءة' });
    }
  });

  app.put('/api/groups/:code/today', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, todayBook, todayChapter, challengeTotal } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      const updates: any = {};
      if (todayBook !== undefined) updates.todayBook = todayBook;
      if (todayChapter !== undefined) updates.todayChapter = todayChapter;
      if (challengeTotal !== undefined) updates.challengeTotal = challengeTotal;

      const [updated] = await db.update(readingGroups)
        .set(updates)
        .where(eq(readingGroups.id, group.id))
        .returning();

      res.json({ group: updated });
    } catch (err) {
      console.error('[groups] update today error:', err);
      res.status(500).json({ error: 'فشل التحديث' });
    }
  });

  app.delete('/api/groups/:code/members/:memberName', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      await db.delete(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, req.params.memberName)));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] remove member error:', err);
      res.status(500).json({ error: 'فشل حذف العضو' });
    }
  });

  app.put('/api/groups/:code/members/:memberName/admin', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, isAdmin: setAdmin } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      await db.update(groupMembers)
        .set({ isAdmin: setAdmin })
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, req.params.memberName)));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] set admin error:', err);
      res.status(500).json({ error: 'فشل تغيير الدور' });
    }
  });

  app.post('/api/groups/:code/add-admin', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, name, phone } = req.body;
      if (!name || !phone) return res.status(400).json({ error: 'الاسم ورقم الموبايل مطلوبان' });

      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      const normalizedPhone = String(phone).trim().replace(/\s+/g, '');

      // إذا كان موجوداً بالفعل — نحوّله لأدمن فقط
      const [existing] = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.phone, normalizedPhone)));

      if (existing) {
        await db.update(groupMembers)
          .set({ isAdmin: true })
          .where(eq(groupMembers.id, existing.id));
        return res.json({ memberKey: existing.memberKey, alreadyMember: true });
      }

      const memberKey = generateKey();
      await db.insert(groupMembers).values({
        groupId: group.id,
        userName: name.trim(),
        memberKey,
        phone: normalizedPhone,
        isAdmin: true,
      });

      res.json({ memberKey });
    } catch (err) {
      console.error('[groups] add-admin error:', err);
      res.status(500).json({ error: 'فشل إضافة الأدمن' });
    }
  });

  app.post('/api/groups/:code/leave', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { memberKey } = req.body;
      if (!memberKey) return res.status(400).json({ error: 'مطلوب معرف العضو' });

      const [member] = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.memberKey, memberKey)));
      if (!member) return res.status(404).json({ error: 'العضو غير موجود' });

      if (member.isAdmin) {
        const admins = await db.select().from(groupMembers)
          .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.isAdmin, true)));
        if (admins.length <= 1) {
          return res.status(400).json({ error: 'يجب تعيين أدمن آخر قبل مغادرة المجموعة' });
        }
      }

      await db.delete(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.memberKey, memberKey)));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] leave error:', err);
      res.status(500).json({ error: 'فشل مغادرة المجموعة' });
    }
  });

  app.get('/api/groups/:code/messages', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const messages = await db.select().from(groupMessages)
        .where(eq(groupMessages.groupId, group.id))
        .orderBy(desc(groupMessages.createdAt))
        .limit(100);

      const mutedMembers = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.isMuted, true)));
      const mutedNames = new Set(mutedMembers.map(m => m.userName));

      const filtered = messages.filter(m => !mutedNames.has(m.userName));
      res.json({ messages: filtered.reverse() });
    } catch (err) {
      console.error('[groups] messages error:', err);
      res.status(500).json({ error: 'فشل تحميل الرسائل' });
    }
  });

  app.post('/api/groups/:code/messages', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { userName, message } = req.body;
      if (!userName || !message) {
        return res.status(400).json({ error: 'الرسالة واسم المستخدم مطلوبان' });
      }

      const mutedCheck = await db.select().from(groupMembers)
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, userName), eq(groupMembers.isMuted, true)));
      if (mutedCheck.length > 0) {
        return res.status(403).json({ error: 'تم كتم هذا العضو' });
      }

      const [msg] = await db.insert(groupMessages).values({
        groupId: group.id,
        userName,
        message,
      }).returning();

      res.json({ message: msg });
    } catch (err) {
      console.error('[groups] send message error:', err);
      res.status(500).json({ error: 'فشل إرسال الرسالة' });
    }
  });

  app.put('/api/groups/:code/messages/:messageId/pin', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      const [msg] = await db.update(groupMessages)
        .set({ isPinned: true })
        .where(eq(groupMessages.id, parseInt(req.params.messageId)))
        .returning();

      res.json({ message: msg });
    } catch (err) {
      console.error('[groups] pin error:', err);
      res.status(500).json({ error: 'فشل تثبيت الرسالة' });
    }
  });

  app.delete('/api/groups/:code/messages/:messageId', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      await db.delete(groupMessages).where(eq(groupMessages.id, parseInt(req.params.messageId)));
      res.json({ success: true });
    } catch (err) {
      console.error('[groups] delete message error:', err);
      res.status(500).json({ error: 'فشل حذف الرسالة' });
    }
  });

  app.put('/api/groups/:code/members/:memberName/mute', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, muted } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      await db.update(groupMembers)
        .set({ isMuted: muted })
        .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userName, req.params.memberName)));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] mute error:', err);
      res.status(500).json({ error: 'فشل كتم العضو' });
    }
  });

  app.get('/api/groups/:code/reports', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const logs = await db.select().from(groupReadingLogs)
        .where(eq(groupReadingLogs.groupId, group.id))
        .orderBy(desc(groupReadingLogs.createdAt));

      res.json({ logs });
    } catch (err) {
      console.error('[groups] reports error:', err);
      res.status(500).json({ error: 'فشل تحميل التقارير' });
    }
  });

  app.get('/api/groups/:code/leaderboard', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const logs = await db.select().from(groupReadingLogs)
        .where(eq(groupReadingLogs.groupId, group.id));

      const memberStats: Record<string, { chaptersReadCount: number; lastReadingDate: string; totalReadingTimeMinutes: number }> = {};
      const seenChapters = new Set<string>();
      for (const log of logs) {
        if (!memberStats[log.userName]) {
          memberStats[log.userName] = { chaptersReadCount: 0, lastReadingDate: '', totalReadingTimeMinutes: 0 };
        }
        const chapterKey = `${log.userName}|${log.book}|${log.chapter}`;
        if (!seenChapters.has(chapterKey)) {
          seenChapters.add(chapterKey);
          memberStats[log.userName].chaptersReadCount++;
        }
        memberStats[log.userName].totalReadingTimeMinutes += Math.round((log.timeSpent || 0) / 60);
        if (log.date > memberStats[log.userName].lastReadingDate) {
          memberStats[log.userName].lastReadingDate = log.date;
        }
      }

      const leaderboard = Object.entries(memberStats)
        .map(([userName, stats]) => ({ userName, ...stats }))
        .sort((a, b) => b.chaptersReadCount - a.chaptersReadCount)
        .slice(0, 10);

      res.json({ leaderboard });
    } catch (err) {
      console.error('[groups] leaderboard error:', err);
      res.status(500).json({ error: 'فشل تحميل ترتيب القراءة' });
    }
  });

  app.get('/api/groups/:code/leader-report', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const leaderKey = req.query.leaderKey as string || '';
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const logs = await db.select().from(groupReadingLogs)
        .where(eq(groupReadingLogs.groupId, group.id));

      const weeklyLogs = logs.filter(l => l.date >= weekAgo);
      const weeklyChapters = new Set(weeklyLogs.map(l => `${l.book}-${l.chapter}`)).size;

      const lastReadByMember: Record<string, string> = {};
      for (const log of logs) {
        if (!lastReadByMember[log.userName] || log.date > lastReadByMember[log.userName]) {
          lastReadByMember[log.userName] = log.date;
        }
      }

      const inactiveMembers = members.filter(m => {
        const lastRead = lastReadByMember[m.userName];
        return !lastRead || lastRead < threeDaysAgo;
      }).map(m => m.userName);

      res.json({
        groupName: group.name,
        totalMembers: members.length,
        chaptersThisWeek: weeklyChapters,
        inactiveMembers,
      });
    } catch (err) {
      console.error('[groups] leader report error:', err);
      res.status(500).json({ error: 'فشل تحميل التقرير' });
    }
  });

  app.post('/api/groups/:code/missions', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, title, bookName, startChapter, endChapter, deadline } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      await db.update(groupMissions).set({ isActive: false })
        .where(and(eq(groupMissions.groupId, group.id), eq(groupMissions.isActive, true)));

      const [mission] = await db.insert(groupMissions).values({
        groupId: group.id,
        title,
        bookName,
        startChapter,
        endChapter,
        deadline,
        createdBy: req.body.userName || group.leaderName,
      }).returning();

      res.json({ mission });
    } catch (err) {
      console.error('[groups] create mission error:', err);
      res.status(500).json({ error: 'فشل إنشاء المهمة' });
    }
  });

  app.get('/api/groups/:code/missions', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const missions = await db.select().from(groupMissions)
        .where(and(eq(groupMissions.groupId, group.id), eq(groupMissions.isActive, true)));

      const activeMission = missions[0] || null;

      if (activeMission) {
        const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, group.id));
        const logs = await db.select().from(groupReadingLogs)
          .where(eq(groupReadingLogs.groupId, group.id));

        const missionChapters = new Set<string>();
        for (let ch = activeMission.startChapter; ch <= activeMission.endChapter; ch++) {
          missionChapters.add(`${activeMission.bookName}-${ch}`);
        }
        const totalChapters = missionChapters.size;

        const memberProgress: Record<string, number> = {};
        for (const m of members) { memberProgress[m.userName] = 0; }

        for (const log of logs) {
          const key = `${log.book}-${log.chapter}`;
          if (missionChapters.has(key) && memberProgress[log.userName] !== undefined) {
            memberProgress[log.userName]++;
          }
        }

        const completedMembers = Object.values(memberProgress).filter(c => c >= totalChapters).length;
        const groupProgress = members.length > 0 ? Math.round((completedMembers / members.length) * 100) : 0;

        return res.json({
          mission: activeMission,
          totalChapters,
          memberProgress,
          completedMembers,
          totalMembers: members.length,
          groupProgress,
        });
      }

      res.json({ mission: null });
    } catch (err) {
      console.error('[groups] get missions error:', err);
      res.status(500).json({ error: 'فشل تحميل المهمة' });
    }
  });

  app.get('/api/groups/:code/assignments', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const assignments = await db.select().from(groupAssignments)
        .where(and(eq(groupAssignments.groupId, group.id), eq(groupAssignments.isActive, true)))
        .orderBy(desc(groupAssignments.createdAt));

      res.json({ assignments });
    } catch (err) {
      console.error('[groups] get assignments error:', err);
      res.status(500).json({ error: 'فشل تحميل القراءات المطلوبة' });
    }
  });

  app.post('/api/groups/:code/assignments', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey, userName, type, title, bookName, chapters, deadline } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      const date = new Date().toISOString().split('T')[0];
      const [assignment] = await db.insert(groupAssignments).values({
        groupId: group.id,
        type,
        title: title || null,
        bookName,
        chapters: chapters,
        assignedBy: userName,
        assignedDate: date,
        deadline: deadline || null,
      }).returning();

      res.json({ assignment });
    } catch (err) {
      console.error('[groups] create assignment error:', err);
      res.status(500).json({ error: 'فشل إنشاء القراءة المطلوبة' });
    }
  });

  app.delete('/api/groups/:code/assignments/:assignmentId', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const { leaderKey } = req.body;
      const authorized = await isAdminByLeaderKey(group, leaderKey);
      if (!authorized) return res.status(403).json({ error: 'غير مسموح' });

      await db.update(groupAssignments)
        .set({ isActive: false })
        .where(eq(groupAssignments.id, parseInt(req.params.assignmentId)));

      res.json({ success: true });
    } catch (err) {
      console.error('[groups] delete assignment error:', err);
      res.status(500).json({ error: 'فشل حذف القراءة' });
    }
  });

  app.get('/api/groups/:code/assignments/:assignmentId/progress', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const assignmentId = parseInt(req.params.assignmentId);
      const readings = await db.select().from(assignmentReadings)
        .where(and(eq(assignmentReadings.assignmentId, assignmentId), eq(assignmentReadings.groupId, group.id)));

      const memberProgress: Record<string, { completed: number; total_time: number; chapters: Record<number, { timeSpent: number; scrollCount: number; completed: boolean }> }> = {};

      for (const r of readings) {
        if (!memberProgress[r.userName]) {
          memberProgress[r.userName] = { completed: 0, total_time: 0, chapters: {} };
        }
        memberProgress[r.userName].chapters[r.chapter] = {
          timeSpent: r.timeSpent || 0,
          scrollCount: r.scrollCount || 0,
          completed: r.completed || false,
        };
        if (r.completed) {
          memberProgress[r.userName].completed++;
          memberProgress[r.userName].total_time += (r.timeSpent || 0);
        }
      }

      res.json({ memberProgress });
    } catch (err) {
      console.error('[groups] get assignment progress error:', err);
      res.status(500).json({ error: 'فشل تحميل تقدم القراءة' });
    }
  });

  app.post('/api/groups/:code/assignments/:assignmentId/open', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const assignmentId = parseInt(req.params.assignmentId);
      const { userName, bookName, chapter } = req.body;
      if (!userName || !bookName || !chapter) return res.status(400).json({ error: 'بيانات ناقصة' });

      const existing = await db.select().from(assignmentReadings)
        .where(and(
          eq(assignmentReadings.assignmentId, assignmentId),
          eq(assignmentReadings.groupId, group.id),
          eq(assignmentReadings.userName, userName),
          eq(assignmentReadings.chapter, chapter),
        ));

      if (existing.length === 0) {
        await db.insert(assignmentReadings).values({
          assignmentId,
          groupId: group.id,
          userName,
          bookName,
          chapter,
          timeSpent: 0,
          scrollCount: 0,
          scrollDepth: 0,
          completed: false,
          openedAt: new Date(),
        });
      }

      res.json({ ok: true });
    } catch (err) {
      console.error('[groups] assignment open error:', err);
      res.status(500).json({ error: 'فشل تسجيل فتح الإصحاح' });
    }
  });

  app.post('/api/groups/:code/assignments/:assignmentId/read', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const assignmentId = parseInt(req.params.assignmentId);
      const { userName, bookName, timeSpent, scrollCount, scrollDepth } = req.body;
      const chapter = parseInt(req.body.chapter);

      const existing = await db.select().from(assignmentReadings)
        .where(and(
          eq(assignmentReadings.assignmentId, assignmentId),
          eq(assignmentReadings.groupId, group.id),
          eq(assignmentReadings.userName, userName),
          eq(assignmentReadings.chapter, chapter),
        ));

      if (existing.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        await pool.query(
          `UPDATE assignment_readings SET
            time_spent = GREATEST(COALESCE(time_spent,0), $1),
            scroll_count = GREATEST(COALESCE(scroll_count,0), $2),
            scroll_depth = GREATEST(COALESCE(scroll_depth,0), $3),
            completed = true,
            completed_at = NOW(),
            completed_date = $4
           WHERE id = $5`,
          [timeSpent || 0, scrollCount || 0, scrollDepth || 0, today, existing[0].id]
        );
        const updated = { ...existing[0], completed: true, completedAt: new Date() };

        // سجّل في group_reading_logs حتى تُحتسب للإحصائيات اليومية
        try {
          const date = new Date().toISOString().split('T')[0];
          const scrollPct = (scrollCount || 0) > 0 ? Math.min((scrollCount || 0) * 10, 100) : 0;
          const quality = (timeSpent || 0) < 30 ? 'fast' : (scrollPct > 70 && (timeSpent || 0) > 60 ? 'genuine' : 'normal');
          await pool.query(
            `INSERT INTO group_reading_logs (group_id, user_name, book, chapter, date, time_spent, scroll_percent, quality)
             SELECT $1,$2,$3,$4,$5,$6,$7,$8
             WHERE NOT EXISTS (
               SELECT 1 FROM group_reading_logs
               WHERE group_id=$1 AND user_name=$2 AND date=$5 AND book=$3 AND chapter=$4
             )`,
            [group.id, userName, bookName, chapter, date, timeSpent || 0, scrollPct, quality]
          );
        } catch (logErr) {
          console.error('[groups] assignment read - log insert error:', logErr);
        }

        // تحقق هل أتم العضو كل إصحاحات كل القراءات
        const allDoneCheck = await pool.query(
          `SELECT COUNT(*) = 0 AS all_done
           FROM (
             SELECT ga.id, ch::int AS chapter
             FROM group_assignments ga
             CROSS JOIN LATERAL unnest(ga.chapters::int[]) AS ch
             WHERE ga.group_id = $1
           ) required
           WHERE NOT EXISTS (
             SELECT 1 FROM assignment_readings ar
             WHERE ar.assignment_id = required.id
               AND ar.user_name = $2
               AND ar.chapter = required.chapter
               AND ar.completed = true
           )`,
          [group.id, userName]
        );
        const allDone: boolean = allDoneCheck.rows[0]?.all_done === true;

        return res.json({ reading: updated, allDone });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const insertResult = await pool.query(
        `INSERT INTO assignment_readings
           (assignment_id, group_id, user_name, book_name, chapter,
            time_spent, scroll_count, scroll_depth,
            completed, opened_at, completed_at, completed_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW(),NOW(),$9,NOW())
         RETURNING *`,
        [assignmentId, group.id, userName, bookName, chapter,
         timeSpent || 0, scrollCount || 0, scrollDepth || 0, todayStr]
      );
      const reading = insertResult.rows[0];

      try {
        const date = new Date().toISOString().split('T')[0];
        const scrollPct = (scrollCount || 0) > 0 ? Math.min((scrollCount || 0) * 10, 100) : 0;
        const quality = (timeSpent || 0) < 30 ? 'fast' : (scrollPct > 70 && (timeSpent || 0) > 60 ? 'genuine' : 'normal');
        await pool.query(
          `INSERT INTO group_reading_logs (group_id, user_name, book, chapter, date, time_spent, scroll_percent, quality)
           SELECT $1,$2,$3,$4,$5,$6,$7,$8
           WHERE NOT EXISTS (
             SELECT 1 FROM group_reading_logs
             WHERE group_id=$1 AND user_name=$2 AND date=$5 AND book=$3 AND chapter=$4
           )`,
          [group.id, userName, bookName, chapter, date, timeSpent || 0, scrollPct, quality]
        );
      } catch (logErr) {
        console.error('[groups] assignment read - log insert error (new):', logErr);
      }

      try {
        const cps = await db.select().from(challengeParticipants)
          .where(eq(challengeParticipants.groupId, group.id));
        for (const cp of cps) {
          const [ch] = await db.select().from(churchChallenges)
            .where(eq(churchChallenges.id, cp.challengeId));
          if (ch && ch.isActive && ch.bookName === bookName && chapter >= ch.startChapter && chapter <= ch.endChapter) {
            await db.update(challengeParticipants)
              .set({ totalChaptersRead: (cp.totalChaptersRead || 0) + 1 })
              .where(eq(challengeParticipants.id, cp.id));
          }
        }
      } catch (e) {
        console.log('[groups] challenge update from assignment (non-critical):', e);
      }

      const allDoneCheck2 = await pool.query(
        `SELECT COUNT(*) = 0 AS all_done
         FROM (
           SELECT ga.id, ch::int AS chapter
           FROM group_assignments ga
           CROSS JOIN LATERAL unnest(ga.chapters::int[]) AS ch
           WHERE ga.group_id = $1
         ) required
         WHERE NOT EXISTS (
           SELECT 1 FROM assignment_readings ar
           WHERE ar.assignment_id = required.id
             AND ar.user_name = $2
             AND ar.chapter = required.chapter
             AND ar.completed = true
         )`,
        [group.id, userName]
      );
      const allDone2: boolean = allDoneCheck2.rows[0]?.all_done === true;

      res.json({ reading, allDone: allDone2 });
    } catch (err) {
      console.error('[groups] assignment read error:', err);
      res.status(500).json({ error: 'فشل تسجيل القراءة' });
    }
  });

  app.get('/api/groups/:code/assignments/:assignmentId/admin-report', async (req, res) => {
    try {
      const [group] = await db.select().from(readingGroups).where(eq(readingGroups.groupCode, req.params.code.toUpperCase()));
      if (!group) return res.status(404).json({ error: 'المجموعة غير موجودة' });

      const assignmentId = parseInt(req.params.assignmentId);
      const [assignment] = await db.select().from(groupAssignments).where(eq(groupAssignments.id, assignmentId));
      if (!assignment) return res.status(404).json({ error: 'القراءة غير موجودة' });

      const members = await db.select().from(groupMembers)
        .where(eq(groupMembers.groupId, group.id));

      const readings = await db.select().from(assignmentReadings)
        .where(and(eq(assignmentReadings.assignmentId, assignmentId), eq(assignmentReadings.groupId, group.id)));

      const chapters = (assignment.chapters as number[]) || [];

      const report = members.map(m => {
        const memberReadings = readings.filter(r => r.userName === m.userName);
        const chapterDetails = chapters.map(ch => {
          const r = memberReadings.find(mr => mr.chapter === ch);
          let quality: string | null = null;
          if (r?.completed) {
            if ((r.timeSpent || 0) < 30) quality = 'fast';
            else if ((r.scrollDepth || 0) >= 80 && (r.timeSpent || 0) >= 60) quality = 'genuine';
            else quality = 'normal';
          } else if (r?.openedAt) {
            quality = 'opened';
          }
          return {
            chapter: ch,
            timeSpent: r?.timeSpent || 0,
            scrollCount: r?.scrollCount || 0,
            scrollDepth: r?.scrollDepth || 0,
            completed: r?.completed || false,
            opened: !!r?.openedAt,
            openedAt: r?.openedAt || null,
            completedAt: r?.completedAt || null,
            quality,
          };
        });

        const completedChapters = chapterDetails.filter(c => c.completed).length;
        const openedChapters = chapterDetails.filter(c => c.opened && !c.completed).length;
        const totalTime = chapterDetails.reduce((sum, c) => sum + c.timeSpent, 0);
        const avgScrollDepth = completedChapters > 0
          ? Math.round(chapterDetails.filter(c => c.completed).reduce((sum, c) => sum + c.scrollDepth, 0) / completedChapters)
          : 0;
        const lastActivity = chapterDetails
          .map(c => c.completedAt || c.openedAt)
          .filter(Boolean)
          .sort()
          .pop() || null;

        return {
          userName: m.userName,
          completedChapters,
          openedChapters,
          totalChapters: chapters.length,
          totalTime,
          totalScrolls: chapterDetails.reduce((sum, c) => sum + c.scrollCount, 0),
          avgScrollDepth,
          lastActivity,
          chapterDetails,
        };
      });

      report.sort((a, b) => b.completedChapters - a.completedChapters);
      res.json({ report, assignment });
    } catch (err) {
      console.error('[groups] admin report error:', err);
      res.status(500).json({ error: 'فشل تحميل التقرير' });
    }
  });
}
