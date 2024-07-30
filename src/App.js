import { useEffect, useReducer } from "react";
import Loader from "./Loader";

const SECONDS_PER_QUESTION = 30;

function reducer(state, action) {
  switch (action.type) {
    case "setStatus":
      return { ...state, status: action.payload.status };
    case "setData":
      return {
        ...state,
        questions: action.payload.data,
        status: action.payload.status,
      };
    case "setStartTest":
      return {
        ...state,
        status: action.payload.status,
        score: 0,
        remaining_sec: state.questions.length * SECONDS_PER_QUESTION,
      };
    case "fetchFailed":
      return { ...state, status: "error" };
    case "setNextQuestion":
      return {
        ...state,
        currentQuestion: state.currentQuestion + 1,
        answer: "",
      };
    case "setAnswer":
      const quest = state.questions[state.currentQuestion];
      const val =
        action.payload.indx === quest.correctOption
          ? state.score + quest.points
          : state.score;

      return { ...state, answer: action.payload.indx, score: val };
    case "setFinishedState":
      return {
        ...state,
        status: "finished",
        answer: "",
        currentQuestion: 0,
        score: state.score,
        questions: [],
      };
    case "timer":
      return {
        ...state,
        remaining_sec: state.remaining_sec - 1,
        status: state.remaining_sec === 0 ? "finished" : state.status,
      };
    default:
      throw new Error("error occur");
  }
}

export default function App() {
  const [data, dispatch] = useReducer(reducer, {
    questions: [],
    // isLoading, error, ready, active, finished
    status: "",
    currentQuestion: 0,
    answer: "",
    score: 0,
    remaining_sec: 0,
  });

  const { questions, status, currentQuestion, answer, score, remaining_sec } =
    data;

  useEffect(() => {
    async function fetchData() {
      dispatch({ type: "setStatus", payload: { status: "isLoading" } });

      try {
        const res = await fetch("http://localhost:8080/questions");
        const data = await res.json();
        dispatch({ type: "setData", payload: { data, status: "ready" } });
      } catch (error) {
        console.log(error.message);
        dispatch({ type: "fetchFailed" });
      }
    }
    fetchData();
  }, []);

  const totalPoint = questions.reduce((acc, question, index, arr) => {
    return (acc += question.points);
  }, 0);

  return (
    <section className="section">
      <Header />

      <Main>
        {status === "isLoading" && <Loader />}
        {status === "ready" && (
          <Ready questions={questions} dispatch={dispatch}>
            <p style={{ marginBottom: "20px" }}>
              the test is about do start kindly read all instruction carefully,
              you have a total of {questions.length} questions to answer in
              5min, good luck press the start button when you are ready..
            </p>
            <Btn
              className="btn next"
              onClick={() =>
                dispatch({
                  type: "setStartTest",
                  payload: { status: "active" },
                })
              }
            >
              start
            </Btn>
          </Ready>
        )}
        {status === "active" && (
          <>
            <ProgressBar
              questions={questions}
              currentQuestion={currentQuestion}
              score={score}
              totalPoint={totalPoint}
              pickedAnswer={answer}
            />

            <Ul>
              {/* {questions.map((quest) => ( */}

              <QustnAns
                key={questions[currentQuestion]?.id}
                aQuestion={questions[currentQuestion]}
                currentQuestion={currentQuestion}
                dispatch={dispatch}
                questions={questions}
                pickedAnswer={answer}
                remaining_sec={remaining_sec}
              />
            </Ul>
          </>
        )}
        {status === "finished" && (
          <Ready>
            <p style={{ marginBottom: "20px" }}>
              congratulations on completing the quiz you have a total score of{" "}
              {score} point.
            </p>
            <Btn
              className="btn next"
              onClick={() =>
                dispatch({ type: "setStartTest", payload: { status: "ready" } })
              }
            >
              Restart quiz
            </Btn>
          </Ready>
        )}
      </Main>
    </section>
  );
}

function Ready({ children }) {
  return <div className="ready">{children}</div>;
}

function Header() {
  return (
    <header className="header margin">
      <h1>
        <span>🕸️</span> <span>the react quiz</span>
      </h1>
    </header>
  );
}

function ProgressBar({
  questions,
  currentQuestion,
  score,
  totalPoint,
  pickedAnswer,
}) {
  return (
    <article className="progress-container">
      <p>
        <progress
          className="progress"
          max="15"
          value={currentQuestion + Number(pickedAnswer !== "")}
        ></progress>
      </p>
      <p>
        <strong>
          Question {currentQuestion + 1}/{questions.length}
        </strong>
      </p>
      <p>
        <strong>
          Point {score}/{totalPoint} points
        </strong>
      </p>
    </article>
  );
}

function Ul({ children }) {
  return <ul className="qestn-ans">{children}</ul>;
}

function Main({ children }) {
  return (
    <main className="main margin">
      {children}
      {/* <Timer /> */}
    </main>
  );
}

function QustnAns({
  aQuestion,
  children,
  dispatch,
  currentQuestion,
  questions,
  pickedAnswer,
  remaining_sec,
}) {
  // const {
  //   question,
  //   options,
  //   //  correctOption, points, id
  // } = aQuestion;
  return (
    <li>
      <h4>{aQuestion?.question}</h4>
      <div className="ans">
        {Array.from({ length: aQuestion?.options.length }, (_, i) => (
          <AnswerBtn
            key={i}
            className={`btn ans-btn `}
            pickedAnswer={pickedAnswer}
            iterationIndex={i}
            correctAns={aQuestion?.correctOption}
            onClick={() =>
              dispatch({
                type: "setAnswer",
                payload: {
                  indx: i,
                },
              })
            }
          >
            {aQuestion?.options[i]}
          </AnswerBtn>
        ))}
        {/* <Btn className="btn ans-btn" >{aQuestion?.options[1]}</Btn>
        <Btn className="btn ans-btn">{aQuestion?.options[2]}</Btn>
        <Btn className="btn ans-btn">{aQuestion?.options[3]}</Btn> */}
      </div>
      <p className="container">
        {/* <span className="timer">7:23</span> */}
        <Timer remaining_sec={remaining_sec} dispatch={dispatch} />
        {currentQuestion + 1 < questions.length && pickedAnswer !== "" ? (
          <Btn
            className={"btn next"}
            onClick={() => dispatch({ type: "setNextQuestion" })}
          >
            next
          </Btn>
        ) : (
          false
        )}
        {currentQuestion + 1 === questions.length && pickedAnswer !== "" && (
          <Btn
            className={"btn next"}
            onClick={() => dispatch({ type: "setFinishedState" })}
          >
            finish
          </Btn>
        )}
      </p>
    </li>
  );
}

function Btn({ children, onClick, className }) {
  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function AnswerBtn({
  children,
  onClick,
  className,
  iterationIndex,
  pickedAnswer,
  correctAns,
}) {
  const ans = iterationIndex === pickedAnswer;
  const hasAnswered = pickedAnswer !== "";

  return (
    <button
      onClick={onClick}
      className={`${className} ${ans ? " selected" : " "} ${
        hasAnswered
          ? iterationIndex === correctAns
            ? " correct"
            : "wrong"
          : ""
      } ${pickedAnswer}`}
      disabled={hasAnswered}
    >
      {children}
    </button>
  );
}

function Timer({ remaining_sec, dispatch }) {
  const mins = Math.floor(remaining_sec / 60);
  const secs = remaining_sec % 60;

  useEffect(
    function () {
      const id = setInterval(() => dispatch({ type: "timer" }), 1000);

      return () => clearInterval(id);
    },
    [dispatch]
  );
  return (
    <span className="timer">
      {mins < 10 && "0"}
      {mins}:{secs < 10 && "0"}
      {secs}
    </span>
  );
}
