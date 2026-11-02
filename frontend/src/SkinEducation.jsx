
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen, Layers, Droplets, ShieldCheck, Brain,
  CheckCircle, Bookmark, BookmarkCheck, Search,
  ChevronDown, ChevronUp, RotateCcw, Award,
  GraduationCap, Clock, CircleCheck, FlaskConical,
  Sun, HeartPulse, Microscope, Download
} from "lucide-react";
import "./SkinEducation.css";

const STORAGE_KEY = "dermalytix-education-v2";

const lessons = [
  {
    id: "anatomy",
    title: "Skin Anatomy",
    category: "Anatomy",
    level: "Beginner",
    duration: "15 min",
    icon: Layers,
    description: "Explore the structure and functions of human skin.",
    content: [
      {
        name: "Epidermis",
        detail: "The outermost skin layer. It provides a protective barrier and helps reduce water loss. Keratinocytes are its main cells."
      },
      {
        name: "Dermis",
        detail: "The middle layer. It contains collagen, elastin, blood vessels, nerves, hair follicles and glands."
      },
      {
        name: "Hypodermis",
        detail: "The deeper subcutaneous tissue, containing fat and connective tissue. It provides cushioning, insulation and energy storage."
      },
      {
        name: "Skin appendages",
        detail: "Hair follicles, sebaceous glands and sweat glands are structures associated with the skin."
      }
    ]
  },
  {
    id: "skin-types",
    title: "Understanding Skin Types",
    category: "Basics",
    level: "Beginner",
    duration: "10 min",
    icon: Droplets,
    description: "Learn the characteristics of common skin types.",
    content: [
      { name: "Normal skin", detail: "Generally balanced, without persistent excessive oiliness or dryness." },
      { name: "Oily skin", detail: "Produces more sebum and may look shiny, particularly around the forehead, nose and chin." },
      { name: "Dry skin", detail: "May feel tight, rough or flaky because of reduced moisture in the outer skin layer." },
      { name: "Combination skin", detail: "Has characteristics of more than one skin type, often oilier in the T-zone." },
      { name: "Sensitive skin", detail: "May react with itching, burning, redness or irritation. Sensitivity can occur with any skin type." }
    ]
  },
  {
    id: "skin-barrier",
    title: "The Skin Barrier",
    category: "Anatomy",
    level: "Intermediate",
    duration: "15 min",
    icon: ShieldCheck,
    description: "Understand how the outer skin barrier protects the body.",
    content: [
      { name: "Stratum corneum", detail: "The outermost part of the epidermis, made of corneocytes and surrounding lipids." },
      { name: "Barrier function", detail: "Helps limit water loss and protects against external irritants and microorganisms." },
      { name: "Ceramides", detail: "Lipids that help maintain the structure and function of the skin barrier." },
      { name: "Barrier disruption", detail: "Can contribute to dryness, irritation, tightness and increased sensitivity." }
    ]
  },
  {
    id: "acne",
    title: "Acne",
    category: "Conditions",
    level: "Beginner",
    duration: "12 min",
    icon: HeartPulse,
    description: "Understand acne, its features and common contributing factors.",
    content: [
      { name: "What is acne?", detail: "A common skin condition involving hair follicles and oil glands. It can cause blackheads, whiteheads, papules, pustules and deeper lesions." },
      { name: "Contributing factors", detail: "Excess sebum, follicular plugging, inflammation and the activity of Cutibacterium acnes can contribute." },
      { name: "Common areas", detail: "Face, chest, shoulders and back." },
      { name: "General management", detail: "Management may involve appropriate skincare and evidence-based topical or oral treatments selected by a healthcare professional." }
    ]
  },
  {
    id: "eczema",
    title: "Eczema",
    category: "Conditions",
    level: "Intermediate",
    duration: "12 min",
    icon: ShieldCheck,
    description: "Learn about eczema and its common symptoms.",
    content: [
      { name: "Overview", detail: "Eczema describes a group of inflammatory skin conditions. Atopic dermatitis is a common form." },
      { name: "Symptoms", detail: "Itching, dryness, redness and inflamed patches may occur." },
      { name: "Triggers", detail: "Irritants, allergens, weather and individual factors may contribute to flare-ups." },
      { name: "Care", detail: "Moisturizers and clinician-directed treatment can help manage symptoms." }
    ]
  },
  {
    id: "psoriasis",
    title: "Psoriasis",
    category: "Conditions",
    level: "Advanced",
    duration: "15 min",
    icon: Microscope,
    description: "Explore the immune-related mechanisms of psoriasis.",
    content: [
      { name: "Overview", detail: "Psoriasis is a chronic immune-mediated inflammatory condition that speeds up skin-cell turnover." },
      { name: "Features", detail: "It may cause well-defined plaques with scaling. Appearance varies by type and skin tone." },
      { name: "Mechanism", detail: "Immune signalling, including pathways involving IL-23 and IL-17, plays an important role." },
      { name: "Management", detail: "Treatment depends on severity and may include topical therapies, phototherapy or systemic medicines." }
    ]
  },
  {
    id: "pigmentation",
    title: "Skin Pigmentation",
    category: "Advanced",
    level: "Advanced",
    duration: "15 min",
    icon: Sun,
    description: "Study melanin, melanocytes and pigmentation changes.",
    content: [
      { name: "Melanin", detail: "A pigment that contributes to skin, hair and eye colour and helps protect against ultraviolet radiation." },
      { name: "Melanocytes", detail: "Cells in the epidermis that produce melanin." },
      { name: "Hyperpigmentation", detail: "Areas of skin become darker due to increased pigment or its distribution." },
      { name: "Hypopigmentation", detail: "Areas have reduced pigmentation. Causes vary and need appropriate assessment." }
    ]
  },
  {
    id: "fungal",
    title: "Fungal Skin Infections",
    category: "Conditions",
    level: "Intermediate",
    duration: "12 min",
    icon: Microscope,
    description: "Learn about common superficial fungal infections.",
    content: [
      { name: "Overview", detail: "Dermatophytes and yeasts can cause infections involving skin, hair or nails." },
      { name: "Features", detail: "Scaling, itching, redness and changes in skin appearance can occur." },
      { name: "Spread", detail: "Some fungal infections spread through direct contact or contaminated objects and surfaces." },
      { name: "Treatment", detail: "The appropriate antifungal treatment depends on the organism and site of infection." }
    ]
  },
  {
    id: "sun",
    title: "Sun Protection",
    category: "Prevention",
    level: "Beginner",
    duration: "10 min",
    icon: Sun,
    description: "Understand ultraviolet radiation and sun protection.",
    content: [
      { name: "UVA", detail: "UVA penetrates deeply into the skin and contributes to photoaging and skin damage." },
      { name: "UVB", detail: "UVB is a major cause of sunburn and contributes to skin cancer risk." },
      { name: "Sunscreen", detail: "Broad-spectrum sunscreen helps protect against UVA and UVB. Follow the label and reapply as directed." },
      { name: "Other protection", detail: "Shade, protective clothing and avoiding intense midday sun can reduce exposure." }
    ]
  },
  {
    id: "ingredients",
    title: "Skincare Ingredients",
    category: "Ingredients",
    level: "Intermediate",
    duration: "18 min",
    icon: FlaskConical,
    description: "Understand commonly used skincare ingredients.",
    content: [
      { name: "Hyaluronic acid", detail: "A humectant that attracts and holds water, helping skin feel hydrated." },
      { name: "Niacinamide", detail: "A form of vitamin B3 used in skincare for barrier support and other skin concerns." },
      { name: "Salicylic acid", detail: "A beta-hydroxy acid that can help unclog pores." },
      { name: "Retinoids", detail: "Vitamin A derivatives used for acne and other skin concerns. They can cause irritation and require appropriate precautions." },
      { name: "Ceramides", detail: "Lipids that support the skin barrier." },
      { name: "Vitamin C", detail: "An antioxidant used in skincare formulations." },
      { name: "Glycolic acid", detail: "An alpha-hydroxy acid used for exfoliation. It can increase irritation and sun sensitivity." },
      { name: "Benzoyl peroxide", detail: "An ingredient used in acne treatment that helps reduce acne-causing bacteria." }
    ]
  }
];

const anatomyLayers = [
  {
    name: "Epidermis",
    description: "The protective outer layer. It contains several sublayers, including the stratum corneum."
  },
  {
    name: "Dermis",
    description: "The supportive middle layer, containing collagen, elastin, nerves, vessels and skin appendages."
  },
  {
    name: "Hypodermis",
    description: "The deeper fatty connective tissue that cushions and insulates the body."
  }
];

const ingredientGuide = [
  ["Niacinamide", "Barrier support and appearance of uneven tone", "May be suitable for many skin types; introduce new products gradually."],
  ["Retinoids", "Acne and photoaging concerns", "May cause irritation. Pregnancy-related precautions are important; ask a clinician."],
  ["Hyaluronic acid", "Hydration", "A humectant commonly used in moisturizers and serums."],
  ["Salicylic acid", "Clogged pores and acne", "Can irritate or dry skin. Introduce carefully."],
  ["Ceramides", "Skin barrier support", "Commonly used in moisturizers."],
  ["Vitamin C", "Antioxidant skincare", "Formulations vary; irritation is possible."],
  ["Glycolic acid", "Exfoliation", "May irritate skin and increase sun sensitivity."],
  ["Benzoyl peroxide", "Acne", "Can cause dryness and bleach fabrics."]
];

const quizQuestions = [
  {
    question: "Which is the outermost layer of the skin?",
    options: ["Dermis", "Epidermis", "Hypodermis"],
    answer: "Epidermis",
    explanation: "The epidermis is the outermost layer and forms a protective barrier."
  },
  {
    question: "Which layer contains blood vessels and collagen?",
    options: ["Epidermis", "Dermis", "Stratum corneum"],
    answer: "Dermis",
    explanation: "The dermis contains connective tissue, blood vessels, nerves and skin appendages."
  },
  {
    question: "Which ingredient is a humectant?",
    options: ["Hyaluronic acid", "Benzoyl peroxide", "Retinoid"],
    answer: "Hyaluronic acid",
    explanation: "Hyaluronic acid attracts and holds water."
  },
  {
    question: "Which cells produce melanin?",
    options: ["Keratinocytes", "Melanocytes", "Fibroblasts"],
    answer: "Melanocytes",
    explanation: "Melanocytes produce the pigment melanin."
  },
  {
    question: "Which condition is immune-mediated?",
    options: ["Psoriasis", "Simple dryness", "A blackhead"],
    answer: "Psoriasis",
    explanation: "Psoriasis is a chronic immune-mediated inflammatory condition."
  },
  {
    question: "What is the main role of ceramides?",
    options: ["Increase skin pigmentation", "Support the skin barrier", "Remove all bacteria"],
    answer: "Support the skin barrier",
    explanation: "Ceramides are important lipids in the skin barrier."
  }
];

const flashcards = [
  ["What is the epidermis?", "The outermost protective layer of the skin."],
  ["What is collagen?", "A structural protein that provides strength and support to skin."],
  ["What is melanin?", "A pigment produced by melanocytes."],
  ["What is sebum?", "An oily substance produced by sebaceous glands."],
  ["What are ceramides?", "Lipids that help maintain the skin barrier."],
  ["What is the dermis?", "The skin layer containing collagen, blood vessels, nerves and hair follicles."],
  ["What is a humectant?", "An ingredient that attracts and holds water."]
];

const defaultProgress = {
  level: "Beginner",
  completed: [],
  bookmarks: [],
  quizBest: 0
};

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultProgress, ...(saved || {}) };
  } catch {
    return defaultProgress;
  }
}

export default function SkinEducation() {
  const [progress, setProgress] = useState(loadProgress);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState("Epidermis");
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const categories = ["All", ...new Set(lessons.map(item => item.category))];

  const filteredLessons = useMemo(() => {
    return lessons.filter(item => {
      const matchesSearch =
        `${item.title} ${item.description} ${item.category}`
          .toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      const matchesLevel =
        progress.level === "Beginner" ||
        progress.level === "Intermediate" ||
        item.level !== "Beginner" ||
        progress.level === "Advanced";
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [search, category, progress.level]);

  const completedCount = progress.completed.length;
  const progressPercent = Math.round((completedCount / lessons.length) * 100);
  const quizScore = quizQuestions.filter(
    (question, index) => answers[index] === question.answer
  ).length;

  const toggleBookmark = id => {
    setProgress(previous => ({
      ...previous,
      bookmarks: previous.bookmarks.includes(id)
        ? previous.bookmarks.filter(item => item !== id)
        : [...previous.bookmarks, id]
    }));
  };

  const markComplete = id => {
    setProgress(previous => ({
      ...previous,
      completed: previous.completed.includes(id)
        ? previous.completed
        : [...previous.completed, id]
    }));
  };

  const resetQuiz = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const submitQuiz = () => {
    setSubmitted(true);
    setProgress(previous => ({
      ...previous,
      quizBest: Math.max(previous.quizBest, quizScore)
    }));
  };

  const certificateReady = completedCount === lessons.length && progress.quizBest >= 4;

  return (
    <main className="skin-education">
      <header className="education-hero">
        <div>
          <span className="education-eyebrow">DERMALYTIX LEARNING CENTRE</span>
          <h1>Skin Education</h1>
          <p>Explore the science of skin, understand common conditions and build your knowledge.</p>
          <div className="education-hero-meta">
            <span><BookOpen size={16} /> {lessons.length} lessons</span>
            <span><Clock size={16} /> Self-paced learning</span>
            <span><GraduationCap size={16} /> Beginner to advanced</span>
          </div>
        </div>
        <div className="education-hero-icon"><Brain size={54} /></div>
      </header>

      <section className="education-stats">
        <article className="education-stat">
          <BookOpen />
          <div><strong>{lessons.length}</strong><span>Total lessons</span></div>
        </article>
        <article className="education-stat">
          <CircleCheck />
          <div><strong>{completedCount}</strong><span>Completed</span></div>
        </article>
        <article className="education-stat">
          <Bookmark />
          <div><strong>{progress.bookmarks.length}</strong><span>Bookmarks</span></div>
        </article>
        <article className="education-stat">
          <Award />
          <div><strong>{progress.quizBest}/{quizQuestions.length}</strong><span>Best quiz score</span></div>
        </article>
      </section>

      <section className="education-progress-panel">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">YOUR JOURNEY</span><h2>Learning Progress</h2></div>
          <strong>{progressPercent}%</strong>
        </div>
        <div className="education-progress-track">
          <div style={{ width: `${progressPercent}%` }} />
        </div>
        <p>{completedCount} of {lessons.length} lessons completed. Keep learning at your own pace.</p>
      </section>

      <section className="education-level-panel">
        <div>
          <h2>Choose your learning level</h2>
          <p>Change the level to explore lessons suited to your knowledge.</p>
        </div>
        <div className="education-level-buttons">
          {["Beginner", "Intermediate", "Advanced"].map(level => (
            <button
              key={level}
              className={progress.level === level ? "active" : ""}
              onClick={() => setProgress(previous => ({ ...previous, level }))}
            >
              {level}
            </button>
          ))}
        </div>
      </section>

      <section className="education-section">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">EXPLORE</span><h2>Learning Library</h2></div>
        </div>
        <div className="education-search-row">
          <div className="education-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search lessons..."
            />
          </div>
          <select value={category} onChange={event => setCategory(event.target.value)}>
            {categories.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>

        <div className="education-grid">
          {filteredLessons.map(lesson => {
            const Icon = lesson.icon;
            const isOpen = expanded === lesson.id;
            const isComplete = progress.completed.includes(lesson.id);
            const isSaved = progress.bookmarks.includes(lesson.id);

            return (
              <article className="education-card" key={lesson.id}>
                <div className="education-card-top">
                  <div className="education-card-icon"><Icon size={23} /></div>
                  <button
                    className="education-bookmark"
                    onClick={() => toggleBookmark(lesson.id)}
                    aria-label={isSaved ? "Remove bookmark" : "Bookmark lesson"}
                  >
                    {isSaved ? <BookmarkCheck /> : <Bookmark />}
                  </button>
                </div>
                <div className="education-card-tags">
                  <span>{lesson.level}</span><span>{lesson.duration}</span>
                </div>
                <h3>{lesson.title}</h3>
                <p>{lesson.description}</p>
                <button
                  className="education-primary-button"
                  onClick={() => setExpanded(isOpen ? null : lesson.id)}
                >
                  {isOpen ? "Close lesson" : "Explore lesson"}
                  {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
                {isOpen && (
                  <div className="education-lesson-content">
                    {lesson.content.map(section => (
                      <div className="education-detail" key={section.name}>
                        <h4>{section.name}</h4><p>{section.detail}</p>
                      </div>
                    ))}
                    <button
                      className="education-complete-button"
                      onClick={() => markComplete(lesson.id)}
                      disabled={isComplete}
                    >
                      <CheckCircle size={17} />
                      {isComplete ? "Lesson completed" : "Mark as completed"}
                    </button>
                  </div>
                )}
                {isComplete && <span className="education-completed-label"><CheckCircle size={14} /> Completed</span>}
              </article>
            );
          })}
        </div>
        {filteredLessons.length === 0 && <p className="education-empty">No lessons match your search.</p>}
      </section>

      <section className="education-section anatomy-panel">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">INTERACTIVE LEARNING</span><h2>Explore Skin Anatomy</h2></div>
          <Layers size={28} />
        </div>
        <p className="education-muted">Select a skin layer to learn about its structure and function.</p>
        <div className="anatomy-layout">
          <div className="anatomy-diagram">
            <button className={`anatomy-layer epidermis ${selectedLayer === "Epidermis" ? "selected" : ""}`} onClick={() => setSelectedLayer("Epidermis")}>Epidermis</button>
            <button className={`anatomy-layer dermis ${selectedLayer === "Dermis" ? "selected" : ""}`} onClick={() => setSelectedLayer("Dermis")}>Dermis</button>
            <button className={`anatomy-layer hypodermis ${selectedLayer === "Hypodermis" ? "selected" : ""}`} onClick={() => setSelectedLayer("Hypodermis")}>Hypodermis</button>
          </div>
          <div className="anatomy-description">
            <span className="education-eyebrow">SELECTED LAYER</span>
            <h3>{selectedLayer}</h3>
            <p>{anatomyLayers.find(layer => layer.name === selectedLayer)?.description}</p>
          </div>
        </div>
      </section>

      <section className="education-section">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">INGREDIENT REFERENCE</span><h2>Skincare Ingredient Guide</h2></div>
          <FlaskConical size={27} />
        </div>
        <div className="ingredient-grid">
          {ingredientGuide.map(([name, benefit, caution]) => (
            <article className="ingredient-card" key={name}>
              <h3>{name}</h3>
              <p><strong>Common use:</strong> {benefit}</p>
              <p><strong>Note:</strong> {caution}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="education-section">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">ACTIVE RECALL</span><h2>Learning Flashcards</h2></div>
          <Brain size={27} />
        </div>
        <div className="education-flashcard" onClick={() => setShowAnswer(value => !value)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") setShowAnswer(value => !value); }}>
          <span>{showAnswer ? "ANSWER" : "QUESTION"} · {flashIndex + 1}/{flashcards.length}</span>
          <h3>{showAnswer ? flashcards[flashIndex][1] : flashcards[flashIndex][0]}</h3>
          <p>Click the card to {showAnswer ? "see the question" : "reveal the answer"}.</p>
        </div>
        <div className="education-flash-controls">
          <button onClick={() => { setFlashIndex(index => (index + flashcards.length - 1) % flashcards.length); setShowAnswer(false); }}>Previous</button>
          <button onClick={() => { setFlashIndex(index => (index + 1) % flashcards.length); setShowAnswer(false); }}>Next card</button>
        </div>
      </section>

      <section className="education-section">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">CHECK YOUR KNOWLEDGE</span><h2>Skin Knowledge Quiz</h2></div>
          <Brain size={27} />
        </div>
        {quizQuestions.map((question, index) => (
          <div className="education-question" key={question.question}>
            <h3>{index + 1}. {question.question}</h3>
            {question.options.map(option => (
              <label className="education-option" key={option}>
                <input
                  type="radio"
                  name={`education-question-${index}`}
                  checked={answers[index] === option}
                  disabled={submitted}
                  onChange={() => setAnswers(previous => ({ ...previous, [index]: option }))}
                />
                {option}
              </label>
            ))}
            {submitted && (
              <p className={answers[index] === question.answer ? "education-correct" : "education-wrong"}>
                {answers[index] === question.answer ? "Correct! " : `Correct answer: ${question.answer}. `}
                {question.explanation}
              </p>
            )}
          </div>
        ))}
        {!submitted ? (
          <button className="education-primary-button quiz-submit" disabled={Object.keys(answers).length !== quizQuestions.length} onClick={submitQuiz}>Submit quiz</button>
        ) : (
          <div className="education-quiz-result">
            <Award size={25} />
            <div><h3>Your score: {quizScore}/{quizQuestions.length}</h3><p>Your best score: {Math.max(progress.quizBest, quizScore)}/{quizQuestions.length}</p></div>
            <button onClick={resetQuiz}><RotateCcw size={16} /> Try again</button>
          </div>
        )}
      </section>

      <section className="education-section">
        <div className="education-section-heading">
          <div><span className="education-eyebrow">SAVED FOR LATER</span><h2>My Bookmarks</h2></div>
          <Bookmark size={27} />
        </div>
        {progress.bookmarks.length === 0 ? (
          <p className="education-muted">You have not bookmarked any lessons yet. Use the bookmark icon on a lesson to save it.</p>
        ) : (
          <div className="education-bookmark-list">
            {progress.bookmarks.map(id => {
              const lesson = lessons.find(item => item.id === id);
              if (!lesson) return null;
              return (
                <div key={id}>
                  <span>{lesson.title}</span>
                  <button onClick={() => { setExpanded(id); document.querySelector(".education-grid")?.scrollIntoView({ behavior: "smooth" }); }}>Open lesson</button>
                  <button onClick={() => toggleBookmark(id)} aria-label={`Remove ${lesson.title}`}><BookmarkCheck size={18} /></button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="education-certificate-panel">
        <div><Award size={34} /><div><h2>Course Completion Certificate</h2><p>Complete all lessons and score at least 4 out of 6 in the quiz to unlock your printable certificate.</p></div></div>
        <button disabled={!certificateReady} onClick={() => setShowCertificate(true)}>
          <Download size={17} /> {certificateReady ? "View certificate" : "Certificate locked"}
        </button>
        {showCertificate && (
          <div className="education-certificate">
            <span>DERMALYTIX · LEARNING CENTRE</span>
            <Award size={50} />
            <h2>Certificate of Completion</h2>
            <p>This certificate recognises the successful completion of</p>
            <h3>Skin Education Course</h3>
            <p>All learning modules completed · Quiz score: {progress.quizBest}/{quizQuestions.length}</p>
            <p>Completion date: {new Date().toLocaleDateString()}</p>
            <p className="certificate-note">Educational achievement certificate — not a professional qualification or clinical accreditation.</p>
            <button onClick={() => window.print()}>Print / Save as PDF</button>
            <button onClick={() => setShowCertificate(false)}>Close</button>
          </div>
        )}
      </section>

      <section className="education-references">
        <h3>Further reading</h3>
        <p>Use reputable medical sources to continue learning:</p>
        <ul>
          <li><a href="https://www.aad.org/" target="_blank" rel="noreferrer">American Academy of Dermatology</a></li>
          <li><a href="https://dermnetnz.org/" target="_blank" rel="noreferrer">DermNet New Zealand</a></li>
          <li><a href="https://www.nhs.uk/conditions/" target="_blank" rel="noreferrer">NHS health information</a></li>
          <li><a href="https://www.ncbi.nlm.nih.gov/books/" target="_blank" rel="noreferrer">NCBI Bookshelf</a></li>
        </ul>
      </section>

      <p className="education-disclaimer">
        Medical education only. This content does not diagnose skin conditions or replace professional medical advice. Consult a qualified healthcare professional for personal concerns.
      </p>
    </main>
  );
}
