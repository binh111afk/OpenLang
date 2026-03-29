import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import { PronounceButton } from './PronounceButton';

const MINI_QUIZ_BATCH_SIZE = 5;

function normalizeText(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function shuffleArray(list) {
  const cloned = [...list];
  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }
  return cloned;
}

function KbdHint({ children }) {
  return (
    <kbd className="hidden sm:inline-flex items-center rounded-md border border-white/35 bg-white/25 px-2 py-0.5 font-mono text-[11px] leading-none text-white/90 backdrop-blur-sm">
      {children}
    </kbd>
  );
}

function launchConfetti() {
  confetti({
    particleCount: 140,
    spread: 84,
    startVelocity: 38,
    origin: { y: 0.82 },
    colors: ['#22C55E', '#4ADE80', '#86EFAC', '#A7F3D0'],
  });
}

function createQuestion(wordItem, pool) {
  const quizKinds = ['multiple_choice', 'typing_vi', 'typing_en'];
  const mode = quizKinds[Math.floor(Math.random() * quizKinds.length)];

  if (mode === 'multiple_choice') {
    const distractors = shuffleArray(
      pool.filter((item) => item.word !== wordItem.word),
    )
      .slice(0, 3)
      .map((item) => item.details.definition_vi);

    return {
      id: `${wordItem.word}-mc`,
      mode,
      prompt: wordItem.word,
      answer: wordItem.details.definition_vi,
      options: shuffleArray([wordItem.details.definition_vi, ...distractors]),
    };
  }

  if (mode === 'typing_vi') {
    return {
      id: `${wordItem.word}-typing-vi`,
      mode,
      prompt: wordItem.word,
      answer: wordItem.details.definition_vi,
    };
  }

  return {
    id: `${wordItem.word}-typing-en`,
    mode,
    prompt: wordItem.details.definition_vi,
    answer: wordItem.word,
  };
}

function buildQuizQuestions(words, pool) {
  return shuffleArray(words).map((item) => createQuestion(item, pool));
}

function BottomFeedbackBar({ feedback, onContinue }) {
  if (!feedback) {
    return null;
  }

  return (
    <motion.div
      initial={{ y: 96, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 96, opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`flex w-full items-center justify-between gap-4 rounded-[1.75rem] border px-4 py-4 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.32)] backdrop-blur-xl sm:px-6 ${
        feedback.correct
          ? 'border-emerald-200 bg-[#DCFCE7] text-emerald-900'
          : 'border-rose-200 bg-[#FEE2E2] text-rose-900'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 flex-none items-center justify-center rounded-full text-xl font-black text-white ${
            feedback.correct ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {feedback.correct ? '✓' : '×'}
        </div>
        <div className="space-y-1">
          <p className="text-xl font-black">
            {feedback.correct ? 'Chính xác!' : 'Chưa chính xác'}
          </p>
          <p className="text-sm font-medium sm:text-base">
            {feedback.correct
              ? 'Tuyệt vời, bạn làm đúng rồi.'
              : `Đáp án đúng: ${feedback.correctAnswer}`}
          </p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className={`flex h-12 flex-none items-center justify-center rounded-2xl px-6 text-sm font-extrabold text-white transition hover:brightness-110 sm:h-14 sm:px-8 sm:text-base ${
          feedback.correct ? 'bg-emerald-600' : 'bg-rose-600'
        }`}
      >
        Tiếp Tục
      </button>
    </motion.div>
  );
}

function StudyCard({ item, currentNumber, total }) {
  const imageUrl = item.details?.image_url || item.details?.image_large_url || null;
  const hasImage = Boolean(imageUrl);

  return (
    <motion.div
      key={`study-${item.word}-${currentNumber}`}
      initial={{ opacity: 0, x: 28, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -28, scale: 0.985 }}
      transition={{ duration: 0.34, ease: [0.2, 0.8, 0.2, 1] }}
      className="w-full min-h-[58vh] overflow-hidden rounded-3xl border border-purple-200/80 bg-white/95 shadow-[0_26px_72px_-42px_rgba(88,28,135,0.45)] dark:border-purple-800 dark:bg-gray-900/95 sm:min-h-[62vh] lg:min-h-[66vh]"
    >
      {hasImage ? (
        <div className="flex h-full min-h-[inherit] flex-col gap-6 p-6 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="lg:w-[45%] lg:flex-none">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-purple-200/70 shadow-sm dark:bg-slate-900 dark:ring-purple-800/80">
              <img
                src={imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full scale-125 object-cover opacity-50 blur-xl"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-white/18 dark:bg-gray-900/18" />
              <div className="relative z-[1] flex h-full w-full items-center justify-center p-4 sm:p-5">
                <img
                  src={imageUrl}
                  alt={item.word}
                  className="h-full w-full rounded-[20px] object-contain shadow-sm"
                  loading="lazy"
                />
              </div>
            </div>
            </div>

            <div className="flex flex-1 flex-col justify-center gap-5 p-2 sm:p-4 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-purple-500 dark:text-purple-400">
              {item.category}
            </p>

            <div className="flex items-center gap-3">
              <h2
                className="text-5xl font-black leading-tight text-purple-800 dark:text-purple-300"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {item.word}
              </h2>
              <PronounceButton text={item.word} lang="en-US" label="Phát âm từ" />
            </div>

            <p className="text-lg font-semibold tracking-wide text-purple-600 dark:text-purple-300">
              {item.ipa}
            </p>

            <div className="h-0.5 w-12 rounded-full bg-purple-500" />

            <div className="rounded-2xl border border-purple-100 bg-purple-50/90 px-5 py-4 text-center dark:border-purple-900 dark:bg-purple-950/60">
              <p className="text-[1.9rem] font-bold leading-tight text-gray-800 dark:text-gray-100">
                {item.details.definition_vi}
              </p>
            </div>
          </div>
          </div>

          {item.details.example_en ? (
            <>
              <div className="mx-auto mt-2 w-[72%] border-t border-purple-100 dark:border-purple-900/70" />
              <div className="mx-auto mt-3 w-[80%] rounded-2xl bg-purple-50/50 px-6 py-5 text-center dark:bg-purple-950/25">
                <div className="mb-3 flex items-center justify-center gap-3">
                  <p className="text-sm font-semibold text-purple-500 dark:text-purple-400">
                    Ví dụ
                  </p>
                  <PronounceButton
                    text={item.details.example_en}
                    lang="en-US"
                    label="Phát âm câu ví dụ"
                    className="p-1.5 rounded-lg"
                  />
                </div>
                <p className="text-lg font-semibold italic leading-7 text-gray-700 dark:text-gray-200">
                  {item.details.example_en}
                </p>
                {item.details.example_vi ? (
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {item.details.example_vi}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      ) : (
        <div className="flex h-full min-h-[inherit] flex-col items-center justify-center gap-4 p-8 sm:p-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-sm font-bold text-white shadow-lg">
            {currentNumber}
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm tracking-widest text-purple-400 dark:text-purple-400">
              {item.furigana || item.category}
            </p>
            <div className="flex items-center gap-3">
              <h2
                className="font-bold leading-[1.35] text-gray-800 dark:text-gray-100"
                style={{
                  fontFamily: item.furigana ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                  fontSize: item.furigana ? '4rem' : '3rem',
                }}
              >
                {item.word}
              </h2>
              <PronounceButton
                text={item.word}
                lang={item.furigana ? 'ja-JP' : 'en-US'}
                label="Phát âm từ"
              />
            </div>
            <p className="text-lg font-semibold tracking-wide text-purple-600 dark:text-purple-300">
              {item.ipa}
            </p>
          </div>

          <div className="h-0.5 w-14 rounded-full bg-purple-500" />

          <div className="w-full rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 px-5 py-3.5 dark:from-purple-950 dark:to-violet-950">
            <p className="text-center text-3xl font-bold text-gray-800 dark:text-gray-100">
              {item.details.definition_vi}
            </p>
          </div>

          {item.details.example_en ? (
            <div className="w-full rounded-2xl border border-purple-200 bg-purple-50/80 px-5 py-4 text-center dark:border-purple-700 dark:bg-purple-900/30">
              <div className="mb-3 flex items-center justify-center gap-3">
                <p className="text-sm font-semibold text-purple-500 dark:text-purple-400">
                  Ví dụ
                </p>
                <PronounceButton
                  text={item.details.example_en}
                  lang={item.furigana ? 'ja-JP' : 'en-US'}
                  label="Phát âm câu ví dụ"
                  className="p-1.5 rounded-lg"
                />
              </div>
              <p className="text-center text-base italic leading-relaxed text-gray-700 dark:text-gray-200">
                {item.details.example_en}
              </p>
              {item.details.example_vi ? (
                <p className="mt-1.5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.details.example_vi}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  );
}

function QuizCard({
  question,
  answerInput,
  selectedOption,
  feedback,
  onInputChange,
  onOptionSelect,
}) {
  const isAnswered = Boolean(feedback);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isAnswered && question.mode !== 'multiple_choice') {
      inputRef.current?.focus();
    }
  }, [question, isAnswered]);

  return (
    <motion.div
      key={`quiz-${question.id}`}
      initial={{ opacity: 0, x: 28, scale: 0.985 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        y: feedback && !feedback.correct ? [0, -10, 10, -8, 8, -4, 4, 0] : 0,
      }}
      exit={{ opacity: 0, x: -28, scale: 0.985 }}
      transition={{
        duration: 0.32,
        y: { duration: 0.42, ease: 'easeInOut' },
      }}
      className="w-full max-w-3xl rounded-3xl border border-purple-200/80 bg-white/95 p-6 shadow-[0_26px_72px_-42px_rgba(88,28,135,0.45)] dark:border-purple-800 dark:bg-gray-900/95 sm:p-8 lg:p-10"
    >
      <div className="space-y-4 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-purple-400">
          {question.mode === 'multiple_choice'
            ? 'Trắc nghiệm'
            : question.mode === 'typing_vi'
              ? 'Anh - Việt'
              : 'Việt - Anh'}
        </p>

        <h2 className="text-5xl font-black text-gray-900 dark:text-white sm:text-6xl">
          {question.prompt}
        </h2>
      </div>

      {question.mode === 'multiple_choice' ? (
        <div className="mt-10 grid gap-3">
          {question.options.map((option, index) => {
            const active = selectedOption === option;
            const isCorrectOption = feedback && option === question.answer;
            const isWrongSelected =
              feedback && !feedback.correct && active && option !== question.answer;

            return (
              <button
                key={option}
                onClick={() => onOptionSelect(option)}
                disabled={isAnswered}
                className={`relative rounded-2xl border px-5 py-4 pr-14 text-left font-medium transition ${
                  isCorrectOption
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950 dark:text-emerald-100'
                    : isWrongSelected
                      ? 'border-rose-500 bg-rose-50 text-rose-900 dark:border-rose-400 dark:bg-rose-950 dark:text-rose-100'
                      : active
                        ? 'border-purple-500 bg-purple-50 text-purple-900 dark:border-purple-400 dark:bg-purple-900 dark:text-white'
                        : 'border-purple-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-[#F5F3FF] dark:border-purple-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-purple-950'
                } ${isAnswered ? 'cursor-not-allowed opacity-95' : ''}`}
              >
                <span className="absolute right-4 top-3 rounded-md border border-purple-200 bg-purple-50 px-1.5 py-0.5 text-[11px] font-bold text-purple-500 dark:border-purple-700 dark:bg-purple-900/70 dark:text-purple-200">
                  {index + 1}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 space-y-5">
          <input
            ref={inputRef}
            value={answerInput}
            onChange={(event) => onInputChange(event.target.value)}
            disabled={isAnswered}
            placeholder={
              question.mode === 'typing_vi'
                ? 'Nhập nghĩa tiếng Việt'
                : 'Nhập từ tiếng Anh'
            }
            className={`w-full rounded-[1.35rem] border bg-white px-5 py-4 text-lg text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-4 dark:bg-gray-950 dark:text-white ${
              feedback?.correct
                ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-100 dark:border-emerald-400'
                : feedback && !feedback.correct
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-100 dark:border-rose-400'
                  : 'border-purple-200 focus:border-purple-500 focus:ring-purple-100 dark:border-purple-800'
            } ${isAnswered ? 'cursor-not-allowed opacity-95' : ''}`}
          />
        </div>
      )}
    </motion.div>
  );
}

function SummaryCard({ results, onRestart }) {
  const correctCount = results.filter((item) => item.correct).length;
  const total = results.length;
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <motion.div
      key="summary-card"
      initial={{ opacity: 0, x: 28, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -28, scale: 0.985 }}
      transition={{ duration: 0.32 }}
      className="w-full rounded-3xl border border-purple-200 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] backdrop-blur-sm dark:border-purple-800 dark:bg-gray-900/90"
    >
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white shadow-lg">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-gray-900 dark:text-white">
          Hoàn Thành Buổi Học
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Bạn đã học xong và hoàn thành bài kiểm tra tổng hợp.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-purple-50 p-4 text-center dark:bg-purple-950">
          <p className="text-sm text-purple-400">Đúng</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {correctCount}/{total}
          </p>
        </div>
        <div className="rounded-2xl bg-fuchsia-50 p-4 text-center dark:bg-fuchsia-950">
          <p className="text-sm text-fuchsia-400">Điểm</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {score}%
          </p>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-purple-300 bg-white px-5 py-4 text-base font-bold text-purple-700 transition hover:bg-purple-50 dark:border-purple-700 dark:bg-gray-950 dark:text-purple-300 dark:hover:bg-purple-950"
      >
        <RotateCcw className="h-4 w-4" />
        Học Lại Từ Đầu
      </button>
    </motion.div>
  );
}

export default function LearningFlow({
  vocabList = [],
  distractorPool,
  batchSize = MINI_QUIZ_BATCH_SIZE,
}) {
  const pool = useMemo(
    () => (distractorPool?.length ? distractorPool : vocabList),
    [distractorPool, vocabList],
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizType, setQuizType] = useState(null);
  const [learnedWords, setLearnedWords] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [finalResults, setFinalResults] = useState([]);
  const [sessionDone, setSessionDone] = useState(false);
  const [keyboardPressed, setKeyboardPressed] = useState(false);

  const currentStudyItem = vocabList[currentIndex];
  const currentQuestion = quizQuestions[quizIndex];
  const scoreCount = finalResults.filter((item) => item.correct).length;
  const statusLabel = sessionDone
    ? 'Hoàn thành'
    : isQuizMode
      ? quizType === 'mini'
        ? 'Mini Quiz'
        : 'Final Test'
      : 'Đang học';
  const statusCounter = sessionDone
    ? `${scoreCount}/${finalResults.length || 0}`
    : isQuizMode && currentQuestion
      ? `${quizIndex + 1}/${quizQuestions.length}`
      : `${currentIndex + 1}/${vocabList.length}`;
  const progressValue = sessionDone
    ? 100
    : isQuizMode && currentQuestion
      ? ((quizIndex + 1) / Math.max(quizQuestions.length, 1)) * 100
      : ((currentIndex + 1) / Math.max(vocabList.length, 1)) * 100;

  useEffect(() => {
    setCurrentIndex(0);
    setIsQuizMode(false);
    setQuizType(null);
    setLearnedWords([]);
    setQuizQuestions([]);
    setQuizIndex(0);
    setAnswerInput('');
    setSelectedOption('');
    setFeedback(null);
    setFinalResults([]);
    setSessionDone(false);
  }, [vocabList]);

  function startQuiz(type, words) {
    setQuizType(type);
    setQuizQuestions(buildQuizQuestions(words, pool));
    setQuizIndex(0);
    setAnswerInput('');
    setSelectedOption('');
    setFeedback(null);
    setIsQuizMode(true);
  }

  function handleNextStudy() {
    if (!currentStudyItem) {
      return;
    }

    const updatedLearnedWords = [...learnedWords, currentStudyItem];
    const nextIndex = currentIndex + 1;

    setLearnedWords(updatedLearnedWords);

    const shouldOpenMiniQuiz =
      updatedLearnedWords.length % batchSize === 0 && nextIndex < vocabList.length;

    if (shouldOpenMiniQuiz) {
      startQuiz('mini', updatedLearnedWords.slice(-batchSize));
      return;
    }

    if (nextIndex >= vocabList.length) {
      startQuiz('final', updatedLearnedWords);
      return;
    }

    setCurrentIndex(nextIndex);
  }

  function handlePreviousStudy() {
    if (isQuizMode || sessionDone) {
      return;
    }

    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }

  function handleQuizSubmit() {
    if (feedback || !currentQuestion) {
      return;
    }

    const rawAnswer =
      currentQuestion.mode === 'multiple_choice' ? selectedOption : answerInput;

    if (!rawAnswer) {
      return;
    }

    const isCorrect =
      normalizeText(rawAnswer) === normalizeText(currentQuestion.answer);

    if (isCorrect) {
      launchConfetti();
    }

    setFeedback({
      correct: isCorrect,
      correctAnswer: currentQuestion.answer,
    });

    setFinalResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        correct: isCorrect,
        userAnswer: rawAnswer,
        correctAnswer: currentQuestion.answer,
      },
    ]);
  }

  function handleDontKnow() {
    if (feedback || !currentQuestion) {
      return;
    }

    setFeedback({
      correct: false,
      correctAnswer: currentQuestion.answer,
    });

    setFinalResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        correct: false,
        userAnswer: 'Tôi không biết',
        correctAnswer: currentQuestion.answer,
      },
    ]);
  }

  function handleQuizContinue() {
    if (!feedback) {
      return;
    }

    const nextQuestionIndex = quizIndex + 1;

    if (nextQuestionIndex >= quizQuestions.length) {
      setIsQuizMode(false);
      setQuizIndex(0);
      setAnswerInput('');
      setSelectedOption('');
      setFeedback(null);

      if (quizType === 'final') {
        setSessionDone(true);
        setQuizType(null);
        return;
      }

      setQuizType(null);
      return;
    }

    setQuizIndex(nextQuestionIndex);
    setAnswerInput('');
    setSelectedOption('');
    setFeedback(null);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsQuizMode(false);
    setQuizType(null);
    setLearnedWords([]);
    setQuizQuestions([]);
    setQuizIndex(0);
    setAnswerInput('');
    setSelectedOption('');
    setFeedback(null);
    setFinalResults([]);
    setSessionDone(false);
  }

  function triggerKeyboardPress() {
    setKeyboardPressed(true);
    window.setTimeout(() => setKeyboardPressed(false), 130);
  }

  useEffect(() => {
    const handler = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (isQuizMode && currentQuestion?.mode === 'multiple_choice' && !feedback && /^[1-4]$/.test(event.key)) {
        const optionIndex = Number(event.key) - 1;
        const option = currentQuestion.options?.[optionIndex];
        if (option) {
          setSelectedOption(option);
        }
        return;
      }

      if (event.key !== 'Enter') {
        return;
      }

      event.preventDefault();
      triggerKeyboardPress();

      if (sessionDone) {
        handleRestart();
        return;
      }

      if (isQuizMode) {
        if (feedback) {
          handleQuizContinue();
          return;
        }

        handleQuizSubmit();
        return;
      }

      handleNextStudy();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentQuestion, feedback, isQuizMode, sessionDone]);

  if (!vocabList.length) {
    return (
      <div className="rounded-[2rem] border border-purple-200 bg-white/90 p-8 text-center text-gray-500 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] dark:border-purple-800 dark:bg-gray-900/90 dark:text-gray-400">
        Chưa có từ vựng để học.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[980px] space-y-6 pb-10">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="font-bold uppercase tracking-[0.24em]">{statusLabel}</span>
          <span className="font-semibold">{statusCounter}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{ duration: 0.35 }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sessionDone ? (
          <SummaryCard key="summary" results={finalResults} onRestart={handleRestart} />
        ) : isQuizMode && currentQuestion ? (
          <div className="flex min-h-[62vh] items-center justify-center">
            <QuizCard
              key={currentQuestion.id}
              question={currentQuestion}
              answerInput={answerInput}
              selectedOption={selectedOption}
              feedback={feedback}
              onInputChange={setAnswerInput}
              onOptionSelect={setSelectedOption}
            />
          </div>
        ) : currentStudyItem ? (
          <>
            <StudyCard
              key={currentStudyItem.word}
              item={currentStudyItem}
              currentNumber={currentIndex + 1}
              total={vocabList.length}
            />
            <div className="flex flex-wrap justify-center gap-1.5 pt-0.5">
              {vocabList.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-8 bg-gradient-to-r from-purple-500 to-violet-500'
                      : index < currentIndex
                        ? 'w-1.5 bg-purple-300 dark:bg-purple-700'
                        : 'w-1.5 bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="sticky bottom-4 z-30 mt-2">
        <AnimatePresence mode="wait" initial={false}>
          {isQuizMode && feedback ? (
            <BottomFeedbackBar key="feedback-bar" feedback={feedback} onContinue={handleQuizContinue} />
          ) : (
            <motion.div
              key={isQuizMode ? 'quiz-actions' : 'study-actions'}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2 }}
              className="flex w-full items-center gap-3 rounded-[1.75rem] border border-purple-200/80 bg-white/92 px-4 py-4 shadow-[0_24px_60px_-40px_rgba(88,28,135,0.38)] backdrop-blur-xl dark:border-purple-800/80 dark:bg-gray-950/92 sm:px-6"
            >
              {isQuizMode ? (
                <>
                  <button
                    onClick={handleDontKnow}
                    className="h-12 rounded-2xl border-2 border-purple-200 bg-white px-4 text-sm font-bold text-purple-700 transition hover:bg-[#F5F3FF] dark:border-purple-700 dark:bg-gray-900 dark:text-purple-300 dark:hover:bg-purple-950 sm:h-14 sm:px-5 sm:text-base"
                  >
                    Tôi không biết
                  </button>
                  <button
                    onClick={handleQuizSubmit}
                    className={`flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 text-base font-extrabold text-white shadow-lg shadow-purple-200/60 transition-all hover:shadow-xl active:scale-95 dark:shadow-purple-900/40 sm:h-[58px] ${
                      keyboardPressed ? 'scale-95' : ''
                    }`}
                  >
                    <span>Xác Nhận</span>
                    <ArrowRight className="h-5 w-5" />
                    <KbdHint>Enter</KbdHint>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePreviousStudy}
                    disabled={sessionDone || currentIndex === 0}
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                      sessionDone || currentIndex === 0
                        ? 'cursor-not-allowed border-gray-200 text-gray-400 opacity-40 dark:border-gray-700'
                        : 'border-purple-300 text-purple-700 hover:bg-purple-50 hover:shadow-sm active:scale-95 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950'
                    }`}
                    title="Trở lại"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    onClick={sessionDone ? handleRestart : handleNextStudy}
                    className={`flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 text-base font-extrabold text-white shadow-lg shadow-purple-200/60 transition-all hover:shadow-xl active:scale-95 dark:shadow-purple-900/40 sm:h-[58px] ${
                      keyboardPressed ? 'scale-95' : ''
                    }`}
                  >
                    <span>{sessionDone ? 'Học Lại Từ Đầu' : 'Tiếp Tục'}</span>
                    {sessionDone ? <RotateCcw className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                    {!sessionDone ? <KbdHint>Enter</KbdHint> : null}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
