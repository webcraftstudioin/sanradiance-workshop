import { db, configured, workshopId, collection, doc, addDoc, getDoc, getDocs, query, where, orderBy, serverTimestamp } from "./firebase.js?v=20261016b";
import { DEFAULT_WORKSHOP, DEFAULT_PROGRAMS, DEFAULT_TESTIMONIALS, INCLUDED, ROLES, QUALIFICATIONS } from "./defaults.js?v=20261016b";
import { $, $$, esc, initials, colorFor, toast, safeUrl } from "./util.js?v=20261016b";

let workshop = DEFAULT_WORKSHOP, programs = DEFAULT_PROGRAMS, stories = [];
let rating = 0;

// Uses the catalogue link set in the admin dashboard; falls back to assets/course-catalogue.pdf.
const catalogCard = () => {
  const link = safeUrl(workshop.catalogUrl || "");
  const btn = link
    ? `<a class="btn sm" href="${esc(link)}" target="_blank" rel="noopener">Download catalogue</a>`
    : `<a class="btn sm" href="assets/course-catalogue.pdf" download="SanRadiance-JayathiSoft-Course-Catalogue.pdf">Download catalogue</a>`;
  return CATALOG_CARD.replace("{{BTN}}", btn);
};
const CATALOG_CARD = `
  <div class="card catalog">
    <div class="catalog-ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg></div>
    <div class="catalog-tx"><strong>Course catalogue</strong><small>All programs, syllabus &amp; contacts · PDF</small></div>
    {{BTN}}
  </div>`;

async function loadContent() {
  if (!configured) return;
  try {
    const w = await getDoc(doc(db, "settings", "workshop"));
    if (w.exists()) workshop = { ...DEFAULT_WORKSHOP, ...w.data() };
  } catch (e) { console.warn("workshop", e); }
  try {
    const p = await getDocs(query(collection(db, "programs"), orderBy("order")));
    if (!p.empty) programs = p.docs.map((d) => d.data());
  } catch (e) { console.warn("programs", e); }
  try {
    const t = await getDocs(query(collection(db, "testimonials"), where("show", "==", true)));
    stories = t.docs.map((d) => d.data()).sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  } catch (e) { console.warn("testimonials", e); }
  // Until stories are managed in the admin dashboard, show the built-in alumni stories.
  if (!stories.length && workshop.storiesSource !== "db") stories = DEFAULT_TESTIMONIALS;
}

function renderHeader() {
  $("#evLine").textContent = `Career & Placement Guidance · ${workshop.venue.split(",").pop().trim()} · ${workshop.date.replace(/^\w+,\s*/, "")}`;
}

function renderForm() {
  rating = 0;
  $("#phTitle").textContent = "Feedback & Course Interest";
  $("#body").innerHTML = `
    ${configured ? "" : `<div class="notice">Setup not finished: this page can't save answers yet. Paste your Firebase settings into config.js (README step 3).</div>`}
    <div class="welcome">Thank you for attending this workshop! We appreciate your participation. Please fill out the form below to share your feedback and let us know whether you are interested in joining our courses.</div>
    ${catalogCard()}
    <form id="sForm" novalidate style="display:grid;gap:14px">
      <div class="card"><fieldset><legend>Student information</legend>
        <label class="f">Full name<input type="text" id="fName" autocomplete="name" maxlength="100" placeholder="e.g. Ananya Rao"></label>
        <label class="f">Phone number<input type="tel" id="fPhone" inputmode="numeric" autocomplete="tel" maxlength="20" placeholder="10-digit mobile number"></label>
        <label class="f">I am attending as
          <select id="fRole"><option value="">Select…</option>${ROLES.map((r) => `<option>${esc(r)}</option>`).join("")}</select></label>
        <label class="f">Educational qualification
          <select id="fQual"><option value="">Select…</option>${QUALIFICATIONS.map((q) => `<option>${esc(q)}</option>`).join("")}</select></label>
        <div class="f">Interested in joining a course?
          <small>Parents and placement officers: answer for your child or students.</small>
          <div class="seg"><label><input type="radio" name="fInt" value="Yes">Yes</label><label><input type="radio" name="fInt" value="No">No</label></div></div>
        <label class="f">Comments or description<textarea id="fCom" maxlength="1000" placeholder="Feedback, suggestions, questions or your overall experience"></textarea></label>
      </fieldset></div>
      <div class="card"><fieldset><legend>Refer your friend <span style="text-transform:none;letter-spacing:0;font-weight:500;color:var(--muted)">(optional)</span></legend>
        <p class="muted" style="margin:0;font-size:13px">Know someone who would benefit from these programs? Share their details and our team will reach out.</p>
        <label class="f">Friend's name<input type="text" id="fRefName" autocomplete="off" maxlength="100" placeholder="e.g. Rahul Kumar"></label>
        <label class="f">Friend's contact number<input type="tel" id="fRefPhone" inputmode="numeric" autocomplete="off" maxlength="20" placeholder="10-digit mobile number"></label>
        <small class="muted" style="font-size:12px">Please refer only friends who are happy to be contacted.</small>
      </fieldset></div>
      <div class="card"><fieldset><legend>Workshop feedback</legend>
        <div class="f">Did you attend the workshop?
          <div class="seg"><label><input type="radio" name="fAtt" value="Yes" checked>Yes, I attended</label><label><input type="radio" name="fAtt" value="No">No</label></div></div>
        <div class="f">Rate this workshop
          <div class="stars" id="stars" role="group" aria-label="Rating">${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-n="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">★</button>`).join("")}</div></div>
        <label class="check"><input type="checkbox" id="fConsent"> I agree that SanRadiance and JayathiSoft may contact me by phone or WhatsApp about this workshop and their programs. My details won't be shared with anyone else.</label>
      </fieldset></div>
      <div class="err" id="fErr" role="alert"></div>
      <button class="btn" type="submit" id="fSubmit">Submit →</button>
    </form>`;
  $$("#stars button").forEach((b) => (b.onclick = () => {
    rating = +b.dataset.n;
    $$("#stars button").forEach((s) => s.classList.toggle("on", +s.dataset.n <= rating));
  }));
  $("#sForm").onsubmit = submit;
}

function cleanPhone(v) {
  let p = String(v || "").replace(/\D/g, "");
  if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
  if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
  return p;
}

async function submit(e) {
  e.preventDefault();
  const name = $("#fName").value.trim().replace(/\s+/g, " ");
  const phone = cleanPhone($("#fPhone").value);
  const refName = $("#fRefName").value.trim().replace(/\s+/g, " ");
  const refPhone = cleanPhone($("#fRefPhone").value);
  const role = $("#fRole").value, qual = $("#fQual").value;
  const intr = $('input[name="fInt"]:checked'), att = $('input[name="fAtt"]:checked');
  let m = "";
  if (!name) m = "Please enter your full name.";
  else if (!/^[6-9]\d{9}$/.test(phone)) m = "Please enter a valid 10-digit mobile number.";
  else if (!role) m = "Please tell us how you are attending (student, parent, etc.).";
  else if (!qual) m = "Please select your qualification.";
  else if (!intr) m = "Please tell us if you're interested in joining a course.";
  else if (refName && !refPhone) m = "Please enter your friend's contact number, or clear their name.";
  else if (refPhone && !refName) m = "Please enter your friend's name, or clear their number.";
  else if (refPhone && !/^[6-9]\d{9}$/.test(refPhone)) m = "Please enter a valid 10-digit number for your friend.";
  else if (refPhone && refPhone === phone) m = "Your friend's number can't be the same as yours.";
  else if (!rating) m = "Please rate the workshop (tap the stars).";
  else if (!$("#fConsent").checked) m = "Please tick the consent box so we can contact you.";
  $("#fErr").textContent = m;
  if (m) return;
  if (!configured) { $("#fErr").textContent = "This page isn't connected yet, so your answers can't be saved."; return; }

  const btn = $("#fSubmit"); btn.disabled = true; btn.textContent = "Submitting…";
  try {
    const entry = {
      workshopId, name, phone, role, qual,
      interest: intr.value, attended: att.value, rating,
      comment: $("#fCom").value.trim().slice(0, 1000),
      consent: true, status: "New", notes: "",
      createdAt: serverTimestamp()
    };
    if (refName && refPhone) { entry.refName = refName.slice(0, 100); entry.refPhone = refPhone; }
    await addDoc(collection(db, "submissions"), entry);
    renderThanks(name.split(" ")[0]);
    window.scrollTo(0, 0);
  } catch (err) {
    console.error(err);
    $("#fErr").textContent = "We couldn't submit your form. Please check your internet connection and try again.";
    btn.disabled = false; btn.textContent = "Submit →";
  }
}

function whatsappCard() {
  const link = safeUrl(workshop.whatsappUrl || "");
  if (!link) return "";
  return `<div class="card wa-card">
    <div class="wa-ic" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.3 4.8 4.9-1.3A9.9 9.9 0 1 0 12.04 2zm0 18.1a8.2 8.2 0 0 1-4.2-1.15l-.3-.18-2.9.76.78-2.83-.2-.3a8.2 8.2 0 1 1 6.8 3.7zm4.5-6.1c-.25-.12-1.47-.72-1.7-.8-.23-.09-.4-.13-.56.12-.17.25-.64.8-.79.97-.14.16-.29.18-.54.06a6.7 6.7 0 0 1-3.34-2.92c-.25-.44.25-.4.72-1.34.08-.16.04-.3-.02-.43l-.76-1.83c-.2-.48-.4-.41-.56-.42h-.48a.92.92 0 0 0-.66.31 2.8 2.8 0 0 0-.87 2.07 4.85 4.85 0 0 0 1.02 2.58 11.1 11.1 0 0 0 4.25 3.75c1.58.68 2.2.74 2.99.62.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.17-.48-.29z"/></svg></div>
    <div class="wa-tx">
      <strong>Join our WhatsApp community</strong>
      <p>We'll share all updates about this workshop, our courses, upcoming batches and career opportunities here.</p>
    </div>
    <a class="btn wa-btn" href="${esc(link)}" target="_blank" rel="noopener">Join WhatsApp community</a>
  </div>`;
}

function renderThanks(first) {
  $("#phTitle").textContent = `Thank you, ${first}!`;
  const hasStories = stories.length > 0;
  $("#body").innerHTML = `
    <div class="card thanks"><div class="tick" aria-hidden="true">✓</div><h2 style="font-size:19px">Your feedback has been submitted</h2><p class="muted" style="margin:0;font-size:14px">Our team will reach out if you showed interest in a program. Meanwhile, explore below.</p></div>
    ${whatsappCard()}
    <div class="ptabs" role="tablist">
      ${hasStories ? `<button role="tab" data-pt="stories" aria-selected="true">Success stories</button>` : ""}
      <button role="tab" data-pt="courses" aria-selected="${hasStories ? "false" : "true"}">Workshop &amp; programs</button>
    </div>
    <div id="ptab"></div>`;
  $$(".ptabs button").forEach((b) => (b.onclick = () => {
    $$(".ptabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
    renderTab(b.dataset.pt);
  }));
  renderTab(hasStories ? "stories" : "courses");
}

function renderTab(t) {
  const el = $("#ptab");
  if (t === "stories") {
    el.innerHTML = `<div style="display:grid;gap:12px">
      <p class="muted" style="margin:0;font-size:13px">Alumni who built their careers with JayathiSoft and SanRadiance.</p>
      ${stories.map((x) => {
      const photo = safeUrl(x.photo), video = safeUrl(x.video);
      const sub = [x.course, x.college].filter(Boolean).join(" · ");
      const job = [x.role, x.company].filter(Boolean).map(esc).join(" · ");
      return `<article class="card tcard">
        <div class="who">${photo ? `<img class="avatar" src="${esc(photo)}" alt="Photo of ${esc(x.name)}" loading="lazy">` : `<div class="avatar" style="background:${colorFor(x.name)}">${esc(initials(x.name))}</div>`}
          <div><strong>${esc(x.name)}</strong>${sub ? `<small>${esc(sub)}</small>` : ""}${x.location ? `<small>📍 ${esc(x.location)}</small>` : ""}</div></div>
        ${x.story ? `<p style="margin:0;font-size:14px">“${esc(x.story)}”</p>` : ""}
        ${(x.skills || []).length ? `<div class="chips">${x.skills.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>` : ""}
        ${job || x.pkg ? `<div class="placed"><span>${job}</span>${x.pkg ? `<span>${esc(x.pkg)}</span>` : ""}</div>` : ""}
        ${video ? `<a href="${esc(video)}" target="_blank" rel="noopener" style="font-size:13px;font-weight:600">▶ Watch video testimonial</a>` : ""}
      </article>`;
    }).join("")}
    </div>`;
    return;
  }
  const w = workshop;
  el.innerHTML = `<div class="info">
    <div class="card"><span class="eyebrow">Today's workshop</span><h3 style="margin-top:4px">${esc(w.title)}</h3>
      <p class="muted" style="margin:0 0 4px;font-size:13px">${esc(w.date)} · ${esc(w.time)}<br>${esc(w.venue)}</p>
      <p style="margin:0 0 6px;font-size:13px">Conducted by ${esc(w.by)}</p>
      <ul>${(w.topics || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    ${(w.companies || []).length ? `<div class="card"><h3>Companies covered in the guidance</h3><p class="muted" style="margin:0;font-size:13px">How hiring works and what skills are expected at leading companies such as:</p>
      <div class="cos">${w.companies.map((c) => `<span>${esc(c)}</span>`).join("")}<span>and other reputed organisations</span></div>
      <p class="disclaim">Career guidance only. These companies are not partners or sponsors of this event, and jobs are not guaranteed.</p></div>` : ""}
    <div class="card"><h3>Who benefits from this program</h3><div class="aud">
      <div>Job seekers<small>Aiming for high-paying IT roles</small></div><div>Parents<small>Planning their child's career</small></div>
      <div>Placement officers<small>Guiding their students</small></div><div>Education promoters<small>Building student pathways</small></div></div></div>
    <div style="display:grid;gap:8px"><h3>Training &amp; internship programs</h3>
      <p class="muted" style="margin:0;font-size:13px">Job-oriented training by JayathiSoft and a VTU-registered AI internship by SanRadiance. Tap a program for details.</p>
      ${programs.map((c, i) => `<details class="card course"${i === 0 ? " open" : ""}><summary><span><span class="org">${esc(c.org)}</span><br>${esc(c.name)}</span>${c.tag ? `<span class="tag">${esc(c.tag)}</span>` : ""}</summary>
        <dl><dt>Duration</dt><dd>${esc(c.dur)}</dd><dt>Next batch</dt><dd>${esc(c.batch)}</dd><dt>Mode</dt><dd>${esc(c.mode)}</dd><dt>Fee</dt><dd>${esc(c.fee)}</dd></dl>
        ${(c.syllabus || []).length ? `<strong style="font-size:13px;color:var(--ink)">Syllabus</strong><ul>${c.syllabus.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
        ${c.outcomes ? `<p style="font-size:13px;margin:8px 0 0"><strong style="color:var(--ink)">You'll be able to:</strong> ${esc(c.outcomes)}</p>` : ""}
      </details>`).join("")}</div>
    <div class="card"><h3>What the programs include</h3><ul>${INCLUDED.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="card"><h3>Who can join</h3><ul><li>B.E., B.Tech, BCA and MCA students and graduates</li><li>Working professionals looking to move into higher-paying IT roles</li><li>Internship: CS, ECE, Data Science or AI/ML, 6th semester and above preferred</li></ul></div>
    <div class="card"><h3>How to register</h3><ol><li>Call or WhatsApp us on the number below.</li><li>Free counselling to pick the right program.</li><li>Confirm your seat in the next batch.</li></ol></div>
    ${catalogCard()}
    <div class="contact"><strong>Program enquiries</strong>Call / WhatsApp: <b><a href="tel:+91${esc(w.phone.replace(/\D/g, ""))}">${esc(w.phone)}</a></b><br>Email: <b>${esc(w.email)}</b><br>${esc(w.address)}<br>${esc(w.websites)}</div>
  </div>`;
}

(async function init() {
  await loadContent();
  renderHeader();
  renderForm();
})().catch((e) => { console.error(e); renderForm(); toast("Some content couldn't load. You can still submit the form."); });
