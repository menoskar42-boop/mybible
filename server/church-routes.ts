import type { Express } from "express";
import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  churches, churchAdmins, readingGroups, groupMembers,
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

const ADMIN_PHONE = process.env.ADMIN_PHONE || '01552406406';

export function registerChurchRoutes(app: Express) {

  app.post('/api/ministry/login', async (req, res) => {
    try {
      const { name, phone } = req.body;
      if (!name || !phone) {
        return res.status(400).json({ error: 'الاسم ورقم الموبايل مطلوبان' });
      }

      const normalizedPhone = phone.trim().replace(/\s+/g, '');

      // Super admin bypass
      if (normalizedPhone === ADMIN_PHONE) {
        return res.json({ role: 'admin', groups: [] });
      }

      // Look up member records by phone
      const members = await db.select({
        member: groupMembers,
        group: readingGroups,
      }).from(groupMembers)
        .innerJoin(readingGroups, eq(groupMembers.groupId, readingGroups.id))
        .where(eq(groupMembers.phone, normalizedPhone));

      if (members.length === 0) {
        return res.status(401).json({
          error: 'رقم الموبايل غير مسجل. يرجى الانضمام لمجموعة أولاً باستخدام كود المجموعة.'
        });
      }

      // Verify name matches at least one record
      const nameMatch = members.find(
        m => m.member.userName.trim() === name.trim()
      );
      if (!nameMatch) {
        return res.status(401).json({
          error: 'الاسم لا يطابق الرقم المسجل. تأكد من الاسم الذي سجلته عند الانضمام.'
        });
      }

      // Build groups list with memberKeys
      const groups = members.map(m => ({
        groupCode: m.group.groupCode,
        groupName: m.group.name,
        churchName: m.group.churchName || '',
        memberKey: m.member.memberKey,
        userName: m.member.userName,
        isAdmin: m.member.isAdmin || m.group.leaderKey === m.member.memberKey,
      }));

      res.json({ role: 'user', groups });
    } catch (err) {
      console.error('[ministry] login error:', err);
      res.status(500).json({ error: 'فشل تسجيل الدخول' });
    }
  });

  app.post('/api/churches/request', async (req, res) => {
    try {
      const { name, governorate, adminName, adminPhone, notes } = req.body;
      if (!name || !governorate || !adminName || !adminPhone) {
        return res.status(400).json({ error: 'جميع الحقول المطلوبة يجب ملؤها' });
      }

      const [church] = await db.insert(churches).values({
        name,
        governorate,
        adminName,
        adminPhone,
        notes: notes || null,
        status: 'pending',
      }).returning();

      res.json({ church });
    } catch (err) {
      console.error('[churches] request error:', err);
      res.status(500).json({ error: 'فشل إرسال الطلب' });
    }
  });

  app.get('/api/churches', async (req, res) => {
    try {
      const approved = await db.select().from(churches).where(eq(churches.status, 'approved'));
      res.json({ churches: approved });
    } catch (err) {
      console.error('[churches] list error:', err);
      res.status(500).json({ error: 'فشل تحميل الكنائس' });
    }
  });

  app.get('/api/churches/all', async (req, res) => {
    try {
      const all = await db.select().from(churches);
      res.json({ churches: all });
    } catch (err) {
      console.error('[churches] list all error:', err);
      res.status(500).json({ error: 'فشل تحميل الكنائس' });
    }
  });

  app.get('/api/churches/pending', async (req, res) => {
    try {
      const phone = req.query.phone as string;
      if (phone !== ADMIN_PHONE) {
        return res.status(403).json({ error: 'غير مسموح' });
      }
      const pending = await db.select().from(churches).where(eq(churches.status, 'pending'));
      res.json({ churches: pending });
    } catch (err) {
      console.error('[churches] pending error:', err);
      res.status(500).json({ error: 'فشل تحميل الطلبات' });
    }
  });

  app.put('/api/churches/:id/approve', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [church] = await db.update(churches)
        .set({ status: 'approved' })
        .where(eq(churches.id, id))
        .returning();

      if (!church) return res.status(404).json({ error: 'الكنيسة غير موجودة' });

      const existing = await db.select().from(churchAdmins)
        .where(and(eq(churchAdmins.churchId, id), eq(churchAdmins.phone, church.adminPhone)));
      if (existing.length === 0) {
        await db.insert(churchAdmins).values({
          churchId: id,
          phone: church.adminPhone,
          name: church.adminName,
        });
      }

      res.json({ church });
    } catch (err) {
      console.error('[churches] approve error:', err);
      res.status(500).json({ error: 'فشل الموافقة' });
    }
  });

  app.put('/api/churches/:id/reject', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [church] = await db.update(churches)
        .set({ status: 'rejected' })
        .where(eq(churches.id, id))
        .returning();

      if (!church) return res.status(404).json({ error: 'الكنيسة غير موجودة' });
      res.json({ church });
    } catch (err) {
      console.error('[churches] reject error:', err);
      res.status(500).json({ error: 'فشل الرفض' });
    }
  });

  app.get('/api/churches/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [church] = await db.select().from(churches).where(eq(churches.id, id));
      if (!church || church.status !== 'approved') {
        return res.status(404).json({ error: 'الكنيسة غير موجودة' });
      }

      const groups = await db.select().from(readingGroups).where(eq(readingGroups.churchId, id));
      const admins = await db.select().from(churchAdmins).where(eq(churchAdmins.churchId, id));

      res.json({ church, groups, admins });
    } catch (err) {
      console.error('[churches] get error:', err);
      res.status(500).json({ error: 'فشل تحميل الكنيسة' });
    }
  });

  app.get('/api/churches/:id/is-admin', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const phone = req.query.phone as string;
      if (!phone) return res.json({ isAdmin: false });

      const admins = await db.select().from(churchAdmins)
        .where(and(eq(churchAdmins.churchId, id), eq(churchAdmins.phone, phone)));

      res.json({ isAdmin: admins.length > 0 });
    } catch (err) {
      res.json({ isAdmin: false });
    }
  });

  app.post('/api/churches/:id/groups', async (req, res) => {
    try {
      const churchId = parseInt(req.params.id);
      const { name, ageGroup, description, leaderName, leaderPhone } = req.body;

      if (!name || !leaderName) {
        return res.status(400).json({ error: 'اسم المجموعة واسم الخادم مطلوبان' });
      }

      const [church] = await db.select().from(churches).where(eq(churches.id, churchId));
      if (!church || church.status !== 'approved') {
        return res.status(404).json({ error: 'الكنيسة غير موجودة' });
      }

      const admins = await db.select().from(churchAdmins)
        .where(and(eq(churchAdmins.churchId, churchId), eq(churchAdmins.phone, leaderPhone)));
      if (admins.length === 0) {
        return res.status(403).json({ error: 'غير مسموح - يجب أن تكون أدمن الكنيسة' });
      }

      const groupCode = generateCode();
      const leaderKey = generateKey();

      const [group] = await db.insert(readingGroups).values({
        groupCode,
        name,
        churchName: church.name,
        churchId,
        ageGroup: ageGroup || null,
        description: description || null,
        leaderName,
        leaderKey,
      }).returning();

      await db.insert(groupMembers).values({
        groupId: group.id,
        userName: leaderName,
        memberKey: leaderKey,
        isAdmin: true,
      });

      res.json({ group, leaderKey });
    } catch (err) {
      console.error('[churches] create group error:', err);
      res.status(500).json({ error: 'فشل إنشاء المجموعة' });
    }
  });

  app.post('/api/churches/:id/admins', async (req, res) => {
    try {
      const churchId = parseInt(req.params.id);
      const { name, phone, requestorPhone } = req.body;

      if (!name || !phone) {
        return res.status(400).json({ error: 'الاسم والموبايل مطلوبان' });
      }

      const admins = await db.select().from(churchAdmins)
        .where(and(eq(churchAdmins.churchId, churchId), eq(churchAdmins.phone, requestorPhone)));
      if (admins.length === 0) {
        return res.status(403).json({ error: 'غير مسموح' });
      }

      const existing = await db.select().from(churchAdmins)
        .where(and(eq(churchAdmins.churchId, churchId), eq(churchAdmins.phone, phone)));
      if (existing.length > 0) {
        return res.json({ admin: existing[0], alreadyExists: true });
      }

      const [admin] = await db.insert(churchAdmins).values({
        churchId,
        phone,
        name,
      }).returning();

      res.json({ admin });
    } catch (err) {
      console.error('[churches] add admin error:', err);
      res.status(500).json({ error: 'فشل إضافة أدمن' });
    }
  });
}
