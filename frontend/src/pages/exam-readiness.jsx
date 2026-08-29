import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import StudyBuddyLoader
    from "../components/StudyBuddyLoader";


function ExamReadiness() {

    const navigate =
        useNavigate();


    // ========================================================
    // STATE
    // ========================================================

    const [
        readiness,
        setReadiness
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    const [
        selectedExamId,
        setSelectedExamId
    ] = useState(null);


    // ========================================================
    // TOKEN
    // ========================================================

    const getToken = () => {

        return (
            localStorage.getItem("token") ||
            sessionStorage.getItem("token")
        );
    };


    const getAuthHeaders = () => {

        return {

            Authorization:
                `Bearer ${getToken()}`
        };
    };


    // ========================================================
    // FETCH READINESS
    // ========================================================

    const fetchReadiness =
        async () => {

            try {

                setLoading(
                    true
                );


                setError(
                    ""
                );


                const response =
                    await api.get(
                        "/api/exam-readiness",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setReadiness(
                    response.data
                );


                if (
                    response.data
                        ?.exams
                        ?.length >
                    0
                ) {

                    setSelectedExamId(
                        response.data
                            .exams[0]
                            .exam_id
                    );
                }


            } catch (error) {

                console.error(
                    "Exam readiness error:",
                    error
                );


                setError(
                    error.response
                        ?.data
                        ?.message ||
                    "Unable to calculate exam readiness."
                );


            } finally {

                setLoading(
                    false
                );
            }
        };


    // ========================================================
    // LOAD
    // ========================================================

    useEffect(
        () => {

            if (
                !getToken()
            ) {

                navigate(
                    "/login"
                );

                return;
            }


            fetchReadiness();

        },
        []
    );


    // ========================================================
    // SELECTED EXAM
    // ========================================================

    const selectedExam =
        readiness
            ?.exams
            ?.find(
                exam =>
                    Number(
                        exam.exam_id
                    ) ===
                    Number(
                        selectedExamId
                    )
            ) ||
        readiness
            ?.exams
            ?.[0] ||
        null;


    // ========================================================
    // LOADING
    // ========================================================

    if (loading) {

        return (

            <StudyBuddyLoader
                title="Calculating exam readiness"
                text="StudyBuddy is analyzing your mastery, tests, revision, flashcards and study progress."
            />

        );
    }


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <main className="sb-mobile-page" style={styles.page}>

            <div className="sb-mobile-container" style={styles.container}>


                {/* ========================================= */}
                {/* NAVIGATION */}
                {/* ========================================= */}

                <div className="sb-mobile-nav" style={styles.nav}>

                    <button
                        type="button"
                        style={
                            styles.secondaryButton
                        }
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
                        style={
                            styles.secondaryButton
                        }
                        onClick={
                            fetchReadiness
                        }
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* ========================================= */}
                {/* ERROR */}
                {/* ========================================= */}

                {error && (

                    <div style={styles.errorCard}>

                        {error}

                    </div>

                )}


                {/* ========================================= */}
                {/* HERO */}
                {/* ========================================= */}

                <section className="sb-mobile-hero" style={styles.hero}>

                    <div style={styles.heroGlow} />


                    <div className="sb-mobile-hero-content" style={styles.heroContent}>

                        <div style={styles.eyebrow}>
                            ✦ STUDYBUDDY INTELLIGENCE
                        </div>


                        <h1 className="sb-mobile-title" style={styles.heroTitle}>

                            Exam{" "}

                            <span style={styles.pink}>
                                Readiness
                            </span>

                        </h1>


                        <p style={styles.heroText}>

                            Your readiness score combines
                            syllabus completion, mastery,
                            test performance, revision,
                            flashcards, weak topics and
                            study-plan progress.

                        </p>

                    </div>


                    <ReadinessCircle
                        value={
                            readiness
                                ?.overall_readiness ||
                            0
                        }
                        label="Overall"
                    />

                </section>


                {/* ========================================= */}
                {/* EXAMS */}
                {/* ========================================= */}

                {readiness
                    ?.exams
                    ?.length ===
                0 ? (

                    <div style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            ◷
                        </div>


                        <h2>
                            No upcoming exams
                        </h2>


                        <p style={styles.muted}>
                            Add an exam first to calculate
                            your readiness.
                        </p>


                        <button
                            style={styles.primaryButton}
                            onClick={() =>
                                navigate(
                                    "/exam-planner"
                                )
                            }
                        >
                            Open Exam Planner
                        </button>

                    </div>

                ) : (

                    <>

                        {/* ================================= */}
                        {/* EXAM SELECTOR */}
                        {/* ================================= */}

                        <div className="sb-mobile-scroll-row" style={styles.examSelector}>

                            {readiness.exams.map(
                                exam => {

                                    const active =
                                        Number(
                                            selectedExamId
                                        ) ===
                                        Number(
                                            exam.exam_id
                                        );


                                    return (

                                        <button
                                            key={
                                                exam.exam_id
                                            }
                                            type="button"
                                            onClick={() =>
                                                setSelectedExamId(
                                                    exam.exam_id
                                                )
                                            }
                                            style={
                                                active
                                                    ? styles.examTabActive
                                                    : styles.examTab
                                            }
                                        >

                                            <span style={styles.examTabSubject}>
                                                {
                                                    exam.subject_name
                                                }
                                            </span>


                                            <strong>
                                                {
                                                    exam.readiness_score
                                                }%
                                            </strong>

                                        </button>

                                    );
                                }
                            )}

                        </div>


                        {selectedExam && (

                            <>

                                {/* ============================= */}
                                {/* SELECTED EXAM */}
                                {/* ============================= */}

                                <section className="sb-mobile-hero" style={styles.examHero}>

                                    <div style={styles.examInfo}>

                                        <p style={styles.eyebrow}>
                                            UPCOMING EXAM
                                        </p>


                                        <h2 style={styles.examTitle}>
                                            {
                                                selectedExam.exam_name
                                            }
                                        </h2>


                                        <p style={styles.subjectName}>
                                            {
                                                selectedExam.subject_name
                                            }
                                        </p>


                                        <div style={styles.examMeta}>

                                            <span>
                                                ◷{" "}
                                                {
                                                    selectedExam.days_left
                                                }{" "}
                                                days remaining
                                            </span>


                                            <span>
                                                ●{" "}
                                                {
                                                    selectedExam.readiness_level
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <ReadinessCircle
                                        value={
                                            selectedExam
                                                .readiness_score
                                        }
                                        label="Ready"
                                    />

                                </section>


                                {/* ============================= */}
                                {/* METRICS */}
                                {/* ============================= */}

                                <div className="sb-mobile-grid-4" style={styles.metricsGrid}>

                                    <MetricCard
                                        label="Syllabus"
                                        value={
                                            selectedExam
                                                .metrics
                                                .syllabus_completion
                                        }
                                    />


                                    <MetricCard
                                        label="Mastery"
                                        value={
                                            selectedExam
                                                .metrics
                                                .average_mastery
                                        }
                                    />


                                    <MetricCard
                                        label="Tests"
                                        value={
                                            selectedExam
                                                .metrics
                                                .average_test_score
                                        }
                                    />


                                    <MetricCard
                                        label="Study Plan"
                                        value={
                                            selectedExam
                                                .metrics
                                                .study_plan_score
                                        }
                                    />


                                    <MetricCard
                                        label="Revision"
                                        value={
                                            selectedExam
                                                .metrics
                                                .revision_score
                                        }
                                    />


                                    <MetricCard
                                        label="Flashcards"
                                        value={
                                            selectedExam
                                                .metrics
                                                .flashcard_score
                                        }
                                    />

                                </div>


                                {/* ============================= */}
                                {/* RECOMMENDATION */}
                                {/* ============================= */}

                                <section style={styles.recommendationCard}>

                                    <div style={styles.aiIcon}>
                                        ✦
                                    </div>


                                    <div>

                                        <p style={styles.eyebrow}>
                                            STUDYBUDDY RECOMMENDS
                                        </p>


                                        <h3 style={styles.recommendationTitle}>
                                            What should you focus on?
                                        </h3>


                                        <p style={styles.recommendationText}>
                                            {
                                                selectedExam.recommendation
                                            }
                                        </p>

                                    </div>

                                </section>


                                {/* ============================= */}
                                {/* TOPIC INFORMATION */}
                                {/* ============================= */}

                                <section className="sb-mobile-grid-3" style={styles.detailsGrid}>

                                    <div style={styles.detailCard}>

                                        <span style={styles.detailLabel}>
                                            TOPICS PASSED
                                        </span>


                                        <strong style={styles.detailValue}>

                                            {
                                                selectedExam
                                                    .metrics
                                                    .passed_topics
                                            }

                                            {" / "}

                                            {
                                                selectedExam
                                                    .metrics
                                                    .total_topics
                                            }

                                        </strong>

                                    </div>


                                    <div style={styles.detailCard}>

                                        <span style={styles.detailLabel}>
                                            TEST ATTEMPTS
                                        </span>


                                        <strong style={styles.detailValue}>
                                            {
                                                selectedExam
                                                    .metrics
                                                    .test_attempts
                                            }
                                        </strong>

                                    </div>


                                    <div style={styles.detailCard}>

                                        <span style={styles.detailLabel}>
                                            WEAK TOPICS
                                        </span>


                                        <strong style={styles.detailValue}>
                                            {
                                                selectedExam
                                                    .metrics
                                                    .weak_topics
                                            }
                                        </strong>

                                    </div>

                                </section>


                                {/* ============================= */}
                                {/* WEAK TOPICS */}
                                {/* ============================= */}

                                {selectedExam
                                    .weak_topics
                                    ?.length >
                                0 && (

                                    <section style={styles.weakSection}>

                                        <div style={styles.sectionHeader}>

                                            <div>

                                                <p style={styles.eyebrow}>
                                                    NEEDS ATTENTION
                                                </p>


                                                <h2 style={styles.sectionTitle}>
                                                    Weak Topics
                                                </h2>

                                            </div>


                                            <span style={styles.countBadge}>
                                                {
                                                    selectedExam
                                                        .weak_topics
                                                        .length
                                                }
                                            </span>

                                        </div>


                                        <div className="sb-mobile-grid-2" style={styles.weakGrid}>

                                            {selectedExam
                                                .weak_topics
                                                .map(
                                                    topic => (

                                                        <div
                                                            key={
                                                                topic.topic_id
                                                            }
                                                            style={
                                                                styles.weakCard
                                                            }
                                                        >

                                                            <div>

                                                                <h3 style={styles.weakTitle}>
                                                                    {
                                                                        topic.topic_name
                                                                    }
                                                                </h3>


                                                                <span style={styles.weakLevel}>
                                                                    {
                                                                        topic.weakness_level ||
                                                                        "Needs revision"
                                                                    }
                                                                </span>

                                                            </div>


                                                            <strong style={styles.weakScore}>
                                                                {
                                                                    Math.round(
                                                                        topic.average_score
                                                                    )
                                                                }
                                                                %
                                                            </strong>

                                                        </div>

                                                    )
                                                )}

                                        </div>

                                    </section>

                                )}

                            </>

                        )}

                    </>

                )}

            </div>

        </main>
    );
}


// ============================================================
// READINESS CIRCLE
// ============================================================

function ReadinessCircle({
    value,
    label
}) {

    const percentage =
        Math.min(
            Math.max(
                Number(value) || 0,
                0
            ),
            100
        );


    return (

        <div
            style={{
                ...styles.readinessCircle,

                background:
                    `conic-gradient(
                        #F05A9D 0% ${percentage}%,
                        rgba(255,255,255,.07)
                        ${percentage}% 100%
                    )`
            }}
        >

            <div style={styles.readinessInner}>

                <strong style={styles.readinessValue}>
                    {
                        Math.round(
                            percentage
                        )
                    }
                    %
                </strong>


                <span style={styles.readinessLabel}>
                    {label}
                </span>

            </div>

        </div>
    );
}


// ============================================================
// METRIC
// ============================================================

function MetricCard({
    label,
    value
}) {

    const percentage =
        Math.min(
            Math.max(
                Number(value) || 0,
                0
            ),
            100
        );


    return (

        <div style={styles.metricCard}>

            <div style={styles.metricHeader}>

                <span style={styles.metricLabel}>
                    {label}
                </span>


                <strong style={styles.metricValue}>
                    {
                        Math.round(
                            percentage
                        )
                    }
                    %
                </strong>

            </div>


            <div style={styles.metricTrack}>

                <div
                    style={{
                        ...styles.metricFill,

                        width:
                            `${percentage}%`
                    }}
                />

            </div>

        </div>
    );
}


// ============================================================
// STYLES
// ============================================================

const styles = {

    page: {
        minHeight:
            "100vh",

        padding:
            "34px 22px 80px",

        background:
            "transparent",

        color:
            "#FFF7FB",

        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    container: {
        maxWidth:
            "1180px",

        margin:
            "0 auto"
    },


    nav: {
        display:
            "flex",

        justifyContent:
            "space-between",

        gap:
            "15px",

        marginBottom:
            "22px"
    },


    secondaryButton: {
        minHeight:
            "42px",

        padding:
            "0 17px",

        borderRadius:
            "11px",

        border:
            "1px solid rgba(240,90,157,.24)",

        background:
            "rgba(10,10,13,.72)",

        color:
            "#F7A3C8",

        cursor:
            "pointer",

        fontWeight:
            "700"
    },


    primaryButton: {
        minHeight:
            "44px",

        padding:
            "0 18px",

        marginTop:
            "18px",

        border:
            "none",

        borderRadius:
            "11px",

        background:
            "linear-gradient(100deg,#D93478,#F05A9D,#FF69AD)",

        color:
            "#FFF",

        cursor:
            "pointer",

        fontWeight:
            "800"
    },


    hero: {
        position:
            "relative",

        overflow:
            "hidden",

        display:
            "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        gap:
            "35px",

        padding:
            "42px",

        marginBottom:
            "25px",

        borderRadius:
            "26px",

        background:
            "linear-gradient(145deg,rgba(24,20,27,.94),rgba(7,7,10,.88))",

        border:
            "1px solid rgba(240,90,157,.28)",

        backdropFilter:
            "blur(24px)"
    },


    heroGlow: {
        position:
            "absolute",

        width:
            "420px",

        height:
            "420px",

        right:
            "-130px",

        top:
            "-270px",

        borderRadius:
            "50%",

        background:
            "rgba(240,90,157,.18)",

        filter:
            "blur(95px)"
    },


    heroContent: {
        position:
            "relative",

        zIndex:
            1,

        maxWidth:
            "700px"
    },


    eyebrow: {
        margin:
            "0 0 9px",

        color:
            "#F05A9D",

        fontSize:
            "9px",

        fontWeight:
            "900",

        letterSpacing:
            "1.7px"
    },


    heroTitle: {
        margin:
            0,

        color:
            "#FFF9FC",

        fontSize:
            "clamp(36px,5vw,52px)",

        letterSpacing:
            "-1.4px"
    },


    pink: {
        color:
            "#F05A9D"
    },


    heroText: {
        maxWidth:
            "650px",

        margin:
            "15px 0 0",

        color:
            "#A99DA4",

        lineHeight:
            "1.7",

        fontSize:
            "14px"
    },


    readinessCircle: {
        flexShrink:
            0,

        width:
            "150px",

        height:
            "150px",

        padding:
            "9px",

        borderRadius:
            "50%",

        display:
            "grid",

        placeItems:
            "center",

        boxShadow:
            "0 0 45px rgba(240,90,157,.12)"
    },


    readinessInner: {
        width:
            "100%",

        height:
            "100%",

        borderRadius:
            "50%",

        display:
            "flex",

        flexDirection:
            "column",

        alignItems:
            "center",

        justifyContent:
            "center",

        background:
            "#0B090D",

        border:
            "1px solid rgba(240,90,157,.18)"
    },


    readinessValue: {
        color:
            "#FFF",

        fontSize:
            "33px"
    },


    readinessLabel: {
        marginTop:
            "5px",

        color:
            "#95888F",

        fontSize:
            "10px"
    },


    examSelector: {
        display:
            "flex",

        gap:
            "10px",

        overflowX:
            "auto",

        marginBottom:
            "18px"
    },


    examTab: {
        minWidth:
            "150px",

        padding:
            "13px",

        display:
            "flex",

        justifyContent:
            "space-between",

        gap:
            "15px",

        borderRadius:
            "12px",

        border:
            "1px solid rgba(255,255,255,.07)",

        background:
            "rgba(9,9,12,.70)",

        color:
            "#A99DA4",

        cursor:
            "pointer"
    },


    examTabActive: {
        minWidth:
            "150px",

        padding:
            "13px",

        display:
            "flex",

        justifyContent:
            "space-between",

        gap:
            "15px",

        borderRadius:
            "12px",

        border:
            "1px solid rgba(240,90,157,.35)",

        background:
            "rgba(240,90,157,.10)",

        color:
            "#FFF",

        cursor:
            "pointer"
    },


    examTabSubject: {
        overflow:
            "hidden",

        textOverflow:
            "ellipsis",

        whiteSpace:
            "nowrap"
    },


    examHero: {
        display:
            "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        gap:
            "25px",

        padding:
            "30px",

        marginBottom:
            "18px",

        borderRadius:
            "21px",

        background:
            "linear-gradient(145deg,rgba(21,19,24,.92),rgba(8,8,11,.84))",

        border:
            "1px solid rgba(240,90,157,.18)"
    },


    examInfo: {
        minWidth:
            0
    },


    examTitle: {
        margin:
            0,

        color:
            "#FFF",

        fontSize:
            "28px"
    },


    subjectName: {
        margin:
            "7px 0 14px",

        color:
            "#F7A3C8"
    },


    examMeta: {
        display:
            "flex",

        flexWrap:
            "wrap",

        gap:
            "10px",

        color:
            "#94888E",

        fontSize:
            "11px"
    },


    metricsGrid: {
        display:
            "grid",

        gridTemplateColumns:
            "repeat(auto-fit,minmax(220px,1fr))",

        gap:
            "13px",

        marginBottom:
            "20px"
    },


    metricCard: {
        padding:
            "20px",

        borderRadius:
            "15px",

        background:
            "linear-gradient(145deg,rgba(19,17,22,.90),rgba(8,8,11,.82))",

        border:
            "1px solid rgba(240,90,157,.13)"
    },


    metricHeader: {
        display:
            "flex",

        justifyContent:
            "space-between",

        marginBottom:
            "12px"
    },


    metricLabel: {
        color:
            "#91858B",

        fontSize:
            "11px"
    },


    metricValue: {
        color:
            "#FFF"
    },


    metricTrack: {
        height:
            "6px",

        overflow:
            "hidden",

        borderRadius:
            "999px",

        background:
            "rgba(255,255,255,.06)"
    },


    metricFill: {
        height:
            "100%",

        borderRadius:
            "999px",

        background:
            "linear-gradient(90deg,#D93478,#F05A9D,#FF69AD)"
    },


    recommendationCard: {
        display:
            "flex",

        alignItems:
            "center",

        gap:
            "18px",

        padding:
            "25px",

        marginBottom:
            "20px",

        borderRadius:
            "18px",

        background:
            "linear-gradient(145deg,rgba(240,90,157,.08),rgba(8,8,11,.80))",

        border:
            "1px solid rgba(240,90,157,.20)"
    },


    aiIcon: {
        flexShrink:
            0,

        width:
            "52px",

        height:
            "52px",

        display:
            "grid",

        placeItems:
            "center",

        borderRadius:
            "15px",

        background:
            "rgba(240,90,157,.10)",

        color:
            "#F05A9D",

        fontSize:
            "22px"
    },


    recommendationTitle: {
        margin:
            0,

        color:
            "#FFF",

        fontSize:
            "17px"
    },


    recommendationText: {
        margin:
            "6px 0 0",

        color:
            "#A99DA4",

        lineHeight:
            "1.65",

        fontSize:
            "12px"
    },


    detailsGrid: {
        display:
            "grid",

        gridTemplateColumns:
            "repeat(3,1fr)",

        gap:
            "13px",

        marginBottom:
            "30px"
    },


    detailCard: {
        padding:
            "20px",

        textAlign:
            "center",

        borderRadius:
            "15px",

        background:
            "rgba(8,8,11,.65)",

        border:
            "1px solid rgba(240,90,157,.12)"
    },


    detailLabel: {
        display:
            "block",

        color:
            "#81757B",

        fontSize:
            "9px",

        letterSpacing:
            "1px"
    },


    detailValue: {
        display:
            "block",

        marginTop:
            "8px",

        color:
            "#FFF",

        fontSize:
            "23px"
    },


    weakSection: {
        marginTop:
            "25px"
    },


    sectionHeader: {
        display:
            "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        marginBottom:
            "15px"
    },


    sectionTitle: {
        margin:
            0,

        color:
            "#FFF"
    },


    countBadge: {
        padding:
            "7px 11px",

        borderRadius:
            "999px",

        background:
            "rgba(240,90,157,.10)",

        color:
            "#F7A3C8"
    },


    weakGrid: {
        display:
            "grid",

        gridTemplateColumns:
            "repeat(auto-fit,minmax(260px,1fr))",

        gap:
            "12px"
    },


    weakCard: {
        display:
            "flex",

        justifyContent:
            "space-between",

        alignItems:
            "center",

        gap:
            "15px",

        padding:
            "18px",

        borderRadius:
            "14px",

        background:
            "rgba(8,8,11,.65)",

        border:
            "1px solid rgba(240,90,157,.13)"
    },


    weakTitle: {
        margin:
            0,

        color:
            "#FFF",

        fontSize:
            "14px"
    },


    weakLevel: {
        display:
            "block",

        marginTop:
            "5px",

        color:
            "#877A81",

        fontSize:
            "10px",

        textTransform:
            "capitalize"
    },


    weakScore: {
        color:
            "#F05A9D",

        fontSize:
            "20px"
    },


    errorCard: {
        padding:
            "14px",

        marginBottom:
            "20px",

        borderRadius:
            "12px",

        background:
            "rgba(180,50,80,.12)",

        border:
            "1px solid rgba(255,100,140,.2)",

        color:
            "#FFB8CE"
    },


    emptyCard: {
        padding:
            "50px 30px",

        textAlign:
            "center",

        borderRadius:
            "20px",

        background:
            "rgba(10,10,13,.80)",

        border:
            "1px solid rgba(240,90,157,.15)"
    },


    emptyIcon: {
        width:
            "54px",

        height:
            "54px",

        margin:
            "0 auto 14px",

        display:
            "grid",

        placeItems:
            "center",

        borderRadius:
            "15px",

        background:
            "rgba(240,90,157,.10)",

        color:
            "#F05A9D"
    },


    muted: {
        color:
            "#91858B"
    }

};


export default ExamReadiness;