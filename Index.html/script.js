// ===== helpers =====
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

function splitLines(str=''){
  return str.split(/\r?\n/).map(s => s.replace(/^\s*-\s?/, '').trim()).filter(Boolean);
}
function esc(s=''){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

// ===== dynamic add buttons =====
$('#add-exp').addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'exp item';
  div.innerHTML = `
    <label>Company <input type="text" class="exp-company" /></label>
    <label>Role <input type="text" class="exp-role" /></label>
    <label>Dates <input type="text" class="exp-dates" placeholder="Jan 2024 – Present" /></label>
    <label>Achievements (one per line)
      <textarea class="exp-bullets" rows="3"></textarea>
    </label>`;
  $('#exp-group').insertBefore(div, $('#add-exp'));
});

$('#add-edu').addEventListener('click', () => {
  const div = document.createElement('div');
  div.className = 'edu item';
  div.innerHTML = `
    <label>School <input type="text" class="edu-school" /></label>
    <label>Degree <input type="text" class="edu-degree" /></label>
    <label>Dates <input type="text" class="edu-dates" /></label>
    <label>Notes <textarea class="edu-notes" rows="2"></textarea></label>`;
  $('#edu-group').insertBefore(div, $('#add-edu'));
});

// ===== generate preview =====
function buildPreview(){
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const phone = $('#phone').value.trim();
  const website = $('#website').value.trim();
  const summary = $('#summary').value.trim();
  const Certifications = $('#Certifications').value.trim();
  const skills = $('#skills').value.split(',').map(s=>s.trim()).filter(Boolean);

  const exp = $$('.exp').map(div => ({
    company: $('.exp-company', div)?.value.trim() || '',
    role: $('.exp-role', div)?.value.trim() || '',
    dates: $('.exp-dates', div)?.value.trim() || '',
    bullets: splitLines($('.exp-bullets', div)?.value || '')
  })).filter(x => x.company || x.role || x.dates || x.bullets.length);

  const edu = $$('.edu').map(div => ({
    school: $('.edu-school', div)?.value.trim() || '',
    degree: $('.edu-degree', div)?.value.trim() || '',
    dates: $('.edu-dates', div)?.value.trim() || '',
    notes: $('.edu-notes', div)?.value.trim() || ''
  })).filter(x => x.school || x.degree || x.dates || x.notes);

  // header
  let html = `
    <div class="resume-name">${esc(name || 'Your Name')}</div>
    <div class="resume-meta">
      ${esc(email)}${email && (phone || website) ? ' · ' : ''}
      ${esc(phone)}${(phone && website) ? ' · ' : ''}${website ? `<a href="${esc(website)}" target="_blank">${esc(website)}</a>` : ''}
    </div>`;

  if (summary){
    html += `
      <div class="resume-section">
        <h3>Summary</h3>
        <div>${esc(summary)}</div>
      </div>`;
  }

  if (skills.length){
    html += `
      <div class="resume-section">
        <h3>Skills</h3>
        <div>${skills.map(esc).join(' · ')}</div>
      </div>`;
  }

  if (exp.length){
    html += `<div class="resume-section"><h3>Experience</h3>`;
    exp.forEach(e => {
      html += `
        <div><strong>${esc(e.role || '')}</strong>${e.role && e.company ? ' — ' : ''}${esc(e.company || '')}
        ${e.dates ? ` <span class="resume-meta">(${esc(e.dates)})</span>` : ''}</div>
        ${e.bullets.length ? `<ul class="resume-ul">${e.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>` : ''}`;
    });
    html += `</div>`;
  }

  if (edu.length){
    html += `<div class="resume-section"><h3>Education</h3>`;
    edu.forEach(d => {
      html += `
        <div><strong>${esc(d.degree || '')}</strong>${d.degree && d.school ? ', ' : ''}${esc(d.school || '')}
        ${d.dates ? ` <span class="resume-meta">(${esc(d.dates)})</span>` : ''}</div>
        ${d.notes ? `<div>${esc(d.notes)}</div>` : ''}`;
    });
    html += `</div>`;
  }

  $('#preview').innerHTML = html;
}

// ===== submit => build preview + save =====
$('#resume-form').addEventListener('submit', e => {
  e.preventDefault();
  buildPreview();
  saveData();
});

// live update while typing (nice UX)
$('#resume-form').addEventListener('input', () => {
  buildPreview();
  saveData();
});

// ===== print & clear =====
$('#print').addEventListener('click', () => window.print());
$('#clear').addEventListener('click', () => {
  if (!confirm('Clear all data?')) return;
  localStorage.removeItem('resumeData');
  location.reload();
});

// ===== persistence =====
function saveData(){
  const data = {
    name: $('#name').value, email: $('#email').value, phone: $('#phone').value,
    website: $('#website').value, summary: $('#summary').value, skills: $('#skills').value,
    exp: $$('.exp').map(div => ({
      company: $('.exp-company', div)?.value || '',
      role: $('.exp-role', div)?.value || '',
      dates: $('.exp-dates', div)?.value || '',
      bullets: $('.exp-bullets', div)?.value || ''
    })),
    edu: $$('.edu').map(div => ({
      school: $('.edu-school', div)?.value || '',
      degree: $('.edu-degree', div)?.value || '',
      dates: $('.edu-dates', div)?.value || '',
      notes: $('.edu-notes', div)?.value || ''
    }))
  };
  localStorage.setItem('resumeData', JSON.stringify(data));
}

function loadData(){
  const raw = localStorage.getItem('resumeData'); if (!raw) return;
  try{
    const d = JSON.parse(raw);
    $('#name').value = d.name || ''; $('#email').value = d.email || '';
    $('#phone').value = d.phone || ''; $('#website').value = d.website || '';
    $('#summary').value = d.summary || ''; $('#skills').value = d.skills || '';

    // rebuild edu/exp lists to match saved length
    const addItems = (want, sel, addBtnId) => {
      const current = $$(sel).length;
      for (let i=current; i<want; i++) $(addBtnId).click();
    };
    addItems((d.exp||[]).length || 1, '.exp', '#add-exp');
    addItems((d.edu||[]).length || 1, '.edu', '#add-edu');

    // fill
    (d.exp||[]).forEach((e, i) => {
      const div = $$('.exp')[i];
      $('.exp-company', div).value = e.company || '';
      $('.exp-role', div).value = e.role || '';
      $('.exp-dates', div).value = e.dates || '';
      $('.exp-bullets', div).value = e.bullets || '';
    });
    (d.edu||[]).forEach((x, i) => {
      const div = $$('.edu')[i];
      $('.edu-school', div).value = x.school || '';
      $('.edu-degree', div).value = x.degree || '';
      $('.edu-dates', div).value = x.dates || '';
      $('.edu-notes', div).value = x.notes || '';
    });

    buildPreview();
  }catch(e){}
}
document.addEventListener('DOMContentLoaded', loadData);
