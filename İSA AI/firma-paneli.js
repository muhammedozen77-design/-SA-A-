const STORAGE_KEY = "isa-ai-firma-paneli";
const FIRST_READY_YEAR = 2025;
const LAST_READY_YEAR = 2030;
const FUTURE_YEAR_BUFFER = 2;
const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const statusLabels = {
  active: "Aktif",
  left: "Çıkan",
};

const professionOptions = [
  "ELEKTRİK KABLO",
  "ELEKTRİK BAĞLANTI",
  "MONTAJ",
  "MONTAJ YARDIMCISI",
  "EKİP BAŞI",
  "USTA BAŞI",
  "KAYNAKÇI",
  "TAŞÇI",
];

const specialHolidayDates = {
  2025: {
    "03-29": "Ramazan Bayramı Arifesi",
    "03-30": "Ramazan Bayramı",
    "03-31": "Ramazan Bayramı",
    "04-01": "Ramazan Bayramı",
    "06-05": "Kurban Bayramı Arifesi",
    "06-06": "Kurban Bayramı",
    "06-07": "Kurban Bayramı",
    "06-08": "Kurban Bayramı",
    "06-09": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
  2026: {
    "03-19": "Ramazan Bayramı Arifesi",
    "03-20": "Ramazan Bayramı",
    "03-21": "Ramazan Bayramı",
    "03-22": "Ramazan Bayramı",
    "05-26": "Kurban Bayramı Arifesi",
    "05-27": "Kurban Bayramı",
    "05-28": "Kurban Bayramı",
    "05-29": "Kurban Bayramı",
    "05-30": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
  2027: {
    "03-09": "Ramazan Bayramı Arifesi",
    "03-10": "Ramazan Bayramı",
    "03-11": "Ramazan Bayramı",
    "03-12": "Ramazan Bayramı",
    "05-15": "Kurban Bayramı Arifesi",
    "05-16": "Kurban Bayramı",
    "05-17": "Kurban Bayramı",
    "05-18": "Kurban Bayramı",
    "05-19": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
  2028: {
    "02-26": "Ramazan Bayramı Arifesi",
    "02-27": "Ramazan Bayramı",
    "02-28": "Ramazan Bayramı",
    "02-29": "Ramazan Bayramı",
    "05-04": "Kurban Bayramı Arifesi",
    "05-05": "Kurban Bayramı",
    "05-06": "Kurban Bayramı",
    "05-07": "Kurban Bayramı",
    "05-08": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
  2029: {
    "02-14": "Ramazan Bayramı Arifesi",
    "02-15": "Ramazan Bayramı",
    "02-16": "Ramazan Bayramı",
    "02-17": "Ramazan Bayramı",
    "04-23": "Kurban Bayramı Arifesi",
    "04-24": "Kurban Bayramı",
    "04-25": "Kurban Bayramı",
    "04-26": "Kurban Bayramı",
    "04-27": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
  2030: {
    "02-03": "Ramazan Bayramı Arifesi",
    "02-04": "Ramazan Bayramı",
    "02-05": "Ramazan Bayramı",
    "02-06": "Ramazan Bayramı",
    "04-12": "Kurban Bayramı Arifesi",
    "04-13": "Kurban Bayramı",
    "04-14": "Kurban Bayramı",
    "04-15": "Kurban Bayramı",
    "04-16": "Kurban Bayramı",
    "10-28": "Cumhuriyet Bayramı Arifesi",
  },
};

const fixedHolidayDates = {
  "01-01": "Yılbaşı",
  "04-23": "Ulusal Egemenlik ve Çocuk Bayramı",
  "05-01": "Emek ve Dayanışma Günü",
  "05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  "07-15": "Demokrasi ve Milli Birlik Günü",
  "08-30": "Zafer Bayramı",
  "10-29": "Cumhuriyet Bayramı",
};

const state = loadState();

const tabButtons = document.querySelectorAll("[data-tab-button]");
const tabPanels = document.querySelectorAll("[data-tab-panel]");
const personnelList = document.querySelector("[data-personnel-list]");
const personnelDetail = document.querySelector("[data-personnel-detail]");
const activePersonnelList = document.querySelector("[data-active-personnel-list]");
const dialog = document.querySelector("[data-personnel-dialog]");
const personnelForm = document.querySelector("[data-personnel-form]");
const openDialogButton = document.querySelector("[data-open-personnel-dialog]");
const closeDialogButton = document.querySelector("[data-close-personnel-dialog]");
const workYearSelect = document.querySelector("[data-work-year]");
const workMonthInput = document.querySelector("[data-work-month]");
const hoursTableShell = document.querySelector("[data-hours-table]");
const exportExcelButton = document.querySelector("[data-export-excel]");
const importHoursInput = document.querySelector("[data-import-hours-file]");
const importStatus = document.querySelector("[data-import-status]");
const payrollPanel = document.querySelector("[data-payroll-panel]");
const exportPayrollButton = document.querySelector("[data-export-payroll]");

saveState();
renderAll();

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.activeTab = button.dataset.tabButton;
    saveState();
    renderTabs();
  });
});

openDialogButton?.addEventListener("click", () => {
  personnelForm?.reset();
  dialog?.showModal();
});

closeDialogButton?.addEventListener("click", () => {
  dialog?.close();
});

personnelForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(personnelForm);
  const name = String(formData.get("name") || "").trim();
  const startDate = String(formData.get("startDate") || "");
  const profession = String(formData.get("profession") || "").trim();

  if (!name || !startDate || !profession) {
    return;
  }

  const personnel = {
    id: createId(),
    name,
    startDate,
    profession,
    status: "active",
    documents: [],
  };

  state.personnel.push(personnel);
  state.selectedPersonnelId = personnel.id;
  saveState();
  dialog?.close();
  renderAll();
});

personnelList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-personnel-id]");

  if (!button) {
    return;
  }

  state.selectedPersonnelId = button.dataset.personnelId;
  saveState();
  renderPersonnelDocuments();
});

personnelDetail?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-file-delete]");
  const personnelDeleteButton = event.target.closest("[data-personnel-delete]");
  const statusButton = event.target.closest("[data-status]");

  if (deleteButton) {
    deletePersonnelDocument(deleteButton.dataset.fileDelete);
    return;
  }

  if (personnelDeleteButton) {
    deletePersonnel(personnelDeleteButton.dataset.personnelDelete);
    return;
  }

  if (!statusButton) {
    return;
  }

  const personnel = getSelectedPersonnel();

  if (!personnel) {
    return;
  }

  personnel.status = statusButton.dataset.status;
  saveState();
  renderAll();
});

activePersonnelList?.addEventListener("click", (event) => {
  const personnelDeleteButton = event.target.closest("[data-personnel-delete]");

  if (!personnelDeleteButton) {
    return;
  }

  deletePersonnel(personnelDeleteButton.dataset.personnelDelete);
});

personnelDetail?.addEventListener("change", async (event) => {
  const input = event.target.closest("[data-personnel-file-input]");

  if (!input) {
    return;
  }

  await addPersonnelDocuments(input.files);
  input.value = "";
});

document.addEventListener("dragover", (event) => {
  if (hasDraggedFiles(event.dataTransfer)) {
    event.preventDefault();
  }
});

document.addEventListener("drop", (event) => {
  if (hasDraggedFiles(event.dataTransfer)) {
    event.preventDefault();
  }
});

personnelDetail?.addEventListener("dragenter", (event) => {
  const dropZone = getCurrentDropZone(event.target);

  if (!dropZone || !hasDraggedFiles(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  dropZone.classList.add("is-dragging");
});

personnelDetail?.addEventListener("dragover", (event) => {
  const dropZone = getCurrentDropZone(event.target);

  if (!dropZone || !hasDraggedFiles(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  dropZone.classList.add("is-dragging");
});

personnelDetail?.addEventListener("dragleave", (event) => {
  if (personnelDetail.contains(event.relatedTarget)) {
    return;
  }

  clearDropZoneState();
});

personnelDetail?.addEventListener("drop", async (event) => {
  const dropZone = getCurrentDropZone(event.target);

  if (!dropZone || !hasDraggedFiles(event.dataTransfer)) {
    return;
  }

  event.preventDefault();
  clearDropZoneState();
  await addPersonnelDocuments(await getFilesFromDataTransfer(event.dataTransfer));
});

workYearSelect?.addEventListener("change", () => {
  const [, selectedMonth] = splitMonthValue(state.selectedMonth);
  state.selectedMonth = `${workYearSelect.value}-${selectedMonth}`;
  saveState();
  renderYearMonthControls();
  renderHoursTable();
  renderPayrollPanel();
});

workMonthInput?.addEventListener("change", () => {
  state.selectedMonth = normalizeMonthValue(workMonthInput.value);
  saveState();
  renderYearMonthControls();
  renderHoursTable();
  renderPayrollPanel();
});

hoursTableShell?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-work-input]");

  if (!input) {
    return;
  }

  const personId = input.dataset.personId;
  const day = input.dataset.day;
  const value = Number(input.value);
  const monthHours = getMonthHours(state.selectedMonth);
  monthHours[personId] ||= {};

  if (input.value === "" || Number.isNaN(value)) {
    delete monthHours[personId][day];
  } else {
    monthHours[personId][day] = Math.max(0, value);
  }

  saveState();
  updateHourTotals();
  renderPayrollPanel();
});

exportExcelButton?.addEventListener("click", () => {
  exportHoursAsExcel();
});

importHoursInput?.addEventListener("change", async () => {
  const file = importHoursInput.files?.[0];

  if (!file) {
    return;
  }

  await importHoursFromFile(file);
  importHoursInput.value = "";
});

payrollPanel?.addEventListener("input", (event) => {
  const input = event.target.closest("[data-payroll-input]");

  if (!input) {
    return;
  }

  const payrollData = getPayrollPersonData(state.selectedMonth, input.dataset.personId);
  payrollData[input.dataset.payrollField] = parseMoneyInput(input.value);
  saveState();
  updatePayrollRow(input.dataset.personId);
  updatePayrollGrandTotals();
});

exportPayrollButton?.addEventListener("click", () => {
  exportPayrollAsExcel();
});

function loadState() {
  const fallback = {
    activeTab: "documents",
    selectedMonth: getCurrentMonth(),
    selectedPersonnelId: "",
    personnel: [],
    workHours: {},
    payroll: {},
  };

  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return normalizeState({
      ...fallback,
      ...storedState,
    });
  } catch {
    return fallback;
  }
}

function normalizeState(nextState) {
  const activeTab = ["documents", "hours", "list", "payroll"].includes(nextState.activeTab) ? nextState.activeTab : "documents";
  const personnel = Array.isArray(nextState.personnel) ? nextState.personnel : [];

  return {
    activeTab,
    selectedMonth: normalizeMonthValue(nextState.selectedMonth),
    selectedPersonnelId: String(nextState.selectedPersonnelId || ""),
    personnel: personnel.map(normalizePersonnel),
    workHours: isPlainObject(nextState.workHours) ? nextState.workHours : {},
    payroll: isPlainObject(nextState.payroll) ? nextState.payroll : {},
  };
}

function normalizePersonnel(person) {
  const documents = Array.isArray(person.documents) ? person.documents : [];

  return {
    id: String(person.id || createId()),
    name: String(person.name || "İsimsiz Personel"),
    startDate: String(person.startDate || getTodayDate()),
    profession: normalizeProfession(person.profession),
    status: person.status === "left" ? "left" : "active",
    documents: documents.map(normalizeDocument).filter(Boolean),
  };
}

function normalizeDocument(document) {
  if (!document?.dataUrl || !document?.name) {
    return null;
  }

  return {
    id: String(document.id || createId()),
    name: String(document.name),
    relativePath: String(document.relativePath || ""),
    type: String(document.type || "application/octet-stream"),
    size: Number(document.size || 0),
    uploadedAt: String(document.uploadedAt || new Date().toISOString()),
    dataUrl: String(document.dataUrl),
  };
}

function normalizeProfession(value) {
  const profession = String(value || "").trim();

  if (professionOptions.includes(profession)) {
    return profession;
  }

  return profession || "Belirtilmedi";
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    alert("Dosyalar tarayıcı depolama alanına sığmadı. Daha küçük dosya yüklemeyi dene.");
    return false;
  }
}

function renderAll() {
  renderTabs();
  renderYearMonthControls();
  renderPersonnelDocuments();
  renderActivePersonnelList();
  renderHoursTable();
  renderPayrollPanel();
}

function renderTabs() {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tabButton === state.activeTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === state.activeTab);
  });
}

function renderYearMonthControls() {
  if (!workYearSelect || !workMonthInput) {
    return;
  }

  const [selectedYear] = splitMonthValue(state.selectedMonth);
  workYearSelect.innerHTML = getSelectableYears()
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  workYearSelect.value = selectedYear;
  workMonthInput.value = state.selectedMonth;
}

function renderPersonnelDocuments() {
  if (!personnelList || !personnelDetail) {
    return;
  }

  if (!state.personnel.length) {
    personnelList.innerHTML = `<p class="empty-state">Personel kaydı yok.</p>`;
    personnelDetail.innerHTML = `<p class="empty-state">Personel seçilmedi.</p>`;
    return;
  }

  if (!state.personnel.some((person) => person.id === state.selectedPersonnelId)) {
    state.selectedPersonnelId = state.personnel[0].id;
    saveState();
  }

  personnelList.innerHTML = state.personnel
    .map((person) => {
      const isSelected = person.id === state.selectedPersonnelId;

      return `
        <button class="personnel-folder ${isSelected ? "is-selected" : ""}" type="button" data-personnel-id="${escapeHtml(person.id)}">
          <span class="folder-icon" aria-hidden="true">▣</span>
          <span>
            <strong>${escapeHtml(person.name)}</strong>
            <small>${escapeHtml(person.profession)} · ${formatDate(person.startDate)} · ${statusLabels[person.status]}</small>
          </span>
        </button>
      `;
    })
    .join("");

  const selected = getSelectedPersonnel();

  if (!selected) {
    personnelDetail.innerHTML = `<p class="empty-state">Personel seçilmedi.</p>`;
    return;
  }

  personnelDetail.innerHTML = `
    <div class="detail-heading">
      <h3>${escapeHtml(selected.name)}</h3>
      <span class="status-badge status-${selected.status}">${statusLabels[selected.status]}</span>
    </div>
    <dl class="detail-list">
      <div>
        <dt>İşe giriş tarihi</dt>
        <dd>${formatDate(selected.startDate)}</dd>
      </div>
      <div>
        <dt>Meslek</dt>
        <dd>${escapeHtml(selected.profession)}</dd>
      </div>
    </dl>
    <div class="detail-action-row">
      <div class="status-control" aria-label="Personel durumu">
        <button class="${selected.status === "active" ? "is-active" : ""}" type="button" data-status="active">Aktif</button>
        <button class="${selected.status === "left" ? "is-active" : ""}" type="button" data-status="left">Çıkan</button>
      </div>
      <button class="personnel-delete-button" type="button" data-personnel-delete="${escapeHtml(selected.id)}">Personeli Sil</button>
    </div>
    <section class="personnel-documents" aria-labelledby="personnel-documents-title" data-document-dropzone>
      <div class="documents-header">
        <h4 id="personnel-documents-title">Personel Özlük Evrakları</h4>
        <label class="file-upload-button">
          Dosya Yükle
          <input type="file" multiple data-personnel-file-input />
        </label>
      </div>
      <div class="document-list">
        ${renderPersonnelDocumentList(selected.documents)}
      </div>
    </section>
  `;
}

function renderActivePersonnelList() {
  if (!activePersonnelList) {
    return;
  }

  const activePersonnel = state.personnel.filter((person) => person.status === "active");

  if (!activePersonnel.length) {
    activePersonnelList.innerHTML = `<p class="empty-state">Aktif personel yok.</p>`;
    return;
  }

  activePersonnelList.innerHTML = `
    <table class="personnel-roster-table">
      <thead>
        <tr>
          <th>Ad Soyad</th>
          <th>Meslek</th>
          <th>İşe Giriş Tarihi</th>
          <th>Durum</th>
          <th>İşlem</th>
        </tr>
      </thead>
      <tbody>
        ${activePersonnel
          .map(
            (person) => `
              <tr>
                <td>${escapeHtml(person.name)}</td>
                <td>${escapeHtml(person.profession)}</td>
                <td>${formatDate(person.startDate)}</td>
                <td><span class="status-badge status-active">Aktif</span></td>
                <td class="roster-actions">
                  <button class="personnel-delete-button is-compact" type="button" data-personnel-delete="${escapeHtml(person.id)}">Sil</button>
                </td>
              </tr>
            `,
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function renderPersonnelDocumentList(documents) {
  if (!documents.length) {
    return `<p class="empty-state">Henüz evrak yüklenmedi. Dosya seçebilir veya dosyaları buraya sürükleyip bırakabilirsin.</p>`;
  }

  return documents
    .map((document) => {
      const displayName = document.relativePath || document.name;

      return `
        <article class="document-item">
          <div>
            <a class="document-name" href="${escapeHtml(document.dataUrl)}" target="_blank" rel="noopener noreferrer">
              ${escapeHtml(displayName)}
            </a>
            <small>${formatFileSize(document.size)} · ${formatDateTime(document.uploadedAt)}</small>
          </div>
          <div class="document-actions">
            <a class="file-action" href="${escapeHtml(document.dataUrl)}" download="${escapeHtml(document.name)}">İndir</a>
            <button class="file-action danger-action" type="button" data-file-delete="${escapeHtml(document.id)}">Sil</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderHoursTable() {
  if (!hoursTableShell || !workMonthInput) {
    return;
  }

  workMonthInput.value = state.selectedMonth;
  const activePersonnel = getEligibleActivePersonnel();

  if (!activePersonnel.length) {
    const hasActivePersonnel = state.personnel.some((person) => person.status === "active");
    hoursTableShell.innerHTML = `<p class="empty-state">${
      hasActivePersonnel ? "Seçilen ayda işe başlamış aktif personel yok." : "Aktif personel yok."
    }</p>`;
    exportExcelButton.disabled = true;
    return;
  }

  exportExcelButton.disabled = false;

  const dayMetas = getMonthDayMetas(state.selectedMonth);
  const daysInMonth = dayMetas.length;
  const dayHeaders = dayMetas.map(renderDayHeader).join("");
  const rows = activePersonnel
    .map((person) => {
      const cells = dayMetas.map((dayMeta) => {
        const value = getWorkHour(state.selectedMonth, person.id, dayMeta.day);

        return `
          <td class="${getDayColumnClass(dayMeta)}">
            <input
              class="hour-input"
              type="number"
              min="0"
              step="0.25"
              value="${value || ""}"
              aria-label="${escapeHtml(person.name)} ${dayMeta.day}. gün ${escapeHtml(dayMeta.dayName)}"
              data-work-input
              data-person-id="${escapeHtml(person.id)}"
              data-day="${dayMeta.day}"
            />
          </td>
        `;
      }).join("");

      return `
        <tr data-row-person-id="${escapeHtml(person.id)}">
          <th scope="row">${escapeHtml(person.name)}</th>
          ${cells}
          <td class="total-cell" data-row-total="${escapeHtml(person.id)}">0</td>
        </tr>
      `;
    })
    .join("");

  hoursTableShell.innerHTML = `
    <table class="hours-table">
      <thead>
        <tr>
          <th>Personel</th>
          ${dayHeaders}
          <th>Toplam</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
      <tfoot>
        <tr>
          <th class="grand-total-label" scope="row" colspan="${daysInMonth + 1}">Genel Toplam</th>
          <td class="total-cell grand-total-cell" data-grand-total>0</td>
        </tr>
      </tfoot>
    </table>
  `;

  updateHourTotals();
}

function renderPayrollPanel() {
  if (!payrollPanel) {
    return;
  }

  const activePersonnel = getEligibleActivePersonnel();

  if (!activePersonnel.length) {
    payrollPanel.innerHTML = `<p class="empty-state">Seçilen ayda maaş puantajına dahil edilecek aktif personel yok.</p>`;
    if (exportPayrollButton) {
      exportPayrollButton.disabled = true;
    }
    return;
  }

  if (exportPayrollButton) {
    exportPayrollButton.disabled = false;
  }
  payrollPanel.innerHTML = `
    <table class="payroll-table">
      <thead>
        <tr>
          <th>Personel</th>
          <th>Meslek</th>
          <th>SGK Gün</th>
          <th>Normal Saat</th>
          <th>%50 Saat</th>
          <th>%100 Saat</th>
          <th>Net Maaş</th>
          <th>Saat Ücreti</th>
          <th>Normal Ücret</th>
          <th>%50 Mesai</th>
          <th>%100 Mesai</th>
          <th>Toplam</th>
          <th>Yol</th>
          <th>Diğer Destek</th>
          <th>Avans/Kesinti</th>
          <th>Resmi Ödeme</th>
          <th>Ödenecek</th>
          <th>Zarflanan</th>
          <th>Kalan</th>
        </tr>
      </thead>
      <tbody>
        ${activePersonnel.map(renderPayrollRow).join("")}
      </tbody>
      <tfoot>
        <tr>
          <th class="grand-total-label" colspan="11">Genel Toplam</th>
          <td class="payroll-grand-cell" data-payroll-grand="total">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="road">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="support">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="deduction">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="officialPayment">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="payable">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="envelope">0</td>
          <td class="payroll-grand-cell" data-payroll-grand="remaining">0</td>
        </tr>
      </tfoot>
    </table>
  `;
  updatePayrollGrandTotals();
}

function renderPayrollRow(person) {
  const payrollData = getPayrollPersonData(state.selectedMonth, person.id);
  const calculation = calculatePayroll(person);

  return `
    <tr data-payroll-row="${escapeHtml(person.id)}">
      <th scope="row">${escapeHtml(person.name)}</th>
      <td>${escapeHtml(person.profession)}</td>
      <td class="payroll-metric" data-payroll-output="sgkDays">${formatHours(calculation.sgkDays)}</td>
      <td class="payroll-metric" data-payroll-output="normalHours">${formatHours(calculation.normalHours)}</td>
      <td class="payroll-metric" data-payroll-output="fiftyHours">${formatHours(calculation.fiftyHours)}</td>
      <td class="payroll-metric" data-payroll-output="hundredHours">${formatHours(calculation.hundredHours)}</td>
      <td>${renderPayrollInput(person.id, "netSalary", payrollData.netSalary)}</td>
      <td class="payroll-money" data-payroll-output="hourlyRate">${formatMoney(calculation.hourlyRate)}</td>
      <td class="payroll-money" data-payroll-output="normalPay">${formatMoney(calculation.normalPay)}</td>
      <td class="payroll-money" data-payroll-output="fiftyPay">${formatMoney(calculation.fiftyPay)}</td>
      <td class="payroll-money" data-payroll-output="hundredPay">${formatMoney(calculation.hundredPay)}</td>
      <td class="payroll-money payroll-total" data-payroll-output="total">${formatMoney(calculation.total)}</td>
      <td>${renderPayrollInput(person.id, "road", payrollData.road)}</td>
      <td>${renderPayrollInput(person.id, "support", payrollData.support)}</td>
      <td>${renderPayrollInput(person.id, "deduction", payrollData.deduction)}</td>
      <td>${renderPayrollInput(person.id, "officialPayment", payrollData.officialPayment)}</td>
      <td class="payroll-money payroll-payable" data-payroll-output="payable">${formatMoney(calculation.payable)}</td>
      <td>${renderPayrollInput(person.id, "envelope", payrollData.envelope)}</td>
      <td class="payroll-money payroll-remaining" data-payroll-output="remaining">${formatMoney(calculation.remaining)}</td>
    </tr>
  `;
}

function renderPayrollInput(personId, field, value) {
  return `
    <input
      class="payroll-input"
      type="text"
      inputmode="decimal"
      value="${value || ""}"
      data-payroll-input
      data-person-id="${escapeHtml(personId)}"
      data-payroll-field="${escapeHtml(field)}"
    />
  `;
}

function updatePayrollRow(personId) {
  const person = state.personnel.find((item) => item.id === personId);
  const row = payrollPanel?.querySelector(`[data-payroll-row="${cssEscape(personId)}"]`);

  if (!person || !row) {
    return;
  }

  const calculation = calculatePayroll(person);
  const outputFormatters = {
    sgkDays: formatHours,
    normalHours: formatHours,
    fiftyHours: formatHours,
    hundredHours: formatHours,
    hourlyRate: formatMoney,
    normalPay: formatMoney,
    fiftyPay: formatMoney,
    hundredPay: formatMoney,
    total: formatMoney,
    payable: formatMoney,
    remaining: formatMoney,
  };

  Object.entries(outputFormatters).forEach(([field, formatter]) => {
    const element = row.querySelector(`[data-payroll-output="${field}"]`);

    if (element) {
      element.textContent = formatter(calculation[field]);
    }
  });
}

function updatePayrollGrandTotals() {
  if (!payrollPanel) {
    return;
  }

  const totals = getPayrollGrandTotals();

  Object.entries(totals).forEach(([field, value]) => {
    const element = payrollPanel.querySelector(`[data-payroll-grand="${field}"]`);

    if (element) {
      element.textContent = formatMoney(value);
    }
  });
}

function calculatePayroll(person) {
  const payrollData = getPayrollPersonData(state.selectedMonth, person.id);
  const hours = getPayrollHours(person.id);
  const hourlyRate = Number(payrollData.netSalary || 0) / 225;
  const normalPay = hours.normalHours * hourlyRate;
  const fiftyPay = hours.fiftyHours * hourlyRate * 1.5;
  const hundredPay = hours.hundredHours * hourlyRate * 2;
  const total = normalPay + fiftyPay + hundredPay;
  const payable =
    total +
    Number(payrollData.road || 0) +
    Number(payrollData.support || 0) -
    Number(payrollData.deduction || 0) -
    Number(payrollData.officialPayment || 0);
  const remaining = payable - Number(payrollData.envelope || 0);

  return {
    ...hours,
    hourlyRate,
    normalPay,
    fiftyPay,
    hundredPay,
    total,
    road: Number(payrollData.road || 0),
    support: Number(payrollData.support || 0),
    deduction: Number(payrollData.deduction || 0),
    officialPayment: Number(payrollData.officialPayment || 0),
    payable,
    envelope: Number(payrollData.envelope || 0),
    remaining,
  };
}

function getPayrollHours(personId) {
  const dayMetas = getMonthDayMetas(state.selectedMonth);
  const workedDays = new Set();
  const totals = {
    sgkDays: 0,
    normalHours: 0,
    fiftyHours: 0,
    hundredHours: 0,
  };

  dayMetas.forEach((dayMeta) => {
    const hours = getWorkHour(state.selectedMonth, personId, dayMeta.day);

    if (!hours) {
      return;
    }

    workedDays.add(dayMeta.day);

    if (dayMeta.isHoliday || dayMeta.isSunday) {
      totals.hundredHours += hours;
    } else if (dayMeta.isSaturday) {
      totals.fiftyHours += hours;
    } else {
      totals.normalHours += hours;
    }
  });

  totals.sgkDays = workedDays.size;

  return totals;
}

function getPayrollGrandTotals() {
  return getEligibleActivePersonnel().reduce(
    (totals, person) => {
      const calculation = calculatePayroll(person);

      totals.total += calculation.total;
      totals.road += calculation.road;
      totals.support += calculation.support;
      totals.deduction += calculation.deduction;
      totals.officialPayment += calculation.officialPayment;
      totals.payable += calculation.payable;
      totals.envelope += calculation.envelope;
      totals.remaining += calculation.remaining;

      return totals;
    },
    {
      total: 0,
      road: 0,
      support: 0,
      deduction: 0,
      officialPayment: 0,
      payable: 0,
      envelope: 0,
      remaining: 0,
    },
  );
}

function getPayrollPersonData(month, personId) {
  state.payroll[month] ||= {};
  state.payroll[month][personId] ||= {
    netSalary: 0,
    road: 0,
    support: 0,
    deduction: 0,
    officialPayment: 0,
    envelope: 0,
  };

  return state.payroll[month][personId];
}

function updateHourTotals() {
  const activePersonnel = getEligibleActivePersonnel();
  let grandTotal = 0;

  activePersonnel.forEach((person) => {
    const rowTotal = getPersonMonthTotal(state.selectedMonth, person.id);
    grandTotal += rowTotal;

    const rowTotalElement = document.querySelector(`[data-row-total="${cssEscape(person.id)}"]`);

    if (rowTotalElement) {
      rowTotalElement.textContent = formatHours(rowTotal);
    }
  });

  const grandTotalElement = document.querySelector("[data-grand-total]");

  if (grandTotalElement) {
    grandTotalElement.textContent = formatHours(grandTotal);
  }
}

function exportHoursAsExcel() {
  const activePersonnel = getEligibleActivePersonnel();

  if (!activePersonnel.length) {
    return;
  }

  const dayMetas = getMonthDayMetas(state.selectedMonth);
  const daysInMonth = dayMetas.length;
  const dayHeaders = dayMetas
    .map((dayMeta) => {
      const holidayText = dayMeta.holidayName ? ` - ${dayMeta.holidayName}` : "";
      return `<th${getExcelHeaderStyle(dayMeta)}>${dayMeta.day} ${dayMeta.dayName}${holidayText}</th>`;
    })
    .join("");
  let grandTotal = 0;

  const rows = activePersonnel
    .map((person) => {
      const cells = dayMetas.map((dayMeta) => {
        const value = getWorkHour(state.selectedMonth, person.id, dayMeta.day);
        return `<td${getExcelCellStyle(dayMeta)}>${value ? formatHours(value) : ""}</td>`;
      }).join("");
      const rowTotal = getPersonMonthTotal(state.selectedMonth, person.id);
      grandTotal += rowTotal;

      return `<tr><td>${escapeHtml(person.name)}</td>${cells}<td>${formatHours(rowTotal)}</td></tr>`;
    })
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <caption>Personel Çalışma Saatleri - ${escapeHtml(state.selectedMonth)}</caption>
          <thead><tr><th>Personel</th>${dayHeaders}<th>Toplam</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr><th colspan="${daysInMonth + 1}">Genel Toplam</th><td>${formatHours(grandTotal)}</td></tr></tfoot>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `personel-calisma-saatleri-${state.selectedMonth}.xls`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportPayrollAsExcel() {
  const activePersonnel = getEligibleActivePersonnel();

  if (!activePersonnel.length) {
    return;
  }

  let grandTotal = 0;
  let grandRoad = 0;
  let grandSupport = 0;
  let grandDeduction = 0;
  let grandOfficialPayment = 0;
  let grandPayable = 0;
  let grandEnvelope = 0;
  let grandRemaining = 0;

  const rows = activePersonnel
    .map((person) => {
      const payrollData = getPayrollPersonData(state.selectedMonth, person.id);
      const calculation = calculatePayroll(person);

      grandTotal += calculation.total;
      grandRoad += calculation.road;
      grandSupport += calculation.support;
      grandDeduction += calculation.deduction;
      grandOfficialPayment += calculation.officialPayment;
      grandPayable += calculation.payable;
      grandEnvelope += calculation.envelope;
      grandRemaining += calculation.remaining;

      return `
        <tr>
          <td>${escapeHtml(person.name)}</td>
          <td>${escapeHtml(person.profession)}</td>
          <td>${formatHours(calculation.sgkDays)}</td>
          <td>${formatHours(calculation.normalHours)}</td>
          <td>${formatHours(calculation.fiftyHours)}</td>
          <td>${formatHours(calculation.hundredHours)}</td>
          <td>${formatMoney(payrollData.netSalary)}</td>
          <td>${formatMoney(calculation.hourlyRate)}</td>
          <td>${formatMoney(calculation.normalPay)}</td>
          <td>${formatMoney(calculation.fiftyPay)}</td>
          <td>${formatMoney(calculation.hundredPay)}</td>
          <td>${formatMoney(calculation.total)}</td>
          <td>${formatMoney(calculation.road)}</td>
          <td>${formatMoney(calculation.support)}</td>
          <td>${formatMoney(calculation.deduction)}</td>
          <td>${formatMoney(calculation.officialPayment)}</td>
          <td>${formatMoney(calculation.payable)}</td>
          <td>${formatMoney(calculation.envelope)}</td>
          <td>${formatMoney(calculation.remaining)}</td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head><meta charset="UTF-8" /></head>
      <body>
        <table border="1">
          <caption>Maaş Puantajı - ${escapeHtml(state.selectedMonth)}</caption>
          <thead>
            <tr>
              <th>Personel</th>
              <th>Meslek</th>
              <th>SGK Gün</th>
              <th>Normal Saat</th>
              <th>%50 Saat</th>
              <th>%100 Saat</th>
              <th>Net Maaş</th>
              <th>Saat Ücreti</th>
              <th>Normal Ücret</th>
              <th>%50 Mesai</th>
              <th>%100 Mesai</th>
              <th>Toplam</th>
              <th>Yol</th>
              <th>Diğer Destek</th>
              <th>Avans/Kesinti</th>
              <th>Resmi Ödeme</th>
              <th>Ödenecek</th>
              <th>Zarflanan</th>
              <th>Kalan</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr>
              <th colspan="11">Genel Toplam</th>
              <td>${formatMoney(grandTotal)}</td>
              <td>${formatMoney(grandRoad)}</td>
              <td>${formatMoney(grandSupport)}</td>
              <td>${formatMoney(grandDeduction)}</td>
              <td>${formatMoney(grandOfficialPayment)}</td>
              <td>${formatMoney(grandPayable)}</td>
              <td>${formatMoney(grandEnvelope)}</td>
              <td>${formatMoney(grandRemaining)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(["\ufeff", html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `maas-puantaji-${state.selectedMonth}.xls`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function importHoursFromFile(file) {
  setImportStatus("Excel okunuyor...");

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/import-hours", {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Excel okunamadı.");
    }

    const result = applyImportedHourRows(data.rows || []);
    renderYearMonthControls();
    renderHoursTable();
    renderPayrollPanel();
    setImportStatus(
      `${result.applied} kayıt aktarıldı. ${result.unmatched} eşleşmeyen, ${result.skipped} atlanan satır.`,
    );
  } catch (error) {
    setImportStatus(error.message || "Excel içe aktarma başarısız oldu.");
  }
}

function applyImportedHourRows(rows) {
  const personnelByName = new Map(
    state.personnel.map((person) => [normalizePersonName(person.name), person]),
  );
  let applied = 0;
  let unmatched = 0;
  let skipped = 0;
  let firstImportedMonth = "";

  rows.forEach((row) => {
    const person = personnelByName.get(normalizePersonName(row.name));
    const date = String(row.date || "");
    const hours = Number(row.hours);

    if (!person) {
      unmatched += 1;
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(hours)) {
      skipped += 1;
      return;
    }

    const month = date.slice(0, 7);
    const day = String(Number(date.slice(8, 10)));
    const monthHours = getMonthHours(month);
    monthHours[person.id] ||= {};
    monthHours[person.id][day] = roundToHalfHour(hours);
    firstImportedMonth ||= month;
    applied += 1;
  });

  if (firstImportedMonth) {
    state.selectedMonth = firstImportedMonth;
  }

  saveState();

  return { applied, unmatched, skipped };
}

function roundToHalfHour(value) {
  return Math.round(Number(value) * 2) / 2;
}

function normalizePersonName(value) {
  return String(value || "")
    .toLocaleUpperCase("tr-TR")
    .replaceAll("İ", "I")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function setImportStatus(message) {
  if (importStatus) {
    importStatus.textContent = message;
  }
}

async function addPersonnelDocuments(fileList) {
  const personnel = getSelectedPersonnel();

  if (!personnel || !fileList?.length) {
    return;
  }

  const selectedFiles = Array.from(fileList)
    .map(normalizeIncomingFile)
    .filter((item) => item.file?.name);

  const documents = await Promise.all(
    selectedFiles.map(async ({ file, relativePath }) => ({
      id: createId(),
      name: file.name,
      relativePath,
      type: file.type || "application/octet-stream",
      size: file.size,
      uploadedAt: new Date().toISOString(),
      dataUrl: await readFileAsDataUrl(file),
    })),
  );

  personnel.documents.push(...documents);

  if (!saveState()) {
    personnel.documents.splice(-documents.length);
    saveState();
  }

  renderPersonnelDocuments();
}

async function getFilesFromDataTransfer(dataTransfer) {
  const items = Array.from(dataTransfer?.items || []);
  const entries = items.map((item) => item.webkitGetAsEntry?.()).filter(Boolean);

  if (!entries.length) {
    return Array.from(dataTransfer?.files || []);
  }

  const nestedFiles = await Promise.all(entries.map((entry) => readEntryFiles(entry)));

  return nestedFiles.flat();
}

async function readEntryFiles(entry, parentPath = "") {
  if (entry.isFile) {
    return new Promise((resolve) => {
      entry.file(
        (file) => resolve([{ file, relativePath: `${parentPath}${file.name}` }]),
        () => resolve([]),
      );
    });
  }

  if (!entry.isDirectory) {
    return [];
  }

  const entries = await readDirectoryEntries(entry.createReader());
  const nestedFiles = await Promise.all(
    entries.map((childEntry) => readEntryFiles(childEntry, `${parentPath}${entry.name}/`)),
  );

  return nestedFiles.flat();
}

function readDirectoryEntries(reader) {
  return new Promise((resolve) => {
    const entries = [];

    function readBatch() {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries);
          return;
        }

        entries.push(...batch);
        readBatch();
      });
    }

    readBatch();
  });
}

function normalizeIncomingFile(item) {
  if (item?.file) {
    return item;
  }

  return {
    file: item,
    relativePath: item.webkitRelativePath || "",
  };
}

function getCurrentDropZone(target) {
  const element = target instanceof Element ? target : target?.parentElement;

  return element?.closest("[data-document-dropzone]") || personnelDetail?.querySelector("[data-document-dropzone]");
}

function clearDropZoneState() {
  document.querySelectorAll("[data-document-dropzone].is-dragging").forEach((dropZone) => {
    dropZone.classList.remove("is-dragging");
  });
}

function hasDraggedFiles(dataTransfer) {
  return Array.from(dataTransfer?.types || []).includes("Files");
}

function deletePersonnel(personnelId) {
  const personnel = state.personnel.find((person) => person.id === personnelId);

  if (!personnel) {
    return;
  }

  const shouldDelete = window.confirm(
    `${personnel.name} kaydı, yüklenen evrakları, çalışma saatleri ve maaş puantajı silinsin mi?`,
  );

  if (!shouldDelete) {
    return;
  }

  state.personnel = state.personnel.filter((person) => person.id !== personnelId);
  deletePersonnelFromMonthlyStore(state.workHours, personnelId);
  deletePersonnelFromMonthlyStore(state.payroll, personnelId);

  if (state.selectedPersonnelId === personnelId) {
    state.selectedPersonnelId = state.personnel[0]?.id || "";
  }

  saveState();
  renderAll();
}

function deletePersonnelFromMonthlyStore(store, personnelId) {
  Object.keys(store || {}).forEach((month) => {
    if (!isPlainObject(store[month])) {
      return;
    }

    delete store[month][personnelId];

    if (!Object.keys(store[month]).length) {
      delete store[month];
    }
  });
}

function deletePersonnelDocument(documentId) {
  const personnel = getSelectedPersonnel();

  if (!personnel) {
    return;
  }

  personnel.documents = personnel.documents.filter((document) => document.id !== documentId);
  saveState();
  renderPersonnelDocuments();
}

function getSelectedPersonnel() {
  return state.personnel.find((person) => person.id === state.selectedPersonnelId);
}

function getEligibleActivePersonnel() {
  return state.personnel.filter((person) => {
    return person.status === "active" && hasStartedBySelectedMonth(person.startDate, state.selectedMonth);
  });
}

function hasStartedBySelectedMonth(startDate, selectedMonth) {
  const [startYear, startMonth] = startDate.split("-").map(Number);
  const [selectedYear, selectedMonthNumber] = splitMonthValue(selectedMonth).map(Number);

  if (!startYear || !startMonth || !selectedYear || !selectedMonthNumber) {
    return true;
  }

  return selectedYear > startYear || (selectedYear === startYear && selectedMonthNumber >= startMonth);
}

function getMonthHours(month) {
  state.workHours[month] ||= {};
  return state.workHours[month];
}

function getWorkHour(month, personId, day) {
  return Number(state.workHours[month]?.[personId]?.[day] || 0);
}

function getPersonMonthTotal(month, personId) {
  const days = state.workHours[month]?.[personId] || {};

  return Object.values(days).reduce((total, value) => total + Number(value || 0), 0);
}

function getSelectableYears() {
  const [selectedYear] = splitMonthValue(state.selectedMonth).map(Number);
  const currentYear = new Date().getFullYear();
  const lastYear = Math.max(LAST_READY_YEAR, currentYear + FUTURE_YEAR_BUFFER, selectedYear);

  return Array.from({ length: lastYear - FIRST_READY_YEAR + 1 }, (_, index) => FIRST_READY_YEAR + index);
}

function getCurrentMonth() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");

  return `${today.getFullYear()}-${month}`;
}

function getTodayDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${today.getFullYear()}-${month}-${day}`;
}

function normalizeMonthValue(monthValue) {
  if (/^\d{4}-\d{2}$/.test(String(monthValue || ""))) {
    return monthValue;
  }

  return getCurrentMonth();
}

function splitMonthValue(monthValue) {
  return normalizeMonthValue(monthValue).split("-");
}

function getDaysInMonth(monthValue) {
  const [year, month] = splitMonthValue(monthValue).map(Number);

  return new Date(year, month, 0).getDate();
}

function getMonthDayMetas(monthValue) {
  const [year, month] = splitMonthValue(monthValue).map(Number);
  const daysInMonth = getDaysInMonth(monthValue);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const holidayName = getHolidayName(year, monthDay);
    const dayOfWeek = date.getDay();

    return {
      day: String(day),
      dayName: dayNames[dayOfWeek],
      holidayName,
      isHoliday: Boolean(holidayName),
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
    };
  });
}

function getHolidayName(year, monthDay) {
  return specialHolidayDates[year]?.[monthDay] || fixedHolidayDates[monthDay] || "";
}

function renderDayHeader(dayMeta) {
  const holidayName = dayMeta.holidayName
    ? `<span class="holiday-label">${escapeHtml(dayMeta.holidayName)}</span>`
    : "";

  return `
    <th class="${getDayColumnClass(dayMeta)}" title="${escapeHtml(dayMeta.holidayName)}">
      <span class="day-number">${dayMeta.day}</span>
      <span class="day-name">${dayMeta.dayName}</span>
      ${holidayName}
    </th>
  `;
}

function getDayColumnClass(dayMeta) {
  const classes = ["day-column"];

  if (dayMeta.isSaturday) {
    classes.push("saturday-column");
  }

  if (dayMeta.isSunday) {
    classes.push("sunday-column");
  }

  if (dayMeta.isHoliday) {
    classes.push("holiday-column");
  }

  return classes.join(" ");
}

function getExcelHeaderStyle(dayMeta) {
  if (dayMeta.isHoliday) {
    return ' style="background:#7fb0ff;color:#0f2f5f;font-weight:bold;"';
  }

  if (dayMeta.isSaturday) {
    return ' style="background:#ffe680;color:#182230;font-weight:bold;"';
  }

  if (dayMeta.isSunday) {
    return ' style="background:#ffb3b3;color:#182230;font-weight:bold;"';
  }

  return "";
}

function getExcelCellStyle(dayMeta) {
  if (dayMeta.isHoliday) {
    return ' style="background:#c9ddff;"';
  }

  if (dayMeta.isSaturday) {
    return ' style="background:#fff2b8;"';
  }

  if (dayMeta.isSunday) {
    return ' style="background:#ffd6d6;"';
  }

  return "";
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(new Error("Dosya okunamadı.")));
    reader.readAsDataURL(file);
  });
}

function createId() {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("tr-TR").format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(size) {
  if (!size) {
    return "0 KB";
  }

  const kilobytes = size / 1024;

  if (kilobytes < 1024) {
    return `${formatHours(kilobytes)} KB`;
  }

  return `${formatHours(kilobytes / 1024)} MB`;
}

function parseMoneyInput(value) {
  const rawValue = String(value || "").replace(/[₺\s]/g, "").trim();
  const normalized = rawValue.includes(",")
    ? rawValue.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(rawValue)
      ? rawValue.replace(/\./g, "")
      : rawValue;
  const number = Number(normalized);

  return Number.isNaN(number) ? 0 : number;
}

function formatMoney(value) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatHours(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) {
    return CSS.escape(value);
  }

  return String(value).replaceAll('"', '\\"');
}
