const SOFT_MARINE_STORAGE_KEY = "isa-ai-soft-marine-vault";

const softVaultState = loadSoftVaultState();
const softBoxList = document.querySelector("[data-soft-box-list]");
const softAddBoxButton = document.querySelector("[data-soft-add-box]");

renderSoftVault();

softAddBoxButton?.addEventListener("click", () => {
  const nextNumber = softVaultState.boxes.length + 1;
  const box = {
    id: createSoftId("box"),
    name: `Yeni Kutucuk ${nextNumber}`,
    files: [],
    createdAt: new Date().toISOString(),
  };

  softVaultState.boxes.unshift(box);
  saveSoftVaultState();
  renderSoftVault();
});

softBoxList?.addEventListener("click", (event) => {
  const renameButton = event.target.closest("[data-soft-rename-box]");
  const deleteBoxButton = event.target.closest("[data-soft-delete-box]");
  const deleteFileButton = event.target.closest("[data-soft-delete-file]");

  if (renameButton) {
    renameSoftBox(renameButton.dataset.softRenameBox);
    return;
  }

  if (deleteBoxButton) {
    deleteSoftBox(deleteBoxButton.dataset.softDeleteBox);
    return;
  }

  if (deleteFileButton) {
    deleteSoftFile(deleteFileButton.dataset.softBoxId, deleteFileButton.dataset.softDeleteFile);
  }
});

softBoxList?.addEventListener("change", async (event) => {
  const fileInput = event.target.closest("[data-soft-file-input]");
  const folderInput = event.target.closest("[data-soft-folder-input]");

  if (fileInput) {
    await addSoftFiles(fileInput.dataset.softFileInput, Array.from(fileInput.files || []), "file");
    fileInput.value = "";
    return;
  }

  if (folderInput) {
    await addSoftFiles(folderInput.dataset.softFolderInput, Array.from(folderInput.files || []), "folder");
    folderInput.value = "";
  }
});

softBoxList?.addEventListener("dragover", (event) => {
  const box = event.target.closest("[data-soft-box]");

  if (!box) {
    return;
  }

  event.preventDefault();
  box.classList.add("is-dragging");
});

softBoxList?.addEventListener("dragleave", (event) => {
  const box = event.target.closest("[data-soft-box]");

  if (!box || box.contains(event.relatedTarget)) {
    return;
  }

  box.classList.remove("is-dragging");
});

softBoxList?.addEventListener("drop", async (event) => {
  const box = event.target.closest("[data-soft-box]");

  if (!box) {
    return;
  }

  event.preventDefault();
  box.classList.remove("is-dragging");
  await addSoftFiles(box.dataset.softBox, Array.from(event.dataTransfer?.files || []), "file");
});

function renderSoftVault() {
  if (!softBoxList) {
    return;
  }

  if (!softVaultState.boxes.length) {
    softBoxList.innerHTML = `
      <section class="soft-empty-state">
        <span class="placeholder-icon" aria-hidden="true">SM</span>
        <h2>Henüz kutucuk yok</h2>
        <p>Yeni Kutucuk butonuyla firma özelinde dosya alanları oluşturabilirsiniz.</p>
      </section>
    `;
    return;
  }

  softBoxList.innerHTML = softVaultState.boxes.map(renderSoftBox).join("");
}

function renderSoftBox(box) {
  const fileCount = box.files.length;

  return `
    <article class="soft-vault-box" data-soft-box="${escapeSoftHtml(box.id)}">
      <header class="soft-box-header">
        <div>
          <span class="soft-box-kicker">${fileCount} evrak</span>
          <h3>${escapeSoftHtml(box.name)}</h3>
        </div>
        <div class="soft-box-actions">
          <button class="secondary-button" type="button" data-soft-rename-box="${escapeSoftHtml(box.id)}">Adlandır</button>
          <button class="secondary-button danger" type="button" data-soft-delete-box="${escapeSoftHtml(box.id)}">Sil</button>
        </div>
      </header>

      <div class="soft-upload-actions">
        <label class="secondary-button soft-upload-button">
          Dosya Yükle
          <input type="file" multiple accept=".pdf,image/*,.xls,.xlsx,.xlsm,.csv" data-soft-file-input="${escapeSoftHtml(box.id)}" />
        </label>
        <label class="secondary-button soft-upload-button">
          Klasör Yükle
          <input type="file" multiple webkitdirectory directory data-soft-folder-input="${escapeSoftHtml(box.id)}" />
        </label>
      </div>

      <div class="soft-file-list">
        ${fileCount ? box.files.map((file) => renderSoftFile(box.id, file)).join("") : `<p class="empty-state">Bu kutucukta henüz evrak yok.</p>`}
      </div>
    </article>
  `;
}

function renderSoftFile(boxId, file) {
  return `
    <article class="soft-file-item">
      <div>
        <a class="document-name" href="${escapeSoftHtml(file.dataUrl)}" target="_blank" rel="noopener" download="${escapeSoftHtml(file.name)}">
          ${escapeSoftHtml(file.name)}
        </a>
        <small>${escapeSoftHtml(file.relativePath || getSoftFileKind(file))} - ${formatSoftFileSize(file.size)}</small>
      </div>
      <div class="document-actions">
        <a class="secondary-button" href="${escapeSoftHtml(file.dataUrl)}" download="${escapeSoftHtml(file.name)}">İndir</a>
        <button class="secondary-button danger" type="button" data-soft-box-id="${escapeSoftHtml(boxId)}" data-soft-delete-file="${escapeSoftHtml(file.id)}">Sil</button>
      </div>
    </article>
  `;
}

function renameSoftBox(boxId) {
  const box = getSoftBox(boxId);

  if (!box) {
    return;
  }

  const newName = window.prompt("Kutucuk adı", box.name);

  if (!newName || !newName.trim()) {
    return;
  }

  box.name = newName.trim();
  saveSoftVaultState();
  renderSoftVault();
}

function deleteSoftBox(boxId) {
  const box = getSoftBox(boxId);

  if (!box || !window.confirm(`${box.name} kutucuğu silinsin mi?`)) {
    return;
  }

  softVaultState.boxes = softVaultState.boxes.filter((item) => item.id !== boxId);
  saveSoftVaultState();
  renderSoftVault();
}

function deleteSoftFile(boxId, fileId) {
  const box = getSoftBox(boxId);

  if (!box) {
    return;
  }

  box.files = box.files.filter((file) => file.id !== fileId);
  saveSoftVaultState();
  renderSoftVault();
}

async function addSoftFiles(boxId, files, sourceType) {
  const box = getSoftBox(boxId);

  if (!box || !files.length) {
    return;
  }

  const preparedFiles = [];

  for (const file of files) {
    preparedFiles.push({
      id: createSoftId("file"),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      sourceType,
      relativePath: file.webkitRelativePath || "",
      uploadedAt: new Date().toISOString(),
      dataUrl: await readSoftFileAsDataUrl(file),
    });
  }

  box.files = [...preparedFiles, ...box.files];

  try {
    saveSoftVaultState();
  } catch (error) {
    box.files = box.files.filter((file) => !preparedFiles.some((preparedFile) => preparedFile.id === file.id));
    window.alert("Dosyalar kaydedilemedi. Dosya veya klasör boyutu tarayıcı depolama sınırını aşmış olabilir.");
  }

  renderSoftVault();
}

function loadSoftVaultState() {
  try {
    const state = JSON.parse(localStorage.getItem(SOFT_MARINE_STORAGE_KEY) || "{}");

    return {
      boxes: Array.isArray(state.boxes) ? state.boxes.map(normalizeSoftBox) : [],
    };
  } catch {
    return { boxes: [] };
  }
}

function normalizeSoftBox(box) {
  return {
    id: String(box.id || createSoftId("box")),
    name: String(box.name || "Kutucuk"),
    createdAt: String(box.createdAt || new Date().toISOString()),
    files: Array.isArray(box.files) ? box.files.map(normalizeSoftFile).filter((file) => file.dataUrl) : [],
  };
}

function normalizeSoftFile(file) {
  return {
    id: String(file.id || createSoftId("file")),
    name: String(file.name || "Dosya"),
    type: String(file.type || "application/octet-stream"),
    size: Number(file.size || 0),
    sourceType: file.sourceType === "folder" ? "folder" : "file",
    relativePath: String(file.relativePath || ""),
    uploadedAt: String(file.uploadedAt || new Date().toISOString()),
    dataUrl: String(file.dataUrl || ""),
  };
}

function saveSoftVaultState() {
  localStorage.setItem(SOFT_MARINE_STORAGE_KEY, JSON.stringify(softVaultState));
}

function getSoftBox(boxId) {
  return softVaultState.boxes.find((box) => box.id === boxId) || null;
}

function readSoftFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

function getSoftFileKind(file) {
  if (file.sourceType === "folder") {
    return "Klasör içinden yüklendi";
  }

  if (file.type?.startsWith("image/")) {
    return "Resim";
  }

  if (file.type === "application/pdf") {
    return "PDF";
  }

  if (file.name.match(/\.(xls|xlsx|xlsm|csv)$/i)) {
    return "Excel";
  }

  return "Dosya";
}

function formatSoftFileSize(size) {
  const safeSize = Number(size || 0);

  if (safeSize < 1024) {
    return `${safeSize} B`;
  }

  if (safeSize < 1024 * 1024) {
    return `${(safeSize / 1024).toFixed(1)} KB`;
  }

  return `${(safeSize / (1024 * 1024)).toFixed(1)} MB`;
}

function createSoftId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function escapeSoftHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
