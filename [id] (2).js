// Função Vercel: gera uma página com meta tags Open Graph dinâmicas
// para cada post, e redireciona humanos para o app real.
// Rota final: https://SEU-DOMINIO.vercel.app/p/ID_DO_POST

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

module.exports = async (req, res) => {
  const { id } = req.query;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const dominio = `https://${host}`;

  try {
    const doc = await db.collection('posts').doc(id).get();

    if (!doc.exists) {
      res.writeHead(302, { Location: dominio });
      return res.end();
    }

    const post = doc.data();

    const titulo = post.tipo === 'produto'
      ? `${post.produtoNome} — R$ ${post.produtoPreco || ''}`
      : `Publicação de ${post.autorNome || 'um afiliado'} no Viralize`;

    const descricao = (post.texto || 'Confira essa publicação no Viralize — a rede social dos afiliados!').slice(0, 150);

    // Usa a imagem do produto ou do vídeo/mídia; se não tiver nenhuma, cai num ícone genérico
    const imagem = post.produtoImg || post.midiaUrl || 'https://placehold.co/1200x630/ff5c35/ffffff?text=Viralize';

    // URL real do app (a pessoa cai na página inicial do Viralize)
    const urlApp = dominio + '/';

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${escapeHtml(titulo)}">
  <meta property="og:description" content="${escapeHtml(descricao)}">
  <meta property="og:image" content="${imagem}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0; url=${urlApp}">
  <title>${escapeHtml(titulo)}</title>
</head>
<body>
  <p>Redirecionando... <a href="${urlApp}">Clique aqui se não for redirecionado</a></p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    console.error(err);
    res.writeHead(302, { Location: dominio });
    res.end();
  }
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
