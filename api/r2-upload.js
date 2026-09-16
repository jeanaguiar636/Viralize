// Função Vercel: recebe o arquivo (em base64) do navegador e faz o upload
// pro Cloudflare R2 DIRETO DO SERVIDOR (sem o navegador falar com o R2).
// Isso evita qualquer problema de CORS, porque quem fala com o Cloudflare
// é o próprio Vercel, não o celular da pessoa.
// Rota: POST /api/r2-upload  { nomeArquivo, tipoArquivo, dadosBase64 }

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido' });
  }

  try {
    const { nomeArquivo, tipoArquivo, dadosBase64 } = req.body;

    if (!nomeArquivo || !tipoArquivo || !dadosBase64) {
      return res.status(400).json({ erro: 'nomeArquivo, tipoArquivo e dadosBase64 são obrigatórios' });
    }

    const buffer = Buffer.from(dadosBase64, 'base64');

    // Limite de segurança: evita travar em arquivos gigantes (o limite da própria Vercel já é ~4.5MB)
    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(413).json({ erro: 'Arquivo muito grande. Envie algo até 4MB.' });
    }

    const extensao = nomeArquivo.split('.').pop();
    const pasta = tipoArquivo.startsWith('video/') ? 'videos'
                : tipoArquivo.startsWith('audio/') ? 'audios'
                : 'imagens';
    const chave = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: chave,
      Body: buffer,
      ContentType: tipoArquivo,
    }));

    const urlPublica = `${process.env.R2_PUBLIC_URL}/${chave}`;

    res.status(200).json({ urlPublica, chave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Falha ao enviar arquivo pro R2: ' + err.message });
  }
};
      
