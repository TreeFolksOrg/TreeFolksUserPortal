import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import TreeFolks from "../../../assets/icons/treefolks.svg?react";
import { submitPreConsultQuiz } from "../../../services/projectService";
import { clearQuizProjectId, getQuizProjectId } from "../quizProject";
import {
  CLOSING,
  PART_ONE_INTRO,
  PART_ONE_QUESTIONS,
  PART_TWO_INTRO,
  PART_TWO_QUESTIONS,
} from "../quizData";

const imageUrl = (file) => encodeURI(`/${file}`);

const toLocalDateString = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const QuizImage = ({ image, alt }) => (
  <figure className="mt-4">
    <img
      src={imageUrl(image.file)}
      alt={image.caption || alt}
      className="mx-auto max-h-[28rem] w-auto max-w-full rounded-lg border border-gray-100 shadow-sm"
    />
    {image.caption && (
      <figcaption className="mt-2 text-center text-sm italic text-gray-500">
        {image.caption}
      </figcaption>
    )}
  </figure>
);

const NextButton = ({ onClick, disabled, loading, children }) => (
  <div className="mt-8 flex justify-end">
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  </div>
);

const OptionList = ({ name, options, selected, onSelect }) => (
  <div className="mt-4 space-y-2">
    {options.map((option) => (
      <label
        key={option.key}
        className={`flex cursor-pointer items-start rounded-lg border p-3 text-sm transition ${
          selected === option.key
            ? "border-green-500 bg-green-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
        }`}
      >
        <input
          type="radio"
          name={name}
          value={option.key}
          checked={selected === option.key}
          onChange={() => onSelect(option.key)}
          className="mt-0.5 mr-3 h-4 w-4 accent-green-600"
        />
        <span>
          <span className="font-medium">{option.key}.</span> {option.text}
        </span>
      </label>
    ))}
  </div>
);

const ResultOptionList = ({ options, selected, correct }) => (
  <div className="mt-4 space-y-2">
    {options.map((option) => {
      const isCorrect = option.key === correct;
      const isWrongPick = option.key === selected && !isCorrect;
      const style = isCorrect
        ? "border-green-500 bg-green-50 text-green-900"
        : isWrongPick
          ? "border-red-300 bg-red-50 text-red-900"
          : "border-gray-200 bg-white text-gray-500";
      return (
        <div
          key={option.key}
          className={`flex items-start rounded-lg border p-3 text-sm ${style}`}
        >
          <span className="mr-3 mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center">
            {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {isWrongPick && <XCircle className="h-4 w-4 text-red-500" />}
          </span>
          <span>
            <span className="font-medium">{option.key}.</span> {option.text}
            {option.key === selected && (
              <span className="ml-2 text-xs font-semibold uppercase">(Your answer)</span>
            )}
          </span>
        </div>
      );
    })}
  </div>
);

const QuizPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectId] = useState(() => location.state?.projectId || getQuizProjectId());

  const [step, setStep] = useState({ kind: "part1" });
  const [partOneAnswers, setPartOneAnswers] = useState({});
  const [partTwoAnswers, setPartTwoAnswers] = useState({});
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // The app locks body scroll, so the content container scrolls instead.
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [step]);

  if (!projectId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <p className="max-w-md text-gray-700">
          We couldn't tell which project this quiz is for. Please open the quiz from your project page.
        </p>
        <Link
          to="/landowner/dashboard"
          className="mt-4 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition hover:bg-green-700"
        >
          Back to my project
        </Link>
      </div>
    );
  }

  const totalQuestions = PART_TWO_QUESTIONS.length;
  const correctCount = PART_TWO_QUESTIONS.filter(
    (q) => partTwoAnswers[q.id] === q.correct
  ).length;
  const scorePercent = Math.round((correctCount / totalQuestions) * 100);

  const buildAnswersText = () => {
    const lines = PART_ONE_QUESTIONS.map((q) => {
      const option = q.options.find((o) => o.key === partOneAnswers[q.id]);
      return `${q.id}. ${q.text}\n   ${option.key}. ${option.text}`;
    });
    let text = `Part 1 — Land Management Style\n\n${lines.join("\n\n")}`;
    if (comment.trim()) {
      text += `\n\nComments: ${comment.trim()}`;
    }
    return text;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitPreConsultQuiz(projectId, {
        answers: buildAnswersText(),
        scorePercent,
        completedDate: toLocalDateString(new Date()),
      });
      clearQuizProjectId();
      navigate(`/landowner/project/${projectId}`, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to submit the quiz. Please try again.");
      setSubmitting(false);
    }
  };

  const renderPartOne = () => {
    const allAnswered = PART_ONE_QUESTIONS.every((q) => partOneAnswers[q.id]);
    return (
      <>
        <h1 className="text-3xl font-semibold text-gray-900">{PART_ONE_INTRO.title}</h1>
        <p className="mt-4 text-sm text-gray-600">{PART_ONE_INTRO.description}</p>
        <div className="mt-4 border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <p className="font-medium">{PART_ONE_INTRO.streamNoteTitle}</p>
          <p className="mt-1">{PART_ONE_INTRO.streamNote}</p>
        </div>

        <div className="mt-8 space-y-8">
          {PART_ONE_QUESTIONS.map((q) => (
            <fieldset key={q.id}>
              <legend className="text-base font-semibold text-gray-900">
                {q.id}. {q.text}
              </legend>
              <OptionList
                name={`part1-${q.id}`}
                options={q.options}
                selected={partOneAnswers[q.id]}
                onSelect={(key) => setPartOneAnswers((prev) => ({ ...prev, [q.id]: key }))}
              />
            </fieldset>
          ))}
        </div>

        {!allAnswered && (
          <p className="mt-6 text-right text-xs text-gray-500">
            Answer all questions to continue.
          </p>
        )}
        <NextButton
          disabled={!allAnswered}
          onClick={() => setStep({ kind: "question", index: 0 })}
        >
          Next
        </NextButton>
      </>
    );
  };

  const renderQuestion = (index) => {
    const q = PART_TWO_QUESTIONS[index];
    return (
      <>
        {index === 0 && (
          <div className="mb-8 border-b border-gray-100 pb-6">
            <h1 className="text-3xl font-semibold text-gray-900">{PART_TWO_INTRO.title}</h1>
            <p className="mt-4 text-sm text-gray-600">{PART_TWO_INTRO.description}</p>
            <p className="mt-2 text-sm text-gray-600">{PART_TWO_INTRO.note}</p>
          </div>
        )}
        <p className="text-sm font-medium uppercase tracking-wide text-green-600">
          Question {index + 1} of {totalQuestions}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">{q.text}</h2>
        {q.image && <QuizImage image={q.image} alt={`Question ${q.id}`} />}
        <OptionList
          name={`part2-${q.id}`}
          options={q.options}
          selected={partTwoAnswers[q.id]}
          onSelect={(key) => setPartTwoAnswers((prev) => ({ ...prev, [q.id]: key }))}
        />
        <NextButton
          disabled={!partTwoAnswers[q.id]}
          onClick={() => setStep({ kind: "answer", index })}
        >
          Next
        </NextButton>
      </>
    );
  };

  const renderAnswer = (index) => {
    const q = PART_TWO_QUESTIONS[index];
    const selected = partTwoAnswers[q.id];
    const isCorrect = selected === q.correct;
    const correctOption = q.options.find((o) => o.key === q.correct);
    const isLast = index === totalQuestions - 1;
    return (
      <>
        <p className="text-sm font-medium uppercase tracking-wide text-green-600">
          Question {index + 1} of {totalQuestions}
        </p>
        <h2 className="mt-2 text-xl font-semibold text-gray-900">{q.text}</h2>
        <ResultOptionList options={q.options} selected={selected} correct={q.correct} />

        <div className="mt-6">
          <p className={`font-semibold ${isCorrect ? "text-green-700" : "text-gray-900"}`}>
            {isCorrect
              ? "Correct!"
              : `Correct answer: ${correctOption.key}. ${correctOption.text}`}
          </p>
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
            {q.explanation.map((item, i) =>
              typeof item === "string" ? (
                <p key={i}>{item}</p>
              ) : (
                <QuizImage key={i} image={item.image} alt={`Question ${q.id} explanation`} />
              )
            )}
          </div>
        </div>

        {q.answerImages.map((image) => (
          <QuizImage key={image.file} image={image} alt={`Question ${q.id} explanation`} />
        ))}

        <NextButton
          onClick={() =>
            setStep(isLast ? { kind: "closing" } : { kind: "question", index: index + 1 })
          }
        >
          Next
        </NextButton>
      </>
    );
  };

  const renderClosing = () => (
    <>
      <h1 className="text-3xl font-semibold text-gray-900">{CLOSING.title}</h1>

      <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-700">
        {CLOSING.paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      <QuizImage image={{ file: CLOSING.image }} alt="End of quiz" />

      <p className="mt-8 text-lg font-semibold text-green-600">
        Your Score: {correctCount}/{totalQuestions} ({scorePercent}%)
      </p>

      <label htmlFor="quiz-comment" className="mt-6 block text-sm font-medium text-gray-700">
        Your comments about the quiz
      </label>
      <textarea
        id="quiz-comment"
        rows={4}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={submitting}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
      />

      {error && (
        <div className="mt-6 flex items-center justify-center rounded-lg bg-red-100 p-3 text-center text-red-500 shadow-sm">
          <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}
      <NextButton onClick={handleSubmit} loading={submitting}>
        Submit
      </NextButton>
    </>
  );

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-center border-b border-gray-200 bg-white p-4">
        <TreeFolks className="h-16 w-16 text-green-600" />
      </header>
      <div ref={scrollRef} className="flex-1 overflow-auto px-4 py-8">
        <main className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-xl sm:p-10">
          {step.kind === "part1" && renderPartOne()}
          {step.kind === "question" && renderQuestion(step.index)}
          {step.kind === "answer" && renderAnswer(step.index)}
          {step.kind === "closing" && renderClosing()}
        </main>
      </div>
    </div>
  );
};

export default QuizPage;
