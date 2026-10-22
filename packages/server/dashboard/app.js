// Rahul's dashboard. Renders one snapshot ({ alerts, verifications, household }) into the page.
// Mock only for now: answers update the local snapshot instead of POSTing to /verifications/:id/respond.
(() => {
  const TYPOLOGY = {
    digital_arrest: "Digital arrest",
    fake_rbi_safe_account: "Fake RBI safe account",
    courier_narcotics: "Courier / parcel scam",
    grandparent_voice_clone: "Family emergency call",
    government_impersonation_us: "US government impersonation",
    none: "No scam pattern",
  };

  const SEVERITY = {
    critical: "Critical · गंभीर",
    warning: "Warning · चेतावनी",
    info: "Info · जानकारी",
  };

  // The question Rahul is asked depends on what the caller claimed.
  const QUESTION = {
    digital_arrest: {
      en: "Does Dadi have any case or notice?",
      hi: "कोई खुद को CBI बताकर कह रहा है कि दादी 'डिजिटल अरेस्ट' में हैं। क्या दादी पर कोई केस या नोटिस है?",
      yes: { en: "No case — it's a scam", hi: "koi case nahi, ye scam hai" },
      no: { en: "There may be a real case", hi: "shayad sach mein case hai" },
    },
    grandparent_voice_clone: {
      en: "Are you safe?",
      hi: "कोई आपकी आवाज़ में कह रहा है कि आप जेल में हैं और पैसे चाहिए। क्या आप सुरक्षित हैं?",
      yes: { en: "I'm safe — it's a scam", hi: "main theek hoon, ye scam hai" },
      no: { en: "I need help", hi: "mujhe madad chahiye" },
    },
  };
  const DEFAULT_QUESTION = {
    en: "Is this real?",
    hi: "क्या यह सच है?",
    yes: { en: "It's a scam", hi: "ye scam hai" },
    no: { en: "I need help", hi: "mujhe madad chahiye" },
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  function formatTime(iso) {
    const d = new Date(iso);
    const time = d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
    const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
    if (days === 0) return `Today ${time}`;
    if (days === 1) return `Yesterday ${time}`;
    if (days < 7) return `${d.toLocaleDateString("en-IN", { weekday: "short" })} ${time}`;
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
  }
  const clock = (iso) => formatTime(iso).replace(/^(Today|Yesterday) /, "");
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

  function waited(iso) {
    const s = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  const latest = (list) => [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  // ---- Status area: one of five states ----

  function hero({ tone = "", eyebrow, check, title, titleHi, meta }) {
    return `<section class="hero ${tone}" aria-live="polite">
      ${check ? `<div class="check" aria-hidden="true">${check}</div>` : `<p class="hero-eyebrow"><span class="dot"></span>${eyebrow}</p>`}
      <h2 class="hero-title">${title}</h2>
      <p class="hero-title-hi" lang="hi">${titleHi}</p>
      <p class="hero-meta">${meta}</p>
    </section>`;
  }

  function renderSafe(snapshot) {
    const last = latest(snapshot.alerts);
    const meta = `Last check ${last ? clock(last.createdAt) : "—"} · ${esc(snapshot.household.persona.city)}`;
    return hero({ eyebrow: "All clear · सब ठीक है", title: "Dadi is safe", titleHi: "दादी सुरक्षित हैं", meta });
  }

  function renderPending(v, alert) {
    const q = QUESTION[v.typology] ?? DEFAULT_QUESTION;
    const score = alert ? ` · ${alert.score}/100` : "";
    return `<section class="request" aria-live="assertive">
      <div class="request-head">
        <span class="who"><span class="dot"></span><span>Dadi is asking you · <span lang="hi">दादी पूछ रही हैं</span></span></span>
        <time datetime="${v.createdAt}">${clock(v.createdAt)}</time>
      </div>
      <div class="request-body">
        <h2 class="request-title">${esc(v.reason)} ${q.en}</h2>
        <p class="request-hi" lang="hi">${q.hi}</p>
        <p style="margin-top:14px"><span class="pill critical">${SEVERITY.critical}</span></p>
        <p class="request-meta">${TYPOLOGY[v.typology] ?? "Unknown"}${score} · waiting <span data-waiting="${v.createdAt}">${waited(v.createdAt)}</span></p>
        <button class="answer primary" data-answer="confirmed_safe" data-id="${v.id}">
          <strong>${q.yes.en}</strong><span>${q.yes.hi}</span>
        </button>
        <button class="answer" data-answer="needs_help" data-id="${v.id}">
          <strong>${q.no.en}</strong><span>${q.no.hi}</span>
        </button>
        <p class="request-note">Alexa will tell Dadi your answer right away. Either way, she is told not to send money.</p>
      </div>
    </section>`;
  }

  function renderConfirmed(v) {
    return hero({
      check: "✓",
      title: "Dadi knows it's a scam",
      titleHi: "दादी को बता दिया गया है",
      meta: `You answered at ${clock(v.respondedAt)}. Alexa told Dadi to end the call and report it at 1930.`,
    });
  }

  function renderNeedsHelp(v) {
    return hero({
      tone: "help",
      check: "!",
      title: "Help is needed",
      titleHi: "मदद की ज़रूरत है",
      meta: `You said help is needed at ${clock(v.respondedAt)}. Alexa still told Dadi not to pay this caller and that family will call her.`,
    });
  }

  function renderNoResponse(v) {
    return hero({
      tone: "quiet",
      check: "…",
      title: "No answer in time",
      titleHi: "समय पर जवाब नहीं मिला",
      meta: `Dadi asked at ${clock(v.createdAt)}. Alexa told her to end the call, not pay anything, and call 1930 if she feels unsafe.`,
    });
  }

  function action(label, hi, sub, dark, key) {
    return `<button class="action ${dark ? "dark" : ""}" data-action="${key}">
      <span><strong>${label}</strong><span class="sub"><span lang="hi">${hi}</span>${sub ? ` · ${sub}` : ""}</span></span>
      <span class="chev" aria-hidden="true">›</span>
    </button>`;
  }

  function renderNext(status) {
    const items = [action("Call Dadi now", "दादी को कॉल करें", "a familiar voice helps", true, "call-dadi")];
    if (status === "needs_help") items.push(action("Call Priya", "प्रिया को कॉल करें", "she is in Lucknow", false, "call-priya"));
    items.push(action("Report at 1930", "शिकायत करें", "cybercrime.gov.in", false, "report"));
    return `<h2>Next · <span lang="hi">आगे क्या करें</span></h2>${items.join("")}`;
  }

  // ---- Lists ----

  function verificationFor(alert, verifications) {
    // FamilyEvent has no verification id, so link by typology + time window (a verification follows its alert).
    return verifications.find((v) => v.typology === alert.typology && v.respondedAt
      && Math.abs(Date.parse(v.createdAt) - Date.parse(alert.createdAt)) < 10 * 60_000);
  }

  function renderAlerts(snapshot) {
    const alerts = [...snapshot.alerts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (alerts.length === 0) return `<li class="empty">No alerts yet.</li>`;
    return alerts.map((a) => {
      const v = verificationFor(a, snapshot.verifications);
      const link = !v ? "" : v.status === "confirmed_safe"
        ? `<p class="alert-link"><span class="dot"></span>You confirmed scam · ${clock(v.respondedAt)}</p>`
        : `<p class="alert-link help"><span class="dot"></span>You asked for help · ${clock(v.respondedAt)}</p>`;
      const score = a.score == null ? "" : `<span class="score ${a.severity}"><b>${a.score}</b>/100</span>`;
      return `<li>
        <div class="alert-top"><span class="pill ${a.severity}">${SEVERITY[a.severity]}</span><time datetime="${a.createdAt}">${formatTime(a.createdAt)}</time></div>
        <div class="alert-mid"><h3>${TYPOLOGY[a.typology] ?? "Alert"}</h3>${score}</div>
        <p class="alert-summary" title="${esc(a.summary)}">${esc(a.summary)}</p>
        ${link}
      </li>`;
    }).join("");
  }

  function renderHousehold({ persona, contacts }) {
    const dadi = `<li class="person">
      <span class="initial dadi" aria-hidden="true">${esc(persona.displayName[0])}</span>
      <div class="who"><strong>${esc(persona.displayName)} · <span lang="hi">दादी</span></strong><p>${esc(persona.city)}${persona.livesAlone ? " · lives alone" : ""}</p></div>
      <button class="call filled" data-action="call-dadi">Call<small lang="hi">कॉल करें</small></button>
    </li>`;
    const people = contacts.map((c) => `<li class="person">
      <span class="initial" aria-hidden="true">${esc(c.name[0])}</span>
      <div class="who"><strong>${esc(c.name)} · <span lang="hi">${esc(c.relationshipHi ?? "")}</span></strong><p>${esc(cap(c.relationship))} · ${esc(c.city ?? "")}</p></div>
      ${c.id === VIEWER_ID
        ? `<span class="pill primary">You${c.primary ? " · primary" : ""}</span>`
        : `<button class="call" data-action="call-${esc(c.id)}">Call<small lang="hi">कॉल करें</small></button>`}
    </li>`);
    return dadi + people.join("");
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---- Render ----

  const VIEWER_ID = "rahul";
  let snapshot;

  function render() {
    const v = latest(snapshot.verifications);
    const alert = v && latest(snapshot.alerts.filter((a) => a.typology === v.typology));
    const status = v?.status ?? "none";

    $("status").innerHTML =
      status === "pending" ? renderPending(v, alert)
      : status === "confirmed_safe" ? renderConfirmed(v)
      : status === "needs_help" ? renderNeedsHelp(v)
      : status === "no_response" ? renderNoResponse(v)
      : renderSafe(snapshot);

    const showNext = status !== "none" && status !== "pending";
    $("next").hidden = !showNext;
    $("next").innerHTML = showNext ? renderNext(status) : "";

    $("alerts").innerHTML = renderAlerts(snapshot);
    // The design keeps the request and follow-up screens focused; household shows only when all is clear.
    $("household-section").hidden = status !== "none";
    $("household").innerHTML = renderHousehold(snapshot.household);
  }

  function load(scenario) {
    const data = window.GUARDIAN_MOCK[scenario] ? scenario : "safe";
    snapshot = structuredClone(window.GUARDIAN_MOCK[data]);
    document.querySelectorAll(".preview button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.scenario === data)));
    history.replaceState(null, "", `?state=${data}`);
    render();
  }

  let toastTimer;
  function toast(text) {
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-answer], [data-action], [data-scenario]");
    if (!target) return;
    if (target.dataset.scenario) return load(target.dataset.scenario);
    if (target.dataset.answer) {
      const v = snapshot.verifications.find((x) => x.id === target.dataset.id);
      Object.assign(v, { status: target.dataset.answer, respondedAt: new Date().toISOString() });
      return render();
    }
    const messages = {
      "call-dadi": "Mock: would call Dadi",
      "call-priya": "Mock: would call Priya",
      report: "Mock: would open cybercrime.gov.in / dial 1930",
    };
    toast(messages[target.dataset.action] ?? "Mock action");
  });

  setInterval(() => {
    document.querySelectorAll("[data-waiting]").forEach((el) => { el.textContent = waited(el.dataset.waiting); });
  }, 1000);

  load(new URLSearchParams(location.search).get("state") ?? "safe");
})();
