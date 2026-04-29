const data = {
  subjects: {
    "Signals & Systems": [
      { topic: "Fourier Series", questions: [
        { id: "ss1", text: "Find fundamental frequency of x(t)=cos(4πt)+sin(6πt)", difficulty: 1, concept: "periodicity" },
        { id: "ss2", text: "Compute FS coefficients for a 50% duty square wave.", difficulty: 2, concept: "fs_coeff" },
        { id: "ss3", text: "Given spectrum sketch, reconstruct x(t) and justify symmetry.", difficulty: 4, concept: "spectrum_recon" }
      ] }
    ],
    "Network Theory": [
      { topic: "Transient Analysis", questions: [
        { id: "nt1", text: "Find i(t) in an RC charging circuit with initial voltage.", difficulty: 1, concept: "rc_transient" },
        { id: "nt2", text: "RLC step response: identify damping and peak time.", difficulty: 3, concept: "rlc_response" },
        { id: "nt3", text: "PYQ-style: compute energy delivered in first 2τ.", difficulty: 3, concept: "energy_calc" }
      ] }
    ],
    "Analog Electronics": [
      { topic: "BJT Biasing", questions: [
        { id: "ae1", text: "Determine Q-point for voltage-divider bias BJT.", difficulty: 1, concept: "q_point" },
        { id: "ae2", text: "Find stability factor S for given circuit values.", difficulty: 2, concept: "stability" },
        { id: "ae3", text: "Design resistor values for target IC and VCE under β-variation.", difficulty: 4, concept: "design_bias" }
      ] }
    ]
  }
};

const state = { user: null, mode: 'learn', sort: 'mastery', subject: null, topic: null, solved: [], todaySolved: 0 };
const el = id => document.getElementById(id);

function login(user) {
  state.user = user;
  const saved = JSON.parse(localStorage.getItem(`gateprep_${user}`) || '{}');
  Object.assign(state, saved);
  el('auth-screen').classList.add('hidden');
  el('app-screen').classList.remove('hidden');
  el('user-label').textContent = user;
  renderSubjects();
  updateStats();
}

function getAllQuestions() {
  const out = [];
  Object.entries(data.subjects).forEach(([subject, topics]) => topics.forEach(t => t.questions.forEach(q => out.push({ ...q, subject, topic: t.topic }))));
  return out;
}

function questionOrder() {
  let list = getAllQuestions().filter(q => !state.solved.includes(q.id));
  if (state.subject) list = list.filter(q => q.subject === state.subject);
  if (state.topic) list = list.filter(q => q.topic === state.topic);

  if (state.mode === 'practice') {
    const solvedConcepts = new Set(getAllQuestions().filter(q => state.solved.includes(q.id)).map(q => q.concept));
    list.sort((a, b) => a.difficulty - b.difficulty);
    list = list.filter(q => solvedConcepts.has(q.concept) || q.text.includes('PYQ'));
  } else {
    list.sort((a, b) => a.difficulty - b.difficulty || a.text.length - b.text.length);
  }

  if (state.sort === 'recent') list.reverse();
  if (state.sort === 'difficulty') list.sort((a, b) => a.difficulty - b.difficulty);
  return list;
}

function renderSubjects() {
  el('subject-list').innerHTML = Object.keys(data.subjects).map(s => `<li class="${state.subject===s?'active':''}" data-subject="${s}">${s}</li>`).join('');
  bindSubjectClicks();
  renderTopics();
  renderQuestion();
}

function renderTopics() {
  const topics = state.subject ? data.subjects[state.subject].map(t => t.topic) : [];
  el('topic-list').innerHTML = topics.map(t => `<li class="${state.topic===t?'active':''}" data-topic="${t}">${t}</li>`).join('');
  document.querySelectorAll('[data-topic]').forEach(li => li.onclick = () => { state.topic = li.dataset.topic; renderSubjects(); save(); });
}

function renderQuestion() {
  const q = questionOrder()[0];
  if (!q) { el('question-text').textContent = 'No pending questions in this filter. Switch mode/topic.'; return; }
  state.current = q;
  el('question-subject').textContent = q.subject;
  el('question-topic').textContent = q.topic;
  el('question-difficulty').textContent = `Difficulty ${q.difficulty}`;
  el('question-text').textContent = q.text;
  const search = encodeURIComponent(`${q.text} GATE EC`);
  el('google-link').href = `https://www.google.com/search?q=${search}`;
  el('yt-frame').src = `https://www.youtube.com/embed?listType=search&list=${search}`;
}

function bindSubjectClicks() {
  document.querySelectorAll('[data-subject]').forEach(li => li.onclick = () => { state.subject = li.dataset.subject; state.topic = null; renderSubjects(); save(); });
}

function updateStats() {
  const total = getAllQuestions().length;
  el('progress-text').textContent = `${state.solved.length} / ${total} solved`;
  el('today-count').textContent = `${state.todaySolved || 0} questions`;
  const streak = (state.todaySolved || 0) >= 10 ? 1 : 0;
  el('streak-text').textContent = `${streak} days`;
}

function save() {
  if (!state.user) return;
  localStorage.setItem(`gateprep_${state.user}`, JSON.stringify({
    mode: state.mode, sort: state.sort, subject: state.subject, topic: state.topic,
    solved: state.solved, todaySolved: state.todaySolved
  }));
}

el('google-login').onclick = () => {
  const mock = prompt('Demo mode: enter your Google email');
  if (mock) login(mock);
};
el('email-form').onsubmit = (e) => {
  e.preventDefault();
  login(el('email-input').value.trim());
};
el('learn-mode').onclick = () => { state.mode='learn'; el('learn-mode').classList.add('active'); el('practice-mode').classList.remove('active'); renderQuestion(); save(); };
el('practice-mode').onclick = () => { state.mode='practice'; el('practice-mode').classList.add('active'); el('learn-mode').classList.remove('active'); renderQuestion(); save(); };
el('sort-select').onchange = (e) => { state.sort=e.target.value; renderQuestion(); save(); };
el('refer-btn').onclick = () => el('split-container').classList.add('refer-open');
el('back-question').onclick = () => el('split-container').classList.remove('refer-open');
el('solved-btn').onclick = () => {
  if (state.current && !state.solved.includes(state.current.id)) { state.solved.push(state.current.id); state.todaySolved=(state.todaySolved||0)+1; }
  updateStats(); renderQuestion(); save();
};
el('next-btn').onclick = renderQuestion;
