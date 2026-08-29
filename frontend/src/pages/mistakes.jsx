import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function Mistakes() {

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [mistakes, setMistakes] =
        useState([]);

    const [summary, setSummary] =
        useState(null);

    const [
        difficultTopics,
        setDifficultTopics
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [message, setMessage] =
        useState("");

    const [selectedSubject, setSelectedSubject] =
        useState("all");


    // ============================================
    // TOKEN
    // ============================================

    const getToken = () => {

        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };


    const getAuthHeaders = () => ({

        Authorization:
            `Bearer ${getToken()}`
    });


    // ============================================
    // DATE
    // ============================================

    const formatDate = (
        value
    ) => {

        if (!value) {

            return "";
        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day:
                    "numeric",

                month:
                    "short",

                year:
                    "numeric"
            }
        );
    };


    // ============================================
    // FETCH DATA
    // ============================================

    const fetchMistakes =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/mistakes",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMistakes(
                    response.data.mistakes ||
                    []
                );


            } catch (error) {

                console.error(
                    "Fetch mistakes error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to load mistake bank."
                );
            }
        };


    const fetchSummary =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/mistakes/summary",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setSummary(
                    response.data.summary ||
                    null
                );


                setDifficultTopics(
                    response.data
                        .most_difficult_topics ||
                    []
                );


            } catch (error) {

                console.error(
                    "Fetch mistake summary error:",
                    error
                );
            }
        };


    // ============================================
    // LOAD
    // ============================================

    useEffect(
        () => {

            const load =
                async () => {

                    if (!getToken()) {

                        navigate(
                            "/login"
                        );

                        return;
                    }


                    setLoading(
                        true
                    );


                    await Promise.all([
                        fetchMistakes(),
                        fetchSummary()
                    ]);


                    setLoading(
                        false
                    );
                };


            load();

        },
        []
    );


    // ============================================
    // SUBJECT OPTIONS
    // ============================================

    const subjects =
        useMemo(
            () => {

                return Array.from(
                    new Set(
                        mistakes
                            .map(
                                (
                                    mistake
                                ) =>
                                    mistake.subject_name
                            )
                            .filter(
                                Boolean
                            )
                    )
                );

            },
            [
                mistakes
            ]
        );


    // ============================================
    // FILTERED MISTAKES
    // ============================================

    const filteredMistakes =
        useMemo(
            () => {

                if (
                    selectedSubject ===
                    "all"
                ) {

                    return mistakes;
                }


                return mistakes.filter(
                    (
                        mistake
                    ) =>
                        mistake.subject_name ===
                        selectedSubject
                );

            },
            [
                mistakes,
                selectedSubject
            ]
        );


    // ============================================
    // GROUP BY TOPIC
    // ============================================

    const groupedMistakes =
        useMemo(
            () => {

                const groups =
                    new Map();


                filteredMistakes.forEach(
                    (
                        mistake
                    ) => {

                        const key =
                            String(
                                mistake.topic_id
                            );


                        if (
                            !groups.has(
                                key
                            )
                        ) {

                            groups.set(
                                key,
                                {
                                    topic_id:
                                        mistake.topic_id,

                                    topic_name:
                                        mistake.topic_name,

                                    chapter_name:
                                        mistake.chapter_name,

                                    subject_name:
                                        mistake.subject_name,

                                    mistakes:
                                        []
                                }
                            );
                        }


                        groups
                            .get(
                                key
                            )
                            .mistakes
                            .push(
                                mistake
                            );
                    }
                );


                return Array.from(
                    groups.values()
                );

            },
            [
                filteredMistakes
            ]
        );


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <main style={styles.loading}>

                Loading Mistake Bank...

            </main>
        );
    }


    // ============================================
    // PAGE
    // ============================================

    return (

        <main className="sb-mobile-page" style={styles.page}>

            <div className="sb-mobile-container" style={styles.container}>


                {/* ================================= */}
                {/* NAVIGATION */}
                {/* ================================= */}

                <div className="sb-mobile-nav" style={styles.topNav}>

                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>


                    <button
                        type="button"
                        style={styles.secondaryButton}
                        onClick={() =>
                            navigate(
                                "/revisions"
                            )
                        }
                    >
                        Revision Centre
                    </button>

                </div>


                {/* ================================= */}
                {/* HERO */}
                {/* ================================= */}

                <section className="sb-mobile-hero" style={styles.hero}>

                    <div>

                        <p style={styles.eyebrow}>
                            SMART ERROR ANALYSIS
                        </p>


                        <h1 style={styles.heroTitle}>

                            Mistake{" "}

                            <span style={styles.pink}>
                                Bank
                            </span>

                        </h1>


                        <p style={styles.heroDescription}>

                            Every incorrect test answer
                            is collected here so you can
                            understand what went wrong,
                            revise the concept and avoid
                            repeating the same mistake.

                        </p>

                    </div>


                    <div style={styles.heroIcon}>
                        ✕
                    </div>

                </section>


                {/* ================================= */}
                {/* ERROR */}
                {/* ================================= */}

                {message && (

                    <div style={styles.errorMessage}>

                        {message}

                    </div>

                )}


                {/* ================================= */}
                {/* SUMMARY */}
                {/* ================================= */}

                <section className="sb-mobile-grid-4" style={styles.summaryGrid}>

                    <div style={styles.summaryCard}>

                        <span style={styles.summaryLabel}>
                            TOTAL MISTAKES
                        </span>

                        <strong style={styles.summaryValue}>
                            {
                                summary
                                    ?.total_mistakes ||
                                0
                            }
                        </strong>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryLabel}>
                            TOPICS AFFECTED
                        </span>

                        <strong style={styles.summaryValue}>
                            {
                                summary
                                    ?.affected_topics ||
                                0
                            }
                        </strong>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryLabel}>
                            CHAPTERS
                        </span>

                        <strong style={styles.summaryValue}>
                            {
                                summary
                                    ?.affected_chapters ||
                                0
                            }
                        </strong>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryLabel}>
                            SUBJECTS
                        </span>

                        <strong style={styles.summaryValue}>
                            {
                                summary
                                    ?.affected_subjects ||
                                0
                            }
                        </strong>

                    </div>

                </section>


                {/* ================================= */}
                {/* DIFFICULT TOPICS */}
                {/* ================================= */}

                {difficultTopics.length > 0 && (

                    <section style={styles.section}>

                        <p style={styles.eyebrow}>
                            PERFORMANCE INSIGHT
                        </p>


                        <h2 style={styles.sectionTitle}>
                            Topics Needing Attention
                        </h2>


                        <div className="sb-mobile-grid-2" style={styles.difficultGrid}>

                            {difficultTopics.map(
                                (
                                    topic,
                                    index
                                ) => (

                                    <button
                                        type="button"
                                        key={
                                            topic.topic_id
                                        }
                                        style={styles.difficultCard}
                                        onClick={() =>
                                            navigate(
                                                `/topics/${topic.topic_id}`
                                            )
                                        }
                                    >

                                        <span style={styles.rank}>
                                            #
                                            {
                                                index + 1
                                            }
                                        </span>


                                        <div style={styles.difficultContent}>

                                            <strong>
                                                {
                                                    topic.topic_name
                                                }
                                            </strong>

                                            <span>
                                                {
                                                    topic.subject_name
                                                }
                                            </span>

                                        </div>


                                        <div style={styles.mistakeCount}>

                                            {
                                                topic.mistake_count
                                            }

                                            <small>
                                                mistakes
                                            </small>

                                        </div>

                                    </button>

                                )
                            )}

                        </div>

                    </section>

                )}


                {/* ================================= */}
                {/* FILTER */}
                {/* ================================= */}

                <section className="sb-mobile-filter" style={styles.filterSection}>

                    <div>

                        <p style={styles.eyebrow}>
                            REVIEW
                        </p>


                        <h2 style={styles.sectionTitle}>
                            Your Mistakes
                        </h2>

                    </div>


                    <select
                        value={
                            selectedSubject
                        }
                        onChange={(event) =>
                            setSelectedSubject(
                                event.target.value
                            )
                        }
                        style={styles.select}
                    >

                        <option value="all">
                            All Subjects
                        </option>


                        {subjects.map(
                            (
                                subject
                            ) => (

                                <option
                                    key={
                                        subject
                                    }
                                    value={
                                        subject
                                    }
                                >
                                    {
                                        subject
                                    }
                                </option>

                            )
                        )}

                    </select>

                </section>


                {/* ================================= */}
                {/* EMPTY */}
                {/* ================================= */}

                {groupedMistakes.length ===
                0 ? (

                    <section style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            ✓
                        </div>


                        <h2>
                            No mistakes here
                        </h2>


                        <p style={styles.muted}>

                            {
                                mistakes.length ===
                                0
                                    ? "Complete some topic tests and any incorrect answers will automatically appear here."
                                    : "There are no mistakes for this subject."
                            }

                        </p>

                    </section>

                ) : (

                    <div style={styles.topicGroups}>

                        {groupedMistakes.map(
                            (
                                group
                            ) => (

                                <section
                                    key={
                                        group.topic_id
                                    }
                                    style={styles.topicGroup}
                                >

                                    {/* ================================= */}
                                    {/* TOPIC HEADER */}
                                    {/* ================================= */}

                                    <div className="sb-mobile-row" style={styles.topicHeader}>

                                        <div>

                                            <span style={styles.subjectName}>
                                                {
                                                    group.subject_name
                                                }
                                            </span>


                                            <h2 style={styles.topicName}>
                                                {
                                                    group.topic_name
                                                }
                                            </h2>


                                            <p style={styles.chapterName}>
                                                {
                                                    group.chapter_name
                                                }
                                            </p>

                                        </div>


                                        <div className="sb-mobile-actions" style={styles.topicRight}>

                                            <div style={styles.topicMistakeCount}>

                                                {
                                                    group
                                                        .mistakes
                                                        .length
                                                }

                                                <span>
                                                    {
                                                        group
                                                            .mistakes
                                                            .length ===
                                                        1
                                                            ? "Mistake"
                                                            : "Mistakes"
                                                    }
                                                </span>

                                            </div>


                                            <button
                                                type="button"
                                                style={styles.primaryButton}
                                                onClick={() =>
                                                    navigate(
                                                        `/topics/${group.topic_id}`
                                                    )
                                                }
                                            >
                                                Review Topic →
                                            </button>

                                        </div>

                                    </div>


                                    {/* ================================= */}
                                    {/* QUESTIONS */}
                                    {/* ================================= */}

                                    <div style={styles.mistakeList}>

                                        {group.mistakes.map(
                                            (
                                                mistake,
                                                index
                                            ) => (

                                                <article
                                                    key={
                                                        `${mistake.id}-${index}`
                                                    }
                                                    style={styles.mistakeCard}
                                                >

                                                    <div style={styles.questionTop}>

                                                        <span style={styles.questionNumber}>

                                                            MISTAKE{" "}

                                                            {
                                                                index + 1
                                                            }

                                                        </span>


                                                        <span style={styles.difficultyBadge}>

                                                            {
                                                                mistake.difficulty ||
                                                                "adaptive"
                                                            }

                                                        </span>

                                                    </div>


                                                    <h3 style={styles.questionText}>

                                                        {
                                                            mistake.question_text
                                                        }

                                                    </h3>


                                                    {/* ================================= */}
                                                    {/* ANSWERS */}
                                                    {/* ================================= */}

                                                    <div className="sb-mobile-grid-2" style={styles.answerGrid}>

                                                        <div style={styles.wrongAnswerBox}>

                                                            <span style={styles.answerLabel}>
                                                                YOUR ANSWER
                                                            </span>


                                                            <strong style={styles.wrongAnswer}>

                                                                {
                                                                    mistake.selected_answer
                                                                }.

                                                                {" "}

                                                                {
                                                                    mistake.selected_answer_text
                                                                }

                                                            </strong>

                                                        </div>


                                                        <div style={styles.correctAnswerBox}>

                                                            <span style={styles.answerLabel}>
                                                                CORRECT ANSWER
                                                            </span>


                                                            <strong style={styles.correctAnswer}>

                                                                {
                                                                    mistake.correct_answer
                                                                }.

                                                                {" "}

                                                                {
                                                                    mistake.correct_answer_text
                                                                }

                                                            </strong>

                                                        </div>

                                                    </div>


                                                    {/* ================================= */}
                                                    {/* EXPLANATION */}
                                                    {/* ================================= */}

                                                    {mistake.explanation && (

                                                        <div style={styles.explanation}>

                                                            <span style={styles.answerLabel}>
                                                                WHY?
                                                            </span>


                                                            <p>
                                                                {
                                                                    mistake.explanation
                                                                }
                                                            </p>

                                                        </div>

                                                    )}


                                                    {/* ================================= */}
                                                    {/* META */}
                                                    {/* ================================= */}

                                                    <div style={styles.meta}>

                                                        <span>

                                                            Attempt{" "}

                                                            #
                                                            {
                                                                mistake.attempt_number
                                                            }

                                                        </span>


                                                        <span>

                                                            Test Score:{" "}

                                                            {
                                                                Math.round(
                                                                    mistake.attempt_percentage
                                                                )
                                                            }
                                                            %

                                                        </span>


                                                        <span>

                                                            {
                                                                formatDate(
                                                                    mistake.attempted_at
                                                                )
                                                            }

                                                        </span>

                                                    </div>

                                                </article>

                                            )
                                        )}

                                    </div>

                                </section>

                            )
                        )}

                    </div>

                )}

            </div>

        </main>
    );
}


// ============================================
// STYLES
// ============================================

const styles = {

    page: {
        minHeight: "100vh",

        padding:
            "36px 22px 75px",

        background:
            "transparent",

        color:
            "#FFF7FB",

        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    loading: {
        minHeight: "100vh",

        display: "grid",

        placeItems: "center",

        background:
            "transparent",

        color:
            "#F7A3C8",

        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    container: {
        width: "100%",

        maxWidth: "1120px",

        margin: "0 auto"
    },


    topNav: {
        display: "flex",

        justifyContent:
            "space-between",

        gap: "15px",

        marginBottom: "22px"
    },


    hero: {
        display: "flex",

        justifyContent:
            "space-between",

        alignItems: "center",

        gap: "30px",

        padding: "38px",

        marginBottom: "20px",

        borderRadius: "26px",

        background:
            "linear-gradient(145deg, rgba(24,20,27,.93), rgba(7,7,10,.87))",

        border:
            "1px solid rgba(240,90,157,.28)",

        backdropFilter:
            "blur(24px)",

        boxShadow:
            "0 30px 85px rgba(0,0,0,.45)"
    },


    eyebrow: {
        margin: "0 0 8px",

        color: "#F05A9D",

        fontSize: "10px",

        fontWeight: "900",

        letterSpacing: "1.7px"
    },


    heroTitle: {
        margin: 0,

        fontSize:
            "clamp(35px, 5vw, 52px)",

        letterSpacing:
            "-1.4px"
    },


    pink: {
        color: "#F05A9D"
    },


    heroDescription: {
        maxWidth: "700px",

        color: "#A99DA4",

        lineHeight: "1.7",

        fontSize: "14px"
    },


    heroIcon: {
        width: "74px",

        height: "74px",

        flexShrink: 0,

        display: "grid",

        placeItems: "center",

        borderRadius: "21px",

        background:
            "rgba(240,90,157,.10)",

        border:
            "1px solid rgba(240,90,157,.24)",

        color: "#F05A9D",

        fontSize: "30px"
    },


    errorMessage: {
        padding: "14px 16px",

        marginBottom: "20px",

        borderRadius: "12px",

        background:
            "rgba(165,45,80,.13)",

        border:
            "1px solid rgba(255,100,145,.22)",

        color: "#FFB3CC",

        fontSize: "13px"
    },


    summaryGrid: {
        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",

        gap: "13px",

        marginBottom: "38px"
    },


    summaryCard: {
        padding: "20px",

        borderRadius: "16px",

        background:
            "linear-gradient(145deg, rgba(20,18,23,.9), rgba(7,7,10,.82))",

        border:
            "1px solid rgba(240,90,157,.14)"
    },


    summaryLabel: {
        display: "block",

        color: "#897D83",

        fontSize: "9px",

        fontWeight: "800",

        letterSpacing: "1.2px"
    },


    summaryValue: {
        display: "block",

        marginTop: "8px",

        color: "#FFF9FC",

        fontSize: "29px"
    },


    section: {
        marginTop: "35px",

        marginBottom: "35px"
    },


    sectionTitle: {
        margin: 0,

        color: "#FFF9FC",

        fontSize: "27px"
    },


    difficultGrid: {
        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",

        gap: "11px",

        marginTop: "17px"
    },


    difficultCard: {
        display: "flex",

        alignItems: "center",

        gap: "13px",

        padding: "15px",

        borderRadius: "13px",

        background:
            "rgba(10,10,13,.66)",

        border:
            "1px solid rgba(240,90,157,.13)",

        color: "#FFF7FB",

        cursor: "pointer",

        textAlign: "left"
    },


    rank: {
        color: "#F05A9D",

        fontSize: "13px",

        fontWeight: "900"
    },


    difficultContent: {
        flex: 1,

        minWidth: 0,

        display: "flex",

        flexDirection: "column",

        gap: "4px",

        fontSize: "13px"
    },


    mistakeCount: {
        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        color: "#F7A3C8",

        fontSize: "18px",

        fontWeight: "800"
    },


    filterSection: {
        display: "flex",

        justifyContent:
            "space-between",

        alignItems:
            "flex-end",

        gap: "20px",

        marginBottom: "17px"
    },


    select: {
        minWidth: "190px",

        minHeight: "42px",

        padding: "0 12px",

        borderRadius: "10px",

        background:
            "#111115",

        border:
            "1px solid rgba(240,90,157,.20)",

        color: "#FFF7FB",

        outline: "none"
    },


    topicGroups: {
        display: "grid",

        gap: "22px"
    },


    topicGroup: {
        padding: "24px",

        borderRadius: "20px",

        background:
            "linear-gradient(145deg, rgba(20,18,23,.92), rgba(7,7,10,.86))",

        border:
            "1px solid rgba(240,90,157,.15)"
    },


    topicHeader: {
        display: "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        gap: "20px",

        paddingBottom: "18px",

        marginBottom: "15px",

        borderBottom:
            "1px solid rgba(255,255,255,.06)"
    },


    subjectName: {
        color: "#F05A9D",

        fontSize: "10px",

        fontWeight: "800"
    },


    topicName: {
        margin: "6px 0 3px",

        color: "#FFF9FC",

        fontSize: "21px"
    },


    chapterName: {
        margin: 0,

        color: "#887C82",

        fontSize: "12px"
    },


    topicRight: {
        display: "flex",

        alignItems: "center",

        gap: "12px"
    },


    topicMistakeCount: {
        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        color: "#FFF9FC",

        fontSize: "22px",

        fontWeight: "800"
    },


    mistakeList: {
        display: "grid",

        gap: "12px"
    },


    mistakeCard: {
        padding: "20px",

        borderRadius: "15px",

        background:
            "rgba(7,7,10,.48)",

        border:
            "1px solid rgba(255,255,255,.065)"
    },


    questionTop: {
        display: "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        gap: "15px"
    },


    questionNumber: {
        color: "#F05A9D",

        fontSize: "9px",

        fontWeight: "900",

        letterSpacing: "1.1px"
    },


    difficultyBadge: {
        padding: "5px 8px",

        borderRadius: "999px",

        background:
            "rgba(240,90,157,.08)",

        color: "#F7A3C8",

        fontSize: "9px",

        fontWeight: "700",

        textTransform: "capitalize"
    },


    questionText: {
        margin: "12px 0 17px",

        color: "#FFF9FC",

        fontSize: "17px",

        lineHeight: "1.5"
    },


    answerGrid: {
        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",

        gap: "10px"
    },


    wrongAnswerBox: {
        padding: "13px",

        borderRadius: "11px",

        background:
            "rgba(170,45,75,.09)",

        border:
            "1px solid rgba(255,100,135,.16)"
    },


    correctAnswerBox: {
        padding: "13px",

        borderRadius: "11px",

        background:
            "rgba(240,90,157,.07)",

        border:
            "1px solid rgba(240,90,157,.18)"
    },


    answerLabel: {
        display: "block",

        marginBottom: "6px",

        color: "#7D7177",

        fontSize: "8px",

        fontWeight: "900",

        letterSpacing: "1px"
    },


    wrongAnswer: {
        color: "#FF9CB5",

        fontSize: "13px"
    },


    correctAnswer: {
        color: "#F7A3C8",

        fontSize: "13px"
    },


    explanation: {
        marginTop: "12px",

        padding: "14px",

        borderRadius: "11px",

        background:
            "rgba(240,90,157,.045)",

        color: "#ACA0A6",

        lineHeight: "1.65",

        fontSize: "12px"
    },


    meta: {
        display: "flex",

        flexWrap: "wrap",

        gap: "13px",

        marginTop: "13px",

        color: "#746970",

        fontSize: "10px"
    },


    primaryButton: {
        minHeight: "41px",

        padding: "0 14px",

        border: "none",

        borderRadius: "10px",

        background:
            "linear-gradient(100deg, #D93478, #F05A9D, #FF69AD)",

        color: "#FFF",

        cursor: "pointer",

        fontSize: "12px",

        fontWeight: "800"
    },


    secondaryButton: {
        minHeight: "41px",

        padding: "0 14px",

        borderRadius: "10px",

        border:
            "1px solid rgba(240,90,157,.21)",

        background:
            "rgba(10,10,13,.68)",

        color: "#F7A3C8",

        cursor: "pointer",

        fontSize: "12px",

        fontWeight: "700"
    },


    emptyCard: {
        padding: "48px 25px",

        borderRadius: "19px",

        textAlign: "center",

        background:
            "linear-gradient(145deg, rgba(20,18,23,.9), rgba(7,7,10,.82))",

        border:
            "1px solid rgba(240,90,157,.14)"
    },


    emptyIcon: {
        width: "53px",

        height: "53px",

        margin: "0 auto 15px",

        display: "grid",

        placeItems: "center",

        borderRadius: "15px",

        color: "#F05A9D",

        background:
            "rgba(240,90,157,.09)",

        fontSize: "22px"
    },


    muted: {
        color: "#8F8389",

        lineHeight: "1.6",

        fontSize: "13px"
    }
};


export default Mistakes;