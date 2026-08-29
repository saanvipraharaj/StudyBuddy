import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";


function TopicDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [topic, setTopic] = useState(null);
    const [learningContent, setLearningContent] = useState(null);
    const [test, setTest] = useState(null);

    const [flashcards, setFlashcards] = useState([]);
    const [currentFlashcard, setCurrentFlashcard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const [activeSection, setActiveSection] = useState("notes");

    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatingTest, setGeneratingTest] = useState(false);
    const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
    const [reviewingFlashcard, setReviewingFlashcard] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");


    // =========================================================
    // AUTH
    // =========================================================

    const getToken = () => {
        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };


    const getAuthHeaders = () => {
        return {
            Authorization: `Bearer ${getToken()}`
        };
    };


    // =========================================================
    // FETCH TOPIC
    // =========================================================

    const fetchTopic = async () => {
        try {
            const response = await api.get(
                `/api/topics/${id}`,
                {
                    headers: getAuthHeaders()
                }
            );

            setTopic(response.data.topic);

        } catch (error) {
            console.error("Fetch topic error:", error);

            setMessage(
                error.response?.data?.message ||
                "Unable to load topic."
            );

            setMessageType("error");
        }
    };


    // =========================================================
    // FETCH LEARNING CONTENT
    // =========================================================

    const fetchLearningContent = async () => {
        try {
            const response = await api.get(
                `/api/topic-learning/${id}`,
                {
                    headers: getAuthHeaders()
                }
            );

            if (
                response.data.exists &&
                response.data.content
            ) {
                setLearningContent(
                    response.data.content
                );
            } else {
                setLearningContent(null);
            }

        } catch (error) {
            console.error(
                "Fetch learning content error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to load learning content."
            );

            setMessageType("error");
        }
    };


    // =========================================================
    // FETCH TEST
    // =========================================================

    const fetchTest = async () => {
        try {
            const response = await api.get(
                `/api/tests/topic/${id}`,
                {
                    headers: getAuthHeaders()
                }
            );

            const tests =
                response.data.tests || [];

            if (tests.length > 0) {
                setTest(tests[0]);
            } else {
                setTest(null);
            }

        } catch (error) {
            console.error(
                "Fetch topic test error:",
                error
            );
        }
    };


    // =========================================================
    // FETCH FLASHCARDS
    // =========================================================

    const fetchFlashcards = async () => {
        try {
            const response = await api.get(
                `/api/flashcards/topic/${id}`,
                {
                    headers: getAuthHeaders()
                }
            );

            setFlashcards(
                response.data.flashcards || []
            );

            setCurrentFlashcard(0);
            setIsFlipped(false);

        } catch (error) {
            console.error(
                "Fetch flashcards error:",
                error
            );
        }
    };


    // =========================================================
    // LOAD PAGE
    // =========================================================

    useEffect(() => {

        const loadPage = async () => {

            const token = getToken();

            if (!token) {
                navigate("/login");
                return;
            }

            await Promise.all([
                fetchTopic(),
                fetchLearningContent(),
                fetchTest(),
                fetchFlashcards()
            ]);

            setLoading(false);
        };

        loadPage();

    }, [id]);


    // =========================================================
    // GENERATE STUDY NOTES
    // =========================================================

    const handleGenerateNotes = async () => {

        if (learningContent) {
            setMessage(
                "Study notes already exist for this topic."
            );

            setMessageType("error");
            return;
        }

        const confirmed = window.confirm(
            "Generate study notes for this topic using all PDFs uploaded for the chapter?"
        );

        if (!confirmed) return;

        try {

            setGenerating(true);

            setMessage(
                "AI is generating your study notes..."
            );

            setMessageType("success");

            const response = await api.post(
                `/api/topic-learning/generate/${id}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            setLearningContent(
                response.data.content
            );

            setActiveSection("notes");

            setMessage(
                response.data.message ||
                "Study notes generated successfully."
            );

            setMessageType("success");

        } catch (error) {

            console.error(
                "Generate learning content error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to generate study notes."
            );

            setMessageType("error");

        } finally {
            setGenerating(false);
        }
    };


    // =========================================================
    // GENERATE FLASHCARDS
    // =========================================================

    const handleGenerateFlashcards = async () => {

        if (!learningContent) {
            setMessage(
                "Generate study notes before creating flashcards."
            );

            setMessageType("error");
            return;
        }

        if (flashcards.length > 0) {
            setMessage(
                "Flashcards already exist for this topic."
            );

            setMessageType("error");
            return;
        }

        const confirmed =
            window.confirm(
                "Generate flashcards for this topic?"
            );

        if (!confirmed) return;

        try {

            setGeneratingFlashcards(true);

            setMessage(
                "AI is generating flashcards..."
            );

            setMessageType("success");

            const response = await api.post(
                `/api/flashcards/generate/${id}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            setFlashcards(
                response.data.flashcards || []
            );

            setCurrentFlashcard(0);
            setIsFlipped(false);
            setActiveSection("flashcards");

            setMessage(
                response.data.message ||
                "Flashcards generated successfully."
            );

            setMessageType("success");

        } catch (error) {

            console.error(
                "Generate flashcards error:",
                error
            );

            if (error.response?.status === 409) {

                await fetchFlashcards();

                setMessage(
                    "Flashcards are ready."
                );

                setMessageType("success");
                return;
            }

            setMessage(
                error.response?.data?.message ||
                "Unable to generate flashcards."
            );

            setMessageType("error");

        } finally {
            setGeneratingFlashcards(false);
        }
    };


    // =========================================================
    // FLASHCARD CONTROLS
    // =========================================================

    const handleFlipFlashcard = () => {
        if (reviewingFlashcard) return;

        setIsFlipped(
            previous => !previous
        );
    };


    const handleNextFlashcard = () => {

        if (
            flashcards.length === 0 ||
            reviewingFlashcard
        ) {
            return;
        }

        setCurrentFlashcard(
            previous =>
                previous === flashcards.length - 1
                    ? 0
                    : previous + 1
        );

        setIsFlipped(false);
    };


    const handlePreviousFlashcard = () => {

        if (
            flashcards.length === 0 ||
            reviewingFlashcard
        ) {
            return;
        }

        setCurrentFlashcard(
            previous =>
                previous === 0
                    ? flashcards.length - 1
                    : previous - 1
        );

        setIsFlipped(false);
    };


    // =========================================================
    // REVIEW FLASHCARD
    // =========================================================

    const handleReviewFlashcard = async (rating) => {

        const activeFlashcard =
            flashcards[currentFlashcard];

        if (
            !activeFlashcard ||
            reviewingFlashcard
        ) {
            return;
        }

        try {

            setReviewingFlashcard(true);

            const response = await api.post(
                `/api/flashcards/${activeFlashcard.id}/review`,
                {
                    rating
                },
                {
                    headers: getAuthHeaders()
                }
            );

            const updatedFlashcard =
                response.data.flashcard;

            setFlashcards(
                previousFlashcards =>
                    previousFlashcards.map(
                        flashcard =>
                            Number(flashcard.id) ===
                            Number(updatedFlashcard.id)
                                ? updatedFlashcard
                                : flashcard
                    )
            );

            if (rating === "again") {
                setMessage(
                    "We'll bring this card back sooner."
                );
            }

            if (rating === "good") {
                setMessage(
                    "Nice — this card has been added to your review schedule."
                );
            }

            if (rating === "easy") {
                setMessage(
                    "Great — you seem confident with this one."
                );
            }

            setMessageType("success");

            if (flashcards.length > 1) {
                setCurrentFlashcard(
                    previous =>
                        previous === flashcards.length - 1
                            ? 0
                            : previous + 1
                );
            }

            setIsFlipped(false);

        } catch (error) {

            console.error(
                "Review flashcard error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to save flashcard review."
            );

            setMessageType("error");

        } finally {
            setReviewingFlashcard(false);
        }
    };


    // =========================================================
    // GENERATE TEST
    // =========================================================

    const handleGenerateTest = async () => {

        if (!learningContent) {
            setMessage(
                "Generate and study the learning content before creating the topic test."
            );

            setMessageType("error");
            return;
        }

        if (test) {
            setMessage(
                "A topic test already exists."
            );

            setMessageType("error");
            return;
        }

        const confirmed =
            window.confirm(
                "Generate a mandatory 10-question test for this topic?"
            );

        if (!confirmed) return;

        try {

            setGeneratingTest(true);

            setMessage(
                "AI is generating your topic test..."
            );

            setMessageType("success");

            const response = await api.post(
                `/api/tests/generate/${id}`,
                {},
                {
                    headers: getAuthHeaders()
                }
            );

            setTest(
                response.data.test
            );

            setMessage(
                response.data.message ||
                "Topic test generated successfully."
            );

            setMessageType("success");

        } catch (error) {

            console.error(
                "Generate topic test error:",
                error
            );

            if (
                error.response?.status === 409 &&
                error.response?.data?.test
            ) {
                setTest(
                    error.response.data.test
                );

                setMessage(
                    "Topic test is ready."
                );

                setMessageType("success");
                return;
            }

            setMessage(
                error.response?.data?.message ||
                "Unable to generate topic test."
            );

            setMessageType("error");

        } finally {
            setGeneratingTest(false);
        }
    };


    const handleStartTest = () => {

        if (!test) {
            setMessage(
                "Generate the topic test first."
            );

            setMessageType("error");
            return;
        }

        navigate(
            `/tests/${test.id}`
        );
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingCard}>
                    <div style={styles.loadingDot}></div>

                    <h2 style={styles.loadingTitle}>
                        Loading Topic
                    </h2>

                    <p style={styles.muted}>
                        Preparing your study space...
                    </p>
                </div>
            </div>
        );
    }


    if (!topic) {
        return (
            <div style={styles.centerPage}>
                <div style={styles.loadingCard}>
                    <h2 style={styles.loadingTitle}>
                        Topic unavailable
                    </h2>

                    <p style={styles.muted}>
                        {message || "Topic not found."}
                    </p>
                </div>
            </div>
        );
    }


    const activeFlashcard =
        flashcards[currentFlashcard];


    const tabs = [
        {
            key: "notes",
            label: "Study Notes",
            icon: "✦"
        },
        {
            key: "concepts",
            label: "Key Concepts",
            icon: "◇"
        },
        {
            key: "examples",
            label: "Examples",
            icon: "⌁"
        },
        {
            key: "points",
            label: "Important Points",
            icon: "★"
        },
        {
            key: "flashcards",
            label: "Flashcards",
            icon: "▣"
        }
    ];


    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="sb-mobile-page" style={styles.page}>

            <div className="sb-mobile-container" style={styles.container}>

                {/* TOP NAV */}

                <div className="sb-mobile-nav" style={styles.topNav}>

                    <button
                        onClick={() =>
                            navigate(
                                `/chapters/${topic.chapter_id}`
                            )
                        }
                        style={styles.backButton}
                    >
                        <span style={styles.backArrow}>
                            ←
                        </span>

                        Back to Chapter
                    </button>


                    <button
                        onClick={() =>
                            navigate("/dashboard")
                        }
                        style={styles.dashboardButton}
                    >
                        Dashboard
                    </button>

                </div>


                {/* HERO */}

                <section className="sb-mobile-hero" style={styles.hero}>

                    <div style={styles.heroGlow}></div>

                    <div className="sb-mobile-hero-content" style={styles.heroContent}>

                        <div style={styles.topicBadge}>
                            TOPIC {topic.topic_number}
                        </div>

                        <h1 className="sb-mobile-title" style={styles.title}>
                            {topic.name}
                        </h1>

                        <p style={styles.description}>
                            {topic.description ||
                                "Learn this topic with AI-powered notes, concepts, flashcards and tests."}
                        </p>

                    </div>


                    <div className="sb-mobile-hero-stats" style={styles.heroStats}>

                        <div style={styles.statCard}>
                            <span style={styles.statIcon}>
                                ◷
                            </span>

                            <div>
                                <p style={styles.statLabel}>
                                    STUDY TIME
                                </p>

                                <h3 style={styles.statValue}>
                                    {topic.estimated_minutes || 30} min
                                </h3>
                            </div>
                        </div>


                        <div style={styles.statCard}>
                            <span style={styles.statIcon}>
                                ●
                            </span>

                            <div>
                                <p style={styles.statLabel}>
                                    STATUS
                                </p>

                                <h3 style={styles.statValue}>
                                    {topic.is_active
                                        ? "Active"
                                        : "Inactive"}
                                </h3>
                            </div>
                        </div>


                        <div style={styles.statCard}>
                            <span style={styles.statIcon}>
                                ▣
                            </span>

                            <div>
                                <p style={styles.statLabel}>
                                    FLASHCARDS
                                </p>

                                <h3 style={styles.statValue}>
                                    {flashcards.length}
                                </h3>
                            </div>
                        </div>

                    </div>

                </section>


                {/* MESSAGE */}

                {message && (
                    <div
                        style={{
                            ...styles.message,

                            ...(messageType === "error"
                                ? styles.errorMessage
                                : styles.successMessage)
                        }}
                    >
                        <span>
                            {messageType === "error"
                                ? "!"
                                : "✓"}
                        </span>

                        {message}
                    </div>
                )}


                {/* NO CONTENT */}

                {!learningContent ? (

                    <section style={styles.emptyLearningCard}>

                        <div style={styles.aiIcon}>
                            ✦
                        </div>

                        <p style={styles.eyebrow}>
                            AI LEARNING STUDIO
                        </p>

                        <h2 style={styles.sectionTitle}>
                            Learn this topic with StudyBuddy
                        </h2>

                        <p style={styles.sectionDescription}>
                            StudyBuddy will analyse all PDFs
                            uploaded to this chapter and build
                            a complete learning pack specifically
                            for this topic.
                        </p>


                        <div className="sb-mobile-grid-2" style={styles.featureGrid}>

                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>
                                    ✎
                                </span>

                                <div>
                                    <strong>
                                        Study Notes
                                    </strong>

                                    <p>
                                        Detailed AI-generated explanations
                                    </p>
                                </div>
                            </div>


                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>
                                    ◇
                                </span>

                                <div>
                                    <strong>
                                        Key Concepts
                                    </strong>

                                    <p>
                                        Important ideas simplified
                                    </p>
                                </div>
                            </div>


                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>
                                    ⌁
                                </span>

                                <div>
                                    <strong>
                                        Examples
                                    </strong>

                                    <p>
                                        Practical examples for understanding
                                    </p>
                                </div>
                            </div>


                            <div style={styles.feature}>
                                <span style={styles.featureIcon}>
                                    ▣
                                </span>

                                <div>
                                    <strong>
                                        Flashcards
                                    </strong>

                                    <p>
                                        AI-powered active recall
                                    </p>
                                </div>
                            </div>

                        </div>


                        <button
                            onClick={handleGenerateNotes}
                            disabled={generating}
                            style={{
                                ...styles.primaryButton,
                                ...(generating
                                    ? styles.disabledPrimary
                                    : {})
                            }}
                        >
                            <span>
                                ✦
                            </span>

                            {generating
                                ? "Generating your study pack..."
                                : "Generate Study Notes"}
                        </button>

                    </section>

                ) : (

                    <>

                        {/* TABS */}

                        <div className="sb-mobile-tabs" style={styles.tabs}>

                            {tabs.map(tab => (

                                <button
                                    key={tab.key}
                                    onClick={() => {
                                        setActiveSection(tab.key);

                                        if (
                                            tab.key ===
                                            "flashcards"
                                        ) {
                                            setIsFlipped(false);
                                        }
                                    }}
                                    style={{
                                        ...styles.tab,

                                        ...(activeSection === tab.key
                                            ? styles.activeTab
                                            : {})
                                    }}
                                >
                                    <span>
                                        {tab.icon}
                                    </span>

                                    {tab.label}

                                    {tab.key === "flashcards" &&
                                        flashcards.length > 0 && (
                                            <span
                                                style={
                                                    styles.tabCount
                                                }
                                            >
                                                {flashcards.length}
                                            </span>
                                        )}

                                </button>

                            ))}

                        </div>


                        {/* NOTES */}

                        {activeSection === "notes" && (

                            <section style={styles.contentCard}>

                                <SectionHeader
                                    eyebrow="AI STUDY MATERIAL"
                                    title="Study Notes"
                                    description="Your complete AI-generated notes for this topic."
                                />

                                <div style={styles.notesText}>
                                    {learningContent.notes ||
                                        "No notes available."}
                                </div>

                            </section>

                        )}


                        {/* CONCEPTS */}

                        {activeSection === "concepts" && (

                            <section style={styles.contentCard}>

                                <SectionHeader
                                    eyebrow="CORE KNOWLEDGE"
                                    title="Key Concepts"
                                    description="The concepts you should understand before moving forward."
                                />


                                {Array.isArray(
                                    learningContent.key_concepts
                                ) &&
                                learningContent.key_concepts.length > 0 ? (

                                    <div className="sb-mobile-grid-2" style={styles.contentGrid}>

                                        {learningContent.key_concepts.map(
                                            (concept, index) => (

                                                <div
                                                    key={index}
                                                    style={
                                                        styles.conceptCard
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.numberBadge
                                                        }
                                                    >
                                                        {String(index + 1)
                                                            .padStart(2, "0")}
                                                    </div>

                                                    <h3
                                                        style={
                                                            styles.itemTitle
                                                        }
                                                    >
                                                        {concept.name}
                                                    </h3>

                                                    <p
                                                        style={
                                                            styles.itemText
                                                        }
                                                    >
                                                        {
                                                            concept.explanation
                                                        }
                                                    </p>

                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <EmptyState
                                        text="No key concepts available."
                                    />

                                )}

                            </section>

                        )}


                        {/* EXAMPLES */}

                        {activeSection === "examples" && (

                            <section style={styles.contentCard}>

                                <SectionHeader
                                    eyebrow="PUT IT INTO PRACTICE"
                                    title="Examples"
                                    description="Use these examples to connect the theory with practical understanding."
                                />


                                {Array.isArray(
                                    learningContent.examples
                                ) &&
                                learningContent.examples.length > 0 ? (

                                    <div style={styles.contentList}>

                                        {learningContent.examples.map(
                                            (example, index) => (

                                                <div
                                                    key={index}
                                                    style={
                                                        styles.exampleCard
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.exampleNumber
                                                        }
                                                    >
                                                        {index + 1}
                                                    </div>

                                                    <div>
                                                        <h3
                                                            style={
                                                                styles.itemTitle
                                                            }
                                                        >
                                                            {
                                                                example.title
                                                            }
                                                        </h3>

                                                        <p
                                                            style={
                                                                styles.itemText
                                                            }
                                                        >
                                                            {
                                                                example.example
                                                            }
                                                        </p>
                                                    </div>

                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <EmptyState
                                        text="No examples available."
                                    />

                                )}

                            </section>

                        )}


                        {/* IMPORTANT POINTS */}

                        {activeSection === "points" && (

                            <section style={styles.contentCard}>

                                <SectionHeader
                                    eyebrow="REMEMBER THESE"
                                    title="Important Points"
                                    description="High-value points to remember for revision and exams."
                                />


                                {Array.isArray(
                                    learningContent.important_points
                                ) &&
                                learningContent.important_points.length > 0 ? (

                                    <div style={styles.pointsList}>

                                        {learningContent.important_points.map(
                                            (point, index) => (

                                                <div
                                                    key={index}
                                                    style={
                                                        styles.pointCard
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.checkIcon
                                                        }
                                                    >
                                                        ✓
                                                    </div>

                                                    <p
                                                        style={
                                                            styles.pointText
                                                        }
                                                    >
                                                        {point}
                                                    </p>

                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <EmptyState
                                        text="No important points available."
                                    />

                                )}

                            </section>

                        )}


                        {/* FLASHCARDS */}

                        {activeSection === "flashcards" && (

                            <section style={styles.contentCard}>

                                <div style={styles.flashcardHeader}>

                                    <SectionHeader
                                        eyebrow="ACTIVE RECALL"
                                        title="Flashcards"
                                        description="Flip each card, recall the answer and rate how well you knew it."
                                    />


                                    {flashcards.length > 0 && (
                                        <div
                                            style={
                                                styles.flashcardCount
                                            }
                                        >
                                            {currentFlashcard + 1}
                                            <span>/</span>
                                            {flashcards.length}
                                        </div>
                                    )}

                                </div>


                                {flashcards.length === 0 ? (

                                    <div style={styles.flashcardEmpty}>

                                        <div
                                            style={
                                                styles.emptyFlashcardIcon
                                            }
                                        >
                                            ▣
                                        </div>

                                        <h3 style={styles.emptyTitle}>
                                            No flashcards yet
                                        </h3>

                                        <p style={styles.emptyText}>
                                            Generate flashcards from your
                                            AI study notes to start active
                                            recall practice.
                                        </p>

                                        <button
                                            onClick={
                                                handleGenerateFlashcards
                                            }
                                            disabled={
                                                generatingFlashcards
                                            }
                                            style={styles.primaryButton}
                                        >
                                            ✦{" "}

                                            {generatingFlashcards
                                                ? "Generating Flashcards..."
                                                : "Generate Flashcards"}
                                        </button>

                                    </div>

                                ) : (

                                    <>

                                        <div style={styles.flashcardScene}>

                                            <div
                                                onClick={
                                                    handleFlipFlashcard
                                                }
                                                style={{
                                                    ...styles.flashcard,

                                                    transform:
                                                        isFlipped
                                                            ? "rotateY(180deg)"
                                                            : "rotateY(0deg)"
                                                }}
                                            >

                                                {/* FRONT */}

                                                <div
                                                    style={{
                                                        ...styles.flashcardFace,
                                                        ...styles.flashcardFront
                                                    }}
                                                >
                                                    <span
                                                        style={
                                                            styles.cardLabel
                                                        }
                                                    >
                                                        QUESTION
                                                    </span>

                                                    <h2
                                                        style={
                                                            styles.flashcardQuestion
                                                        }
                                                    >
                                                        {
                                                            activeFlashcard
                                                                ?.question
                                                        }
                                                    </h2>

                                                    <p
                                                        style={
                                                            styles.flipHint
                                                        }
                                                    >
                                                        Click anywhere
                                                        to reveal answer
                                                    </p>
                                                </div>


                                                {/* BACK */}

                                                <div
                                                    style={{
                                                        ...styles.flashcardFace,
                                                        ...styles.flashcardBack
                                                    }}
                                                >
                                                    <span
                                                        style={
                                                            styles.cardLabel
                                                        }
                                                    >
                                                        ANSWER
                                                    </span>

                                                    <p
                                                        style={
                                                            styles.flashcardAnswer
                                                        }
                                                    >
                                                        {
                                                            activeFlashcard
                                                                ?.answer
                                                        }
                                                    </p>

                                                    <p
                                                        style={
                                                            styles.flipHint
                                                        }
                                                    >
                                                        Click to see
                                                        question again
                                                    </p>
                                                </div>

                                            </div>

                                        </div>


                                        <div style={styles.flashcardMeta}>
                                            Difficulty{" "}
                                            <span style={styles.difficultyBadge}>
                                                {activeFlashcard?.difficulty ||
                                                    "medium"}
                                            </span>
                                        </div>


                                        {isFlipped && (

                                            <div style={styles.reviewSection}>

                                                <p
                                                    style={
                                                        styles.reviewTitle
                                                    }
                                                >
                                                    How well did you know this?
                                                </p>


                                                <div
                                                    style={
                                                        styles.reviewButtons
                                                    }
                                                >

                                                    <button
                                                        onClick={() =>
                                                            handleReviewFlashcard(
                                                                "again"
                                                            )
                                                        }
                                                        disabled={
                                                            reviewingFlashcard
                                                        }
                                                        style={
                                                            styles.reviewButton
                                                        }
                                                    >
                                                        😕 Didn't Know
                                                    </button>


                                                    <button
                                                        onClick={() =>
                                                            handleReviewFlashcard(
                                                                "good"
                                                            )
                                                        }
                                                        disabled={
                                                            reviewingFlashcard
                                                        }
                                                        style={{
                                                            ...styles.reviewButton,
                                                            ...styles.goodReview
                                                        }}
                                                    >
                                                        👍 Knew It
                                                    </button>


                                                    <button
                                                        onClick={() =>
                                                            handleReviewFlashcard(
                                                                "easy"
                                                            )
                                                        }
                                                        disabled={
                                                            reviewingFlashcard
                                                        }
                                                        style={{
                                                            ...styles.reviewButton,
                                                            ...styles.easyReview
                                                        }}
                                                    >
                                                        😎 Too Easy
                                                    </button>

                                                </div>


                                                {reviewingFlashcard && (
                                                    <p style={styles.muted}>
                                                        Saving review...
                                                    </p>
                                                )}

                                            </div>

                                        )}


                                        <div style={styles.flashcardStats}>

                                            <div style={styles.flashcardStatItem}>
                                                <span style={styles.flashcardStatLabel}>
                                                    Reviews
                                                </span>

                                                <strong style={styles.flashcardStatValue}>
                                                    {
                                                        activeFlashcard
                                                            ?.review_count || 0
                                                    }
                                                </strong>
                                            </div>

                                            <div style={styles.flashcardStatItem}>
                                                <span style={styles.flashcardStatLabel}>
                                                    Knew It
                                                </span>

                                                <strong style={styles.flashcardStatValue}>
                                                    {
                                                        activeFlashcard
                                                            ?.correct_count || 0
                                                    }
                                                </strong>
                                            </div>

                                            <div style={styles.flashcardStatItem}>
                                                <span style={styles.flashcardStatLabel}>
                                                    Didn't Know
                                                </span>

                                                <strong style={styles.flashcardStatValue}>
                                                    {
                                                        activeFlashcard
                                                            ?.incorrect_count || 0
                                                    }
                                                </strong>
                                            </div>

                                        </div>


                                        <div
                                            style={
                                                styles.flashcardNavigation
                                            }
                                        >

                                            <button
                                                onClick={
                                                    handlePreviousFlashcard
                                                }
                                                disabled={
                                                    reviewingFlashcard
                                                }
                                                style={
                                                    styles.navButton
                                                }
                                            >
                                                ← Previous
                                            </button>


                                            <span
                                                style={
                                                    styles.navCounter
                                                }
                                            >
                                                {currentFlashcard + 1}
                                                {" of "}
                                                {flashcards.length}
                                            </span>


                                            <button
                                                onClick={
                                                    handleNextFlashcard
                                                }
                                                disabled={
                                                    reviewingFlashcard
                                                }
                                                style={
                                                    styles.navButton
                                                }
                                            >
                                                Next →
                                            </button>

                                        </div>

                                    </>

                                )}

                            </section>

                        )}

                    </>

                )}


                {/* TEST */}

                <section style={styles.testCard}>

                    <div style={styles.testIcon}>
                        ✓
                    </div>


                    <div style={styles.testContent}>

                        <p style={styles.eyebrow}>
                            MASTERY CHECK
                        </p>

                        <h2 style={styles.testTitle}>
                            Topic Test
                        </h2>

                        <p style={styles.testDescription}>
                            Complete the mandatory test after
                            studying this topic. You need at
                            least <strong>70%</strong> to pass
                            and demonstrate topic mastery.
                        </p>


                        {!learningContent ? (

                            <div>
                                <button
                                    disabled
                                    style={styles.disabledButton}
                                >
                                    Generate Topic Test
                                </button>

                                <p style={styles.lockedText}>
                                    🔒 Generate the study
                                    content first.
                                </p>
                            </div>

                        ) : !test ? (

                            <button
                                onClick={handleGenerateTest}
                                disabled={generatingTest}
                                style={styles.primaryButton}
                            >
                                {generatingTest
                                    ? "Generating Test..."
                                    : "Generate Topic Test"}
                            </button>

                        ) : (

                            <div style={styles.testReadyContent}>

                                <div style={styles.testDetails}>

                                    <div style={styles.testDetailCard}>
                                        <span style={styles.testDetailLabel}>
                                            QUESTIONS
                                        </span>

                                        <strong style={styles.testDetailValue}>
                                            {
                                                Number(
                                                    test.total_questions
                                                ) || 0
                                            }
                                        </strong>
                                    </div>


                                    <div style={styles.testDetailCard}>
                                        <span style={styles.testDetailLabel}>
                                            PASSING SCORE
                                        </span>

                                        <strong style={styles.testDetailValue}>
                                            {
                                                Number(
                                                    test.passing_percentage
                                                ).toFixed(0)
                                            }%
                                        </strong>
                                    </div>

                                </div>


                                <button
                                    onClick={handleStartTest}
                                    style={styles.primaryButton}
                                >
                                    Start Test →
                                </button>

                            </div>

                        )}

                    </div>

                </section>

            </div>

        </div>
    );
}


// =========================================================
// SMALL COMPONENTS
// =========================================================

function SectionHeader({
    eyebrow,
    title,
    description
}) {
    return (
        <div style={styles.sectionHeader}>

            <p style={styles.eyebrow}>
                {eyebrow}
            </p>

            <h2 style={styles.sectionTitle}>
                {title}
            </h2>

            <p style={styles.sectionDescription}>
                {description}
            </p>

        </div>
    );
}


function EmptyState({ text }) {
    return (
        <div style={styles.simpleEmpty}>
            {text}
        </div>
    );
}


// =========================================================
// STYLES
// =========================================================

const styles = {

    page: {
        minHeight: "100vh",
        padding: "38px 24px 70px",
        background: "transparent",
        color: "#FFF7FB",
        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    container: {
        width: "100%",
        maxWidth: "1180px",
        margin: "0 auto"
    },


    centerPage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFF7FB",
        padding: "30px"
    },


    loadingCard: {
        width: "min(420px, 100%)",
        padding: "40px",
        textAlign: "center",
        borderRadius: "24px",
        background:
            "linear-gradient(145deg, rgba(24,24,29,.90), rgba(7,7,10,.86))",
        border:
            "1px solid rgba(240,90,157,.22)",
        backdropFilter: "blur(24px)",
        boxShadow:
            "0 30px 80px rgba(0,0,0,.5)"
    },


    loadingDot: {
        width: "14px",
        height: "14px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: "#F05A9D",
        boxShadow:
            "0 0 25px rgba(240,90,157,.9)"
    },


    loadingTitle: {
        margin: "0 0 8px",
        fontSize: "24px"
    },


    muted: {
        color: "#A99DA4"
    },


    // NAV

    topNav: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "22px"
    },


    backButton: {
        display: "flex",
        alignItems: "center",
        gap: "9px",
        padding: "10px 0",
        border: "none",
        background: "transparent",
        color: "#C8BAC1",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600"
    },


    backArrow: {
        color: "#F05A9D",
        fontSize: "19px"
    },


    dashboardButton: {
        padding: "10px 17px",
        borderRadius: "10px",
        border:
            "1px solid rgba(240,90,157,.24)",
        background:
            "rgba(15,15,19,.66)",
        color: "#F7A3C8",
        cursor: "pointer",
        fontWeight: "600"
    },


    // HERO

    hero: {
        position: "relative",
        overflow: "hidden",
        padding: "38px",
        marginBottom: "24px",
        borderRadius: "26px",
        border:
            "1px solid rgba(240,90,157,.22)",
        background:
            "linear-gradient(135deg, rgba(24,22,28,.88), rgba(7,7,10,.80))",
        backdropFilter: "blur(24px)",
        boxShadow:
            "0 30px 80px rgba(0,0,0,.40)"
    },


    heroGlow: {
        position: "absolute",
        width: "430px",
        height: "430px",
        top: "-280px",
        right: "-80px",
        borderRadius: "50%",
        background:
            "rgba(240,90,157,.16)",
        filter: "blur(90px)",
        pointerEvents: "none"
    },


    heroContent: {
        position: "relative",
        zIndex: 1,
        maxWidth: "760px"
    },


    topicBadge: {
        display: "inline-flex",
        padding: "6px 10px",
        marginBottom: "16px",
        borderRadius: "999px",
        border:
            "1px solid rgba(240,90,157,.25)",
        background:
            "rgba(240,90,157,.08)",
        color: "#F7A3C8",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1.5px"
    },


    title: {
        margin: "0",
        color: "#FFF9FC",
        fontSize: "clamp(32px, 5vw, 52px)",
        lineHeight: "1.05",
        letterSpacing: "-1.8px",
        fontWeight: "800"
    },


    description: {
        maxWidth: "720px",
        margin: "16px 0 0",
        color: "#B9ABB2",
        lineHeight: "1.75",
        fontSize: "15px"
    },


    heroStats: {
        position: "relative",
        zIndex: 1,
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
        gap: "12px",
        marginTop: "32px"
    },


    statCard: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "16px",
        borderRadius: "14px",
        background:
            "rgba(8,8,11,.48)",
        border:
            "1px solid rgba(255,255,255,.07)"
    },


    statIcon: {
        width: "38px",
        height: "38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "11px",
        color: "#F05A9D",
        background:
            "rgba(240,90,157,.10)"
    },


    statLabel: {
        margin: "0 0 4px",
        color: "#756A70",
        fontSize: "10px",
        letterSpacing: "1.2px",
        fontWeight: "700"
    },


    statValue: {
        margin: 0,
        color: "#F7EEF2",
        fontSize: "15px"
    },


    // MESSAGE

    message: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "13px 16px",
        marginBottom: "20px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "600"
    },


    successMessage: {
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.18)",
        color: "#F7A3C8"
    },


    errorMessage: {
        background:
            "rgba(190,55,90,.10)",
        border:
            "1px solid rgba(255,100,140,.22)",
        color: "#FFB3CB"
    },


    // GENERAL CONTENT

    contentCard: {
        padding: "32px",
        marginBottom: "24px",
        borderRadius: "22px",
        background:
            "linear-gradient(145deg, rgba(20,20,25,.86), rgba(7,7,10,.78))",
        border:
            "1px solid rgba(240,90,157,.16)",
        backdropFilter: "blur(22px)",
        boxShadow:
            "0 25px 70px rgba(0,0,0,.34)"
    },


    sectionHeader: {
        marginBottom: "25px"
    },


    eyebrow: {
        margin: "0 0 8px",
        color: "#F05A9D",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.7px"
    },


    sectionTitle: {
        margin: "0",
        color: "#FFF9FC",
        fontSize: "25px",
        letterSpacing: "-.5px"
    },


    sectionDescription: {
        maxWidth: "680px",
        margin: "8px 0 0",
        color: "#A99DA4",
        lineHeight: "1.65",
        fontSize: "14px"
    },


    // GENERATE CONTENT

    emptyLearningCard: {
        padding: "45px 38px",
        marginBottom: "24px",
        textAlign: "center",
        borderRadius: "24px",
        border:
            "1px solid rgba(240,90,157,.20)",
        background:
            "linear-gradient(145deg, rgba(22,20,25,.88), rgba(7,7,10,.80))",
        backdropFilter: "blur(24px)"
    },


    aiIcon: {
        width: "58px",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 18px",
        borderRadius: "17px",
        color: "#FF69AD",
        fontSize: "25px",
        background:
            "rgba(240,90,157,.10)",
        border:
            "1px solid rgba(240,90,157,.22)",
        boxShadow:
            "0 0 35px rgba(240,90,157,.12)"
    },


    featureGrid: {
        maxWidth: "760px",
        margin: "30px auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "12px",
        textAlign: "left"
    },


    feature: {
        display: "flex",
        gap: "13px",
        padding: "16px",
        borderRadius: "14px",
        background:
            "rgba(8,8,11,.52)",
        border:
            "1px solid rgba(255,255,255,.07)",
        color: "#F7EEF2"
    },


    featureIcon: {
        color: "#F05A9D"
    },


    primaryButton: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        minHeight: "45px",
        padding: "0 20px",
        border: "none",
        borderRadius: "11px",
        background:
            "linear-gradient(100deg, #D93478, #F05A9D, #E63E83)",
        color: "#FFFFFF",
        fontSize: "13px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow:
            "0 12px 32px rgba(240,90,157,.20)"
    },


    disabledPrimary: {
        opacity: ".6",
        cursor: "wait"
    },


    // TABS

    tabs: {
        display: "flex",
        gap: "7px",
        overflowX: "auto",
        padding: "7px",
        marginBottom: "20px",
        borderRadius: "14px",
        border:
            "1px solid rgba(255,255,255,.07)",
        background:
            "rgba(7,7,10,.60)",
        backdropFilter: "blur(18px)"
    },


    tab: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        whiteSpace: "nowrap",
        padding: "10px 15px",
        border: "1px solid transparent",
        borderRadius: "9px",
        background: "transparent",
        color: "#8F8389",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: "600"
    },


    activeTab: {
        color: "#FFD4E7",
        border:
            "1px solid rgba(240,90,157,.22)",
        background:
            "rgba(240,90,157,.10)"
    },


    tabCount: {
        minWidth: "20px",
        padding: "2px 6px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.16)",
        color: "#FFD4E7",
        fontSize: "10px"
    },


    // NOTES

    notesText: {
        padding: "24px",
        whiteSpace: "pre-wrap",
        color: "#D8CCD2",
        lineHeight: "1.85",
        fontSize: "14px",
        borderRadius: "14px",
        background:
            "rgba(7,7,10,.48)",
        border:
            "1px solid rgba(255,255,255,.06)"
    },


    // CONCEPTS

    contentGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(270px, 1fr))",
        gap: "14px"
    },


    conceptCard: {
        padding: "21px",
        borderRadius: "15px",
        background:
            "rgba(8,8,11,.52)",
        border:
            "1px solid rgba(255,255,255,.07)"
    },


    numberBadge: {
        display: "inline-block",
        marginBottom: "15px",
        color: "#F05A9D",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1px"
    },


    itemTitle: {
        margin: "0 0 9px",
        color: "#F7EEF2",
        fontSize: "16px"
    },


    itemText: {
        margin: 0,
        color: "#A99DA4",
        lineHeight: "1.7",
        fontSize: "13px"
    },


    contentList: {
        display: "grid",
        gap: "12px"
    },


    exampleCard: {
        display: "flex",
        gap: "17px",
        padding: "20px",
        borderRadius: "14px",
        background:
            "rgba(8,8,11,.50)",
        border:
            "1px solid rgba(255,255,255,.07)"
    },


    exampleNumber: {
        flexShrink: 0,
        width: "34px",
        height: "34px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        background:
            "rgba(240,90,157,.10)",
        color: "#F05A9D",
        fontWeight: "800"
    },


    // IMPORTANT POINTS

    pointsList: {
        display: "grid",
        gap: "10px"
    },


    pointCard: {
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        padding: "16px",
        borderRadius: "13px",
        background:
            "rgba(8,8,11,.48)",
        border:
            "1px solid rgba(255,255,255,.06)"
    },


    checkIcon: {
        flexShrink: 0,
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        color: "#F05A9D",
        background:
            "rgba(240,90,157,.10)",
        fontSize: "11px"
    },


    pointText: {
        margin: 0,
        color: "#D6C9CF",
        lineHeight: "1.65",
        fontSize: "13px"
    },


    // FLASHCARDS

    flashcardHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "20px"
    },


    flashcardCount: {
        flexShrink: 0,
        color: "#F05A9D",
        fontSize: "18px",
        fontWeight: "800"
    },


    flashcardEmpty: {
        padding: "48px 25px",
        textAlign: "center",
        borderRadius: "16px",
        border:
            "1px dashed rgba(240,90,157,.24)",
        background:
            "rgba(8,8,11,.38)"
    },


    emptyFlashcardIcon: {
        fontSize: "31px",
        color: "#F05A9D",
        marginBottom: "14px"
    },


    emptyTitle: {
        margin: "0 0 7px",
        color: "#F7EEF2"
    },


    emptyText: {
        maxWidth: "450px",
        margin: "0 auto 20px",
        color: "#A99DA4",
        lineHeight: "1.6",
        fontSize: "13px"
    },


    flashcardScene: {
        width: "100%",
        maxWidth: "760px",
        height: "390px",
        margin: "25px auto",
        perspective: "1200px"
    },


    flashcard: {
        position: "relative",
        width: "100%",
        height: "100%",
        transformStyle: "preserve-3d",
        transition:
            "transform .55s cubic-bezier(.2,.7,.2,1)",
        cursor: "pointer"
    },


    flashcardFace: {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        textAlign: "center",
        borderRadius: "22px",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        border:
            "1px solid rgba(240,90,157,.22)",
        boxShadow:
            "0 30px 70px rgba(0,0,0,.45)"
    },


    flashcardFront: {
        background:
            "radial-gradient(circle at 50% 0%, rgba(240,90,157,.10), transparent 45%), linear-gradient(145deg, #19171C, #09090C)",
        color: "#FFF7FB"
    },


    flashcardBack: {
        transform: "rotateY(180deg)",
        background:
            "radial-gradient(circle at 50% 100%, rgba(240,90,157,.12), transparent 45%), linear-gradient(145deg, #18161B, #08080B)",
        color: "#FFF7FB"
    },


    cardLabel: {
        position: "absolute",
        top: "28px",
        padding: "6px 10px",
        borderRadius: "999px",
        color: "#F05A9D",
        background:
            "rgba(240,90,157,.08)",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.6px"
    },


    flashcardQuestion: {
        maxWidth: "620px",
        margin: 0,
        color: "#FFF9FC",
        fontSize: "clamp(21px, 3vw, 29px)",
        lineHeight: "1.45"
    },


    flashcardAnswer: {
        maxWidth: "620px",
        margin: 0,
        color: "#E8DCE2",
        fontSize: "18px",
        lineHeight: "1.75"
    },


    flipHint: {
        position: "absolute",
        bottom: "24px",
        margin: 0,
        color: "#756A70",
        fontSize: "11px"
    },


    flashcardMeta: {
        textAlign: "center",
        color: "#887C82",
        fontSize: "12px"
    },


    difficultyBadge: {
        marginLeft: "7px",
        padding: "4px 8px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.09)",
        color: "#F7A3C8",
        textTransform: "capitalize"
    },


    reviewSection: {
        maxWidth: "760px",
        margin: "25px auto",
        textAlign: "center"
    },


    reviewTitle: {
        color: "#D9CDD3",
        fontSize: "13px",
        fontWeight: "600"
    },


    reviewButtons: {
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: "9px"
    },


    reviewButton: {
        minWidth: "135px",
        padding: "11px 15px",
        borderRadius: "10px",
        border:
            "1px solid rgba(240,90,157,.18)",
        background:
            "rgba(240,90,157,.06)",
        color: "#E7DCE2",
        cursor: "pointer",
        fontWeight: "600"
    },


    goodReview: {
        border:
            "1px solid rgba(240,90,157,.32)",
        color: "#F7A3C8"
    },


    easyReview: {
        background:
            "rgba(240,90,157,.12)",
        color: "#FFD4E7"
    },


    flashcardStats: {
        width: "100%",
        maxWidth: "650px",
        margin: "28px auto",
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "12px"
    },


    flashcardStatItem: {
        minWidth: 0,
        minHeight: "88px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        textAlign: "center",
        borderRadius: "13px",
        background:
            "rgba(8,8,11,.48)",
        border:
            "1px solid rgba(240,90,157,.12)"
    },


    flashcardStatLabel: {
        color: "#8F8389",
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "1px",
        textTransform: "uppercase"
    },


    flashcardStatValue: {
        display: "block",
        color: "#FFF7FB",
        fontSize: "21px",
        lineHeight: "1",
        fontWeight: "800"
    },


    flashcardNavigation: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
        marginTop: "25px"
    },


    navButton: {
        padding: "10px 15px",
        borderRadius: "9px",
        border:
            "1px solid rgba(240,90,157,.18)",
        background:
            "rgba(10,10,13,.70)",
        color: "#F7A3C8",
        cursor: "pointer",
        fontWeight: "600"
    },


    navCounter: {
        minWidth: "80px",
        textAlign: "center",
        color: "#9C9096",
        fontSize: "12px",
        fontWeight: "600"
    },


    // TEST

    testCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "18px",
        padding: "40px 30px",
        marginTop: "24px",
        marginBottom: "40px",
        textAlign: "center",
        borderRadius: "22px",
        border:
            "1px solid rgba(240,90,157,.18)",
        background:
            "linear-gradient(135deg, rgba(24,20,26,.88), rgba(8,8,11,.82))",
        backdropFilter: "blur(22px)",
        boxShadow:
            "0 24px 65px rgba(0,0,0,.40)"
    },


    testIcon: {
        flexShrink: 0,
        width: "62px",
        height: "62px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        borderRadius: "18px",
        background:
            "rgba(240,90,157,.12)",
        border:
            "1px solid rgba(240,90,157,.25)",
        color: "#F05A9D",
        fontSize: "27px",
        boxShadow:
            "0 0 30px rgba(240,90,157,.10)"
    },


    testContent: {
        width: "100%",
        maxWidth: "720px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center"
    },


    testTitle: {
        margin: "0",
        color: "#FFF9FC",
        fontSize: "30px",
        fontWeight: "800",
        letterSpacing: "-.7px"
    },


    testDescription: {
        width: "100%",
        maxWidth: "650px",
        margin: "10px auto 24px",
        color: "#A99DA4",
        lineHeight: "1.7",
        fontSize: "14px",
        textAlign: "center"
    },


    testReadyContent: {
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
    },


    testDetails: {
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "stretch",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "22px"
    },


    testDetailCard: {
        minWidth: "150px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        padding: "15px 20px",
        borderRadius: "12px",
        background:
            "rgba(8,8,11,.50)",
        border:
            "1px solid rgba(240,90,157,.12)"
    },


    testDetailLabel: {
        color: "#8F8389",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1.3px"
    },


    testDetailValue: {
        display: "block",
        color: "#FFF7FB",
        fontSize: "21px",
        lineHeight: "1",
        fontWeight: "800"
    },


    disabledButton: {
        minHeight: "44px",
        padding: "0 18px",
        borderRadius: "10px",
        border:
            "1px solid rgba(255,255,255,.07)",
        background:
            "rgba(255,255,255,.035)",
        color: "#625A5E",
        cursor: "not-allowed"
    },


    lockedText: {
        color: "#756A70",
        fontSize: "11px"
    },


    simpleEmpty: {
        padding: "30px",
        textAlign: "center",
        borderRadius: "14px",
        border:
            "1px dashed rgba(240,90,157,.20)",
        color: "#8F8389",
        background:
            "rgba(8,8,11,.40)"
    }
};


export default TopicDetails;