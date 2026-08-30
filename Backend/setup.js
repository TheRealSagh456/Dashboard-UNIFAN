const fs = require("fs")

if (!fs.existsSync('.env')) {
  fs.copyFileSync('.env.example', '.env');
  console.log('.env criado a partir de .env.example');
}