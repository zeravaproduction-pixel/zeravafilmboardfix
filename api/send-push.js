import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kfnevcwlbnsoavlqtacd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_O5CMGPu_C8AaMhJKbAl4Qg_zX_JYvio';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function getOrCreateVapidKeys() {
  const { data } = await sb
    .from('zerava_nicknames')
    .select('nickname')
    .eq('owner_id', '__system__')
    .eq('target_id', '__vapid__')
    .maybeSingle();

  if (data && data.nickname) {
    return JSON.parse(data.nickname);
  }

  const newKeys = webpush.generateVAPIDKeys();
  await sb.from('zerava_nicknames').upsert([
    {
      owner_id: '__system__',
      target_id: '__vapid__',
      nickname: JSON.stringify(newKeys)
    }
  ]);
  return newKeys;
}

export default async function handler(req, res) {
  try {
    const vapidKeys = await getOrCreateVapidKeys();
    webpush.setVapidDetails(
      'mailto:admin@zerava.web.id',
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    // 1. Jika browser meminta Public Key untuk mendaftarkan HP
    if (req.method === 'GET') {
      return res.status(200).json({ publicKey: vapidKeys.publicKey });
    }

    // 2. Jika ada pengiriman Push Notification ke HP member yang sedang menutup aplikasi
    if (req.method === 'POST') {
      const { title, body, page, senderId } = req.body;

      const { data: subs } = await sb
        .from('zerava_nicknames')
        .select('*')
        .eq('target_id', '__push_sub__');

      if (!subs || subs.length === 0) {
        return res.status(200).json({ sent: 0 });
      }

      const payload = JSON.stringify({
        title: title || 'Zerava Filmboard',
        body: body || 'Ada pembaruan baru di Zerava Filmboard',
        page: page || 'notifications'
      });

      const tasks = subs
        .filter((row) => senderId === 'TEST' || row.owner_id !== senderId)
        .map(async (row) => {
          try {
            const subObj = JSON.parse(row.nickname);
            await webpush.sendNotification(subObj, payload);
          } catch (err) {
            // Hapus langganan jika sudah kedaluwarsa/dihapus dari HP
            if (err.statusCode === 404 || err.statusCode === 410) {
              await sb
                .from('zerava_nicknames')
                .delete()
                .match({ owner_id: row.owner_id, target_id: '__push_sub__' });
            }
          }
        });

      await Promise.allSettled(tasks);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
