// Genera los 5 QR de mesa como SVG en la carpeta qr/.
// Uso: SITIO_URL=https://tu-sitio.vercel.app MESA_TOKENS=t1,t2,t3,t4,t5 npm run qr:mesas
import { mkdirSync, writeFileSync } from "node:fs";
import QRCode from "qrcode";

const sitio = (process.env.SITIO_URL || "").replace(/\/+$/, "");
const tokens = (process.env.MESA_TOKENS || "").split(",").map((t) => t.trim());

if (!sitio || tokens.length !== 5 || tokens.some((t) => !t)) {
  console.error("Faltan datos. Define SITIO_URL y MESA_TOKENS con los 5 tokens separados por comas, en orden de mesa.");
  process.exit(1);
}

mkdirSync("qr", { recursive: true });
for (let i = 0; i < 5; i++) {
  const url = `${sitio}/sello/${i + 1}?t=${encodeURIComponent(tokens[i])}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 2, color: { dark: "#000000", light: "#F4EEE3" } });
  writeFileSync(`qr/mesa-${i + 1}.svg`, svg);
  console.log(`Mesa ${i + 1}: qr/mesa-${i + 1}.svg → ${url}`);
}
