# Criar Repositório no GitHub

## ⚠️ Situação Atual

Seu Git local está configurado para:
```
https://github.com/brunomrusso/travel-planner.git
```

Mas o repositório **ainda não existe** no GitHub.

## ✅ Solução: Criar Repositório

### Passo 1: Acessar GitHub

1. Vá para https://github.com/new
2. Ou clique no "+" no canto superior direito → "New repository"

### Passo 2: Preencher Formulário

```
Repository name: travel-planner
Description: Multi-tenant travel planning app with AI itinerary generation
Visibility: Public (recomendado para portfólio)
Initialize this repository with: 
  ☐ Add a README file
  ☐ Add .gitignore
  ☐ Choose a license
```

**Deixe DESMARCADO** - você já tem esses arquivos localmente!

### Passo 3: Criar Repositório

Clique "Create repository"

### Passo 4: Enviar Código

Após criar, você verá instruções. Execute:

```powershell
cd "C:\Users\bruno\OneDrive\Documentos\Projetos\travel-planner"

git push -u origin main
```

## 🔐 Autenticação

Se pedir credenciais:

**Opção 1: Token Pessoal (Recomendado)**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Clique "Generate new token (classic)"
3. Selecione escopos: `repo`, `workflow`
4. Copie o token
5. Cole como password no git push

**Opção 2: SSH (Mais seguro)**
1. Gere SSH key: `ssh-keygen -t ed25519 -C "seu-email@example.com"`
2. Adicione em GitHub → Settings → SSH and GPG keys
3. Use URL SSH: `git@github.com:brunomrusso/travel-planner.git`

## 📋 Checklist

- [ ] Acessei https://github.com/new
- [ ] Criei repositório "travel-planner"
- [ ] Deixei desmarcado "Initialize with README/gitignore/license"
- [ ] Cliquei "Create repository"
- [ ] Executei `git push -u origin main`
- [ ] Código enviado com sucesso ✅

## 🎯 Depois de Enviar

```powershell
# Verificar que foi enviado
git log --oneline

# Ver remote
git remote -v

# Fazer novo commit (exemplo)
git add .
git commit -m "Update documentation"
git push origin main
```

## ❓ Troubleshooting

### "fatal: repository not found"
- Verifique se criou o repositório no GitHub
- Verifique se o nome está correto: `travel-planner`
- Verifique se está usando HTTPS ou SSH corretamente

### "Permission denied (publickey)"
- Você está usando SSH mas não configurou a chave
- Use HTTPS com token pessoal em vez disso

### "fatal: The current branch main has no upstream branch"
- Execute: `git push -u origin main`
- O `-u` configura o upstream

---

**Próximo passo: Criar repositório em https://github.com/new** 🚀
