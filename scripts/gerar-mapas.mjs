// Gera os mapas do painel a partir das malhas territoriais do IBGE (dados públicos, fonte: IBGE).
// Uso: node scripts/gerar-mapas.mjs
// Saída: src/data/mapas/brasil.json (estados) e src/data/mapas/municipios/{UF}.json.
// Os contornos são convertidos em caminhos SVG (projeção equiretangular corrigida pela latitude
// média), com coordenadas arredondadas: o painel não depende de biblioteca nem de serviço externo.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("..", import.meta.url));
const API = "https://servicodados.ibge.gov.br/api/v3/malhas";
const LARGURA = 1000;

async function baixar(url) {
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    console.warn(`Falha ${r.status} em ${url} (tentativa ${tentativa})`);
    await new Promise((ok) => setTimeout(ok, 2000 * tentativa));
  }
  throw new Error(`Não foi possível baixar ${url}`);
}

function aneis(geometria) {
  if (geometria.type === "Polygon") return geometria.coordinates;
  if (geometria.type === "MultiPolygon") return geometria.coordinates.flat();
  return [];
}

/** Converte uma coleção GeoJSON em { viewBox, caminhos: { código: "M…Z" } }. */
function paraSvg(colecao) {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const f of colecao.features)
    for (const anel of aneis(f.geometry))
      for (const [x, y] of anel) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
  const escala = LARGURA / ((maxX - minX) * k);
  const altura = Math.round((maxY - minY) * escala);
  const caminhos = {};
  for (const f of colecao.features) {
    const partes = [];
    for (const anel of aneis(f.geometry)) {
      const pontos = [];
      for (const [x, y] of anel) {
        const p = `${Math.round((x - minX) * k * escala * 10) / 10},${Math.round((maxY - y) * escala * 10) / 10}`;
        if (pontos[pontos.length - 1] !== p) pontos.push(p);
      }
      if (pontos.length >= 3) partes.push(`M${pontos.join("L")}Z`);
    }
    caminhos[f.properties.codarea] = partes.join("");
  }
  return { viewBox: `0 0 ${LARGURA} ${altura}`, caminhos };
}

const municipios = JSON.parse(await readFile(`${RAIZ}src/data/municipios.json`, "utf8"));
// Código IBGE da UF (2 dígitos) → sigla, a partir da lista oficial de municípios já usada no projeto.
const siglaPorCodigo = Object.fromEntries(Object.entries(municipios).map(([sigla, lista]) => [String(lista[0][0]).slice(0, 2), sigla]));

await mkdir(`${RAIZ}src/data/mapas/municipios`, { recursive: true });

const brasil = paraSvg(await baixar(`${API}/paises/BR?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=UF`));
brasil.caminhos = Object.fromEntries(Object.entries(brasil.caminhos).map(([cod, d]) => [siglaPorCodigo[cod], d]));
await writeFile(`${RAIZ}src/data/mapas/brasil.json`, JSON.stringify(brasil));
console.log(`brasil.json: ${Object.keys(brasil.caminhos).length} estados`);

for (const sigla of Object.keys(municipios).sort()) {
  const mapa = paraSvg(await baixar(`${API}/estados/${sigla}?formato=application/vnd.geo+json&qualidade=minima&intrarregiao=municipio`));
  await writeFile(`${RAIZ}src/data/mapas/municipios/${sigla}.json`, JSON.stringify(mapa));
  console.log(`${sigla}.json: ${Object.keys(mapa.caminhos).length} municípios (esperado ${municipios[sigla].length})`);
}
