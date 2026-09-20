// Função Vercel: registra uma visualização de um produto na página Viral.
// Feita via servidor (não direto pelo navegador) porque quem visualiza não é
// o dono do produto, e a regra do Firestore só deixa o dono escrever no
// próprio catálogo. O ponto de quem visualizou é dado direto pelo cliente
// (grava no próprio documento dele, isso a regra permite); aqui só contamos
// a visualização do lado do produto/afiliado dono.
// Rota: POST /api/registrar-visualizacao  { uid, itemId }

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
      .update({ visualizacoesViral: admin.firestore.FieldValue.increment(1) });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(200).json({ ok: false }); // não trava a experiência do cliente por causa de métrica
  }
};
