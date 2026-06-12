# İSA AI

## OpenAI API ile çalıştırma

PowerShell'de proje klasörüne gir:

```powershell
cd "C:\Users\muham\OneDrive\Desktop\İSA AI"
```

API anahtarını ortam değişkeni olarak ayarla:

```powershell
$env:OPENAI_API_KEY="sk-proj-..."
```

Sunucuyu başlat:

```powershell
.\start.ps1
```

Tarayıcıdan aç:

```text
http://localhost:3000
```

Modeli değiştirmek istersen:

```powershell
$env:OPENAI_MODEL="gpt-5.5"
```
