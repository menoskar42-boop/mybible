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
      const todayLogs = await db.select().from(groupReadingLogs)
        .where(and(eq(groupReadingLogs.groupId, group.id), eq(groupReadingLogs.date, today)));

      const readToday = new Set(todayLogs.map(l => l.userName));
      const membersWithStatus = members.map(m => ({
        ...m,
        readToday: readToday.has(m.userName),
        log: todayLogs.find(l => l.userName === m.userName) || null,
      }));

      const allLogs = await db.select().from(groupReadingLogs)
        .where(eq(groupReadingLogs.groupId, group.id));
      const uniqueChaptersRead = new Set(allLogs.map(l => `${l.book}-${l.chapter}`)).size;

      res.json({
        group,
        members: membersWithStatus,
        stats: {
          totalMembers: members.length,
          readToday: readToday.size,
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
      for (const log of logs) {
        if (!memberStats[log.userName]) {
          memberStats[log.userName] = { chaptersReadCount: 0, lastReadingDate: '', totalReadingTimeMinutes: 0 };
        }
        memberStats[log.userName].chaptersReadCount++;
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
      const { userName, bookName, chapter, timeSpent, scrollCount, scrollDepth } = req.body;

      const existing = await db.select().from(assignmentReadings)
        .where(and(
          eq(assignmentReadings.assignmentId, assignmentId),
          eq(assignmentReadings.groupId, group.id),
          eq(assignmentReadings.userName, userName),
          eq(assignmentReadings.chapter, chapter),
        ));

      if (existing.length > 0) {
        const [updated] = await db.update(assignmentReadings)
          .set({
            timeSpent: Math.max(existing[0].timeSpent || 0, timeSpent || 0),
            scrollCount: Math.max(existing[0].scrollCount || 0, scrollCount || 0),
            scrollDepth: Math.max(existing[0].scrollDepth || 0, scrollDepth || 0),
            completed: true,
            completedAt: new Date(),
          })
          .where(eq(assignmentReadings.id, existing[0].id))
          .returning();
        return res.json({ reading: updated });
      }

      const [reading] = await db.insert(assignmentReadings).values({
        assignmentId,
        groupId: group.id,
        userName,
        bookName,
        chapter,
        timeSpent: timeSpent || 0,
        scrollCount: scrollCount || 0,
        scrollDepth: scrollDepth || 0,
        completed: true,
        openedAt: new Date(),
        completedAt: new Date(),
      }).returning();

      const date = new Date().toISOString().split('T')[0];
      const existingLog = await db.select().from(groupReadingLogs)
        .where(and(
          eq(groupReadingLogs.groupId, group.id),
          eq(groupReadingLogs.userName, userName),
          eq(groupReadingLogs.date, date),
          eq(groupReadingLogs.book, bookName),
          eq(groupReadingLogs.chapter, chapter),
        ));

      if (existingLog.length === 0) {
        let quality = 'unknown';
        const scrollPct = scrollCount > 0 ? Math.min(scrollCount * 10, 100) : 0;
        if (timeSpent < 30) quality = 'fast';
        else if (scrollPct > 70 && timeSpent > 60) quality = 'genuine';
        else quality = 'normal';

        await db.insert(groupReadingLogs).values({
          groupId: group.id,
          userName,
          book: bookName,
          chapter,
          date,
          timeSpent: timeSpent || 0,
          scrollPercent: scrollPct,
          quality,
        });

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
      }

      res.json({ reading });
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
