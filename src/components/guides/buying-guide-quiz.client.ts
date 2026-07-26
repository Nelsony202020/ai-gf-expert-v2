import {
  BUYING_GUIDE_QUIZ_STORAGE_KEY,
  buyingGuideQuizQuestions,
  buyingGuideQuizResults,
  previewQuizMatch,
  scoreBuyingGuideQuiz,
  type QuizAnswerId,
  type QuizUserType,
} from '../../data/buying-guide-quiz';

const MATCH_LABELS: Record<QuizUserType, string> = {
  'chat-first': 'Chat-first',
  'media-first': 'Media-first',
  balanced: 'Balanced',
};

function persistResult(type: QuizUserType) {
  try {
    sessionStorage.setItem(
      BUYING_GUIDE_QUIZ_STORAGE_KEY,
      JSON.stringify({ type, savedAt: Date.now() }),
    );
  } catch {
    /* ignore storage errors */
  }
}

function renderLikelyMatch(root: HTMLElement, answers: QuizAnswerId[]) {
  const preview = root.querySelector('[data-quiz-match-preview]');
  if (!(preview instanceof HTMLElement)) return;
  const type = previewQuizMatch(answers);
  preview.textContent = MATCH_LABELS[type];
  preview.dataset.matchType = type;
}

function renderQuestion(root: HTMLElement, step: number, answers: QuizAnswerId[]) {
  const question = buyingGuideQuizQuestions[step];
  if (!question) return;

  const progress = root.querySelector('[data-quiz-progress]');
  const progressDots = root.querySelector('[data-quiz-progress-dots]');
  const questionEl = root.querySelector('[data-quiz-question]');
  const answersEl = root.querySelector('[data-quiz-answers]');
  const backBtn = root.querySelector('[data-quiz-back]') as HTMLButtonElement | null;
  const nextBtn = root.querySelector('[data-quiz-next]') as HTMLButtonElement | null;

  if (progress) progress.textContent = `Question ${step + 1} of ${buyingGuideQuizQuestions.length}`;
  if (progressDots) {
    progressDots.innerHTML = buyingGuideQuizQuestions
      .map((_, index) => {
        const state = index < step ? 'is-done' : index === step ? 'is-active' : '';
        return `<span class="buying-guide-quiz__dot ${state}"></span>`;
      })
      .join('');
  }
  if (questionEl) {
    questionEl.innerHTML = `
      <span class="buying-guide-quiz__question-icon material-symbols-outlined" aria-hidden="true">${question.icon}</span>
      <span>${question.question}</span>
    `;
  }
  if (answersEl) {
    answersEl.innerHTML = question.answers
      .map((answer) => {
        const selected = answers[step] === answer.id;
        return `
          <button
            type="button"
            class="buying-guide-quiz__answer${selected ? ' is-selected' : ''}"
            data-quiz-answer="${answer.id}"
            aria-pressed="${selected ? 'true' : 'false'}"
          >
            <span class="buying-guide-quiz__answer-label">${answer.label}</span>
            <span class="buying-guide-quiz__answer-check material-symbols-outlined" aria-hidden="true">${selected ? 'check_circle' : 'radio_button_unchecked'}</span>
          </button>
        `;
      })
      .join('');
  }

  if (backBtn) backBtn.disabled = step === 0;
  if (nextBtn) {
    nextBtn.disabled = !answers[step];
    nextBtn.textContent = step === buyingGuideQuizQuestions.length - 1 ? 'See result' : 'Continue';
  }

  renderLikelyMatch(root, answers);
}

function renderResultList(items: string[]) {
  return items
    .map(
      (item) => `
        <li>
          <span class="material-symbols-outlined" aria-hidden="true">check</span>
          <span>${item}</span>
        </li>
      `,
    )
    .join('');
}

function renderResult(root: HTMLElement, type: QuizUserType) {
  const result = buyingGuideQuizResults[type];
  const quizPanel = root.querySelector('[data-quiz-panel]');
  const resultPanel = root.querySelector('[data-quiz-result]');
  const header = root.querySelector('.buying-guide-quiz__header');
  const shellPrivacy = root.querySelector('[data-quiz-shell-privacy]');
  if (!(quizPanel instanceof HTMLElement) || !(resultPanel instanceof HTMLElement)) return;

  quizPanel.hidden = true;
  if (header instanceof HTMLElement) header.hidden = true;
  if (shellPrivacy instanceof HTMLElement) shellPrivacy.hidden = true;
  root.classList.add('is-result');
  resultPanel.hidden = false;

  resultPanel.innerHTML = `
    <div class="buying-guide-quiz__result-head">
      <p class="buying-guide-quiz__result-badge">
        <span class="material-symbols-outlined" aria-hidden="true">auto_awesome</span>
        ${result.eyebrow}
      </p>
      <h4 class="buying-guide-quiz__result-title">${result.title}</h4>
      <p class="buying-guide-quiz__result-summary">${result.summary}</p>
    </div>

    <hr class="buying-guide-quiz__result-divider" />

    <div class="buying-guide-quiz__result-columns">
      <div class="buying-guide-quiz__result-column">
        <p class="buying-guide-quiz__result-label">Prioritize</p>
        <ul class="buying-guide-quiz__result-list">
          ${renderResultList(result.prioritize)}
        </ul>
      </div>
      <div class="buying-guide-quiz__result-column">
        <p class="buying-guide-quiz__result-label">${result.secondaryTitle}</p>
        <ul class="buying-guide-quiz__result-list">
          ${renderResultList(result.secondaryItems)}
        </ul>
      </div>
    </div>

    <div class="buying-guide-quiz__result-actions">
      <a class="buying-guide-quiz__result-cta" href="${result.ctaHref}">${result.ctaLabel} →</a>
      <p class="buying-guide-quiz__result-info">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        This result can pre-filter the app directory.
      </p>
    </div>

    <hr class="buying-guide-quiz__result-divider" />

    <footer class="buying-guide-quiz__result-footer">
      <button type="button" class="buying-guide-quiz__retake" data-quiz-retake>Retake test</button>
      <p class="buying-guide-quiz__result-privacy">
        <span class="material-symbols-outlined" aria-hidden="true">lock</span>
        Your answers are private and not stored.
      </p>
    </footer>
  `;

  persistResult(type);
}

function resetQuiz(root: HTMLElement) {
  const quizPanel = root.querySelector('[data-quiz-panel]');
  const resultPanel = root.querySelector('[data-quiz-result]');
  const header = root.querySelector('.buying-guide-quiz__header');
  const shellPrivacy = root.querySelector('[data-quiz-shell-privacy]');
  if (quizPanel instanceof HTMLElement) quizPanel.hidden = false;
  if (header instanceof HTMLElement) header.hidden = false;
  if (shellPrivacy instanceof HTMLElement) shellPrivacy.hidden = false;
  root.classList.remove('is-result');
  if (resultPanel instanceof HTMLElement) {
    resultPanel.hidden = true;
    resultPanel.innerHTML = '';
  }
}

export function initBuyingGuideQuiz() {
  document.querySelectorAll<HTMLElement>('[data-buying-guide-quiz]').forEach((root) => {
    if (root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';

    let step = 0;
    const answers: QuizAnswerId[] = [];

    renderQuestion(root, step, answers);

    root.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const answerBtn = target.closest<HTMLButtonElement>('[data-quiz-answer]');
      if (answerBtn) {
        const value = answerBtn.dataset.quizAnswer as QuizAnswerId | undefined;
        if (!value) return;
        answers[step] = value;
        renderQuestion(root, step, answers);
        return;
      }

      if (target.closest('[data-quiz-back]')) {
        if (step > 0) {
          step -= 1;
          renderQuestion(root, step, answers);
        }
        return;
      }

      if (target.closest('[data-quiz-next]')) {
        if (!answers[step]) return;
        if (step < buyingGuideQuizQuestions.length - 1) {
          step += 1;
          renderQuestion(root, step, answers);
          return;
        }
        const resultType = scoreBuyingGuideQuiz(answers);
        renderResult(root, resultType);
        return;
      }

      if (target.closest('[data-quiz-retake]')) {
        step = 0;
        answers.length = 0;
        resetQuiz(root);
        renderQuestion(root, step, answers);
      }
    });
  });
}

initBuyingGuideQuiz();
document.addEventListener('astro:page-load', initBuyingGuideQuiz);
