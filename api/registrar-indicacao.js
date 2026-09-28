// Função Vercel: dá os 30 pontos de indicação pra quem convidou, na hora em que
// o novo afiliado se cadastra (antes isso acontecia quando o admin aprovava).
// Roda no servidor porque o novo usuário não pode escrever no perfil de outra pessoa.
// Segurança: só aceita quem prova que é o novo usuário (token do Firebase), lê o
// convite do PRÓPRIO perfil dele, e só credita uma vez por conta.
// Rota: POST /api/registrar-indicacao  { idToken }

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
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ erro: 'idToken é obrigatório' });

    const decodificado = await admin.auth().verifyIdToken(idToken);
    const novoUid = decodificado.uid;
    const refNovo = db.collection('usuarios').doc(novoUid);

    const resultado = await db.runTransaction(async (t) => {
