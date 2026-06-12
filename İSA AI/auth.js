(() => {
  "use strict";

  const AUTH_CONFIG_KEY = "isa-ai-auth-config";
  const AUTH_SESSION_KEY = "isa-ai-current-user";
  const AUTH_ACTIVE_USERS_KEY = "isa-ai-active-users";
  const PORTAL_CONTENT_KEY = "isa-ai-portal-content";
  const ACTIVE_USER_STALE_MS = 90 * 1000;
  const ACTIVE_USER_HEARTBEAT_MS = 15 * 1000;
  const DEVELOPER_ROLE_ID = "developer";
  const DEFAULT_LOGO_URL = "https://www.softmarine.com.tr/soft-marine-logo.svg";
  const PRIMARY_ADMIN_USER = { id: "patron", name: "İSA KILIÇ", roleId: DEVELOPER_ROLE_ID, password: "1234" };
  const MODULE_STATUS_OPTIONS = {
    active: { label: "Aktif", badgeClass: "is-live" },
    soon: { label: "Yakında", badgeClass: "is-soon" },
    closed: { label: "Kapalı", badgeClass: "is-closed" },
  };

  const moduleDefinitions = {
    ai: {
      label: "Genel Yapay Zekâ",
      description: "Soru-cevap ekranı ve sohbet geçmişi",
      sections: [],
    },
    personnel: {
      label: "Personel Paneli",
      description: "Personel evrakları, saat girişleri, liste ve maaş puantajı",
      sections: [
        { id: "documents", label: "Personel Evrakları" },
        { id: "hours", label: "Personel Çalışma Saatleri" },
        { id: "list", label: "Personel Listesi" },
        { id: "payroll", label: "Maaş Puantajı" },
      ],
    },
    company: {
      label: "Firma Paneli",
      description: "Firma hakediş ekranları",
      sections: [{ id: "entitlements", label: "Hakediş" }],
    },
    special: {
      label: "Soft Marine",
      description: "Firma özelinde hassas evrak yönetimi",
      sections: [],
    },
    management: {
      label: "Yönetim Paneli",
      description: "Developer için arayüz ve içerik düzenleme ekranı",
      sections: [],
    },
  };

  const defaultConfig = {
    moduleStatuses: {
      ai: "active",
      personnel: "active",
      company: "active",
      special: "active",
      management: "active",
    },
    roles: {
      developer: {
        id: DEVELOPER_ROLE_ID,
        name: "Developer",
        canManageAuth: true,
        permissions: {
          ai: { enabled: true, sections: [] },
          personnel: { enabled: true, sections: ["documents", "hours", "list", "payroll"] },
          company: { enabled: true, sections: ["entitlements"] },
          special: { enabled: true, sections: [] },
          management: { enabled: true, sections: [] },
        },
      },
      patron: {
        id: "patron",
        name: "Patron",
        canManageAuth: true,
        permissions: {
          ai: { enabled: true, sections: [] },
          personnel: { enabled: true, sections: ["documents", "hours", "list", "payroll"] },
          company: { enabled: true, sections: ["entitlements"] },
          special: { enabled: true, sections: [] },
          management: { enabled: false, sections: [] },
        },
      },
      ik: {
        id: "ik",
        name: "İK",
        canManageAuth: false,
        permissions: {
          ai: { enabled: true, sections: [] },
          personnel: { enabled: true, sections: ["documents", "hours", "list"] },
          company: { enabled: false, sections: [] },
          special: { enabled: false, sections: [] },
          management: { enabled: false, sections: [] },
        },
      },
      muhasebe: {
        id: "muhasebe",
        name: "Muhasebe",
        canManageAuth: false,
        permissions: {
          ai: { enabled: true, sections: [] },
          personnel: { enabled: true, sections: ["hours", "list", "payroll"] },
          company: { enabled: true, sections: ["entitlements"] },
          special: { enabled: false, sections: [] },
          management: { enabled: false, sections: [] },
        },
      },
      personel: {
        id: "personel",
        name: "Personel",
        canManageAuth: false,
        permissions: {
          ai: { enabled: true, sections: [] },
          personnel: { enabled: false, sections: [] },
          company: { enabled: false, sections: [] },
          special: { enabled: false, sections: [] },
          management: { enabled: false, sections: [] },
        },
      },
    },
    users: [
      PRIMARY_ADMIN_USER,
      { id: "ik", name: "İK Kullanıcısı", roleId: "ik", password: "1234" },
      { id: "muhasebe", name: "Muhasebe Kullanıcısı", roleId: "muhasebe", password: "1234" },
      { id: "personel", name: "Personel Kullanıcısı", roleId: "personel", password: "1234" },
    ],
  };

  const defaultPortalContent = {
    logoUrl: DEFAULT_LOGO_URL,
    home: {
      documentTitle: "SOFT MARİNE",
      topbarTitle: "Soft Marine Portal",
      topbarSubtitle: "İş yönetim merkezi",
      statusText: "Yerel portal aktif",
      heroBrandName: "SOFT MARINE",
      heroEyebrow: "SOFT MARINE PORTAL",
      title: "SOFT MARİNE",
      intro: "Soft Marine için akıllı iş yönetim portalı",
      modulesEyebrow: "MODÜLLER",
      modulesTitle: "Portal Modülleri",
      modulesDescription: "Günlük operasyon, evrak, puantaj ve yapay zekâ desteği için hazırlanmış yönetim ekranları.",
      primaryAction: "Firma Paneli",
      secondaryAction: "Genel Yapay Zekâ",
    },
    modules: {
      ai: {
        name: "Genel Yapay Zekâ",
        description: "Soru-cevap ve kayıtlı sohbet geçmişi",
        pageEyebrow: "YAPAY ZEKÂ ASİSTANI",
        pageTitle: "Genel Yapay Zekâ",
        pageDescription: "Sorularını gönder, cevapları sohbet geçmişi olarak ekranda tut.",
      },
      personnel: {
        name: "Personel Paneli",
        description: "Evrak, çalışma saati ve maaş puantajı yönetimi",
        pageEyebrow: "PERSONEL YÖNETİMİ",
        pageTitle: "Personel Paneli",
        pageDescription: "Personel evrakları, çalışma saatleri, aktif liste ve maaş puantajı aynı ekranda.",
      },
      company: {
        name: "Firma Paneli",
        description: "Hakediş ve firma süreçleri yönetimi",
        pageEyebrow: "FİRMA YÖNETİMİ",
        pageTitle: "Firma Paneli",
        pageDescription: "Firma süreçleri için ayrılmış sade yönetim alanı.",
      },
      special: {
        name: "Soft Marine",
        description: "Firma özelinde hassas evrak kutuları",
        pageEyebrow: "FİRMA ÖZEL ALANI",
        pageTitle: "Soft Marine",
        pageDescription: "Developer ve Patron erişimine açık hassas firma evrak yönetimi.",
      },
      management: {
        name: "Yönetim Paneli",
        description: "Başlık, modül adı ve logo düzenleme alanı",
        pageEyebrow: "DEVELOPER YÖNETİMİ",
        pageTitle: "Yönetim Paneli",
        pageDescription: "Portalın görsel ve metinsel içeriklerini kod yazmadan düzenle.",
      },
    },
  };

  let authConfig = normalizeConfig(loadConfig());
  let portalContent = loadPortalContent();
  let selectedManagerRoleId = getFirstRoleId();
  let activeUserIntervalId = null;
  const authTabId = getAuthTabId();

  window.PortalAuth = {
    applyCurrentPagePermissions,
    getCurrentUser,
    hasModuleAccess,
    hasSectionAccess,
    openLogin: () => showLoginOverlay(false),
    openManager: openAuthManager,
  };

  document.addEventListener("DOMContentLoaded", () => {
    saveConfig();
    savePortalContent();
    applyPortalContent();
    startActiveUserTracking();
    renderAuthControls();
    bindBlockedLinks();
    applyCurrentPagePermissions();
  });

  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_CONFIG_KEY || event.key === AUTH_SESSION_KEY) {
      authConfig = normalizeConfig(loadConfig());
      applyCurrentPagePermissions();
    } else if (event.key === AUTH_ACTIVE_USERS_KEY) {
      renderActiveUsersWidget();
    } else if (event.key === PORTAL_CONTENT_KEY) {
      portalContent = loadPortalContent();
      applyPortalContent();
      renderAuthControls();
      renderManagementPanel();
    }
  });

  window.addEventListener("beforeunload", removeCurrentActiveSession);

  function loadConfig() {
    try {
      const storedConfig = JSON.parse(localStorage.getItem(AUTH_CONFIG_KEY) || "null");
      return storedConfig || defaultConfig;
    } catch {
      return defaultConfig;
    }
  }

  function saveConfig() {
    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(authConfig));
  }

  function loadPortalContent() {
    try {
      const storedContent = JSON.parse(localStorage.getItem(PORTAL_CONTENT_KEY) || "null");
      return normalizePortalContent(storedContent);
    } catch {
      return normalizePortalContent(null);
    }
  }

  function savePortalContent() {
    localStorage.setItem(PORTAL_CONTENT_KEY, JSON.stringify(portalContent));
  }

  function normalizePortalContent(content) {
    const normalizedContent = clone(defaultPortalContent);

    if (!content || typeof content !== "object") {
      return normalizedContent;
    }

    normalizedContent.logoUrl = String(content.logoUrl || defaultPortalContent.logoUrl);

    Object.keys(defaultPortalContent.home).forEach((field) => {
      normalizedContent.home[field] = String(content.home?.[field] || defaultPortalContent.home[field]);
    });

    Object.entries(defaultPortalContent.modules).forEach(([moduleId, moduleContent]) => {
      Object.keys(moduleContent).forEach((field) => {
        normalizedContent.modules[moduleId][field] = String(content.modules?.[moduleId]?.[field] || moduleContent[field]);
      });
    });

    return normalizedContent;
  }

  function applyPortalContent() {
    const logoUrl = portalContent.logoUrl || DEFAULT_LOGO_URL;
    const home = portalContent.home;
    const currentModuleId = document.body.dataset.authModule;

    document.querySelectorAll(".portal-logo-frame img, .brand-logo-frame img, .screen-brand img").forEach((image) => {
      image.src = logoUrl;
    });

    if (document.body.dataset.authPage === "home") {
      document.title = home.documentTitle;
      setText(".portal-logo strong", home.topbarTitle);
      setText(".portal-logo small", home.topbarSubtitle);
      setText(".portal-status span:last-child", home.statusText);
      setText(".brand-name", home.heroBrandName);
      setText(".home-copy .eyebrow", home.heroEyebrow);
      setText("#page-title", home.title);
      setText(".home-intro", home.intro);
      setText(".section-heading .eyebrow", home.modulesEyebrow);
      setText("#modules-title", home.modulesTitle);
      setText(".section-heading > p", home.modulesDescription);
      setText(".hero-primary-action", home.primaryAction);
      setText(".hero-secondary-action", home.secondaryAction);
      applyHomeModuleContent();
      return;
    }

    if (currentModuleId) {
      const moduleContent = getPortalModuleContent(currentModuleId);
      document.title = moduleContent.pageTitle;
      setText(".screen-brand span", home.heroBrandName);
      setText(".screen-header .eyebrow", moduleContent.pageEyebrow);
      setText(".screen-header h1", moduleContent.pageTitle);
      setText(".screen-header .title-block > p:last-child", moduleContent.pageDescription);
    }
  }

  function applyHomeModuleContent() {
    document.querySelectorAll("[data-auth-module-card]").forEach((card) => {
      const moduleId = card.dataset.authModuleCard;
      const moduleContent = getPortalModuleContent(moduleId);

      setTextIn(card, "strong", moduleContent.name);
      setTextIn(card, "small", moduleContent.description);
    });
  }

  function getPortalModuleContent(moduleId) {
    return portalContent.modules?.[moduleId] || defaultPortalContent.modules[moduleId] || moduleDefinitions[moduleId];
  }

  function normalizeConfig(config) {
    const nextConfig = {
      moduleStatuses: normalizeModuleStatuses(config?.moduleStatuses),
      softMarineModuleReady: true,
      roles: { ...(config?.roles || {}) },
      users: Array.isArray(config?.users) ? config.users : [],
    };

    if (!config?.softMarineModuleReady && nextConfig.moduleStatuses.special === "soon") {
      nextConfig.moduleStatuses.special = "active";
    }

    Object.entries(defaultConfig.roles).forEach(([roleId, role]) => {
      if (!nextConfig.roles[roleId]) {
        nextConfig.roles[roleId] = clone(role);
      }
    });

    Object.keys(nextConfig.roles).forEach((roleId) => {
      nextConfig.roles[roleId] = normalizeRole(nextConfig.roles[roleId], roleId);
    });
    ensureTopAuthorityRoles(nextConfig);

    if (!nextConfig.users.length) {
      nextConfig.users = clone(defaultConfig.users);
    }

    nextConfig.users = nextConfig.users
      .filter((user) => user && user.id)
      .map((user) => ({
        id: String(user.id),
        name: String(user.name || "Kullanıcı"),
        roleId: nextConfig.roles[user.roleId] ? String(user.roleId) : "personel",
        password: String(user.password || "1234"),
      }));

    ensurePrimaryAdminUser(nextConfig);

    return nextConfig;
  }

  function normalizeModuleStatuses(moduleStatuses) {
    const statuses = {};

    Object.keys(moduleDefinitions).forEach((moduleId) => {
      const status = String(moduleStatuses?.[moduleId] || defaultConfig.moduleStatuses[moduleId] || "active");
      statuses[moduleId] = MODULE_STATUS_OPTIONS[status] ? status : "active";
    });

    return statuses;
  }

  function ensurePrimaryAdminUser(config) {
    const existingAdmin = config.users.find((user) => user.id === PRIMARY_ADMIN_USER.id);
    const adminUser = {
      ...PRIMARY_ADMIN_USER,
      password: String(existingAdmin?.password || PRIMARY_ADMIN_USER.password),
    };

    config.users = [adminUser, ...config.users.filter((user) => user.id !== PRIMARY_ADMIN_USER.id)];
  }

  function ensureTopAuthorityRoles(config) {
    config.roles[DEVELOPER_ROLE_ID] = normalizeRole(
      {
        ...config.roles[DEVELOPER_ROLE_ID],
        name: "Developer",
        canManageAuth: true,
        permissions: clone(defaultConfig.roles[DEVELOPER_ROLE_ID].permissions),
      },
      DEVELOPER_ROLE_ID,
    );
    config.roles.patron = normalizeRole(
      {
        ...config.roles.patron,
        canManageAuth: true,
        permissions: clone(defaultConfig.roles.patron.permissions),
      },
      "patron",
    );
  }

  function normalizeRole(role, fallbackId) {
    const roleId = String(role?.id || fallbackId || createId("role"));
    const permissions = {};

    Object.entries(moduleDefinitions).forEach(([moduleId, definition]) => {
      const permission = role?.permissions?.[moduleId] || {};
      const availableSections = definition.sections.map((section) => section.id);

      permissions[moduleId] = {
        enabled: Boolean(permission.enabled),
        sections: availableSections.length
          ? ensureArray(permission.sections).filter((sectionId) => availableSections.includes(sectionId))
          : [],
      };
    });

    return {
      id: roleId,
      name: String(role?.name || "Yeni Rol"),
      canManageAuth: Boolean(role?.canManageAuth),
      permissions,
    };
  }

  function getCurrentUser() {
    const userId = localStorage.getItem(AUTH_SESSION_KEY);
    return authConfig.users.find((user) => user.id === userId) || null;
  }

  function getCurrentRole() {
    const user = getCurrentUser();
    return user ? authConfig.roles[user.roleId] || null : null;
  }

  function hasModuleAccess(moduleId) {
    const role = getCurrentRole();

    if (!role) {
      return false;
    }

    if (isDeveloperRole(role)) {
      return true;
    }

    if (getModuleStatus(moduleId) === "closed") {
      return false;
    }

    if (moduleId === "management") {
      return false;
    }

    if (moduleId === "special" && !isPatronRole(role)) {
      return false;
    }

    return Boolean(role.permissions?.[moduleId]?.enabled);
  }

  function hasSectionAccess(moduleId, sectionId) {
    const role = getCurrentRole();

    if (isDeveloperRole(role)) {
      return true;
    }

    const definition = moduleDefinitions[moduleId];
    const permission = role?.permissions?.[moduleId];

    if (!hasModuleAccess(moduleId) || !permission?.enabled) {
      return false;
    }

    if (!definition?.sections?.length) {
      return true;
    }

    return permission.sections.includes(sectionId);
  }

  function getModuleStatus(moduleId) {
    return authConfig.moduleStatuses?.[moduleId] || defaultConfig.moduleStatuses[moduleId] || "active";
  }

  function isDeveloperRole(role) {
    return role?.id === DEVELOPER_ROLE_ID;
  }

  function isPatronRole(role) {
    return role?.id === "patron";
  }

  function applyCurrentPagePermissions() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      showLoginOverlay(true);
      return;
    }

    removeLoginOverlay();
    updateActiveSession();
    renderAuthControls();
    renderActiveUsersWidget();
    applyHomePermissions();
    applyModuleAccess();
    applySectionPermissions();
    renderManagementPanel();
  }

  function applyHomePermissions() {
    document.querySelectorAll("[data-auth-module-card], [data-auth-link-module]").forEach((element) => {
      const moduleId = element.dataset.authModuleCard || element.dataset.authLinkModule;
      applyModuleStatusVisual(element, moduleId);

      const isAllowed = hasModuleAccess(moduleId);

      element.classList.toggle("is-auth-blocked", !isAllowed);
      element.setAttribute("aria-disabled", String(!isAllowed));

      if (element.matches("[data-auth-module-card]")) {
        let badge = element.querySelector("[data-auth-denied-badge]");

        if (!isAllowed && !badge) {
          badge = document.createElement("span");
          badge.className = "auth-denied-badge";
          badge.dataset.authDeniedBadge = "";
          badge.textContent = getModuleStatus(moduleId) === "closed" ? "Kapalı" : "Yetki yok";
          element.appendChild(badge);
        } else if (isAllowed && badge) {
          badge.remove();
        } else if (!isAllowed && badge) {
          badge.textContent = getModuleStatus(moduleId) === "closed" ? "Kapalı" : "Yetki yok";
        }
      }
    });
  }

  function applyModuleStatusVisual(element, moduleId) {
    const status = getModuleStatus(moduleId);
    const statusMeta = MODULE_STATUS_OPTIONS[status] || MODULE_STATUS_OPTIONS.active;

    element.classList.toggle("is-coming", status === "soon");
    element.classList.toggle("is-module-closed", status === "closed");

    const badge = element.querySelector(".module-badge");

    if (badge) {
      badge.textContent = statusMeta.label;
      Object.values(MODULE_STATUS_OPTIONS).forEach((option) => {
        badge.classList.remove(option.badgeClass);
      });
      badge.classList.add(statusMeta.badgeClass);
    }
  }

  function applyModuleAccess() {
    const moduleId = document.body.dataset.authModule;

    if (!moduleId || hasModuleAccess(moduleId)) {
      return;
    }

    const main = document.querySelector("main");
    const moduleName = getPortalModuleContent(moduleId)?.name || moduleDefinitions[moduleId]?.label || "Bu modül";
    const isClosed = getModuleStatus(moduleId) === "closed";

    if (!main || main.dataset.authDeniedRendered === "true") {
      return;
    }

    main.dataset.authDeniedRendered = "true";
    main.innerHTML = `
      <section class="auth-access-denied">
        <span class="auth-lock-icon" aria-hidden="true">!</span>
        <p class="eyebrow">YETKİ GEREKLİ</p>
        <h1>${escapeHtml(moduleName)} erişimi kapalı</h1>
        <p>${isClosed ? "Bu modül Developer tarafından kapatıldı. Developer tekrar aktif yapana kadar diğer roller bu modüle giremez." : "Bu kullanıcı rolü için bu modül açılmamış. Developer yetkisiyle Yetki Yönetimi ekranından erişim verilebilir."}</p>
        <a class="submit-button" href="index.html">Ana Ekrana Dön</a>
      </section>
    `;
  }

  function applySectionPermissions() {
    document.querySelectorAll("[data-auth-section]").forEach((element) => {
      const [moduleId, sectionId] = parseSectionKey(element.dataset.authSection);
      element.hidden = !hasSectionAccess(moduleId, sectionId);
    });

    const visibleTabButtons = Array.from(document.querySelectorAll("[data-tab-button]")).filter((button) => !button.hidden);
    const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));

    if (!visibleTabButtons.length && tabPanels.length) {
      showNoSectionAccess(tabPanels[0].parentElement);
      return;
    }

    if (!visibleTabButtons.length) {
      return;
    }

    const activeButton = visibleTabButtons.find((button) => button.classList.contains("is-active")) || visibleTabButtons[0];
    const activeTab = activeButton.dataset.tabButton;

    visibleTabButtons.forEach((button) => {
      const isActive = button.dataset.tabButton === activeTab;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });

    tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", !panel.hidden && panel.dataset.tabPanel === activeTab);
    });

    const companySections = Array.from(document.querySelectorAll("[data-auth-section^='company.']"));
    if (companySections.length && companySections.every((section) => section.hidden)) {
      const moduleShell = document.querySelector(".module-screen") || document.querySelector("main");
      showNoSectionAccess(moduleShell);
    }
  }

  function showNoSectionAccess(container) {
    if (!container || container.querySelector("[data-auth-no-section]")) {
      return;
    }

    const message = document.createElement("section");
    message.className = "auth-access-denied auth-section-denied";
    message.dataset.authNoSection = "";
    message.innerHTML = `
      <span class="auth-lock-icon" aria-hidden="true">!</span>
      <h2>Bu rol için açık sekme yok</h2>
      <p>Yetki Yönetimi ekranından bu role en az bir sekme seçildiğinde içerik burada görünecek.</p>
    `;
    container.appendChild(message);
  }

  function startActiveUserTracking() {
    updateActiveSession();
    renderActiveUsersWidget();

    if (activeUserIntervalId) {
      return;
    }

    activeUserIntervalId = window.setInterval(() => {
      updateActiveSession();
      renderActiveUsersWidget();
    }, ACTIVE_USER_HEARTBEAT_MS);
  }

  function updateActiveSession() {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      removeCurrentActiveSession();
      return;
    }

    const currentRole = getCurrentRole();

    if (isDeveloperRole(currentRole)) {
      removeCurrentActiveSession();
      return;
    }

    const sessions = getActiveSessions();

    sessions[authTabId] = {
      tabId: authTabId,
      userId: currentUser.id,
      name: currentUser.name,
      roleId: currentUser.roleId,
      roleName: currentRole?.name || "Rol yok",
      lastSeen: Date.now(),
    };

    saveActiveSessions(sessions);
  }

  function removeCurrentActiveSession() {
    const sessions = getActiveSessions(false);

    if (sessions[authTabId]) {
      delete sessions[authTabId];
      saveActiveSessions(sessions);
    }
  }

  function getActiveSessions(removeStale = true) {
    try {
      const sessions = JSON.parse(localStorage.getItem(AUTH_ACTIVE_USERS_KEY) || "{}");
      const cutoff = Date.now() - ACTIVE_USER_STALE_MS;
      const safeSessions = {};

      Object.entries(sessions || {}).forEach(([tabId, session]) => {
        if (!session?.userId || !session?.lastSeen) {
          return;
        }

        if (removeStale && Number(session.lastSeen) < cutoff) {
          return;
        }

        safeSessions[tabId] = {
          tabId,
          userId: String(session.userId),
          name: String(session.name || "Kullanıcı"),
          roleId: String(session.roleId || ""),
          roleName: String(session.roleName || "Rol yok"),
          lastSeen: Number(session.lastSeen),
        };
      });

      if (removeStale && Object.keys(safeSessions).length !== Object.keys(sessions || {}).length) {
        saveActiveSessions(safeSessions);
      }

      return safeSessions;
    } catch {
      return {};
    }
  }

  function saveActiveSessions(sessions) {
    localStorage.setItem(AUTH_ACTIVE_USERS_KEY, JSON.stringify(sessions));
  }

  function getActiveUsers() {
    const activeUsers = new Map();

    Object.values(getActiveSessions()).forEach((session) => {
      if (session.roleId === DEVELOPER_ROLE_ID) {
        return;
      }

      const existingSession = activeUsers.get(session.userId);

      if (!existingSession || session.lastSeen > existingSession.lastSeen) {
        activeUsers.set(session.userId, session);
      }
    });

    return Array.from(activeUsers.values()).sort((firstUser, secondUser) => secondUser.lastSeen - firstUser.lastSeen);
  }

  function renderActiveUsersWidget() {
    const target = document.querySelector(".portal-topbar");
    const currentRole = getCurrentRole();
    let widget = document.querySelector("[data-auth-active-users]");

    if (!target || document.body.dataset.authPage !== "home" || !currentRole?.canManageAuth) {
      widget?.remove();
      return;
    }

    const activeUsers = getActiveUsers();

    if (!widget) {
      widget = document.createElement("div");
      widget.className = "auth-active-users";
      widget.dataset.authActiveUsers = "";
      target.insertBefore(widget, target.querySelector("[data-auth-controls]") || null);
    }

    widget.innerHTML = `
      <span class="auth-active-heading">
        <span class="status-dot" aria-hidden="true"></span>
        <span>Aktif Kullanıcılar</span>
        <strong>${activeUsers.length}</strong>
      </span>
      <span class="auth-active-list">
        ${
          activeUsers.length
            ? activeUsers.map((user) => `
              <span class="auth-active-chip" title="${escapeHtml(user.name)} - ${escapeHtml(user.roleName)}">
                <strong>${escapeHtml(user.name)}</strong>
                <small>${escapeHtml(user.roleName)}</small>
              </span>
            `).join("")
            : `<span class="auth-active-empty">Aktif kullanıcı yok</span>`
        }
      </span>
    `;
  }

  function renderAuthControls() {
    const currentUser = getCurrentUser();
    const currentRole = getCurrentRole();
    const target = document.querySelector(".portal-topbar") || document.querySelector(".screen-header");

    if (!target) {
      return;
    }

    let controls = target.querySelector("[data-auth-controls]");

    if (!controls) {
      controls = document.createElement("div");
      controls.className = "auth-controls";
      controls.dataset.authControls = "";
      target.appendChild(controls);
    }

    if (!currentUser) {
      controls.innerHTML = `<button class="auth-link-button" type="button" data-auth-open-login>Giriş Yap</button>`;
    } else {
      controls.innerHTML = `
        ${isDeveloperRole(currentRole) ? `<a class="auth-link-button" href="yonetim-paneli.html" data-auth-link-module="management">${escapeHtml(getPortalModuleContent("management").name)}</a>` : ""}
        <span class="auth-user-pill">
          <strong>${escapeHtml(currentUser.name)}</strong>
          <small>${escapeHtml(currentRole?.name || "Rol yok")}</small>
        </span>
        ${currentRole?.canManageAuth ? `<button class="auth-link-button" type="button" data-auth-open-manager>Yetki Yönetimi</button>` : ""}
        <button class="auth-link-button auth-logout" type="button" data-auth-logout>Çıkış</button>
      `;
    }

    controls.querySelector("[data-auth-open-login]")?.addEventListener("click", () => showLoginOverlay(false));
    controls.querySelector("[data-auth-open-manager]")?.addEventListener("click", openAuthManager);
    controls.querySelector("[data-auth-logout]")?.addEventListener("click", logout);
    renderActiveUsersWidget();
  }

  function bindBlockedLinks() {
    document.addEventListener("click", (event) => {
      const blockedLink = event.target.closest(".is-auth-blocked[href]");

      if (!blockedLink) {
        return;
      }

      event.preventDefault();
      const moduleId = blockedLink.dataset.authModuleCard || blockedLink.dataset.authLinkModule || document.body.dataset.authModule;
      showToast(getModuleStatus(moduleId) === "closed" ? "Bu modül Developer tarafından kapatıldı." : "Bu modül için mevcut rolün yetkisi yok.");
    });
  }

  function showLoginOverlay(isRequired) {
    if (document.querySelector("[data-auth-login-overlay]")) {
      return;
    }

    const overlay = document.createElement("div");
    overlay.className = "auth-overlay";
    overlay.dataset.authLoginOverlay = "";
    overlay.innerHTML = `
      <form class="auth-card" data-auth-login-form>
        <div>
          <p class="eyebrow">${escapeHtml(portalContent.home.heroEyebrow)}</p>
          <h2>Kullanıcı Girişi</h2>
          <p>Rol bazlı yetkilerle portala devam edin.</p>
        </div>
        <label class="field-label" for="auth-user">Kullanıcı</label>
        <select id="auth-user" name="userId" required>
          ${authConfig.users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} - ${escapeHtml(authConfig.roles[user.roleId]?.name || "Rol yok")}</option>`).join("")}
        </select>
        <label class="field-label" for="auth-password">Şifre</label>
        <input id="auth-password" name="password" type="password" placeholder="Varsayılan şifre: 1234" required />
        <p class="auth-error" data-auth-login-error></p>
        <div class="auth-form-actions">
          ${isRequired ? "" : `<button class="secondary-button" type="button" data-auth-close-login>İptal</button>`}
          <button class="submit-button" type="submit">Giriş Yap</button>
        </div>
      </form>
    `;

    document.body.appendChild(overlay);
    overlay.querySelector("input")?.focus();
    overlay.querySelector("[data-auth-close-login]")?.addEventListener("click", removeLoginOverlay);
    overlay.querySelector("[data-auth-login-form]")?.addEventListener("submit", handleLogin);
  }

  function handleLogin(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const userId = String(formData.get("userId") || "");
    const password = String(formData.get("password") || "");
    const user = authConfig.users.find((item) => item.id === userId);
    const error = form.querySelector("[data-auth-login-error]");

    if (!user || user.password !== password) {
      if (error) {
        error.textContent = "Kullanıcı veya şifre hatalı.";
      }
      return;
    }

    localStorage.setItem(AUTH_SESSION_KEY, user.id);
    updateActiveSession();
    removeLoginOverlay();
    applyCurrentPagePermissions();
  }

  function removeLoginOverlay() {
    document.querySelector("[data-auth-login-overlay]")?.remove();
  }

  function logout() {
    removeCurrentActiveSession();
    localStorage.removeItem(AUTH_SESSION_KEY);
    renderAuthControls();
    renderActiveUsersWidget();
    showLoginOverlay(true);
  }

  function openAuthManager() {
    const role = getCurrentRole();

    if (!role?.canManageAuth) {
      showToast("Yetki yönetimi için Developer yetkisi gerekir.");
      return;
    }

    let dialog = document.querySelector("[data-auth-manager]");

    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "auth-manager-dialog";
      dialog.dataset.authManager = "";
      document.body.appendChild(dialog);
    }

    renderAuthManager(dialog);
    dialog.showModal();
  }

  function renderAuthManager(dialog) {
    const selectedRole = authConfig.roles[selectedManagerRoleId] || authConfig.roles[getFirstRoleId()];
    selectedManagerRoleId = selectedRole.id;

    dialog.innerHTML = `
      <form method="dialog" class="auth-manager">
        <div class="auth-manager-head">
          <div>
            <p class="eyebrow">YETKİ YÖNETİMİ</p>
            <h2>Rol ve Kullanıcı Ayarları</h2>
            <p>Her role modül ve sekme erişimini manuel olarak verin.</p>
          </div>
          <button class="auth-close-button" type="submit" aria-label="Kapat">×</button>
        </div>

        ${isDeveloperRole(getCurrentRole()) ? renderModuleStatusManager() : ""}

        <div class="auth-manager-grid">
          <aside class="auth-role-sidebar">
            <h3>Roller</h3>
            <div class="auth-role-list">
              ${getOrderedRoles().map((role) => `
                <button class="auth-role-tab ${role.id === selectedRole.id ? "is-active" : ""}" type="button" data-auth-select-role="${escapeHtml(role.id)}">
                  ${escapeHtml(role.name)}
                </button>
              `).join("")}
            </div>
            <div class="auth-add-row">
              <input type="text" placeholder="Yeni rol adı" data-auth-new-role-name />
              <button class="secondary-button" type="button" data-auth-add-role>Ekle</button>
            </div>
          </aside>

          <section class="auth-role-editor">
            <div class="auth-editor-card">
              <label class="field-label" for="auth-role-name">Rol adı</label>
              <input id="auth-role-name" type="text" value="${escapeHtml(selectedRole.name)}" data-auth-role-name />
              <label class="auth-check-row">
                <input type="checkbox" data-auth-manage-permission ${selectedRole.canManageAuth ? "checked" : ""} />
                <span>Bu rol yetki yönetimini açabilsin</span>
              </label>
            </div>

            <div class="auth-permission-list">
              ${Object.entries(moduleDefinitions).filter(([moduleId]) => moduleId !== "management").map(([moduleId, definition]) => renderModulePermissionEditor(selectedRole, moduleId, definition)).join("")}
            </div>

            <div class="auth-form-actions">
              ${isSystemRole(selectedRole.id) ? "" : `<button class="secondary-button danger" type="button" data-auth-delete-role>Rolü Sil</button>`}
              <button class="submit-button" type="button" data-auth-save-role>Rolü Kaydet</button>
            </div>
          </section>

          <section class="auth-users-editor">
            <h3>Kullanıcılar</h3>
            <div class="auth-user-list">
              ${authConfig.users.map(renderUserEditorRow).join("")}
            </div>
            <div class="auth-add-user">
              <input type="text" placeholder="Yeni kullanıcı adı" data-auth-new-user-name />
              <select data-auth-new-user-role>
                ${renderRoleOptions("personel")}
              </select>
              <input type="text" placeholder="Şifre" value="1234" data-auth-new-user-password />
              <button class="secondary-button" type="button" data-auth-add-user>Kullanıcı Ekle</button>
            </div>
          </section>
        </div>
      </form>
    `;

    bindManagerEvents(dialog);
  }

  function renderModulePermissionEditor(role, moduleId, definition) {
    const permission = role.permissions[moduleId] || { enabled: false, sections: [] };
    const allSectionsSelected = definition.sections.length > 0 && definition.sections.every((section) => permission.sections.includes(section.id));
    const moduleContent = getPortalModuleContent(moduleId);

    return `
      <article class="auth-permission-card" data-auth-module-editor="${escapeHtml(moduleId)}">
        <label class="auth-module-check">
          <input type="checkbox" data-auth-module-enabled="${escapeHtml(moduleId)}" ${permission.enabled ? "checked" : ""} />
          <span>
            <strong>${escapeHtml(moduleContent.name)}</strong>
            <small>${escapeHtml(moduleContent.description)}</small>
          </span>
        </label>
        ${
          definition.sections.length
            ? `
              <div class="auth-section-checks">
                <label class="auth-check-row">
                  <input type="checkbox" data-auth-all-sections="${escapeHtml(moduleId)}" ${allSectionsSelected ? "checked" : ""} />
                  <span>Tüm ${escapeHtml(moduleContent.name)} erişimi</span>
                </label>
                ${definition.sections.map((section) => `
                  <label class="auth-check-row">
                    <input type="checkbox" data-auth-section-check="${escapeHtml(moduleId)}.${escapeHtml(section.id)}" ${permission.sections.includes(section.id) ? "checked" : ""} />
                    <span>${escapeHtml(section.label)}</span>
                  </label>
                `).join("")}
              </div>
            `
            : ""
        }
      </article>
    `;
  }

  function renderPortalContentManager() {
    const home = portalContent.home;
    const moduleCount = Object.keys(moduleDefinitions).length;

    return `
      <section class="auth-content-editor management-workbench">
        <div class="management-panel-hero">
          <div class="management-hero-copy">
            <p class="eyebrow">PORTAL TASARIM MERKEZİ</p>
            <h2>Yönetim Paneli</h2>
            <p>Soft Marine Portal marka görünümü, ana ekran metinleri ve modül başlıkları tek merkezden yönetilir.</p>
          </div>
          <div class="management-hero-stats" aria-label="Yönetim özeti">
            <span>
              <strong>${moduleCount}</strong>
              <small>Modül içeriği</small>
            </span>
            <span>
              <strong>Logo</strong>
              <small>Görsel kontrolü</small>
            </span>
            <span>
              <strong>Local</strong>
              <small>Kayıt sistemi</small>
            </span>
          </div>
        </div>

        <div class="auth-content-head management-command-bar">
          <div>
            <h3>Portal Görünüm Ayarları</h3>
            <p>Değişiklikler kaydedildiğinde ana ekran ve ilgili modül sayfaları güncellenir.</p>
          </div>
          <div class="auth-content-actions">
            <button class="secondary-button" type="button" data-auth-reset-content>Varsayılana Dön</button>
            <button class="submit-button" type="button" data-auth-save-content>Görünümü Kaydet</button>
          </div>
        </div>

        <div class="management-editor-layout">
          <aside class="management-side-panel" aria-label="Yönetim menüsü">
            <div class="management-logo-preview">
              <span>
                <img src="${escapeHtml(portalContent.logoUrl)}" alt="Logo önizleme" data-management-logo-preview />
              </span>
              <strong>${escapeHtml(home.heroBrandName)}</strong>
              <small>${escapeHtml(home.topbarTitle)}</small>
            </div>
            <nav class="management-section-nav" aria-label="Düzenleme bölümleri">
              <a href="#management-logo">Logo</a>
              <a href="#management-home">Ana Ekran</a>
              <a href="#management-modules">Modül Başlıkları</a>
            </nav>
          </aside>

          <div class="management-editor-stack">
            <div class="auth-content-section" id="management-logo">
              <div class="auth-content-section-title">
                <span>01</span>
                <div>
                  <h4>Logo</h4>
                  <p>Portal genelinde kullanılan marka görseli.</p>
                </div>
              </div>
              <div class="auth-content-grid">
                <label class="auth-content-field is-wide">
                  <span>Logo URL</span>
                  <input type="text" value="${escapeHtml(portalContent.logoUrl)}" data-content-logo-url />
                </label>
                <label class="auth-content-field auth-content-upload">
                  <span>Logo Dosyası</span>
                  <input type="file" accept="image/*,.svg" data-content-logo-file />
                  <small>PNG, JPG veya SVG yüklenebilir.</small>
                </label>
              </div>
            </div>

            <div class="auth-content-section" id="management-home">
              <div class="auth-content-section-title">
                <span>02</span>
                <div>
                  <h4>Ana Ekran</h4>
                  <p>Portal giriş ekranındaki başlıklar ve kısa metinler.</p>
                </div>
              </div>
              <div class="auth-content-grid">
                ${renderContentField("Tarayıcı başlığı", "home.documentTitle", home.documentTitle)}
                ${renderContentField("Üst bar başlığı", "home.topbarTitle", home.topbarTitle)}
                ${renderContentField("Üst bar alt metni", "home.topbarSubtitle", home.topbarSubtitle)}
                ${renderContentField("Durum metni", "home.statusText", home.statusText)}
                ${renderContentField("Logo kartı yazısı", "home.heroBrandName", home.heroBrandName)}
                ${renderContentField("Hero üst etiketi", "home.heroEyebrow", home.heroEyebrow)}
                ${renderContentField("Ana başlık", "home.title", home.title)}
                ${renderContentField("Açıklama", "home.intro", home.intro, { wide: true })}
                ${renderContentField("Modül üst etiketi", "home.modulesEyebrow", home.modulesEyebrow)}
                ${renderContentField("Modül bölüm başlığı", "home.modulesTitle", home.modulesTitle)}
                ${renderContentField("Modül bölüm açıklaması", "home.modulesDescription", home.modulesDescription, { wide: true, multiline: true })}
                ${renderContentField("Birinci hızlı buton", "home.primaryAction", home.primaryAction)}
                ${renderContentField("İkinci hızlı buton", "home.secondaryAction", home.secondaryAction)}
              </div>
            </div>

            <div class="auth-content-section" id="management-modules">
              <div class="auth-content-section-title">
                <span>03</span>
                <div>
                  <h4>Modül Kartları ve Sayfa Başlıkları</h4>
                  <p>Ana ekran kart adları ve her modülün iç sayfa başlığı.</p>
                </div>
              </div>
              <div class="auth-module-content-grid">
                ${Object.keys(moduleDefinitions).map(renderModuleContentEditor).join("")}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderContentField(label, path, value, options = {}) {
    const fieldClass = `auth-content-field${options.wide ? " is-wide" : ""}`;

    if (options.multiline) {
      return `
        <label class="${fieldClass}">
          <span>${escapeHtml(label)}</span>
          <textarea rows="3" data-content-field="${escapeHtml(path)}">${escapeHtml(value)}</textarea>
        </label>
      `;
    }

    return `
      <label class="${fieldClass}">
        <span>${escapeHtml(label)}</span>
        <input type="text" value="${escapeHtml(value)}" data-content-field="${escapeHtml(path)}" />
      </label>
    `;
  }

  function renderModuleContentEditor(moduleId) {
    const moduleContent = getPortalModuleContent(moduleId);

    return `
      <article class="auth-module-content-card">
        <strong>${escapeHtml(moduleDefinitions[moduleId]?.label || moduleContent.name)}</strong>
        <div class="auth-content-grid">
          ${renderModuleContentField("Kart adı", moduleId, "name", moduleContent.name)}
          ${renderModuleContentField("Kart açıklaması", moduleId, "description", moduleContent.description, { multiline: true })}
          ${renderModuleContentField("Sayfa üst etiketi", moduleId, "pageEyebrow", moduleContent.pageEyebrow)}
          ${renderModuleContentField("Sayfa başlığı", moduleId, "pageTitle", moduleContent.pageTitle)}
          ${renderModuleContentField("Sayfa açıklaması", moduleId, "pageDescription", moduleContent.pageDescription, { multiline: true })}
        </div>
      </article>
    `;
  }

  function renderModuleContentField(label, moduleId, field, value, options = {}) {
    const key = `${moduleId}.${field}`;

    if (options.multiline) {
      return `
        <label class="auth-content-field is-wide">
          <span>${escapeHtml(label)}</span>
          <textarea rows="3" data-content-module-field="${escapeHtml(key)}">${escapeHtml(value)}</textarea>
        </label>
      `;
    }

    return `
      <label class="auth-content-field">
        <span>${escapeHtml(label)}</span>
        <input type="text" value="${escapeHtml(value)}" data-content-module-field="${escapeHtml(key)}" />
      </label>
    `;
  }

  function renderManagementPanel() {
    if (document.body.dataset.authModule !== "management") {
      return;
    }

    const container = document.querySelector("[data-management-content]");

    if (!container || !hasModuleAccess("management")) {
      return;
    }

    container.innerHTML = renderPortalContentManager();
    bindPortalContentEvents(container);
  }

  function bindPortalContentEvents(root) {
    const logoPreview = root.querySelector("[data-management-logo-preview]");
    const logoUrlInput = root.querySelector("[data-content-logo-url]");
    const logoFileInput = root.querySelector("[data-content-logo-file]");

    logoUrlInput?.addEventListener("input", () => {
      if (logoPreview) {
        logoPreview.src = logoUrlInput.value.trim() || DEFAULT_LOGO_URL;
      }
    });

    logoFileInput?.addEventListener("change", async () => {
      const file = logoFileInput.files?.[0];

      if (!file || !logoPreview) {
        return;
      }

      try {
        logoPreview.src = await readFileAsDataUrl(file);
      } catch {
        showToast("Logo önizlemesi hazırlanamadı.");
      }
    });

    root.querySelector("[data-auth-save-content]")?.addEventListener("click", async () => {
      try {
        await savePortalContentFromEditor(root);
        savePortalContent();
        applyPortalContent();
        renderAuthControls();
        showToast("Portal görünümü kaydedildi.");
        renderManagementPanel();
      } catch {
        showToast("Logo dosyası okunamadı.");
      }
    });

    root.querySelector("[data-auth-reset-content]")?.addEventListener("click", () => {
      if (!window.confirm("Portal görünüm ayarları varsayılana dönsün mü?")) {
        return;
      }

      portalContent = normalizePortalContent(null);
      savePortalContent();
      applyPortalContent();
      renderAuthControls();
      showToast("Portal görünümü varsayılana döndü.");
      renderManagementPanel();
    });
  }

  function renderModuleStatusManager() {
    return `
      <section class="auth-module-status-editor">
        <div>
          <h3>Modül Durumları</h3>
          <p>Developer, tüm kullanıcılar için modülleri aktif, yakında veya kapalı yapabilir.</p>
        </div>
        <div class="auth-module-status-grid">
          ${Object.keys(moduleDefinitions).map((moduleId) => {
            const moduleContent = getPortalModuleContent(moduleId);

            return `
              <label class="auth-module-status-row">
                <span>
                  <strong>${escapeHtml(moduleContent.name)}</strong>
                  <small>${escapeHtml(moduleContent.description)}</small>
                </span>
                <select data-auth-module-status="${escapeHtml(moduleId)}">
                  ${Object.entries(MODULE_STATUS_OPTIONS).map(([statusId, status]) => `
                    <option value="${escapeHtml(statusId)}" ${getModuleStatus(moduleId) === statusId ? "selected" : ""}>${escapeHtml(status.label)}</option>
                  `).join("")}
                </select>
              </label>
            `;
          }).join("")}
        </div>
        <div class="auth-form-actions">
          <button class="secondary-button" type="button" data-auth-save-module-statuses>Modül Durumlarını Kaydet</button>
        </div>
      </section>
    `;
  }

  function renderUserEditorRow(user) {
    return `
      <article class="auth-user-row" data-auth-user-row="${escapeHtml(user.id)}">
        <input type="text" value="${escapeHtml(user.name)}" aria-label="Kullanıcı adı" data-auth-user-name />
        <select aria-label="Rol" data-auth-user-role>
          ${renderRoleOptions(user.roleId)}
        </select>
        <input type="text" value="${escapeHtml(user.password)}" aria-label="Şifre" data-auth-user-password />
        ${user.id === PRIMARY_ADMIN_USER.id ? `<span class="auth-fixed-user">Sabit</span>` : `<button class="secondary-button danger" type="button" data-auth-delete-user>Sil</button>`}
      </article>
    `;
  }

  function renderRoleOptions(selectedRoleId) {
    return getOrderedRoles()
      .map((role) => `<option value="${escapeHtml(role.id)}" ${role.id === selectedRoleId ? "selected" : ""}>${escapeHtml(role.name)}</option>`)
      .join("");
  }

  function bindManagerEvents(dialog) {
    dialog.querySelectorAll("[data-auth-select-role]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedManagerRoleId = button.dataset.authSelectRole;
        renderAuthManager(dialog);
      });
    });

    dialog.querySelector("[data-auth-add-role]")?.addEventListener("click", () => {
      const input = dialog.querySelector("[data-auth-new-role-name]");
      const roleName = String(input?.value || "").trim();

      if (!roleName) {
        showToast("Rol adı yazın.");
        return;
      }

      const roleId = createId("role");
      authConfig.roles[roleId] = normalizeRole({ id: roleId, name: roleName, permissions: {} }, roleId);
      selectedManagerRoleId = roleId;
      saveConfig();
      renderAuthManager(dialog);
    });

    dialog.querySelector("[data-auth-save-role]")?.addEventListener("click", () => {
      saveSelectedRole(dialog);
      saveUsersFromManager(dialog);
      saveConfig();
      renderAuthControls();
      applyCurrentPagePermissions();
      showToast("Yetkiler kaydedildi.");
      renderAuthManager(dialog);
    });

    dialog.querySelector("[data-auth-save-module-statuses]")?.addEventListener("click", () => {
      saveModuleStatusesFromManager(dialog);
      saveConfig();
      applyCurrentPagePermissions();
      showToast("Modül durumları kaydedildi.");
      renderAuthManager(dialog);
    });

    dialog.querySelector("[data-auth-delete-role]")?.addEventListener("click", () => {
      deleteSelectedRole(dialog);
    });

    dialog.querySelectorAll("[data-auth-all-sections]").forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        const moduleId = checkbox.dataset.authAllSections;
        dialog.querySelectorAll(`[data-auth-section-check^="${cssEscape(moduleId)}."]`).forEach((sectionCheckbox) => {
          sectionCheckbox.checked = checkbox.checked;
        });
      });
    });

    dialog.querySelector("[data-auth-add-user]")?.addEventListener("click", () => {
      const nameInput = dialog.querySelector("[data-auth-new-user-name]");
      const roleSelect = dialog.querySelector("[data-auth-new-user-role]");
      const passwordInput = dialog.querySelector("[data-auth-new-user-password]");
      const name = String(nameInput?.value || "").trim();

      if (!name) {
        showToast("Kullanıcı adı yazın.");
        return;
      }

      authConfig.users.push({
        id: createId("user"),
        name,
        roleId: String(roleSelect?.value || "personel"),
        password: String(passwordInput?.value || "1234"),
      });
      saveConfig();
      renderAuthManager(dialog);
    });

    dialog.querySelectorAll("[data-auth-delete-user]").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("[data-auth-user-row]");
        const userId = row?.dataset.authUserRow;
        authConfig.users = authConfig.users.filter((user) => user.id !== userId);
        saveConfig();
        renderAuthManager(dialog);
      });
    });
  }

  function saveSelectedRole(dialog) {
    const role = authConfig.roles[selectedManagerRoleId];

    if (!role) {
      return;
    }

    const roleName = String(dialog.querySelector("[data-auth-role-name]")?.value || "").trim();
    role.name = roleName || role.name;
    role.canManageAuth = Boolean(dialog.querySelector("[data-auth-manage-permission]")?.checked);

    Object.keys(moduleDefinitions).forEach((moduleId) => {
      if (moduleId === "management") {
        return;
      }

      const enabled = Boolean(dialog.querySelector(`[data-auth-module-enabled="${cssEscape(moduleId)}"]`)?.checked);
      const sections = Array.from(dialog.querySelectorAll(`[data-auth-section-check^="${cssEscape(moduleId)}."]`))
        .filter((checkbox) => checkbox.checked)
        .map((checkbox) => checkbox.dataset.authSectionCheck.split(".")[1]);

      role.permissions[moduleId] = {
        enabled,
        sections,
      };
    });

    authConfig.roles[selectedManagerRoleId] = normalizeRole(role, selectedManagerRoleId);
    ensureTopAuthorityRoles(authConfig);
  }

  function saveModuleStatusesFromManager(dialog) {
    if (!isDeveloperRole(getCurrentRole())) {
      return;
    }

    dialog.querySelectorAll("[data-auth-module-status]").forEach((select) => {
      const moduleId = select.dataset.authModuleStatus;
      const status = select.value;

      if (moduleDefinitions[moduleId] && MODULE_STATUS_OPTIONS[status]) {
        authConfig.moduleStatuses[moduleId] = status;
      }
    });
  }

  async function savePortalContentFromEditor(root) {
    if (!isDeveloperRole(getCurrentRole())) {
      return;
    }

    const nextContent = normalizePortalContent(portalContent);
    const logoFile = root.querySelector("[data-content-logo-file]")?.files?.[0];
    const logoUrl = String(root.querySelector("[data-content-logo-url]")?.value || "").trim();

    nextContent.logoUrl = logoFile ? await readFileAsDataUrl(logoFile) : logoUrl || DEFAULT_LOGO_URL;

    root.querySelectorAll("[data-content-field]").forEach((field) => {
      setPortalContentValue(nextContent, field.dataset.contentField, field.value);
    });

    root.querySelectorAll("[data-content-module-field]").forEach((field) => {
      const [moduleId = "", contentField = ""] = String(field.dataset.contentModuleField || "").split(".");

      if (!nextContent.modules[moduleId] || !Object.prototype.hasOwnProperty.call(defaultPortalContent.modules[moduleId] || {}, contentField)) {
        return;
      }

      nextContent.modules[moduleId][contentField] = String(field.value || "").trim() || defaultPortalContent.modules[moduleId][contentField];
    });

    portalContent = normalizePortalContent(nextContent);
  }

  function setPortalContentValue(content, path, value) {
    const [scope = "", field = ""] = String(path || "").split(".");

    if (scope !== "home" || !Object.prototype.hasOwnProperty.call(defaultPortalContent.home, field)) {
      return;
    }

    content.home[field] = String(value || "").trim() || defaultPortalContent.home[field];
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => resolve(String(reader.result || DEFAULT_LOGO_URL)));
      reader.addEventListener("error", () => reject(reader.error));
      reader.readAsDataURL(file);
    });
  }

  function saveUsersFromManager(dialog) {
    dialog.querySelectorAll("[data-auth-user-row]").forEach((row) => {
      const user = authConfig.users.find((item) => item.id === row.dataset.authUserRow);

      if (!user) {
        return;
      }

      user.name = String(row.querySelector("[data-auth-user-name]")?.value || user.name).trim() || user.name;
      user.roleId = String(row.querySelector("[data-auth-user-role]")?.value || user.roleId);
      user.password = String(row.querySelector("[data-auth-user-password]")?.value || user.password);
    });
    ensurePrimaryAdminUser(authConfig);
  }

  function deleteSelectedRole(dialog) {
    if (isSystemRole(selectedManagerRoleId)) {
      return;
    }

    const fallbackRoleId = "personel";
    delete authConfig.roles[selectedManagerRoleId];
    authConfig.users = authConfig.users.map((user) => ({
      ...user,
      roleId: user.roleId === selectedManagerRoleId ? fallbackRoleId : user.roleId,
    }));
    selectedManagerRoleId = fallbackRoleId;
    saveConfig();
    renderAuthManager(dialog);
    applyCurrentPagePermissions();
  }

  function getFirstRoleId() {
    return authConfig?.roles?.[DEVELOPER_ROLE_ID] ? DEVELOPER_ROLE_ID : Object.keys(authConfig?.roles || defaultConfig.roles)[0] || DEVELOPER_ROLE_ID;
  }

  function getOrderedRoles() {
    const roles = Object.values(authConfig.roles);

    return roles.sort((firstRole, secondRole) => {
      const firstRank = getRoleRank(firstRole.id);
      const secondRank = getRoleRank(secondRole.id);

      if (firstRank !== secondRank) {
        return firstRank - secondRank;
      }

      return firstRole.name.localeCompare(secondRole.name, "tr");
    });
  }

  function getRoleRank(roleId) {
    if (roleId === DEVELOPER_ROLE_ID) {
      return 0;
    }

    if (roleId === "patron") {
      return 1;
    }

    return 2;
  }

  function isSystemRole(roleId) {
    return roleId === DEVELOPER_ROLE_ID || roleId === "patron";
  }

  function parseSectionKey(value) {
    const [moduleId = "", sectionId = ""] = String(value || "").split(".");
    return [moduleId, sectionId];
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value.map(String) : [];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getAuthTabId() {
    const existingTabId = sessionStorage.getItem("isa-ai-auth-tab-id");

    if (existingTabId) {
      return existingTabId;
    }

    const tabId = createId("tab");
    sessionStorage.setItem("isa-ai-auth-tab-id", tabId);
    return tabId;
  }

  function cssEscape(value) {
    return String(value).replace(/"/g, '\\"');
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function setTextIn(parent, selector, value) {
    const element = parent?.querySelector(selector);

    if (element) {
      element.textContent = value;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function showToast(message) {
    let toast = document.querySelector("[data-auth-toast]");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "auth-toast";
      toast.dataset.authToast = "";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2600);
  }
})();
