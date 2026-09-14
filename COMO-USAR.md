# Viralize — Guia de Configuração e Deploy

## Estrutura do projeto
```
viralize/
├── index.html              → o app inteiro (feed, login, catálogo, ranking)
├── api/preview/[id].js     → função Vercel que gera prévia dinâmica dos links compartilhados
├── package.json            → dependência necessária pra função (firebase-admin)
└── COMO-USAR.md            → este guia
```

## Passo 1 — Criar o projeto Firebase
1. Acesse https://console.firebase.google.com e crie um projeto novo.
2. Ative **Authentication** → método "E-mail/senha".
3. Ative **Firestore Database** (modo produção).
4. Em "Configurações do projeto" → "Seus apps" → crie um app Web e copie o objeto `firebaseConfig`.
5. Cole esse objeto no `index.html`, substituindo o bloco `firebaseConfig` no início do `<script>`.

## Passo 2 — Regras do Firestore (mínimas para começar)
No console do Firebase, em Firestore → Regras, cole:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /posts/{postId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /usuarios/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
      match /catalogo/{itemId} {
        allow read: if true;
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Passo 3 — Subir pro GitHub
1. Crie um repositório novo no GitHub (ex: `viralize`).
2. Pela interface web do GitHub ("Add file" → "Upload files"), arraste todos os arquivos desta pasta mantendo a estrutura (a pasta `api/preview/` precisa ser preservada).

## Passo 4 — Criar o bucket no Cloudflare R2
1. Acesse o painel da Cloudflare → **R2** → "Create bucket". Dê um nome, ex: `viralize-midias`.
2. Nas configurações do bucket, ative **"Public Development URL"** (ou conecte um domínio próprio) — isso te dá a URL pública de acesso aos arquivos.
3. Vá em **"Manage R2 API Tokens"** → "Create API Token" → permissão de leitura e escrita nesse bucket. Guarde:
   - Access Key ID
   - Secret Access Key
   - Account ID (aparece na URL do painel R2, ex: `dash.cloudflare.com/SEU_ACCOUNT_ID/r2`)

## Passo 5 — Conectar ao Vercel
1. Acesse https://vercel.com → "Add New" → "Project".
2. Selecione o repositório `viralize` que você acabou de subir.
3. Em "Environment Variables", adicione:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   (vêm de: Firebase Console → Configurações do projeto → Contas de serviço → "Gerar nova chave privada")
   - `R2_ACCOUNT_ID` — o Account ID do passo 4
   - `R2_ACCESS_KEY_ID` — do token criado no passo 4
   - `R2_SECRET_ACCESS_KEY` — do token criado no passo 4
   - `R2_BUCKET_NAME` — o nome do bucket (ex: `viralize-midias`)
   - `R2_PUBLIC_URL` — a URL pública do bucket (ex: `https://pub-xxxx.r2.dev`), **sem barra no final**
4. Clique em "Deploy".

## Passo 6 — Ajustar domínio no código
No arquivo `api/preview/[id].js`, troque `SEUDOMINIO.com` pela URL real que o Vercel te der (ex: `viralize.vercel.app`) ou pelo seu domínio próprio configurado depois.

## Como funciona o compartilhamento viral
- Cada post tem um botão "Compartilhar" que gera um link único.
- Esse link soma pontos ao usuário (ranking de divulgadores) e conta compartilhamentos no post.
- Quando alguém abre esse link fora do app (WhatsApp, Instagram etc.), a função `/api/preview/[id].js` mostra uma prévia bonita (imagem, título) antes de redirecionar pro app.

## Próximos passos sugeridos
- Trocar o placeholder de embed do TikTok pelo oEmbed oficial deles (mais estável).
- Adicionar upload de imagem de perfil.
- Criar página de perfil público por usuário (catálogo + posts dele).
- Adicionar Facebook Login / login social pra reduzir fricção de cadastro.
