// Função Vercel: registra um clique num produto do catálogo de um afiliado.
// Feita via servidor (não direto pelo navegador) porque a loja pública
// não tem login, e não queremos abrir o Firestore pra escrita anônima direta.
// Rota: POST /api/registrar-clique  { uid, itemId }

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
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { uid, itemId } = req.body;
    if (!uid || !itemId) {
      return res.status(400).json({ erro: 'uid e itemId são obrigatórios' });
    }

    await db.collection('usuarios').doc(uid).collection('catalogo').doc(itemId)
      .update({ cliques: admin.firestore.FieldValue.increment(1) });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false }); // não trava a experiência do cliente por causa de métrica
  }
};
