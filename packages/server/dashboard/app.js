// Rahul's dashboard: one status, one line, one button, readable in 3 seconds at 2 AM.
// Mock only for now: answers update the local snapshot instead of POSTing to /verifications/:id/respond.
(() => {
  // Every visible string, per language. Lines stay at 8 words or fewer.
  const T = {
    en: {
      safe: "Dadi is safe",
      pending: {
        digital_arrest: "CBI caller: does Dadi have a case?",
        grandparent_voice_clone: "Caller says you're in jail. Safe?",
        other: "Dadi is asking: is this real?",
      },
      scam: {
        digital_arrest: "No case — it's a scam",
        grandparent_voice_clone: "I'm safe — it's a scam",
        other: "It's a scam",
      },
      real: { digital_arrest: "There may be a real case", other: "I need help" },
      confirmed: "Dadi knows it's a scam",
      help: "You asked for help",
      noResponse: "Dadi was told to hang up",
      callDadi: "Call Dadi",
      callDadiNow: "Call Dadi now",
      callPriya: "Call Priya",
      report: "Report at 1930",
      lastAlert: "Last alert",
      noAlerts: "No alerts yet",
      history: "History",
      hide: "Hide",
      typology: {
        digital_arrest: "Digital arrest",
        fake_rbi_safe_account: "Fake RBI account",
        courier_narcotics: "Parcel scam",
        grandparent_voice_clone: "Family emergency",
        government_impersonation_us: "US govt. impersonation",
      },
      today: "Today",
      yesterday: "Yesterday",
    },
    hi: {
      safe: "दादी सुरक्षित हैं",
      pending: {
        digital_arrest: "CBI वाला कॉल: क्या दादी पर केस है?",
        grandparent_voice_clone: "कॉलर कहता है आप जेल में हैं। ठीक हैं?",
        other: "दादी पूछ रही हैं: क्या यह सच है?",
      },
      scam: {
        digital_arrest: "कोई केस नहीं — यह धोखा है",
        grandparent_voice_clone: "मैं ठीक हूँ — यह धोखा है",
        other: "यह धोखा है",
      },
      real: { digital_arrest: "शायद सच में केस है", other: "मुझे मदद चाहिए" },
      confirmed: "दादी को पता है यह धोखा है",
      help: "आपने मदद माँगी है",
      noResponse: "दादी को फ़ोन काटने को कहा गया",
      callDadi: "दादी को कॉल करें",
      callDadiNow: "अभी दादी को कॉल करें",
      callPriya: "प्रिया को कॉल करें",
      report: "1930 पर शिकायत",
      lastAlert: "पिछला अलर्ट",
      noAlerts: "अभी कोई अलर्ट नहीं",
      history: "पूरी सूची",
      hide: "छुपाएँ",
      typology: {
        digital_arrest: "डिजिटल अरेस्ट",
        fake_rbi_safe_account: "नकली RBI खाता",
        courier_narcotics: "पार्सल धोखा",
        grandparent_voice_clone: "परिवार इमरजेंसी",
        government_impersonation_us: "US सरकारी धोखा",
      },
      today: "आज",
      yesterday: "कल",
    },
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
  const pick = (map, key) => map[key] ?? map.other;
  const latest = (list) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  // Language preference is a per-viewer convenience; storage may be blocked, so failures are ignored.
  let lang = "en";
  try { lang = localStorage.getItem("guardian-lang") === "hi" ? "hi" : "en"; } catch {}
  if (new URLSearchParams(location.search).get("lang") === "hi") lang = "hi";

  let snapshot;
  let historyOpen = false;

  function when(iso) {
    const t = T[lang];
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
    const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const days = Math.round((day(new Date()) - day(d)) / 86_400_000);
    if (days === 0) return `${t.today} ${time}`;
    if (days === 1) return `${t.yesterday} ${time}`;
    return `${d.toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short" })} ${time}`;
  }

  /** Maps the latest verification to the one status the screen shows. */
  function view(v) {
    const t = T[lang];
    const call = { label: t.callDadi, action: "call-dadi" };
    const report = { label: t.report, action: "report" };
    switch (v?.status) {
      case "pending":
        return {
          tone: "red", icon: "?", line: pick(t.pending, v.typology),
          primary: { label: pick(t.scam, v.typology), answer: "confirmed_safe", id: v.id },
          links: [{ label: pick(t.real, v.typology), answer: "needs_help", id: v.id }],
        };
      case "confirmed_safe":
        return { tone: "green", icon: "✓", line: t.confirmed, primary: call, links: [report] };
      case "needs_help":
        return { tone: "amber", icon: "!", line: t.help, primary: { label: t.callDadiNow, action: "call-dadi" },
          links: [{ label: t.callPriya, action: "call-priya" }, report] };
      case "no_response":
        return { tone: "slate", icon: "…", line: t.noResponse, primary: call, links: [report] };
      default:
        return { tone: "green", icon: "✓", line: t.safe, primary: call, links: [] };
    }
  }

  const attrs = (b) => (b.answer ? `data-answer="${b.answer}" data-id="${esc(b.id)}"` : `data-action="${b.action}"`);

  function renderStatus() {
    const s = view(latest(snapshot.verifications));
    $("status").dataset.tone = s.tone;
    $("status").innerHTML = `
      <div class="icon" aria-hidden="true">${s.icon}</div>
      <p class="line" lang="${lang}">${s.line}</p>
      <button class="primary" ${attrs(s.primary)}>${s.primary.label}</button>
      <div class="links">${s.links.map((l) => `<button class="link" ${attrs(l)}>${l.label}</button>`).join("")}</div>`;
  }

  function renderAlerts() {
    const t = T[lang];
    const alerts = [...snapshot.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const name = (a) => t.typology[a.typology] ?? a.typology ?? "—";
    const score = (a) => (a.score == null ? "" : ` · ${a.score}/100`);
    const last = alerts[0];
    $("last-alert").textContent = last ? `${t.lastAlert}: ${name(last)}${score(last)}` : t.noAlerts;
    $("history-toggle").hidden = alerts.length === 0;
    $("history-toggle").textContent = historyOpen ? t.hide : t.history;
    $("history-toggle").setAttribute("aria-expanded", String(historyOpen));
    $("history").hidden = !historyOpen;
    $("history").innerHTML = alerts
      .map((a) => `<li><span>${esc(name(a))}${score(a)}</span><time datetime="${a.createdAt}">${when(a.createdAt)}</time></li>`)
      .join("");
  }

  function render() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    renderStatus();
    renderAlerts();
  }

  function load(scenario) {
    const key = window.GUARDIAN_MOCK[scenario] ? scenario : "safe";
    snapshot = structuredClone(window.GUARDIAN_MOCK[key]);
    historyOpen = false;
    document.querySelectorAll(".preview button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scenario === key)));
    history.replaceState(null, "", `?state=${key}`);
    render();
  }

  let toastTimer;
  function toast(text) {
    $("toast").textContent = text;
    $("toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-scenario], [data-lang], [data-answer], [data-action], #history-toggle");
    if (!el) return;
    if (el.dataset.scenario) return load(el.dataset.scenario);
    if (el.dataset.lang) {
      lang = el.dataset.lang;
      try { localStorage.setItem("guardian-lang", lang); } catch {}
      return render();
    }
    if (el.id === "history-toggle") {
      historyOpen = !historyOpen;
      return renderAlerts();
    }
    if (el.dataset.answer) {
      const v = snapshot.verifications.find((x) => x.id === el.dataset.id);
      Object.assign(v, { status: el.dataset.answer, respondedAt: new Date().toISOString() });
      return render();
    }
    const mock = { "call-dadi": "Mock: would call Dadi", "call-priya": "Mock: would call Priya", report: "Mock: would dial 1930" };
    toast(mock[el.dataset.action] ?? "Mock action");
  });

  load(new URLSearchParams(location.search).get("state") ?? "safe");
})();
