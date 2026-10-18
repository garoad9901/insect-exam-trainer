const STORAGE_KEY = 'insect-exam-trainer-v1';
const level = window.INSECT_LEVELS.beginner;

const screens = {
  home: document.getElementById('homeScreen'),
  quiz: document.getElementById('quizScreen'),
  result: document.getElementById('resultScreen'),
};

const ui = {
  brandButton: document.getElementById('brandButton'),
  startButton: document.getElementById('startButton'),
  reviewButton: document.getElementById('reviewButton'),
  reviewCount: document.getElementById('reviewCount'),
  resetButton: document.getElementById('resetButton'),
  statsDialog: document.getElementById('statsDialog'),
  closeDialog: document.getElementById('closeDialog'),
  clearProgressButton: document.getElementById('clearProgressButton'),
  quitButton: document.getElementById('quitButton'),
  questionNumber: document.getElementById('questionNumber'),
  questionText: document.getElementById('questionText'),
  questionFigure: document.getElementById('questionFigure'),
  questionImage: document.getElementById('questionImage'),
  answerImage: document.getElementById('answerImage'),
  answerText: document.getElementById('answerText'),
  choiceGrid: document.getElementById('choiceGrid'),
  answerPanel: document.getElementById('answerPanel'),
  answerResult: document.getElementById('answerResult'),
  nextButton: document.getElementById('nextButton'),
  progressText: document.getElementById('progressText'),
  progressBar: document.getElementById('progressBar'),
  scoreText: document.getElementById('scoreText'),
  resultScore: document.getElementById('resultScore'),
  resultPercent: document.getElementById('resultPercent'),
  resultMessage: document.getElementById('resultMessage'),
  retryButton: document.getElementById('retryButton'),
  homeButton: document.getElementById('homeButton'),
};

let stats = loadStats();
let session = null;
let lastConfig = null;

function defaultStats() {
  return { attempts: 0, correct: 0, mastered: [], wrong: [] };
}

function loadStats() {
  try {
    return { ...defaultStats(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return defaultStats();
  }
}

function saveStats() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  renderStats();
}

function renderStats() {
  const accuracy = stats.attempts ? `${Math.round((stats.correct / stats.attempts) * 100)}%` : '—';
  document.getElementById('attemptStat').textContent = stats.attempts;
  document.getElementById('accuracyStat').textContent = accuracy;
  document.getElementById('masteredStat').textContent = stats.mastered.length;
  document.getElementById('dialogAttempts').textContent = stats.attempts;
  document.getElementById('dialogAccuracy').textContent = accuracy;
  document.getElementById('dialogWrong').textContent = stats.wrong.length;
  ui.reviewCount.textContent = `${stats.wrong.length}問`;
  ui.reviewButton.disabled = stats.wrong.length === 0;
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, element]) => element.classList.toggle('active', key === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function renderRuby(text) {
  return text.replace(/([一-龯々]+)（([ぁ-ゖー]+)）/g, '<ruby>$1<rt>$2</rt></ruby>');
}

function plainText(text) {
  return text.replace(/（[ぁ-ゖー]+）/g, '');
}

function selectedValue(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function startPractice(config = null) {
  const chosen = config || {
    mode: 'normal',
    count: selectedValue('count'),
    order: selectedValue('order'),
  };

  let pool = chosen.mode === 'review'
    ? level.questions.filter((question) => stats.wrong.includes(question.id))
    : [...level.questions];

  if (chosen.order === 'random' || chosen.mode === 'review') pool = shuffle(pool);
  const limit = chosen.mode === 'review' || chosen.count === 'all' ? pool.length : Number(chosen.count);
  const questions = pool.slice(0, limit);
  if (!questions.length) return;

  lastConfig = chosen;
  session = { questions, index: 0, correct: 0, answered: false, responses: [] };
  showScreen('quiz');
  renderQuestion();
}

function renderQuestion() {
  const question = session.questions[session.index];
  const position = session.index + 1;
  ui.questionNumber.textContent = `初級 第${question.id}問`;
  ui.questionText.innerHTML = renderRuby(question.prompt);
  if (question.questionFigure) {
    ui.questionFigure.hidden = false;
    ui.questionImage.src = question.questionFigure;
    ui.questionImage.alt = `初級 第${question.id}問の写真・イラスト`;
  } else {
    ui.questionFigure.hidden = true;
    ui.questionImage.src = '';
    ui.questionImage.alt = '';
  }
  ui.answerImage.src = '';
  ui.answerImage.alt = '';
  ui.answerPanel.hidden = true;
  ui.progressText.textContent = `${position} / ${session.questions.length}`;
  ui.scoreText.textContent = `正解 ${session.correct}`;
  ui.progressBar.style.width = `${((position - 1) / session.questions.length) * 100}%`;
  ui.choiceGrid.querySelectorAll('button').forEach((button, index) => {
    button.querySelector('span').innerHTML = renderRuby(question.choices[index]);
    button.setAttribute('aria-label', `${index + 1}、${plainText(question.choices[index])}`);
    button.disabled = false;
    button.classList.remove('correct', 'wrong', 'muted');
  });
  session.answered = false;
}

function answerQuestion(choice) {
  if (!session || session.answered) return;
  session.answered = true;
  const question = session.questions[session.index];
  const isCorrect = choice === question.answer;
  if (isCorrect) session.correct += 1;
  session.responses.push({ id: question.id, choice, correct: isCorrect });

  stats.attempts += 1;
  if (isCorrect) {
    stats.correct += 1;
    if (!stats.mastered.includes(question.id)) stats.mastered.push(question.id);
    stats.wrong = stats.wrong.filter((id) => id !== question.id);
  } else if (!stats.wrong.includes(question.id)) {
    stats.wrong.push(question.id);
  }
  stats.mastered.sort((a, b) => a - b);
  stats.wrong.sort((a, b) => a - b);
  saveStats();

  ui.choiceGrid.querySelectorAll('button').forEach((button) => {
    const value = Number(button.dataset.choice);
    button.disabled = true;
    if (value === question.answer) button.classList.add('correct');
    else if (value === choice) button.classList.add('wrong');
    else button.classList.add('muted');
  });

  ui.answerResult.className = `answer-result ${isCorrect ? 'success' : 'failure'}`;
  const correctChoice = question.choices[question.answer - 1];
  const selectedChoice = question.choices[choice - 1];
  ui.answerResult.innerHTML = isCorrect
    ? `<strong>正解です</strong><span>${renderRuby(correctChoice)}</span>`
    : `<strong>おしい！</strong><span>選んだ答え：${renderRuby(selectedChoice)}</span>`;
  ui.answerText.innerHTML = `<strong>${question.answer}</strong><span>${renderRuby(correctChoice)}</span>`;
  ui.answerImage.src = question.answerFigure;
  ui.answerImage.alt = `初級 第${question.id}問の解答ページにある写真・イラスト`;
  ui.nextButton.textContent = session.index === session.questions.length - 1 ? '結果を見る' : '次の問題へ';
  ui.answerPanel.hidden = false;
  ui.scoreText.textContent = `正解 ${session.correct}`;
  ui.progressBar.style.width = `${((session.index + 1) / session.questions.length) * 100}%`;
  setTimeout(() => ui.answerPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
}

function nextQuestion() {
  if (!session?.answered) return;
  if (session.index >= session.questions.length - 1) return showResult();
  session.index += 1;
  renderQuestion();
}

function showResult() {
  const total = session.questions.length;
  const percent = Math.round((session.correct / total) * 100);
  ui.resultScore.textContent = `${session.correct} / ${total}`;
  ui.resultPercent.textContent = `${percent}%`;
  ui.resultMessage.textContent = percent >= 90
    ? 'すばらしい成績です。初級の知識がしっかり身についています。'
    : percent >= 70
      ? 'あと少しです。間違えた問題を復習すると、さらに安定します。'
      : '写真つきの解説を見ながら、少しずつ覚えていきましょう。';
  showScreen('result');
}

ui.startButton.addEventListener('click', () => startPractice());
ui.reviewButton.addEventListener('click', () => startPractice({ mode: 'review', count: 'all', order: 'random' }));
ui.retryButton.addEventListener('click', () => startPractice(lastConfig));
ui.nextButton.addEventListener('click', nextQuestion);
ui.homeButton.addEventListener('click', () => showScreen('home'));
ui.brandButton.addEventListener('click', () => showScreen('home'));
ui.quitButton.addEventListener('click', () => showScreen('home'));
ui.choiceGrid.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-choice]');
  if (button) answerQuestion(Number(button.dataset.choice));
});

ui.resetButton.addEventListener('click', () => ui.statsDialog.showModal());
ui.closeDialog.addEventListener('click', () => ui.statsDialog.close());
ui.clearProgressButton.addEventListener('click', () => {
  if (!confirm('学習記録をすべてリセットしますか？')) return;
  stats = defaultStats();
  saveStats();
  ui.statsDialog.close();
});

document.addEventListener('keydown', (event) => {
  if (!screens.quiz.classList.contains('active')) return;
  if (['1', '2', '3', '4'].includes(event.key) && !session.answered) answerQuestion(Number(event.key));
  if (event.key === 'Enter' && session.answered) nextQuestion();
  if (event.key === 'Escape') showScreen('home');
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

renderStats();
