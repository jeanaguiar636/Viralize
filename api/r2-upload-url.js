// Função Vercel: gera uma URL temporária e segura (presigned URL)
// pra o navegador enviar o arquivo DIRETO pro Cloudflare R2.
// Rota: POST /api/r2-upload-url  { nomeArquivo, tipoArquivo }

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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
    const { nomeArquivo, tipoArquivo } = req.body;

    if (!nomeArquivo || !tipoArquivo) {
      return res.status(400).json({ erro: 'nomeArquivo e tipoArquivo são obrigatórios' });
    }

    const extensao = nomeArquivo.split('.').pop();
    const pasta = tipoArquivo.startsWith('video/') ? 'videos'
                : tipoArquivo.startsWith('audio/') ? 'audios'
                : 'imagens';
    const chave = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;

    const comando = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: chave,
      ContentType: tipoArquivo,
    });

    const urlUpload = await getSignedUrl(s3, comando, { expiresIn: 300 });
    const urlPublica = `${process.env.R2_PUBLIC_URL}/${chave}`;

    res.status(200).json({ urlUpload, urlPublica, chave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Falha ao gerar URL de upload' });
  }
};
