export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { email, name, divisi, inviteLink } = req.body;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Zerava Studio <admin@zerava.web.id>',
      to: [email],
      subject: 'Undangan Resmi Member Zerava Filmboard — Buat Password Akunmu',
      html: `
        <div style="font-family:sans-serif;background:#11110F;color:#F5F2EB;padding:32px;border-radius:16px;max-width:520px;">
          <h2 style="color:#D8BBA8;">Wellcome to Zerava FilmBoard!</h2>
          <p>Halo <b>${name}</b> (Divisi: <b>${divisi}</b>),</p>
          <p>Admin Zerava Production telah mendaftarkan emailmu di <b>Zerava Filmboard</b>.</p>
          <p>Silakan klik tombol di bawah ini untuk langsung menuju halaman pembuatan password:</p>
          <p style="margin:28px 0;">
            <a href="${inviteLink}" style="background:#2B6E7E;color:#FFFFFF;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:10px;">
              Buat Password Sekarang
            </a>
          </p>
        </div>
      `
    })
  });

  const data = await response.json();
  return res.status(200).json(data);
}
