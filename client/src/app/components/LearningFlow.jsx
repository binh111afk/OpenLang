import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';

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

function createQuestion(wordItem, pool) {
  const quizKinds = ['multiple_choice', 'typing_vi', 'typing_en'];
  const mode = quizKinds[Math.floor(Math.random() * quizKinds.length)];

  if (mode === 'multiple_choice') {
    const distractors = shuffleArray(
      pool.filter((item) => item.word !== wordItem.word),
    )
      .slice(0, 3)
      .map((item) => item.details.definition_vi);

    const options = shuffleArray([
      wordItem.details.definition_vi,
      ...distractors,
    ]);

    return {
      id: `${wordItem.word}-mc`,
      mode,
      prompt: wordItem.word,
      answer: wordItem.details.definition_vi,
      options,
      sourceWord: wordItem,
    };
  }

  if (mode === 'typing_vi') {
    return {
      id: `${wordItem.word}-typing-vi`,
      mode,
      prompt: wordItem.word,
      answer: wordItem.details.definition_vi,
      sourceWord: wordItem,
    };
  }

  return {
    id: `${wordItem.word}-typing-en`,
    mode,
    prompt: wordItem.details.definition_vi,
    answer: wordItem.word,
    sourceWord: wordItem,
  };
}

function buildQuizQuestions(words, pool) {
  return shuffleArray(words).map((item) => createQuestion(item, pool));
}

function StudyCard({ item, currentNumber, total, onNext }) {
  return (
    <motion.div
      key={`study-${item.word}-${currentNumber}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      className="rounded-[2rem] border border-purple-200 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] backdrop-blur-sm dark:border-purple-800 dark:bg-gray-900/90"
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-200">
          Study Mode
        </span>
        <span className="text-sm font-semibold text-purple-500 dark:text-purple-300">
          {currentNumber}/{total}
        </span>
      </div>

      <div className="space-y-4 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-purple-400">
          {item.category}
        </p>
        <h2 className="text-4xl font-black text-gray-900 dark:text-white">
          {item.word}
        </h2>
        <p className="text-lg font-semibold text-purple-600 dark:text-purple-300">
          {item.ipa}
        </p>
      </div>

      <div className="mt-8 space-y-4 rounded-[1.5rem] bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 dark:from-purple-950 dark:to-fuchsia-950">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
            Nghia
          </p>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {item.details.definition_vi}
          </p>
        </div>

        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
            Example
          </p>
          <p className="text-base italic text-gray-700 dark:text-gray-200">
            {item.details.example_en}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {item.details.example_vi}
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-4 text-base font-bold text-white transition hover:brightness-110"
      >
        Tiep Tuc
        <ArrowRight className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function QuizCard({
  quizType,
  question,
  questionIndex,
  totalQuestions,
  answerInput,
  selectedOption,
  feedback,
  onInputChange,
  onOptionSelect,
  onSubmit,
}) {
  return (
    <motion.div
      key={`quiz-${question.id}-${questionIndex}`}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      className="rounded-[2rem] border border-purple-200 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] backdrop-blur-sm dark:border-purple-800 dark:bg-gray-900/90"
    >
      <div className="mb-6 flex items-center justify-between">
        <span className="rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-bold text-fuchsia-700 dark:bg-fuchsia-900 dark:text-fuchsia-200">
          {quizType === 'mini' ? 'Mini Quiz' : 'Final Test'}
        </span>
        <span className="text-sm font-semibold text-purple-500 dark:text-purple-300">
          {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-purple-400">
          {question.mode === 'multiple_choice'
            ? 'Trac nghiem'
            : question.mode === 'typing_vi'
              ? 'Anh - Viet'
              : 'Viet - Anh'}
        </p>

        {question.mode === 'typing_en' ? (
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            {question.prompt}
          </h2>
        ) : (
          <h2 className="text-4xl font-black text-gray-900 dark:text-white">
            {question.prompt}
          </h2>
        )}
      </div>

      {question.mode === 'multiple_choice' ? (
        <div className="mt-8 grid gap-3">
          {question.options.map((option) => {
            const active = selectedOption === option;
            return (
              <button
                key={option}
                onClick={() => onOptionSelect(option)}
                className={`rounded-2xl border px-4 py-3 text-left font-medium transition ${
                  active
                    ? 'border-purple-500 bg-purple-100 text-purple-900 dark:border-purple-400 dark:bg-purple-900 dark:text-white'
                    : 'border-purple-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-purple-950'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-8">
          <input
            value={answerInput}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={
              question.mode === 'typing_vi'
                ? 'Nhap nghia tieng Viet'
                : 'Nhap tu tieng Anh'
            }
            className="w-full rounded-2xl border border-purple-200 bg-white px-4 py-3 text-base text-gray-800 outline-none transition focus:border-purple-500 dark:border-purple-800 dark:bg-gray-950 dark:text-white"
          />
        </div>
      )}

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl px-4 py-3 text-sm font-medium ${
            feedback.correct
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-200'
          }`}
        >
          {feedback.correct
            ? 'Chinh xac!'
            : `Chua dung. Dap an dung: ${feedback.correctAnswer}`}
        </div>
      ) : null}

      <button
        onClick={onSubmit}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-4 text-base font-bold text-white transition hover:brightness-110"
      >
        Xac Nhan
        <ArrowRight className="h-4 w-4" />
      </button>
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
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.28 }}
      className="rounded-[2rem] border border-purple-200 bg-white/90 p-6 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] backdrop-blur-sm dark:border-purple-800 dark:bg-gray-900/90"
    >
      <div className="text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 text-white shadow-lg">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h2 className="mt-5 text-3xl font-black text-gray-900 dark:text-white">
          Hoan Thanh Session
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Ban da hoc xong va hoan thanh bai kiem tra tong hop.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-purple-50 p-4 text-center dark:bg-purple-950">
          <p className="text-sm text-purple-400">Dung</p>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {correctCount}/{total}
          </p>
        </div>
        <div className="rounded-2xl bg-fuchsia-50 p-4 text-center dark:bg-fuchsia-950">
          <p className="text-sm text-fuchsia-400">Diem</p>
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
        Hoc Lai Tu Dau
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

  const currentStudyItem = vocabList[currentIndex];
  const currentQuestion = quizQuestions[quizIndex];

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

  function handleQuizSubmit() {
    if (!currentQuestion) {
      return;
    }

    const rawAnswer =
      currentQuestion.mode === 'multiple_choice' ? selectedOption : answerInput;

    if (!rawAnswer) {
      return;
    }

    const isCorrect =
      normalizeText(rawAnswer) === normalizeText(currentQuestion.answer);

    setFeedback({
      correct: isCorrect,
      correctAnswer: currentQuestion.answer,
    });

    const nextResults = [
      ...finalResults,
      {
        questionId: currentQuestion.id,
        correct: isCorrect,
        userAnswer: rawAnswer,
        correctAnswer: currentQuestion.answer,
      },
    ];
    setFinalResults(nextResults);

    window.setTimeout(() => {
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
        setCurrentIndex((prev) => prev);
        return;
      }

      setQuizIndex(nextQuestionIndex);
      setAnswerInput('');
      setSelectedOption('');
      setFeedback(null);
    }, 900);
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

  if (!vocabList.length) {
    return (
      <div className="rounded-[2rem] border border-purple-200 bg-white/90 p-8 text-center text-gray-500 shadow-[0_24px_60px_-36px_rgba(124,58,237,0.45)] dark:border-purple-800 dark:bg-gray-900/90 dark:text-gray-400">
        Chua co tu vung de hoc.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="rounded-[2rem] border border-purple-200 bg-gradient-to-r from-purple-100 via-fuchsia-50 to-purple-100 p-4 shadow-sm dark:border-purple-800 dark:from-purple-950 dark:via-fuchsia-950 dark:to-purple-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-500">
              OpenLang Smart Flow
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Hoc 5 tu, mini quiz, tiep tuc, roi final test cuoi buoi.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 dark:bg-gray-900/80 dark:text-purple-300">
            {sessionDone
              ? 'Session complete'
              : isQuizMode
                ? quizType === 'mini'
                  ? 'Mini Quiz'
                  : 'Final Test'
                : 'Dang hoc'}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {sessionDone ? (
          <SummaryCard
            key="summary"
            results={finalResults}
            onRestart={handleRestart}
          />
        ) : isQuizMode && currentQuestion ? (
          <QuizCard
            key={currentQuestion.id}
            quizType={quizType}
            question={currentQuestion}
            questionIndex={quizIndex}
            totalQuestions={quizQuestions.length}
            answerInput={answerInput}
            selectedOption={selectedOption}
            feedback={feedback}
            onInputChange={setAnswerInput}
            onOptionSelect={setSelectedOption}
            onSubmit={handleQuizSubmit}
          />
        ) : currentStudyItem ? (
          <StudyCard
            key={currentStudyItem.word}
            item={currentStudyItem}
            currentNumber={currentIndex + 1}
            total={vocabList.length}
            onNext={handleNextStudy}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
