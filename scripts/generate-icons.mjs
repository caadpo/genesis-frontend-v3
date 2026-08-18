import sharp from "sharp";
import path from "path";

const SOURCE = path.resolve("public/logo_dpo.png"); // ajuste se o logo fonte for outro
const OUT_DIR = path.resolve("public/icons");

// Cor de fundo para substituir transparência (ajuste para a cor da sua marca)
const BACKGROUND = "#000000";

async function generate() {
  // apple-touch-icon: 180x180, SEM transparência (iOS não gosta de PNG transparente aqui)
  await sharp(SOURCE)
    .resize(180, 180, { fit: "contain", background: BACKGROUND })
    .flatten({ background: BACKGROUND })
    .png()
    .toFile(path.join(OUT_DIR, "apple-touch-icon.png"));

  // icon-192.png (pode manter transparência, é usado no manifest/Android)
  await sharp(SOURCE)
    .resize(192, 192, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUT_DIR, "icon-192.png"));

  // icon-512.png
  await sharp(SOURCE)
    .resize(512, 512, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUT_DIR, "icon-512.png"));

  console.log("Ícones gerados em public/icons/");
}

generate().catch((err) => {
  console.error("Erro ao gerar ícones:", err);
  process.exit(1);
});
