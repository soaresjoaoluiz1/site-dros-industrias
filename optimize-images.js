/**
 * Otimiza as imagens grandes do site para deploy em produção.
 *
 * Uso:
 *   npm install
 *   npm run optimize
 *
 * Sobrescreve os arquivos originais. Faça commit ANTES de rodar
 * se quiser poder reverter via git.
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  // Imagens grandes que precisam ser comprimidas
  { file: 'assets/img/quimiprol-fachada.jpg', maxWidth: 1600, quality: 82 },
  { file: 'assets/img/hero-industria.jpg',    maxWidth: 1920, quality: 80 },
  { file: 'assets/img/ask-fachada.jpg',       maxWidth: 1600, quality: 82 },
  { file: 'assets/img/agrozacca-fachada.jpg', maxWidth: 1600, quality: 82 },

  // Avatares dos depoimentos
  { file: 'assets/img/rodri.png',     maxWidth: 320, quality: 85, format: 'jpg' },
  { file: 'assets/img/welliton.png',  maxWidth: 320, quality: 85, format: 'jpg' },
  { file: 'assets/img/ramon.png',     maxWidth: 320, quality: 85, format: 'jpg' },
];

const fmt = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';

(async () => {
  console.log('Otimizando imagens...\n');
  let totalBefore = 0, totalAfter = 0;

  for (const t of TARGETS) {
    if (!fs.existsSync(t.file)) {
      console.log('⚠️  Não encontrado:', t.file);
      continue;
    }
    const before = fs.statSync(t.file).size;
    totalBefore += before;

    let pipeline = sharp(t.file).rotate().resize({
      width: t.maxWidth,
      withoutEnlargement: true,
    });

    if (t.format === 'jpg' || t.file.endsWith('.jpg') || t.file.endsWith('.jpeg')) {
      pipeline = pipeline.jpeg({
        quality: t.quality,
        mozjpeg: true,
        progressive: true,
      });
    } else if (t.file.endsWith('.png')) {
      pipeline = pipeline.png({ quality: t.quality, compressionLevel: 9 });
    }

    const buffer = await pipeline.toBuffer();

    // Escrita à prova de lock no Windows: grava num .tmp e renomeia
    const tmp = t.file + '.optimizing.tmp';
    fs.writeFileSync(tmp, buffer);
    // Retry caso o arquivo original esteja segurado por outro processo
    let attempts = 0;
    while (attempts < 10) {
      try {
        fs.rmSync(t.file, { force: true });
        fs.renameSync(tmp, t.file);
        break;
      } catch (err) {
        attempts++;
        if (attempts === 10) {
          fs.rmSync(tmp, { force: true });
          throw new Error(`Não consegui sobrescrever ${t.file} — outro processo está segurando. Feche browser/servidor local e tente de novo.`);
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }

    const after = fs.statSync(t.file).size;
    totalAfter += after;
    const pct = Math.round((1 - after / before) * 100);
    console.log(`  ${t.file.padEnd(40)} ${fmt(before).padStart(10)} → ${fmt(after).padStart(10)}  (${pct}% menor)`);
  }

  console.log('\n========================================');
  console.log(`Total: ${fmt(totalBefore)} → ${fmt(totalAfter)}  (economia: ${fmt(totalBefore - totalAfter)})`);
  console.log('========================================');
  console.log('\nPronto. Confira no browser que está tudo ok visualmente.');
  console.log('Depois: git add assets/img/ && git commit -m "chore: otimiza imagens" && git push');
})();
