import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Check, X, Trophy, Star, RotateCcw, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

type QuizType = 'multiple-choice' | 'fill-blank';
type FeedbackType = 'correct' | 'incorrect' | null;

interface Question {
  id: string;
  type: QuizType;
  word: string;
  correctAnswer: string;
  options?: string[]; // For multiple choice
  sentence?: string; // For fill in the blank
  language: 'english' | 'japanese';
}

interface QuizResult {
  correct: number;
  incorrect: number;
  totalQuestions: number;
  exp: number;
}

export function QuizPage() {
  const navigate = useNavigate();
  const { deckId } = useParams();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [isCompleted, setIsCompleted] = useState(false);

  // Mock questions
  const questions: Question[] = [
    {
      id: '1',
      type: 'multiple-choice',
      word: '勉強',
      correctAnswer: 'Học tập',
      options: ['Học tập', 'Trường học', 'Giáo viên', 'Bạn bè'],
      language: 'japanese',
    },
    {
      id: '2',
      type: 'fill-blank',
      word: '学校',
      correctAnswer: 'がっこう',
      sentence: '___へ行きます (Tôi đi đến trường)',
      language: 'japanese',
    },
    {
      id: '3',
      type: 'multiple-choice',
      word: '先生',
      correctAnswer: 'Giáo viên',
      options: ['Học sinh', 'Giáo viên', 'Bạn bè', 'Phụ huynh'],
      language: 'japanese',
    },
    {
      id: '4',
      type: 'fill-blank',
      word: '友達',
      correctAnswer: 'ともだち',
      sentence: '___と遊びます (Chơi với bạn bè)',
      language: 'japanese',
    },
    {
      id: '5',
      type: 'multiple-choice',
      word: '食べる',
      correctAnswer: 'Ăn',
      options: ['Uống', 'Ăn', 'Ngủ', 'Đi'],
      language: 'japanese',
    },
  ];

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswerSelect = (answer: string) => {
    if (feedback !== null) return; // Already answered
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (feedback !== null) return; // Already submitted

    const isCorrect =
      currentQuestion.type === 'multiple-choice'
        ? selectedAnswer === currentQuestion.correctAnswer
        : userInput.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();

    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setScore((prev) => ({
      ...prev,
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1),
    }));

    if (isCorrect) {
      // Play success animation
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#9333ea', '#a855f7', '#c084fc'],
        });
      }, 100);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setUserInput('');
      setFeedback(null);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setUserInput('');
    setFeedback(null);
    setScore({ correct: 0, incorrect: 0 });
    setIsCompleted(false);
  };

  const calculateExp = (): number => {
    return score.correct * 10;
  };

  // Results Screen
  if (isCompleted) {
    const exp = calculateExp();
    const percentage = Math.round((score.correct / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-2xl"
        >
          {/* Trophy Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full">
              <Trophy className="w-16 h-16 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2"
          >
            Hoàn Thành!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center text-gray-600 dark:text-gray-400 mb-8"
          >
            Chúc mừng bạn đã hoàn thành bài kiểm tra
          </motion.p>

          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 rounded-3xl p-8 mb-8"
          >
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-purple-600 dark:text-purple-400 mb-2">{percentage}%</div>
              <div className="text-gray-600 dark:text-gray-400">Độ chính xác</div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Correct */}
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{score.correct}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Đúng</div>
              </div>

              {/* Incorrect */}
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
                    <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{score.incorrect}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Sai</div>
              </div>

              {/* EXP */}
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                    <Star className="w-5 h-5 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-1">+{exp}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">EXP</div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <button
              onClick={() => navigate('/library')}
              className="flex-1 py-4 rounded-2xl border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-semibold hover:bg-purple-50 dark:hover:bg-purple-950 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Về Thư Viện
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Làm Lại
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Quiz Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <div className="max-w-4xl mx-auto p-6 lg:p-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/library/${deckId}/study`)}
            className="p-3 rounded-2xl bg-white dark:bg-gray-900 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Câu {currentQuestionIndex + 1} / {questions.length}
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Đúng: <span className="font-bold text-green-600 dark:text-green-400">{score.correct}</span> • Sai:{' '}
                <span className="font-bold text-red-600 dark:text-red-400">{score.incorrect}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
            />
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-purple-200 dark:border-purple-800 p-8 shadow-xl mb-8"
          >
            {/* Question Word */}
            <div className="text-center mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {currentQuestion.type === 'multiple-choice' ? 'Chọn nghĩa đúng của từ:' : 'Điền từ vào chỗ trống:'}
              </p>
              <h1
                className="text-5xl font-bold text-gray-800 dark:text-gray-100"
                style={{
                  fontFamily:
                    currentQuestion.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                }}
              >
                {currentQuestion.word}
              </h1>
            </div>

            {/* Multiple Choice Options */}
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedAnswer === option;
                  const isCorrect = option === currentQuestion.correctAnswer;
                  const showResult = feedback !== null;

                  let buttonStyle = 'border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950';

                  if (showResult && isSelected && isCorrect) {
                    buttonStyle = 'border-green-500 bg-green-50 dark:bg-green-950';
                  } else if (showResult && isSelected && !isCorrect) {
                    buttonStyle = 'border-red-500 bg-red-50 dark:bg-red-950';
                  } else if (showResult && isCorrect) {
                    buttonStyle = 'border-green-500 bg-green-50 dark:bg-green-950';
                  }

                  return (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={feedback !== null}
                      className={`
                        relative p-6 rounded-2xl border-2 transition-all text-left
                        ${buttonStyle}
                        ${feedback === null ? 'cursor-pointer' : 'cursor-default'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center font-bold text-purple-700 dark:text-purple-300">
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">{option}</span>
                        {showResult && isCorrect && (
                          <Check className="ml-auto w-6 h-6 text-green-600 dark:text-green-400" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <X className="ml-auto w-6 h-6 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Fill in the Blank */}
            {currentQuestion.type === 'fill-blank' && (
              <div className="space-y-6">
                <div className="p-6 bg-purple-50 dark:bg-purple-950 rounded-2xl">
                  <p className="text-xl text-gray-700 dark:text-gray-300 text-center font-medium">
                    {currentQuestion.sentence}
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={feedback !== null}
                    placeholder="Nhập câu trả lời..."
                    className={`
                      w-full px-6 py-4 rounded-2xl border-2 text-lg font-semibold text-center
                      focus:outline-none transition-all
                      ${
                        feedback === 'correct'
                          ? 'border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : feedback === 'incorrect'
                          ? 'border-red-500 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                          : 'border-purple-200 dark:border-purple-800 focus:border-purple-400 dark:focus:border-purple-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                      }
                    `}
                    style={{
                      fontFamily:
                        currentQuestion.language === 'japanese' ? "'Noto Sans JP', sans-serif" : "'Inter', sans-serif",
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Feedback */}
        <AnimatePresence>
          {feedback !== null && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className={`
                mb-8 p-6 rounded-3xl border-2 shadow-lg
                ${
                  feedback === 'correct'
                    ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700'
                }
              `}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`
                  p-3 rounded-full
                  ${feedback === 'correct' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}
                `}
                >
                  {feedback === 'correct' ? (
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3
                    className={`
                    text-xl font-bold mb-2
                    ${feedback === 'correct' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}
                  `}
                  >
                    {feedback === 'correct' ? '🎉 Chính xác!' : '❌ Chưa đúng rồi!'}
                  </h3>
                  {feedback === 'incorrect' && (
                    <p className="text-red-600 dark:text-red-400">
                      Đáp án đúng là: <span className="font-bold">{currentQuestion.correctAnswer}</span>
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {feedback === null ? (
            <button
              onClick={handleSubmit}
              disabled={
                currentQuestion.type === 'multiple-choice' ? selectedAnswer === null : userInput.trim() === ''
              }
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all"
            >
              Kiểm Tra
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-purple-500 text-white text-lg font-bold hover:shadow-lg hover:shadow-purple-300 dark:hover:shadow-purple-900 transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? 'Câu Tiếp Theo' : 'Xem Kết Quả'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
