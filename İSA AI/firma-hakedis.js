const COMPANY_STORAGE_KEY = "isa-ai-firma-paneli";
const COMPANY_FIRST_READY_YEAR = 2025;
const COMPANY_LAST_READY_YEAR = 2030;
const COMPANY_FUTURE_YEAR_BUFFER = 2;
const COMPANY_BASE_HOURLY_RATE = 650;
const COMPANY_NORMAL_MULTIPLIER = 1;
const COMPANY_FIFTY_MULTIPLIER = 1.3;
const COMPANY_HUNDRED_MULTIPLIER = 1.7;
const companyDayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

const companySpecialHolidayDates = {
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

const companyFixedHolidayDates = {
  "01-01": "Yılbaşı",
  "04-23": "Ulusal Egemenlik ve Çocuk Bayramı",
  "05-01": "Emek ve Dayanışma Günü",
  "05-19": "Atatürk'ü Anma, Gençlik ve Spor Bayramı",
  "07-15": "Demokrasi ve Milli Birlik Günü",
  "08-30": "Zafer Bayramı",
  "10-29": "Cumhuriyet Bayramı",
};

const companyYearSelect = document.querySelector("[data-company-year]");
const companyMonthInput = document.querySelector("[data-company-month]");
const companyEntitlementPanel = document.querySelector("[data-company-entitlement]");

let companySelectedMonth = getCompanyInitialMonth();

renderCompanyEntitlement();

companyYearSelect?.addEventListener("change", () => {
  const [, selectedMonth] = splitCompanyMonthValue(companySelectedMonth);
  companySelectedMonth = `${companyYearSelect.value}-${selectedMonth}`;
  renderCompanyEntitlement();
});

companyMonthInput?.addEventListener("change", () => {
  companySelectedMonth = normalizeCompanyMonthValue(companyMonthInput.value);
  renderCompanyEntitlement();
});

window.addEventListener("storage", (event) => {
  if (event.key === COMPANY_STORAGE_KEY) {
    renderCompanyEntitlement();
  }
});

function renderCompanyEntitlement() {
  renderCompanyMonthControls();

  if (!companyEntitlementPanel) {
    return;
  }

  const state = loadCompanyPersonnelState();
  const activePersonnel = getCompanyEligiblePersonnel(state);

  if (!state.personnel.length) {
    companyEntitlementPanel.innerHTML = `<p class="empty-state">Personel Paneli’nde henüz personel kaydı yok.</p>`;
    return;
  }

  if (!activePersonnel.length) {
    companyEntitlementPanel.innerHTML = `<p class="empty-state">Seçilen ayda hakedişe dahil edilecek aktif personel yok.</p>`;
    return;
  }

  const totals = getCompanyEntitlementTotals(state, activePersonnel);

  companyEntitlementPanel.innerHTML = `
    <div class="company-entitlement-period">
      <span>Seçili Ay</span>
      <strong>${formatCompanyMonthLabel(companySelectedMonth)}</strong>
    </div>
    <div class="company-entitlement-summary" aria-label="Hakediş genel toplamları">
      ${renderCompanyEntitlementMetric("Normal Saat", totals.normalHours, "normal")}
      ${renderCompanyEntitlementMetric("%50 Mesai", totals.fiftyHours, "fifty")}
      ${renderCompanyEntitlementMetric("%100 Mesai", totals.hundredHours, "hundred")}
      ${renderCompanyEntitlementMetric("Bayram / Resmi Tatil", totals.holidayHours, "holiday")}
      ${renderCompanyEntitlementMetric("Genel Toplam", totals.totalHours, "total")}
    </div>
    <div class="company-entitlement-table-shell">
      <table class="company-entitlement-table">
        <thead>
          <tr>
            <th>Personel</th>
            <th>Meslek</th>
            <th>Normal Saat</th>
            <th>%50 Mesai</th>
            <th>%100 Mesai</th>
            <th>Bayram / Resmi Tatil</th>
            <th>Toplam Saat</th>
          </tr>
        </thead>
        <tbody>
          ${activePersonnel.map((person) => renderCompanyEntitlementRow(state, person)).join("")}
        </tbody>
        <tfoot>
          <tr>
            <th class="grand-total-label" colspan="2">Genel Toplam</th>
            <td>${formatCompanyHours(totals.normalHours)}</td>
            <td>${formatCompanyHours(totals.fiftyHours)}</td>
            <td>${formatCompanyHours(totals.hundredHours)}</td>
            <td>${formatCompanyHours(totals.holidayHours)}</td>
            <td>${formatCompanyHours(totals.totalHours)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
    ${renderCompanyEntitlementPayment(totals)}
    ${renderCompanyPersonnelEntitlements(state, activePersonnel)}
  `;
}

function renderCompanyMonthControls() {
  if (!companyYearSelect || !companyMonthInput) {
    return;
  }

  const [selectedYear] = splitCompanyMonthValue(companySelectedMonth);
  companyYearSelect.innerHTML = getCompanySelectableYears()
    .map((year) => `<option value="${year}">${year}</option>`)
    .join("");
  companyYearSelect.value = selectedYear;
  companyMonthInput.value = companySelectedMonth;
}

function renderCompanyEntitlementMetric(label, value, tone) {
  return `
    <article class="company-entitlement-metric company-entitlement-${tone}">
      <span>${escapeCompanyHtml(label)}</span>
      <strong>${formatCompanyHours(value)}</strong>
    </article>
  `;
}

function renderCompanyEntitlementRow(state, person) {
  const hours = getCompanyPersonHours(state, person.id);

  return `
    <tr>
      <th scope="row">${escapeCompanyHtml(person.name)}</th>
      <td>${escapeCompanyHtml(person.profession || "-")}</td>
      <td>${formatCompanyHours(hours.normalHours)}</td>
      <td>${formatCompanyHours(hours.fiftyHours)}</td>
      <td>${formatCompanyHours(hours.hundredHours)}</td>
      <td>${formatCompanyHours(hours.holidayHours)}</td>
      <td>${formatCompanyHours(hours.totalHours)}</td>
    </tr>
  `;
}

function renderCompanyEntitlementPayment(totals) {
  const lines = getCompanyPaymentLines(totals);
  const totalAmount = lines.reduce((sum, line) => sum + line.amount, 0);

  return `
    <section class="company-entitlement-payment-shell" aria-label="Hakediş tutarları">
      <div class="company-entitlement-payment-header">
        <div>
          <h3>Hakediş Tutarları</h3>
          <p>Sabit saat ücreti ${formatCompanyCurrency(COMPANY_BASE_HOURLY_RATE)} olarak hesaplanır.</p>
        </div>
      </div>
      <div class="company-entitlement-payment-table-shell">
        <table class="company-entitlement-payment-table">
          <thead>
            <tr>
              <th>Kalem</th>
              <th>Saat</th>
              <th>Katsayı</th>
              <th>Hesap</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map(renderCompanyPaymentRow).join("")}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="4">Toplam Hakediş</th>
              <td>${formatCompanyCurrency(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  `;
}

function renderCompanyPaymentRow(line) {
  return `
    <tr>
      <th scope="row">${escapeCompanyHtml(line.label)}</th>
      <td>${formatCompanyHours(line.hours)}</td>
      <td>${formatCompanyMultiplier(line.multiplier)}</td>
      <td>${formatCompanyHours(line.hours)} x ${formatCompanyMultiplier(line.multiplier)} x ${formatCompanyCurrency(COMPANY_BASE_HOURLY_RATE)}</td>
      <td>${formatCompanyCurrency(line.amount)}</td>
    </tr>
  `;
}

function getCompanyPaymentLines(totals) {
  return [
    getCompanyPaymentLine("Normal Saat Tutarı", totals.normalHours, COMPANY_NORMAL_MULTIPLIER),
    getCompanyPaymentLine("%50 Mesai Tutarı", totals.fiftyHours, COMPANY_FIFTY_MULTIPLIER),
    getCompanyPaymentLine("%100 Mesai Tutarı", totals.hundredHours, COMPANY_HUNDRED_MULTIPLIER),
    getCompanyPaymentLine("Bayram / Resmi Tatil Tutarı", totals.holidayHours, COMPANY_HUNDRED_MULTIPLIER),
  ];
}

function getCompanyPaymentLine(label, hours, multiplier) {
  const safeHours = Number(hours || 0);
  const safeMultiplier = Number(multiplier || 0);

  return {
    label,
    hours: safeHours,
    multiplier: safeMultiplier,
    amount: safeHours * safeMultiplier * COMPANY_BASE_HOURLY_RATE,
  };
}

function renderCompanyPersonnelEntitlements(state, personnel) {
  const rows = personnel.map((person) => {
    const hours = getCompanyPersonHours(state, person.id);
    const payment = getCompanyPersonPaymentSummary(hours);

    return {
      person,
      hours,
      payment,
    };
  });
  const totalAmount = rows.reduce((sum, row) => sum + row.payment.totalAmount, 0);

  return `
    <section class="company-personnel-entitlement-shell" aria-label="Personel hakedişi">
      <div class="company-entitlement-payment-header">
        <div>
          <h3>Personel Hakedişi</h3>
          <p>Her personelin bireysel normal, %50 ve %100/bayram getirisi ayrı ayrı hesaplanır.</p>
        </div>
      </div>
      <div class="company-entitlement-payment-table-shell">
        <table class="company-entitlement-payment-table company-personnel-entitlement-table">
          <thead>
            <tr>
              <th>Personel</th>
              <th>Meslek</th>
              <th>Normal Getiri</th>
              <th>%50 Mesai Getirisi</th>
              <th>%100 / Bayram Getirisi</th>
              <th>Toplam Hakediş</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(renderCompanyPersonnelEntitlementRow).join("")}
          </tbody>
          <tfoot>
            <tr>
              <th colspan="5">Tüm Personel Toplamı</th>
              <td>${formatCompanyCurrency(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  `;
}

function renderCompanyPersonnelEntitlementRow(row) {
  return `
    <tr>
      <th scope="row">${escapeCompanyHtml(row.person.name)}</th>
      <td>${escapeCompanyHtml(row.person.profession || "-")}</td>
      <td>
        <strong>${formatCompanyCurrency(row.payment.normalAmount)}</strong>
        <small>${formatCompanyHours(row.hours.normalHours)} saat</small>
      </td>
      <td>
        <strong>${formatCompanyCurrency(row.payment.fiftyAmount)}</strong>
        <small>${formatCompanyHours(row.hours.fiftyHours)} saat</small>
      </td>
      <td>
        <strong>${formatCompanyCurrency(row.payment.hundredAndHolidayAmount)}</strong>
        <small>${formatCompanyHours(row.hours.hundredHours + row.hours.holidayHours)} saat</small>
      </td>
      <td>${formatCompanyCurrency(row.payment.totalAmount)}</td>
    </tr>
  `;
}

function getCompanyPersonPaymentSummary(hours) {
  const normalAmount = Number(hours.normalHours || 0) * COMPANY_NORMAL_MULTIPLIER * COMPANY_BASE_HOURLY_RATE;
  const fiftyAmount = Number(hours.fiftyHours || 0) * COMPANY_FIFTY_MULTIPLIER * COMPANY_BASE_HOURLY_RATE;
  const hundredAndHolidayHours = Number(hours.hundredHours || 0) + Number(hours.holidayHours || 0);
  const hundredAndHolidayAmount = hundredAndHolidayHours * COMPANY_HUNDRED_MULTIPLIER * COMPANY_BASE_HOURLY_RATE;

  return {
    normalAmount,
    fiftyAmount,
    hundredAndHolidayAmount,
    totalAmount: normalAmount + fiftyAmount + hundredAndHolidayAmount,
  };
}

function getCompanyEntitlementTotals(state, personnel) {
  return personnel.reduce(
    (totals, person) => {
      const hours = getCompanyPersonHours(state, person.id);

      totals.normalHours += hours.normalHours;
      totals.fiftyHours += hours.fiftyHours;
      totals.hundredHours += hours.hundredHours;
      totals.holidayHours += hours.holidayHours;
      totals.totalHours += hours.totalHours;

      return totals;
    },
    {
      normalHours: 0,
      fiftyHours: 0,
      hundredHours: 0,
      holidayHours: 0,
      totalHours: 0,
    },
  );
}

function getCompanyPersonHours(state, personId) {
  const totals = {
    normalHours: 0,
    fiftyHours: 0,
    hundredHours: 0,
    holidayHours: 0,
    totalHours: 0,
  };
  const dayMetas = getCompanyMonthDayMetas(companySelectedMonth);

  dayMetas.forEach((dayMeta) => {
    const hours = Number(state.workHours?.[companySelectedMonth]?.[personId]?.[dayMeta.day] || 0);

    if (!hours) {
      return;
    }

    totals.totalHours += hours;

    if (dayMeta.isHoliday) {
      totals.holidayHours += hours;
    } else if (dayMeta.isSunday) {
      totals.hundredHours += hours;
    } else if (dayMeta.isSaturday) {
      totals.fiftyHours += hours;
    } else {
      totals.normalHours += hours;
    }
  });

  return totals;
}

function getCompanyEligiblePersonnel(state) {
  return state.personnel.filter((person) => {
    return person.status === "active" && hasCompanyStartedBySelectedMonth(person.startDate);
  });
}

function loadCompanyPersonnelState() {
  try {
    const rawState = JSON.parse(localStorage.getItem(COMPANY_STORAGE_KEY) || "{}");
    return {
      selectedMonth: normalizeCompanyMonthValue(rawState.selectedMonth),
      personnel: Array.isArray(rawState.personnel) ? rawState.personnel.map(normalizeCompanyPersonnel) : [],
      workHours: isCompanyPlainObject(rawState.workHours) ? rawState.workHours : {},
    };
  } catch {
    return {
      selectedMonth: getCompanyCurrentMonth(),
      personnel: [],
      workHours: {},
    };
  }
}

function normalizeCompanyPersonnel(person) {
  return {
    id: String(person.id || ""),
    name: String(person.name || "İsimsiz Personel"),
    startDate: String(person.startDate || getCompanyCurrentDate()),
    profession: String(person.profession || "-"),
    status: person.status === "left" ? "left" : "active",
  };
}

function hasCompanyStartedBySelectedMonth(startDate) {
  const [startYear, startMonth] = String(startDate || "").split("-").map(Number);
  const [selectedYear, selectedMonth] = splitCompanyMonthValue(companySelectedMonth).map(Number);

  if (!startYear || !startMonth || !selectedYear || !selectedMonth) {
    return true;
  }

  return selectedYear > startYear || (selectedYear === startYear && selectedMonth >= startMonth);
}

function getCompanyMonthDayMetas(monthValue) {
  const [year, month] = splitCompanyMonthValue(monthValue).map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const date = new Date(year, month - 1, day);
    const monthDay = `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const holidayName = getCompanyHolidayName(year, monthDay);
    const dayOfWeek = date.getDay();

    return {
      day: String(day),
      dayName: companyDayNames[dayOfWeek],
      holidayName,
      isHoliday: Boolean(holidayName),
      isSaturday: dayOfWeek === 6,
      isSunday: dayOfWeek === 0,
    };
  });
}

function getCompanyHolidayName(year, monthDay) {
  return companySpecialHolidayDates[year]?.[monthDay] || companyFixedHolidayDates[monthDay] || "";
}

function getCompanyInitialMonth() {
  const state = loadCompanyPersonnelState();
  return normalizeCompanyMonthValue(state.selectedMonth || getCompanyCurrentMonth());
}

function getCompanySelectableYears() {
  const currentYear = new Date().getFullYear();
  const lastYear = Math.max(COMPANY_LAST_READY_YEAR, currentYear + COMPANY_FUTURE_YEAR_BUFFER);
  const years = [];

  for (let year = COMPANY_FIRST_READY_YEAR; year <= lastYear; year += 1) {
    years.push(year);
  }

  return years;
}

function normalizeCompanyMonthValue(value) {
  if (/^\d{4}-\d{2}$/.test(String(value || ""))) {
    return value;
  }

  return getCompanyCurrentMonth();
}

function splitCompanyMonthValue(value) {
  return normalizeCompanyMonthValue(value).split("-");
}

function getCompanyCurrentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getCompanyCurrentDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatCompanyMonthLabel(value) {
  if (!/^\d{4}-\d{2}$/.test(String(value || ""))) {
    return "Ay seçilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

function formatCompanyHours(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatCompanyCurrency(value) {
  return `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0))} TL`;
}

function formatCompanyMultiplier(value) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function isCompanyPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeCompanyHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
