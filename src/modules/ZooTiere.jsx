import { useState, useRef, useEffect } from "react";

/* لو عايزة صور حقيقية: ضيفي img: "/animals/elefant.png" لكل حيوان
   وبدّلي <Pic animal={a} /> بالصورة (الدالة Pic تحت) */
const ANIMALS = [
  { word: "Elefant", article: "der", emoji: "🐘" },
  { word: "Jaguar", article: "der", emoji: "🐆" },
  { word: "Löwe", article: "der", emoji: "🦁" },
  { word: "Kamel", article: "das", emoji: "🐪" },
  { word: "Känguru", article: "das", emoji: "🦘" },
  { word: "Giraffe", article: "die", emoji: "🦒" },
  { word: "Strauß", article: "der", emoji: "🐦" }, // مفيش إيموجي نعامة
  { word: "Papagei", article: "der", emoji: "🦜" },
  { word: "Zebra", article: "das", emoji: "🦓" },
  { word: "Tiger", article: "der", emoji: "🐅" },
  { word: "Krokodil", article: "das", emoji: "🐊" },
  { word: "Affe", article: "der", emoji: "🐒" },
  { word: "Delfin", article: "der", emoji: "🐬" },
  { word: "Wolf", article: "der", emoji: "🐺" },
];

// كلاسات Tailwind لازم تتكتب كاملة: der أزرق / das أخضر / die أحمر
const COLOR = {
  der: { text: "text-blue-600" },
  das: { text: "text-green-600" },
  die: { text: "text-red-600" },
};

const ARTICLE_ORDER = { der: 0, das: 1, die: 2 };
const SORTED = [...ANIMALS].sort(
  (a, b) => ARTICLE_ORDER[a.article] - ARTICLE_ORDER[b.article]
);

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

const speak = (text) => {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "de-DE";
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

const Pic = ({ animal }) => <span>{animal.emoji}</span>;

/* ================= الصفحة الرئيسية ================= */
export default function ZooTiere() {
  const [tab, setTab] = useState("karten");
  return (
    <div className="min-h-screen bg-amber-50 select-none">
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
        .shake { animation: shake .4s }
      `}</style>

      <header className="sticky top-0 z-40 bg-amber-50/95 backdrop-blur border-b border-amber-200">
        <div className="max-w-4xl mx-auto px-3 py-3 flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-800">
            Im Zoo 🦁
          </h1>
          <div className="flex rounded-full bg-amber-200 p-1">
            {[
              ["karten", "Karten"],
              ["spiel", "Spiel"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`px-4 sm:px-6 py-2 rounded-full font-bold text-sm sm:text-base transition ${
                  tab === id ? "bg-white shadow text-amber-700" : "text-amber-800"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 py-5">
        {tab === "karten" ? <Cards /> : <Game />}
      </main>
    </div>
  );
}

/* ================= كروت الحيوانات ================= */
function Cards() {
  const [playing, setPlaying] = useState(null);

  const play = (a) => {
    setPlaying(a.word);
    speak(a.word);
    setTimeout(() => setPlaying(null), 900);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
      {SORTED.map((a) => (
        <button
          key={a.word}
          onClick={() => play(a)}
          className={`rounded-3xl bg-white shadow-lg p-3 sm:p-4 flex flex-col items-center active:scale-95 transition ${
            playing === a.word ? "ring-4 ring-amber-400" : ""
          }`}
        >
          <div className="text-6xl sm:text-7xl mb-2">
            <Pic animal={a} />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-slate-800">
            <span className={COLOR[a.article].text}>{a.article}</span> {a.word}
          </div>
          <div
            className="mt-2 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center"
            aria-label="Anhören"
          >
            🔊
          </div>
        </button>
      ))}
    </div>
  );
}

/* ================= اللعبة ================= */
const makeRound = (animal) => ({
  animal,
  choices: shuffle([
    animal,
    ...shuffle(ANIMALS.filter((x) => x.word !== animal.word)).slice(0, 3),
  ]),
});

function Game() {
  const [order, setOrder] = useState(() => shuffle(ANIMALS));
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(() => makeRound(order[0]));
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | correct | wrong
  const [wrongWord, setWrongWord] = useState(null);
  const [drag, setDrag] = useState(null); // {word,x,y}
  const [over, setOver] = useState(false);
  const start = useRef({ x: 0, y: 0 });
  const timer = useRef(null);

  const finished = index >= order.length;
  const locked = status !== "idle";

  useEffect(() => {
    if (!finished) {
      const t = setTimeout(() => speak(round.animal.word), 300);
      return () => clearTimeout(t);
    }
  }, [index, finished]); // eslint-disable-line

  useEffect(() => () => clearTimeout(timer.current), []);

  const restart = () => {
    const o = shuffle(ANIMALS);
    setOrder(o);
    setIndex(0);
    setRound(makeRound(o[0]));
    setScore(0);
    setMissed(false);
    setStatus("idle");
  };

  const isOnTarget = (x, y) =>
    document.elementsFromPoint(x, y).some((el) => el.dataset?.drop === "target");

  const onDown = (e, word) => {
    if (locked) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ word, x: 0, y: 0 });
  };
  const onMove = (e) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX - start.current.x, y: e.clientY - start.current.y });
    setOver(isOnTarget(e.clientX, e.clientY));
  };
  const onUp = (e) => {
    if (!drag) return;
    const dropped = isOnTarget(e.clientX, e.clientY);
    const word = drag.word;
    setDrag(null);
    setOver(false);
    if (!dropped) return;

    if (word === round.animal.word) {
      setStatus("correct");
      if (!missed) setScore((s) => s + 1);
      speak(`${round.animal.article} ${round.animal.word}`);
      timer.current = setTimeout(() => {
        const next = index + 1;
        setIndex(next);
        if (next < order.length) setRound(makeRound(order[next]));
        setMissed(false);
        setStatus("idle");
      }, 1800);
    } else {
      setStatus("wrong");
      setWrongWord(word);
      setMissed(true);
      timer.current = setTimeout(() => {
        setStatus("idle");
        setWrongWord(null);
      }, 700);
    }
  };

  if (finished) {
    return (
      <div className="text-center py-16">
        <div className="text-7xl mb-4">🏆</div>
        <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Super!</h2>
        <p className="text-xl text-slate-600 mb-8">
          {score} / {order.length} richtig
        </p>
        <button
          onClick={restart}
          className="px-10 py-4 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-2xl font-bold shadow-lg active:scale-95 transition"
        >
          Nochmal
        </button>
      </div>
    );
  }

  const a = round.animal;
  const correct = status === "correct";

  return (
    <div className="flex flex-col items-center">
      {/* التقدم */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6">
        <span className="font-bold text-slate-700">
          {index + 1} / {order.length}
        </span>
        <div className="flex-1 mx-4 h-3 bg-amber-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all"
            style={{ width: `${(index / order.length) * 100}%` }}
          />
        </div>
        <span className="font-bold text-slate-700">⭐ {score}</span>
      </div>

      {/* كارت الاسم (المكان اللي بنسحب عليه) */}
      <div
        data-drop="target"
        className={`w-full max-w-sm rounded-3xl border-4 border-dashed p-5 text-center transition-all ${
          correct
            ? "border-transparent bg-white shadow-lg border-solid"
            : over
            ? "border-amber-500 bg-amber-100 scale-105"
            : "border-amber-400 bg-white"
        }`}
      >
        <div className="h-24 sm:h-28 flex items-center justify-center text-7xl sm:text-8xl">
          {correct ? <Pic animal={a} /> : <span className="text-slate-300">❔</span>}
        </div>
        <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-800">
          {correct && (
            <span className={`mr-2 ${COLOR[a.article].text}`}>{a.article}</span>
          )}
          {a.word}
        </div>
        <button
          onClick={() => speak(a.word)}
          className="mt-3 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-2xl shadow active:scale-95 transition"
          aria-label="Wort anhören"
        >
          🔊
        </button>
      </div>

      <p className="mt-6 mb-3 text-slate-600 font-semibold text-center">
        Zieh das richtige Bild auf die Karte!
      </p>

      {/* الصور */}
      <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {round.choices.map((c) => {
          const dragging = drag?.word === c.word;
          const hidden = correct && c.word === a.word;
          return (
            <div
              key={c.word}
              className="aspect-square rounded-2xl bg-amber-100/70 flex items-center justify-center"
            >
              {!hidden && (
                <div
                  onPointerDown={(e) => onDown(e, c.word)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  style={{
                    transform: dragging
                      ? `translate(${drag.x}px, ${drag.y}px) scale(1.15)`
                      : undefined,
                    zIndex: dragging ? 50 : 1,
                    position: "relative",
                  }}
                  className={`touch-none cursor-grab active:cursor-grabbing w-full h-full rounded-2xl bg-white border-4 border-amber-300 shadow-lg flex items-center justify-center text-6xl sm:text-7xl ${
                    wrongWord === c.word ? "shake border-slate-400" : ""
                  } ${dragging ? "" : "transition-transform"}`}
                >
                  <Pic animal={c} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
