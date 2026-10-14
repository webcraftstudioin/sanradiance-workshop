import {
  db, auth, configured, workshopId,
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, writeBatch, serverTimestamp,
  signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail
} from "./firebase.js";
import { DEFAULT_WORKSHOP, DEFAULT_PROGRAMS, STATUSES } from "./defaults.js";
import { $, $$, esc, stars, toast, fmtTime, safeUrl } from "./util.js";

let subs = [], testimonials = [], programs = [], workshop = { ...DEFAULT_WORKSHOP };
let tab = "subs", filt = { q: "", int: "all", status: "all", scope: "this" };
let unsubs = [], editingT = null, editingP = null, confirmDel = null;

/* ---------- Auth ---------- */
if (!configured) {
  $("#setupMsg").hidden = false;
} else {
  onAuthStateChanged(auth, (user) => {
    unsubs.forEach((u) => u()); unsubs = [];
    if (!user) { $("#loginForm").hidden = false; $("#dash").hidden = true; $("#whoami").hidden = true; return; }
    $("#loginForm").hidden = true; $("#whoami").hidden = false; $("#meEmail").textContent = user.email;
    start();
  });
}

$("#loginForm").onsubmit = async (e) => {
  e.preventDefault();
  const email = $("#lEmail").value.trim(), pass = $("#lPass").value;
  if (!email || !pass) { $("#lErr").textContent = "Enter your email and password."; return; }
  $("#lBtn").disabled = true; $("#lErr").textContent = "";
  try { await signInWithEmailAndPassword(auth, email, pass); }
  catch (err) {
    $("#lErr").textContent = /invalid|wrong|not-found|credential/.test(err.code || "") ? "Email or password is incorrect." : "Couldn't sign in. Check your internet connection and try again.";
  } finally { $("#lBtn").disabled = false; }
};
$("#lReset").onclick = async () => {
  const email = $("#lEmail").value.trim();
  if (!email) { $("#lErr").textContent = "Type your email above first, then click Forgot password."; return; }
  try { await sendPasswordResetEmail(auth, email); toast("Password reset email sent"); }
  catch { $("#lErr").textContent = "Couldn't send the reset email. Check the address."; }
};
$("#logout").onclick = () => signOut(auth);

/* ---------- Live data ---------- */
function listenSubs() {
  unsubs.filter((u) => u._subs).forEach((u) => u());
  unsubs = unsubs.filter((u) => !u._subs);
  const q = filt.scope === "all" ? collection(db, "submissions") : query(collection(db, "submissions"), where("workshopId", "==", workshopId));
  const u = onSnapshot(q, (snap) => {
    subs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() ?? Date.now()) - (a.createdAt?.toMillis?.() ?? Date.now()));
    $("#dash").hidden = false;
    renderKPIs();
    if (tab === "subs" || tab === "fb") render();
  }, (err) => {
    console.error(err);
    $("#dash").hidden = true;
    $("#setupMsg").hidden = false;
    $("#setupMsg").innerHTML = err.code === "permission-denied"
      ? `This account (<b>${esc(auth.currentUser?.email)}</b>) is not on the admin list. Ask the owner to add it in the Firebase security rules (README step 5).`
      : "Couldn't load submissions. Check your internet connection and reload.";
  });
  u._subs = true; unsubs.push(u);
}

function start() {
  $("#setupMsg").hidden = true;
  listenSubs();
  unsubs.push(onSnapshot(query(collection(db, "testimonials"), orderBy("order")), (s) => { testimonials = s.docs.map((d) => ({ id: d.id, ...d.data() })); if (tab === "tm") render(); }));
  unsubs.push(onSnapshot(query(collection(db, "programs"), orderBy("order")), (s) => { programs = s.docs.map((d) => ({ id: d.id, ...d.data() })); if (tab === "cs" && !editingP) render(); }));
  unsubs.push(onSnapshot(doc(db, "settings", "workshop"), (s) => { workshop = s.exists() ? { ...DEFAULT_WORKSHOP, ...s.data() } : { ...DEFAULT_WORKSHOP }; workshop._saved = s.exists(); }));
  render();
}

/* ---------- Tabs ---------- */
$$(".atabs button").forEach((b) => (b.onclick = () => {
  tab = b.dataset.at; editingT = editingP = confirmDel = null;
  $$(".atabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
  render();
}));

function renderKPIs() {
  const n = subs.length, yes = subs.filter((s) => s.interest === "Yes").length;
  const avg = n ? subs.reduce((a, s) => a + (s.rating || 0), 0) / n : 0;
  const enr = subs.filter((s) => s.status === "Enrolled").length;
  const refs = subs.filter((s) => s.refPhone).length;
  $("#kpis").innerHTML = `
    <div class="card kpi"><small>Responses</small><b>${n}</b><span>${filt.scope === "all" ? "all workshops" : "this workshop"}</span></div>
    <div class="card kpi"><small>Interested in a program</small><b class="acc">${yes}</b><span>${n ? Math.round((yes / n) * 100) : 0}% of respondents</span></div>
    <div class="card kpi"><small>Average rating</small><b>${avg.toFixed(1)}</b><span>out of 5</span></div>
    <div class="card kpi"><small>Enrolled</small><b>${enr}</b><span>${refs} friend referral${refs === 1 ? "" : "s"} to follow up</span></div>`;
}

function render() {
  const P = $("#panel");
  if (tab === "subs") return renderSubs(P);
  if (tab === "fb") return renderFeedback(P);
  if (tab === "tm") return renderTestimonials(P);
  return renderContent(P);
}

/* ---------- Submissions ---------- */
function filtered() {
  const q = filt.q.toLowerCase();
  return subs.filter((s) =>
    (filt.int === "all" || (filt.int === "ref" ? !!s.refPhone : s.interest === filt.int)) &&
    (filt.status === "all" || s.status === filt.status) &&
    `${s.name} ${s.phone} ${s.qual} ${s.role} ${s.comment} ${s.refName || ""} ${s.refPhone || ""}`.toLowerCase().includes(q));
}

function renderSubs(P) {
  const rows = filtered();
  P.innerHTML = `
    <div class="toolbar">
      <input type="text" id="aq" placeholder="Search name, phone, role, qualification, comment" value="${esc(filt.q)}" aria-label="Search">
      <select id="ai" aria-label="Interest"><option value="all">All attendees</option><option value="Yes"${filt.int === "Yes" ? " selected" : ""}>Interested only</option><option value="No"${filt.int === "No" ? " selected" : ""}>Not interested</option><option value="ref"${filt.int === "ref" ? " selected" : ""}>Referred a friend</option></select>
      <select id="as" aria-label="Status"><option value="all">Any status</option>${STATUSES.map((x) => `<option${filt.status === x ? " selected" : ""}>${x}</option>`).join("")}</select>
      <select id="sc" aria-label="Workshop"><option value="this">This workshop</option><option value="all"${filt.scope === "all" ? " selected" : ""}>All workshops</option></select>
      <button class="btn ghost sm" id="exp">Download Excel (CSV)</button>
    </div>
    <p class="muted" style="margin:0 0 10px;font-size:13px">Showing ${rows.length} of ${subs.length}. Use student contact details only to follow up about this workshop and its programs.</p>
    <div class="tablewrap"><table>
      <thead><tr><th>Name</th><th>Phone</th><th>Attending as</th><th>Qualification</th><th>Interested</th><th>Rating</th><th>Comments</th><th>Referred friend</th><th>Submitted</th><th>Follow-up</th><th>Notes</th><th></th></tr></thead>
      <tbody>${rows.map((s) => `<tr>
        <td><strong>${esc(s.name)}</strong>${s.status === "New" ? ' <span class="pill new">new</span>' : ""}</td>
        <td class="num">${esc(s.phone)}<div class="acts" style="margin-top:4px"><a href="tel:+91${esc(s.phone)}">Call</a><a href="https://wa.me/91${esc(s.phone)}" target="_blank" rel="noopener">WhatsApp</a></div></td>
        <td>${esc(s.role || "—")}</td><td>${esc(s.qual)}</td>
        <td><span class="pill ${s.interest === "Yes" ? "yes" : "no"}">${esc(s.interest)}</span></td>
        <td class="starline" aria-label="${s.rating} of 5">${stars(s.rating || 0)}</td>
        <td style="max-width:240px">${esc(s.comment) || '<span class="muted">—</span>'}</td>
        <td>${s.refPhone ? `<strong>${esc(s.refName)}</strong><div class="num">${esc(s.refPhone)}</div><div class="acts" style="margin-top:4px"><a href="tel:+91${esc(s.refPhone)}">Call</a><a href="https://wa.me/91${esc(s.refPhone)}" target="_blank" rel="noopener">WhatsApp</a></div>` : '<span class="muted">—</span>'}</td>
        <td class="num">${fmtTime(s.createdAt)}</td>
        <td><select data-st="${s.id}" aria-label="Follow-up status for ${esc(s.name)}">${STATUSES.map((x) => `<option${x === s.status ? " selected" : ""}>${x}</option>`).join("")}</select></td>
        <td><input class="note" type="text" data-note="${s.id}" value="${esc(s.notes || "")}" placeholder="Add a note" aria-label="Notes for ${esc(s.name)}" maxlength="500"></td>
        <td>${confirmDel === s.id
          ? `<span class="confirm">Delete? <button class="btn danger sm" data-delyes="${s.id}">Yes</button><button class="btn ghost sm" data-delno>No</button></span>`
          : `<button class="btn ghost sm" data-del="${s.id}" aria-label="Delete ${esc(s.name)}">Delete</button>`}</td>
      </tr>`).join("") || `<tr><td colspan="12" class="empty">${subs.length ? "No students match these filters." : "No submissions yet. They appear here instantly when students submit the form."}</td></tr>`}</tbody>
    </table></div>`;
  const keepFocus = (id, fn) => (e) => { const p = e.target.selectionStart; fn(e); const el = $(id); el.focus(); el.setSelectionRange(p, p); };
  $("#aq").oninput = keepFocus("#aq", (e) => { filt.q = e.target.value; renderSubs(P); });
  $("#ai").onchange = (e) => { filt.int = e.target.value; renderSubs(P); };
  $("#as").onchange = (e) => { filt.status = e.target.value; renderSubs(P); };
  $("#sc").onchange = (e) => { filt.scope = e.target.value; listenSubs(); };
  $("#exp").onclick = exportCSV;
  $$("[data-st]", P).forEach((sel) => (sel.onchange = async () => {
    try { await updateDoc(doc(db, "submissions", sel.dataset.st), { status: sel.value }); toast(`Status updated: ${sel.value}`); }
    catch { toast("Couldn't update the status. Try again."); }
  }));
  $$("[data-note]", P).forEach((inp) => (inp.onchange = async () => {
    try { await updateDoc(doc(db, "submissions", inp.dataset.note), { notes: inp.value.slice(0, 500) }); toast("Note saved"); }
    catch { toast("Couldn't save the note. Try again."); }
  }));
  $$("[data-del]", P).forEach((b) => (b.onclick = () => { confirmDel = b.dataset.del; renderSubs(P); }));
  $$("[data-delno]", P).forEach((b) => (b.onclick = () => { confirmDel = null; renderSubs(P); }));
  $$("[data-delyes]", P).forEach((b) => (b.onclick = async () => {
    try { await deleteDoc(doc(db, "submissions", b.dataset.delyes)); toast("Submission deleted"); }
    catch { toast("Couldn't delete. Try again."); }
    confirmDel = null; renderSubs(P);
  }));
}

function exportCSV() {
  const rows = filtered();
  if (!rows.length) { toast("Nothing to export with these filters"); return; }
  const head = ["Name", "Phone", "Attending as", "Qualification", "Interested", "Attended", "Rating", "Comments", "Referred friend", "Friend's phone", "Status", "Notes", "Submitted", "Workshop"];
  const cell = (v) => { let s = String(v ?? ""); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
  const lines = [head.map(cell).join(",")].concat(rows.map((s) => [s.name, s.phone, s.role, s.qual, s.interest, s.attended, s.rating, s.comment, s.refName, s.refPhone, s.status, s.notes, fmtTime(s.createdAt), s.workshopId].map(cell).join(",")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `workshop-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Downloaded ${rows.length} ${rows.length === 1 ? "row" : "rows"}`);
}

/* ---------- Feedback ---------- */
function renderFeedback(P) {
  const n = subs.length || 1;
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, c: subs.filter((s) => s.rating === r).length }));
  const withC = subs.filter((s) => s.comment);
  P.innerHTML = `<div class="two">
    <div><h3 style="margin-bottom:14px">Rating distribution</h3><div class="bars">${dist.map((d) => `<div class="bar"><span>${d.r} ★</span><div class="track"><i style="width:${(d.c / n) * 100}%"></i></div><span class="num">${d.c}</span></div>`).join("")}</div></div>
    <div><h3 style="margin-bottom:14px">Comments &amp; suggestions (${withC.length})</h3><div class="list">${withC.map((s) => `<div class="row"><div><strong>${esc(s.name)}</strong><small><span class="starline">${stars(s.rating || 0)}</span> · ${esc(s.role || "")} · ${esc(s.qual)}</small><div style="font-size:14px">${esc(s.comment)}</div></div></div>`).join("") || '<p class="muted">No comments yet.</p>'}</div></div>
  </div>`;
}

/* ---------- Testimonials ---------- */
const T_EMPTY = { name: "", course: "", skills: [], company: "", role: "", pkg: "", story: "", photo: "", video: "", verified: false, consent: false, show: false, order: 99 };

function renderTestimonials(P) {
  const t = editingT;
  P.innerHTML = `
    <div class="toolbar"><strong style="flex:1;color:var(--ink)">Student success stories</strong>${t ? "" : '<button class="btn sm" id="addT">Add testimonial</button>'}</div>
    ${t ? `<form class="editor" id="tForm" novalidate>
      <strong style="color:var(--ink)">${t.id ? "Edit" : "New"} testimonial</strong>
      <div class="editgrid">
        <label class="f">Student name<input type="text" id="tName" value="${esc(t.name)}" maxlength="80"></label>
        <label class="f">Course / program<input type="text" id="tCourse" value="${esc(t.course)}" maxlength="100"></label>
        <label class="f">Company<input type="text" id="tCompany" value="${esc(t.company)}" maxlength="100"></label>
        <label class="f">Job role<input type="text" id="tRole" value="${esc(t.role)}" maxlength="100"></label>
        <label class="f">Package <small>e.g. ₹9.5 LPA (only if verified)</small><input type="text" id="tPkg" value="${esc(t.pkg)}" maxlength="30"></label>
        <label class="f">Skills <small>comma separated</small><input type="text" id="tSkills" value="${esc((t.skills || []).join(", "))}" maxlength="200"></label>
        <label class="f">Photo link <small>optional, https://…</small><input type="url" id="tPhoto" value="${esc(t.photo)}"></label>
        <label class="f">Video link <small>optional, e.g. YouTube</small><input type="url" id="tVideo" value="${esc(t.video)}"></label>
        <label class="f">Display order<input type="number" id="tOrder" value="${esc(t.order ?? 99)}" min="1" max="999"></label>
      </div>
      <label class="f">Quote / story<textarea id="tStory" maxlength="400">${esc(t.story)}</textarea></label>
      <label class="check"><input type="checkbox" id="tConsent"${t.consent ? " checked" : ""}> The student gave written permission to use their name, photo and story.</label>
      <label class="check"><input type="checkbox" id="tVerified"${t.verified ? " checked" : ""}> I checked the offer letter (company, role and package are correct).</label>
      <label class="check"><input type="checkbox" id="tShow"${t.show ? " checked" : ""}> Show this story to students.</label>
      <div class="err" id="tErr" role="alert"></div>
      <div class="acts"><button class="btn sm" type="submit">Save</button><button class="btn ghost sm" type="button" id="tCancel">Cancel</button></div>
    </form>` : ""}
    <div class="list" style="margin-top:12px">${testimonials.map((x) => `<div class="row"><div><strong>${esc(x.name)}</strong> — ${esc(x.role)}${x.company ? ", " + esc(x.company) : ""}
      <small>${esc(x.course)}${x.pkg ? " · " + esc(x.pkg) : ""} · ${x.verified ? "Offer letter verified" : "Not verified"} · ${x.consent ? "Consent given" : "No consent yet"} · ${x.show ? "<b style='color:var(--green)'>Visible to students</b>" : "Hidden"}</small></div>
      <div class="acts"><button class="btn ghost sm" data-te="${x.id}">Edit</button>${confirmDel === x.id
        ? `<span class="confirm">Delete? <button class="btn danger sm" data-tdy="${x.id}">Yes</button><button class="btn ghost sm" data-tdn>No</button></span>`
        : `<button class="btn ghost sm" data-td="${x.id}">Delete</button>`}</div></div>`).join("") || (t ? "" : '<p class="empty">No testimonials yet. Add real student stories. The Success stories tab stays hidden for students until at least one story is visible.</p>')}</div>`;
  if (!t) $("#addT").onclick = () => { editingT = { ...T_EMPTY }; renderTestimonials(P); };
  $$("[data-te]", P).forEach((b) => (b.onclick = () => { editingT = { ...testimonials.find((x) => x.id === b.dataset.te) }; renderTestimonials(P); }));
  $$("[data-td]", P).forEach((b) => (b.onclick = () => { confirmDel = b.dataset.td; renderTestimonials(P); }));
  $$("[data-tdn]", P).forEach((b) => (b.onclick = () => { confirmDel = null; renderTestimonials(P); }));
  $$("[data-tdy]", P).forEach((b) => (b.onclick = async () => { try { await deleteDoc(doc(db, "testimonials", b.dataset.tdy)); toast("Testimonial deleted"); } catch { toast("Couldn't delete. Try again."); } confirmDel = null; }));
  if (t) {
    $("#tCancel").onclick = () => { editingT = null; renderTestimonials(P); };
    $("#tForm").onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: $("#tName").value.trim(), course: $("#tCourse").value.trim(), company: $("#tCompany").value.trim(), role: $("#tRole").value.trim(),
        pkg: $("#tPkg").value.trim(), skills: $("#tSkills").value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8),
        photo: safeUrl($("#tPhoto").value.trim()), video: safeUrl($("#tVideo").value.trim()), story: $("#tStory").value.trim(),
        order: Math.max(1, Math.min(999, parseInt($("#tOrder").value, 10) || 99)),
        consent: $("#tConsent").checked, verified: $("#tVerified").checked, show: $("#tShow").checked
      };
      let m = "";
      if (!data.name || !data.role) m = "Name and job role are required.";
      else if (data.show && !data.consent) m = "You can only show a story after the student gives permission.";
      else if (data.show && data.pkg && !data.verified) m = "A story with a package can only be shown after you verify the offer letter.";
      $("#tErr").textContent = m; if (m) return;
      try {
        if (t.id) await setDoc(doc(db, "testimonials", t.id), data);
        else await addDoc(collection(db, "testimonials"), data);
        toast("Testimonial saved"); editingT = null; renderTestimonials(P);
      } catch { $("#tErr").textContent = "Couldn't save. Check your connection and try again."; }
    };
  }
}

/* ---------- Workshop & programs ---------- */
const P_EMPTY = { org: "JayathiSoft", name: "", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online", syllabus: [], outcomes: "", order: 99 };

function renderContent(P) {
  const w = workshop, p = editingP;
  P.innerHTML = `
    ${!w._saved || !programs.length ? `<div class="notice" style="margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1 1 260px">Students currently see the built-in starting content. Click once to copy it into your database so you can edit it here.</span><button class="btn sm" id="seed">Load starting content</button></div>` : ""}
    <form id="wForm" novalidate style="display:grid;gap:12px">
      <strong style="color:var(--ink)">Workshop details</strong>
      <div class="editgrid">
        <label class="f">Title<input type="text" id="wTitle" value="${esc(w.title)}" maxlength="150"></label>
        <label class="f">Date<input type="text" id="wDate" value="${esc(w.date)}" maxlength="60"></label>
        <label class="f">Time<input type="text" id="wTime" value="${esc(w.time)}" maxlength="60"></label>
        <label class="f">Venue<input type="text" id="wVenue" value="${esc(w.venue)}" maxlength="150"></label>
        <label class="f">Contact phone<input type="text" id="wPhone" value="${esc(w.phone)}" maxlength="20"></label>
        <label class="f">Contact email<input type="text" id="wEmail" value="${esc(w.email)}" maxlength="100"></label>
      </div>
      <label class="f">Topics covered <small>one per line</small><textarea id="wTopics">${esc((w.topics || []).join("\n"))}</textarea></label>
      <label class="f">Companies mentioned <small>comma separated</small><textarea id="wCos" style="min-height:60px">${esc((w.companies || []).join(", "))}</textarea></label>
      <label class="f">Course catalogue link <small>Upload your PDF to Google Drive → Share → General access: "Anyone with the link" → Copy link, and paste it here. Leave empty to use the built-in catalogue.</small>
        <input type="url" id="wCat" value="${esc(w.catalogUrl || "")}" placeholder="https://drive.google.com/file/d/…/view">
      </label>
      ${w.catalogUrl ? `<p style="margin:-4px 0 0;font-size:13px"><a href="${esc(safeUrl(w.catalogUrl))}" target="_blank" rel="noopener">Open current catalogue ↗</a></p>` : ""}
      <div><button class="btn sm" type="submit">Save workshop details</button></div>
    </form>
    <hr style="border:0;border-top:1px solid var(--border);margin:22px 0">
    <div class="toolbar"><strong style="flex:1;color:var(--ink)">Programs (${programs.length})</strong>${p ? "" : '<button class="btn sm" id="addP">Add program</button>'}</div>
    ${p ? `<form class="editor" id="pForm" novalidate>
      <strong style="color:var(--ink)">${p.id ? "Edit" : "New"} program</strong>
      <div class="editgrid">
        <label class="f">Program name<input type="text" id="pName" value="${esc(p.name)}" maxlength="100"></label>
        <label class="f">Offered by<select id="pOrg">${["JayathiSoft", "SanRadiance"].map((o) => `<option${o === p.org ? " selected" : ""}>${o}</option>`).join("")}</select></label>
        <label class="f">Label <small>e.g. Training, VTU registered</small><input type="text" id="pTag" value="${esc(p.tag)}" maxlength="30"></label>
        <label class="f">Duration<input type="text" id="pDur" value="${esc(p.dur)}" maxlength="60"></label>
        <label class="f">Fee<input type="text" id="pFee" value="${esc(p.fee)}" maxlength="40"></label>
        <label class="f">Next batch<input type="text" id="pBatch" value="${esc(p.batch)}" maxlength="80"></label>
        <label class="f">Mode<input type="text" id="pMode" value="${esc(p.mode)}" maxlength="80"></label>
        <label class="f">Display order<input type="number" id="pOrder" value="${esc(p.order ?? 99)}" min="1" max="999"></label>
      </div>
      <label class="f">Syllabus <small>one topic per line</small><textarea id="pSyl">${esc((p.syllabus || []).join("\n"))}</textarea></label>
      <label class="f">Outcome <small>"You'll be able to…"</small><textarea id="pOut" style="min-height:60px" maxlength="300">${esc(p.outcomes)}</textarea></label>
      <div class="err" id="pErr" role="alert"></div>
      <div class="acts"><button class="btn sm" type="submit">Save program</button><button class="btn ghost sm" type="button" id="pCancel">Cancel</button></div>
    </form>` : ""}
    <div class="list" style="margin-top:12px">${programs.map((x) => `<div class="row"><div><small class="org">${esc(x.org)}</small><strong>${esc(x.name)}</strong><small>${esc(x.dur)} · Fee: ${esc(x.fee)} · Next batch: ${esc(x.batch)}</small></div>
      <div class="acts"><button class="btn ghost sm" data-pe="${x.id}">Edit</button>${confirmDel === x.id
        ? `<span class="confirm">Delete? <button class="btn danger sm" data-pdy="${x.id}">Yes</button><button class="btn ghost sm" data-pdn>No</button></span>`
        : `<button class="btn ghost sm" data-pd="${x.id}">Delete</button>`}</div></div>`).join("")}</div>`;

  const seed = $("#seed");
  if (seed) seed.onclick = async () => {
    seed.disabled = true;
    try {
      const b = writeBatch(db);
      if (!w._saved) b.set(doc(db, "settings", "workshop"), DEFAULT_WORKSHOP);
      if (!programs.length) DEFAULT_PROGRAMS.forEach((pr) => b.set(doc(collection(db, "programs")), pr));
      await b.commit();
      workshop._saved = true;
      toast("Starting content loaded. You can edit it now.");
      renderContent(P);
    } catch { toast("Couldn't load content. Try again."); seed.disabled = false; }
  };
  $("#wForm").onsubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...DEFAULT_WORKSHOP,
      title: $("#wTitle").value.trim(), date: $("#wDate").value.trim(), time: $("#wTime").value.trim(), venue: $("#wVenue").value.trim(),
      phone: $("#wPhone").value.trim(), email: $("#wEmail").value.trim(),
      topics: $("#wTopics").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 12),
      companies: $("#wCos").value.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 40),
      catalogUrl: safeUrl($("#wCat").value.trim())
    };
    if ($("#wCat").value.trim() && !data.catalogUrl) { toast("The catalogue link must start with https://"); return; }
    const { _saved, ...rest } = { ...workshop, ...data };
    try { await setDoc(doc(db, "settings", "workshop"), rest); toast("Saved. Students now see the updated details."); }
    catch { toast("Couldn't save. Try again."); }
  };
  if (!p) $("#addP").onclick = () => { editingP = { ...P_EMPTY, order: programs.length + 1 }; renderContent(P); };
  $$("[data-pe]", P).forEach((b) => (b.onclick = () => { editingP = { ...programs.find((x) => x.id === b.dataset.pe) }; renderContent(P); }));
  $$("[data-pd]", P).forEach((b) => (b.onclick = () => { confirmDel = b.dataset.pd; renderContent(P); }));
  $$("[data-pdn]", P).forEach((b) => (b.onclick = () => { confirmDel = null; renderContent(P); }));
  $$("[data-pdy]", P).forEach((b) => (b.onclick = async () => { try { await deleteDoc(doc(db, "programs", b.dataset.pdy)); toast("Program deleted"); } catch { toast("Couldn't delete. Try again."); } confirmDel = null; }));
  if (p) {
    $("#pCancel").onclick = () => { editingP = null; renderContent(P); };
    $("#pForm").onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        name: $("#pName").value.trim(), org: $("#pOrg").value, tag: $("#pTag").value.trim(), dur: $("#pDur").value.trim(), fee: $("#pFee").value.trim(),
        batch: $("#pBatch").value.trim(), mode: $("#pMode").value.trim(), outcomes: $("#pOut").value.trim(),
        syllabus: $("#pSyl").value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 15),
        order: Math.max(1, Math.min(999, parseInt($("#pOrder").value, 10) || 99))
      };
      if (!data.name) { $("#pErr").textContent = "Program name is required."; return; }
      try {
        if (p.id) await setDoc(doc(db, "programs", p.id), data);
        else await addDoc(collection(db, "programs"), data);
        toast("Program saved"); editingP = null; renderContent(P);
      } catch { $("#pErr").textContent = "Couldn't save. Check your connection and try again."; }
    };
  }
}
