import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const model = process.env.OPENAI_MODEL || "gpt-5.5";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export async function askOpenAI(question) {
  if (!globalThis.fetch) {
    throw new Error("Bu sunucu için Node.js 18 veya daha yeni bir sürüm gerekir.");
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ortam değişkeni tanımlı değil.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: question,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || `OpenAI API hatası: ${response.status}`);
  }

  return data.output_text || collectOutputText(data) || "Boş yanıt döndü.";
}

function collectOutputText(data) {
  if (!Array.isArray(data.output)) {
    return "";
  }

  return data.output
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();
}

async function readRawBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

async function readJsonBody(request) {
  return JSON.parse((await readRawBody(request)).toString("utf8") || "{}");
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function parseMultipartFile(request, body) {
  const contentType = request.headers["content-type"] || "";
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[1] || contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/)?.[2];

  if (!boundary) {
    throw new Error("Dosya yükleme sınırı okunamadı.");
  }

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let partStart = body.indexOf(boundaryBuffer);

  while (partStart !== -1) {
    const headersStart = partStart + boundaryBuffer.length + 2;
    const headersEnd = body.indexOf(Buffer.from("\r\n\r\n"), headersStart);

    if (headersEnd === -1) {
      break;
    }

    const headers = body.slice(headersStart, headersEnd).toString("utf8");
    const fileName = headers.match(/filename="([^"]*)"/)?.[1];
    const contentTypeHeader = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1] || "application/octet-stream";
    const dataStart = headersEnd + 4;
    const nextBoundary = body.indexOf(boundaryBuffer, dataStart);

    if (nextBoundary === -1) {
      break;
    }

    if (fileName) {
      return {
        fileName,
        contentType: contentTypeHeader,
        buffer: body.slice(dataStart, Math.max(dataStart, nextBoundary - 2)),
      };
    }

    partStart = nextBoundary;
  }

  throw new Error("Yüklenecek dosya bulunamadı.");
}

function parseImportedHoursFile(file) {
  const lowerName = file.fileName.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return parseImportedRowsFromTable(parseCsv(file.buffer.toString("utf8")));
  }

  if (!lowerName.endsWith(".xlsx")) {
    throw new Error("Şimdilik .xlsx veya .csv dosyası yükle.");
  }

  return parseImportedRowsFromTable(parseXlsxFirstSheet(file.buffer));
}

function parseXlsxFirstSheet(buffer) {
  const zipEntries = readZipEntries(buffer);
  const sharedStrings = parseSharedStrings(zipEntries.get("xl/sharedStrings.xml")?.toString("utf8") || "");
  const sheetName = resolveFirstSheetName(zipEntries);
  const sheetXml = zipEntries.get(sheetName)?.toString("utf8");

  if (!sheetXml) {
    throw new Error("Excel içinde okunabilir sayfa bulunamadı.");
  }

  return parseSheetXml(sheetXml, sharedStrings);
}

function readZipEntries(buffer) {
  const entries = new Map();
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  let offset = centralDirectoryOffset;

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Excel zip yapısı okunamadı.");
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const fileName = buffer.slice(offset + 46, offset + 46 + fileNameLength).toString("utf8");
    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.slice(dataStart, dataStart + compressedSize);
    const content = compressionMethod === 0 ? compressedData : inflateRawSync(compressedData);

    entries.set(fileName.replaceAll("\\", "/"), content);
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error("Excel dosyası zip yapısında değil.");
}

function resolveFirstSheetName(entries) {
  const workbookXml = entries.get("xl/workbook.xml")?.toString("utf8") || "";
  const relsXml = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8") || "";
  const firstSheetTag = workbookXml.match(/<sheet\b[^>]*>/)?.[0] || "";
  const relationId = firstSheetTag.match(/r:id="([^"]+)"/)?.[1];

  if (relationId) {
    const relRegex = new RegExp(`<Relationship[^>]+Id="${escapeRegex(relationId)}"[^>]+Target="([^"]+)"`);
    const target = relsXml.match(relRegex)?.[1];

    if (target) {
      return `xl/${target}`.replace("xl//", "xl/").replaceAll("\\", "/");
    }
  }

  return [...entries.keys()].find((name) => name.startsWith("xl/worksheets/sheet")) || "";
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([itemXml]) => {
    return [...itemXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match) => decodeXml(match[1]))
      .join("");
  });
}

function parseSheetXml(xml, sharedStrings) {
  return [...xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(([, rowXml]) => {
    const cells = [];

    [...rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)].forEach(([, attrs, cellXml]) => {
      const ref = attrs.match(/\br="([A-Z]+)\d+"/)?.[1] || "";
      const columnIndex = columnNameToIndex(ref);
      const type = attrs.match(/\bt="([^"]+)"/)?.[1] || "";
      const rawValue = cellXml.match(/<v>([\s\S]*?)<\/v>/)?.[1] || "";
      const inlineValue = cellXml.match(/<t\b[^>]*>([\s\S]*?)<\/t>/)?.[1] || "";
      cells[columnIndex] = getCellValue(type, rawValue, inlineValue, sharedStrings);
    });

    return cells;
  });
}

function getCellValue(type, rawValue, inlineValue, sharedStrings) {
  if (type === "s") {
    return sharedStrings[Number(rawValue)] || "";
  }

  if (type === "inlineStr") {
    return decodeXml(inlineValue);
  }

  return decodeXml(rawValue);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      inQuotes = !inQuotes;
    } else if (character === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  row.push(value);
  rows.push(row);

  return rows.filter((item) => item.some((cell) => String(cell || "").trim()));
}

function parseImportedRowsFromTable(rows) {
  const headerRowIndex = rows.findIndex((row) => {
    const headers = row.map(normalizeHeader);
    return headers.includes("ADI") && headers.includes("SOYADI") && headers.includes("TARIH") && headers.includes("TSAAT");
  });

  if (headerRowIndex === -1) {
    throw new Error("Excel içinde ADI, SOYADI, TARIH ve TSAAT kolonları bulunamadı.");
  }

  const headers = rows[headerRowIndex].map(normalizeHeader);
  const indexes = {
    firstName: headers.indexOf("ADI"),
    lastName: headers.indexOf("SOYADI"),
    date: headers.indexOf("TARIH"),
    totalHours: headers.indexOf("TSAAT"),
  };

  return rows
    .slice(headerRowIndex + 1)
    .map((row) => {
      const name = `${row[indexes.firstName] || ""} ${row[indexes.lastName] || ""}`.trim();
      const date = parseImportedDate(row[indexes.date]);
      const hours = parseImportedNumber(row[indexes.totalHours]);

      return {
        name,
        date,
        hours,
      };
    })
    .filter((row) => row.name && row.date && !Number.isNaN(row.hours));
}

function parseImportedDate(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  if (/^\d+(\.\d+)?$/.test(rawValue)) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    return formatIsoDate(new Date(excelEpoch + Number(rawValue) * 24 * 60 * 60 * 1000));
  }

  const isoMatch = rawValue.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);

  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  const localMatch = rawValue.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);

  if (localMatch) {
    return `${localMatch[3]}-${localMatch[2].padStart(2, "0")}-${localMatch[1].padStart(2, "0")}`;
  }

  return "";
}

function parseImportedNumber(value) {
  const rawValue = String(value || "").trim();
  const normalized = rawValue.includes(",") ? rawValue.replace(/\./g, "").replace(",", ".") : rawValue;

  if (!normalized) {
    return Number.NaN;
  }

  return Number(normalized);
}

function formatIsoDate(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function normalizeHeader(value) {
  return String(value || "")
    .toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, "");
}

function columnNameToIndex(name) {
  return [...name].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0) - 1;
}

function decodeXml(value) {
  return String(value || "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveStaticFile(urlPath) {
  const pathname = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = path.normalize(path.join(rootDir, pathname));
  const relativePath = path.relative(rootDir, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/api/ask") {
    try {
      const body = await readJsonBody(request);
      const question = String(body.question || "").trim();

      if (!question) {
        sendJson(response, 400, { error: "Soru boş olamaz." });
        return;
      }

      const answer = await askOpenAI(question);
      sendJson(response, 200, { answer });
    } catch (error) {
      sendJson(response, 500, { error: error.message || "Sunucu hatası." });
    }

    return;
  }

  if (request.method === "POST" && url.pathname === "/api/import-hours") {
    try {
      const file = parseMultipartFile(request, await readRawBody(request));
      const rows = parseImportedHoursFile(file);
      sendJson(response, 200, { rows });
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Excel içe aktarma başarısız oldu." });
    }

    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    sendJson(response, 405, { error: "Bu yöntem desteklenmiyor." });
    return;
  }

  const filePath = resolveStaticFile(url.pathname);

  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const content = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
    });
    response.end("Not found");
  }
}

createServer(handleRequest).listen(port, () => {
  console.log(`İSA AI çalışıyor: http://localhost:${port}`);
});
