// Função Vercel: consulta o oEmbed oficial do TikTok.
// Aceita tanto links completos (tiktok.com/@user/video/123)
// quanto links curtos (vt.tiktok.com/xxxx), porque o TikTok resolve isso no próprio serviço.
// Rota: GET /api/tiktok-oembed?url=LINK_DO_TIKTOK

module.exports = async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ erro: 'Parâmetro "url" é obrigatório' });
  }

  try {
    const resposta = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);

    if (!resposta.ok) {
      return res.status(404).json({ erro: 'Não foi possível carregar esse vídeo do TikTok' });
    }

    const dados = await resposta.json();
    res.status(200).json(dados);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Falha ao consultar o TikTok' });
  }
};
