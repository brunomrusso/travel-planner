# Enviando Travel Planner para GitHub

## Pré-requisitos

1. Conta GitHub criada (https://github.com)
2. Git instalado no computador
3. Projeto local em: `C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner\`

## Passo 1: Criar Repositório no GitHub

1. Acesse https://github.com/new
2. Preencha:
   - **Repository name**: `travel-planner`
   - **Description**: `Multi-tenant travel planning app with AI itinerary generation`
   - **Public/Private**: Escolha (recomendo Public para portfólio)
   - **Initialize with**: Deixe em branco (vamos fazer localmente)
3. Clique "Create repository"
4. Copie a URL do repositório (ex: `https://github.com/seu-usuario/travel-planner.git`)

## Passo 2: Configurar Git Localmente

Abra PowerShell na pasta do projeto:

```powershell
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner"
```

Configure seu Git (primeira vez):

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@example.com"
```

## Passo 3: Inicializar Repositório Git

```powershell
# Inicializar repositório
git init

# Adicionar todos os arquivos
git add .

# Criar commit inicial
git commit -m "Initial commit: Travel Planner application"

# Renomear branch para main (se necessário)
git branch -M main
```

## Passo 4: Conectar ao GitHub

Substitua `seu-usuario` pela sua conta GitHub:

```powershell
git remote add origin https://github.com/seu-usuario/travel-planner.git

# Verificar conexão
git remote -v
```

## Passo 5: Enviar para GitHub

```powershell
# Fazer push da branch main
git push -u origin main
```

Se pedir autenticação:
- **Username**: seu-usuario-github
- **Password**: seu-token-pessoal (não a senha)

### Gerar Token Pessoal (se necessário)

1. GitHub → Settings → Developer settings → Personal access tokens
2. Clique "Generate new token"
3. Selecione escopos: `repo`, `workflow`
4. Copie o token e use como senha no git push

## Passo 6: Verificar no GitHub

1. Acesse https://github.com/seu-usuario/travel-planner
2. Verifique se todos os arquivos estão lá

## Estrutura que será enviada

```
travel-planner/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── main.py
│   │   ├── config.py
│   │   └── database.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   ├── lib/
│   ├── components/
│   ├── package.json
│   └── ...
├── supabase/
│   └── migrations/
├── README.md
├── QUICK_START.md
├── DEVELOPMENT.md
├── DEPLOYMENT.md
├── .gitignore
└── ... (documentação)
```

## Comandos Úteis Futuros

```powershell
# Ver status
git status

# Ver histórico
git log

# Criar branch para nova feature
git checkout -b feature/nova-feature

# Fazer commit
git add .
git commit -m "Descrição da mudança"

# Fazer push
git push origin main

# Atualizar local com remoto
git pull origin main
```

## Troubleshooting

### "fatal: not a git repository"
```powershell
# Certifique-se que está na pasta correta
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner"
git init
```

### "Permission denied (publickey)"
- Gere SSH key ou use HTTPS com token pessoal
- Verifique credenciais do Git

### "Everything up-to-date"
- Significa que não há mudanças para enviar
- Faça alterações e commit novamente

### Arquivos grandes rejeitados
- GitHub tem limite de 100MB por arquivo
- Use Git LFS para arquivos maiores

## Próximos Passos

1. ✅ Repositório criado no GitHub
2. ✅ Projeto enviado
3. ⏳ Configurar GitHub Actions (CI/CD)
4. ⏳ Configurar branch protection
5. ⏳ Adicionar colaboradores (opcional)

## Configurações Recomendadas no GitHub

### Settings → General
- [ ] Make this repository private (se preferir)
- [ ] Require status checks to pass before merging

### Settings → Branches
- [ ] Add rule para branch `main`
- [ ] Require pull request reviews

### Settings → Secrets
- [ ] Adicionar secrets para deploy (Render, Vercel)

---

**Seu projeto está pronto para GitHub!** 🚀
