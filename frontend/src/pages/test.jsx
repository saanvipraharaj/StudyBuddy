import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../services/api";


function Test() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [test, setTest] =
        useState(null);

    const [questions, setQuestions] =
        useState([]);

    const [answers, setAnswers] =
        useState({});

    const [result, setResult] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const [startTime, setStartTime] =
        useState(null);


    // ============================================
    // AUTH
    // ============================================

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


    // ============================================
    // FETCH TEST
    // ============================================

    const fetchTest = async () => {

        try {

            const response =
                await api.get(
                    `/api/tests/${id}/questions`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setTest(
                response.data.test
            );


            setQuestions(
                response.data.questions ||
                []
            );


            setStartTime(
                Date.now()
            );


        } catch (error) {

            console.error(
                "Fetch test error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to load test."
            );

            setMessageType(
                "error"
            );


        } finally {

            setLoading(false);

        }

    };


    // ============================================
    // LOAD TEST
    // ============================================

    useEffect(() => {

        const token =
            getToken();


        if (!token) {

            navigate("/login");

            return;

        }


        fetchTest();

    }, [id]);


    // ============================================
    // SELECT ANSWER
    // ============================================

    const handleAnswer = (
        questionId,
        answer
    ) => {

        if (result) {
            return;
        }


        setAnswers(
            previous => ({
                ...previous,

                [questionId]:
                    answer
            })
        );

    };


    // ============================================
    // SUBMIT TEST
    // ============================================

    const handleSubmit = async () => {

        if (
            Object.keys(
                answers
            ).length !==
            questions.length
        ) {

            setMessage(
                "Please answer all questions before submitting the test."
            );

            setMessageType(
                "error"
            );

            return;

        }


        const confirmed =
            window.confirm(
                "Submit your test?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setSubmitting(
                true
            );

            setMessage(
                ""
            );


            const formattedAnswers =
                questions.map(
                    question => ({
                        question_id:
                            question.id,

                        selected_answer:
                            answers[
                                question.id
                            ]
                    })
                );


            const timeTaken =
                startTime
                    ? Math.floor(
                        (
                            Date.now() -
                            startTime
                        ) /
                        1000
                    )
                    : 0;


            const response =
                await api.post(
                    `/api/tests/${id}/submit`,
                    {
                        answers:
                            formattedAnswers,

                        time_taken_seconds:
                            timeTaken
                    },
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setResult(
                response.data
            );


            setMessage(
                response.data.message ||
                "Test submitted successfully."
            );


            setMessageType(
                response.data
                    .attempt
                    ?.passed
                    ? "success"
                    : "error"
            );


            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });


        } catch (error) {

            console.error(
                "Submit test error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to submit test."
            );

            setMessageType(
                "error"
            );


        } finally {

            setSubmitting(
                false
            );

        }

    };


    // ============================================
    // GET QUESTION RESULT
    // ============================================

    const getQuestionResult = (
        questionId
    ) => {

        if (
            !result ||
            !Array.isArray(
                result.results
            )
        ) {
            return null;
        }


        return result.results.find(
            item =>
                Number(
                    item.question_id
                ) ===
                Number(
                    questionId
                )
        );

    };


    // ============================================
    // PROGRESS
    // ============================================

    const answeredCount =
        Object.keys(
            answers
        ).length;


    const answerPercentage =
        questions.length > 0
            ? Math.round(
                (
                    answeredCount /
                    questions.length
                ) * 100
            )
            : 0;


    // ============================================
    // RESULT VALUES
    // ============================================

    const resultPercentage =
        result
            ? Number(
                result.attempt?.percentage ||
                0
            )
            : 0;


    const passed =
        Boolean(
            result?.attempt?.passed
        );


    const score =
        Number(
            result?.attempt?.score ||
            0
        );


    const totalResultQuestions =
        Number(
            result?.attempt
                ?.total_questions ||
            questions.length ||
            0
        );


    const passingPercentage =
        Number(
            test?.passing_percentage ||
            result?.attempt
                ?.passing_percentage ||
            70
        );


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <div style={styles.centerPage}>

                <div style={styles.loadingCard}>

                    <div style={styles.loadingIcon}>
                        ✦
                    </div>

                    <h2 style={styles.loadingTitle}>
                        Preparing Your Test
                    </h2>

                    <p style={styles.mutedText}>
                        Loading questions and
                        getting your mastery
                        check ready.
                    </p>

                </div>

            </div>

        );

    }


    // ============================================
    // TEST NOT FOUND
    // ============================================

    if (!test) {

        return (

            <div style={styles.centerPage}>

                <div style={styles.loadingCard}>

                    <div style={styles.loadingIcon}>
                        !
                    </div>

                    <h2 style={styles.loadingTitle}>
                        Test unavailable
                    </h2>

                    <p style={styles.mutedText}>
                        {
                            message ||
                            "Test not found."
                        }
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        style={
                            styles.secondaryButton
                        }
                    >
                        Go to Dashboard
                    </button>

                </div>

            </div>

        );

    }


    // ============================================
    // PAGE
    // ============================================

    return (

        <div className="sb-mobile-page" style={styles.page}>

            <div className="sb-mobile-container" style={styles.container}>


                {/* ================================= */}
                {/* NAVIGATION */}
                {/* ================================= */}

                <div className="sb-mobile-nav" style={styles.topNav}>

                    <button
                        onClick={() =>
                            navigate(
                                `/topics/${test.topic_id}`
                            )
                        }
                        style={styles.backButton}
                    >
                        <span style={styles.backArrow}>
                            ←
                        </span>

                        Back to Topic
                    </button>


                    <button
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                        style={
                            styles.secondaryButton
                        }
                    >
                        Dashboard
                    </button>

                </div>


                {/* ================================= */}
                {/* HERO */}
                {/* ================================= */}

                <section className="sb-mobile-card" style={styles.heroCard}>

                    <div style={styles.heroGlow} />


                    <div className="sb-mobile-row" style={styles.heroTop}>

                        <div style={styles.heroContent}>

                            <div style={styles.masteryBadge}>
                                ✦ MASTERY CHECK
                            </div>


                            <h1 className="sb-mobile-title" style={styles.heroTitle}>
                                {
                                    test.title ||
                                    "Topic Test"
                                }
                            </h1>


                            <p style={styles.heroDescription}>
                                Answer every question
                                carefully. You need{" "}
                                <strong style={styles.highlightText}>
                                    {
                                        passingPercentage
                                            .toFixed(
                                                0
                                            )
                                    }
                                    %
                                </strong>{" "}
                                to pass and complete
                                this topic.
                            </p>

                        </div>


                        <div style={styles.testIconBox}>
                            ✓
                        </div>

                    </div>


                    <div className="sb-mobile-grid-4" style={styles.heroStats}>

                        <div style={styles.heroStatCard}>

                            <span style={styles.statLabel}>
                                QUESTIONS
                            </span>

                            <strong style={styles.statValue}>
                                {
                                    questions.length
                                }
                            </strong>

                        </div>


                        <div style={styles.heroStatCard}>

                            <span style={styles.statLabel}>
                                PASSING SCORE
                            </span>

                            <strong style={styles.statValue}>
                                {
                                    passingPercentage
                                        .toFixed(
                                            0
                                        )
                                }
                                %
                            </strong>

                        </div>


                        <div style={styles.heroStatCard}>

                            <span style={styles.statLabel}>
                                DIFFICULTY
                            </span>

                            <strong
                                style={{
                                    ...styles.statValue,
                                    textTransform:
                                        "capitalize"
                                }}
                            >
                                {
                                    test.difficulty ||
                                    "Medium"
                                }
                            </strong>

                        </div>


                        <div style={styles.heroStatCard}>

                            <span style={styles.statLabel}>
                                ANSWERED
                            </span>

                            <strong style={styles.statValue}>
                                {
                                    answeredCount
                                }
                                {" / "}
                                {
                                    questions.length
                                }
                            </strong>

                        </div>

                    </div>


                    {!result && (

                        <div style={styles.progressSection}>

                            <div style={styles.progressHeader}>

                                <span>
                                    Test progress
                                </span>

                                <strong>
                                    {
                                        answerPercentage
                                    }
                                    %
                                </strong>

                            </div>


                            <div style={styles.progressTrack}>

                                <div
                                    style={{
                                        ...styles.progressFill,

                                        width:
                                            `${answerPercentage}%`
                                    }}
                                />

                            </div>

                        </div>

                    )}

                </section>


                {/* ================================= */}
                {/* MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div
                        style={{
                            ...styles.message,

                            ...(messageType ===
                            "error"
                                ? styles.errorMessage
                                : styles.successMessage)
                        }}
                    >
                        <span>
                            {
                                messageType ===
                                "error"
                                    ? "!"
                                    : "✓"
                            }
                        </span>

                        <strong>
                            {message}
                        </strong>

                    </div>

                )}


                {/* ================================= */}
                {/* RESULT */}
                {/* ================================= */}

                {result && (

                    <section style={styles.resultCard}>

                        <div
                            style={{
                                ...styles.resultIcon,

                                ...(passed
                                    ? styles.passedIcon
                                    : styles.failedIcon)
                            }}
                        >
                            {
                                passed
                                    ? "✓"
                                    : "×"
                            }
                        </div>


                        <p style={styles.resultEyebrow}>
                            TEST COMPLETE
                        </p>


                        <h2 style={styles.resultTitle}>
                            {
                                passed
                                    ? "You Passed!"
                                    : "Keep Practising"
                            }
                        </h2>


                        <p style={styles.resultDescription}>
                            {
                                passed
                                    ? "Great work — you reached the required mastery score for this topic."
                                    : "You did not reach the passing score yet. Review the explanations and try again when you're ready."
                            }
                        </p>


                        <div style={styles.resultScoreCircle}>

                            <strong>
                                {
                                    resultPercentage
                                        .toFixed(
                                            0
                                        )
                                }
                                %
                            </strong>

                            <span>
                                Score
                            </span>

                        </div>


                        <div style={styles.resultStats}>

                            <div style={styles.resultStatCard}>

                                <span style={styles.statLabel}>
                                    CORRECT
                                </span>

                                <strong style={styles.statValue}>
                                    {score}
                                </strong>

                            </div>


                            <div style={styles.resultStatCard}>

                                <span style={styles.statLabel}>
                                    TOTAL
                                </span>

                                <strong style={styles.statValue}>
                                    {
                                        totalResultQuestions
                                    }
                                </strong>

                            </div>


                            <div style={styles.resultStatCard}>

                                <span style={styles.statLabel}>
                                    REQUIRED
                                </span>

                                <strong style={styles.statValue}>
                                    {
                                        Number(
                                            result.attempt
                                                ?.passing_percentage ||
                                            passingPercentage
                                        ).toFixed(
                                            0
                                        )
                                    }
                                    %
                                </strong>

                            </div>


                            <div style={styles.resultStatCard}>

                                <span style={styles.statLabel}>
                                    ATTEMPT
                                </span>

                                <strong style={styles.statValue}>
                                    #
                                    {
                                        result.attempt
                                            ?.attempt_number ||
                                        1
                                    }
                                </strong>

                            </div>

                        </div>

                    </section>

                )}


                {/* ================================= */}
                {/* QUESTION LIST */}
                {/* ================================= */}

                <div style={styles.questionList}>

                    {questions.map(
                        (
                            question,
                            index
                        ) => {

                            const questionResult =
                                getQuestionResult(
                                    question.id
                                );


                            const selectedAnswer =
                                answers[
                                    question.id
                                ];


                            const options = [
                                {
                                    key: "A",
                                    text:
                                        question.option_a
                                },
                                {
                                    key: "B",
                                    text:
                                        question.option_b
                                },
                                {
                                    key: "C",
                                    text:
                                        question.option_c
                                },
                                {
                                    key: "D",
                                    text:
                                        question.option_d
                                }
                            ];


                            return (

                                <section
                                    key={
                                        question.id
                                    }
                                    style={
                                        styles.questionCard
                                    }
                                >

                                    <div style={styles.questionHeader}>

                                        <div>

                                            <p style={styles.questionNumber}>
                                                QUESTION{" "}
                                                {
                                                    index + 1
                                                }
                                                {" / "}
                                                {
                                                    questions.length
                                                }
                                            </p>


                                            <h2 style={styles.questionText}>
                                                {
                                                    question.question_text
                                                }
                                            </h2>

                                        </div>


                                        <span style={styles.difficultyBadge}>
                                            {
                                                question.difficulty ||
                                                "Medium"
                                            }
                                        </span>

                                    </div>


                                    {/* OPTIONS */}

                                    <div style={styles.options}>

                                        {options.map(
                                            option => {

                                                const selected =
                                                    selectedAnswer ===
                                                    option.key;


                                                const correctAfterResult =
                                                    questionResult &&
                                                    questionResult
                                                        .correct_answer ===
                                                    option.key;


                                                const wrongSelected =
                                                    questionResult &&
                                                    selected &&
                                                    !questionResult
                                                        .is_correct;


                                                let optionStyle = {
                                                    ...styles.option
                                                };


                                                if (selected) {

                                                    optionStyle = {
                                                        ...optionStyle,
                                                        ...styles.selectedOption
                                                    };

                                                }


                                                if (
                                                    correctAfterResult
                                                ) {

                                                    optionStyle = {
                                                        ...optionStyle,
                                                        ...styles.correctOption
                                                    };

                                                }


                                                if (
                                                    wrongSelected
                                                ) {

                                                    optionStyle = {
                                                        ...optionStyle,
                                                        ...styles.wrongOption
                                                    };

                                                }


                                                return (

                                                    <label
                                                        key={
                                                            option.key
                                                        }
                                                        style={
                                                            optionStyle
                                                        }
                                                    >

                                                        <input
                                                            type="radio"

                                                            name={
                                                                `question-${question.id}`
                                                            }

                                                            value={
                                                                option.key
                                                            }

                                                            checked={
                                                                selected
                                                            }

                                                            disabled={
                                                                Boolean(
                                                                    result
                                                                )
                                                            }

                                                            onChange={() =>
                                                                handleAnswer(
                                                                    question.id,
                                                                    option.key
                                                                )
                                                            }

                                                            style={
                                                                styles.radioInput
                                                            }
                                                        />


                                                        <span
                                                            style={{
                                                                ...styles.optionLetter,

                                                                ...(selected
                                                                    ? styles.selectedLetter
                                                                    : {})
                                                            }}
                                                        >
                                                            {
                                                                option.key
                                                            }
                                                        </span>


                                                        <span style={styles.optionText}>
                                                            {
                                                                option.text
                                                            }
                                                        </span>


                                                        {correctAfterResult && (

                                                            <span style={styles.correctMark}>
                                                                ✓
                                                            </span>

                                                        )}


                                                        {wrongSelected && (

                                                            <span style={styles.wrongMark}>
                                                                ×
                                                            </span>

                                                        )}

                                                    </label>

                                                );

                                            }
                                        )}

                                    </div>


                                    {/* RESULT EXPLANATION */}

                                    {questionResult && (

                                        <div
                                            style={{
                                                ...styles.answerFeedback,

                                                ...(questionResult
                                                    .is_correct
                                                    ? styles.correctFeedback
                                                    : styles.incorrectFeedback)
                                            }}
                                        >

                                            <div style={styles.feedbackHeader}>

                                                <span
                                                    style={{
                                                        ...styles.feedbackIcon,

                                                        ...(questionResult
                                                            .is_correct
                                                            ? styles.correctFeedbackIcon
                                                            : styles.incorrectFeedbackIcon)
                                                    }}
                                                >
                                                    {
                                                        questionResult
                                                            .is_correct
                                                            ? "✓"
                                                            : "×"
                                                    }
                                                </span>


                                                <strong>
                                                    {
                                                        questionResult
                                                            .is_correct
                                                            ? "Correct Answer"
                                                            : "Incorrect Answer"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="sb-mobile-grid-2" style={styles.feedbackGrid}>

                                                <div>

                                                    <span style={styles.feedbackLabel}>
                                                        YOUR ANSWER
                                                    </span>

                                                    <strong style={styles.feedbackValue}>
                                                        {
                                                            questionResult
                                                                .selected_answer ||
                                                            "Not answered"
                                                        }
                                                    </strong>

                                                </div>


                                                <div>

                                                    <span style={styles.feedbackLabel}>
                                                        CORRECT ANSWER
                                                    </span>

                                                    <strong style={styles.feedbackValue}>
                                                        {
                                                            questionResult
                                                                .correct_answer
                                                        }
                                                    </strong>

                                                </div>

                                            </div>


                                            {questionResult
                                                .explanation && (

                                                <div style={styles.explanationBox}>

                                                    <span style={styles.feedbackLabel}>
                                                        EXPLANATION
                                                    </span>

                                                    <p>
                                                        {
                                                            questionResult
                                                                .explanation
                                                        }
                                                    </p>

                                                </div>

                                            )}

                                        </div>

                                    )}

                                </section>

                            );

                        }
                    )}

                </div>


                {/* ================================= */}
                {/* SUBMIT */}
                {/* ================================= */}

                {!result && (

                    <section className="sb-mobile-row" style={styles.submitSection}>

                        <div>

                            <p style={styles.submitEyebrow}>
                                READY TO SUBMIT?
                            </p>


                            <h2 style={styles.submitTitle}>
                                {
                                    answeredCount ===
                                    questions.length
                                        ? "All questions answered"
                                        : `${
                                            questions.length -
                                            answeredCount
                                        } questions remaining`
                                }
                            </h2>


                            <p style={styles.submitDescription}>
                                Review your answers
                                before submitting.
                                Your score will be
                                calculated immediately.
                            </p>

                        </div>


                        <div className="sb-mobile-actions" style={styles.submitRight}>

                            <span style={styles.answerCount}>
                                {
                                    answeredCount
                                }
                                {" / "}
                                {
                                    questions.length
                                }{" "}
                                answered
                            </span>


                            <button
                                onClick={
                                    handleSubmit
                                }
                                disabled={
                                    submitting
                                }
                                style={{
                                    ...styles.submitButton,

                                    ...(submitting
                                        ? styles.disabledSubmit
                                        : {})
                                }}
                            >
                                {
                                    submitting
                                        ? "Submitting..."
                                        : "Submit Test →"
                                }
                            </button>

                        </div>

                    </section>

                )}


                {/* ================================= */}
                {/* AFTER TEST */}
                {/* ================================= */}

                {result && (

                    <div style={styles.afterTest}>

                        <button
                            onClick={() =>
                                navigate(
                                    `/topics/${test.topic_id}`
                                )
                            }
                            style={
                                styles.primaryButton
                            }
                        >
                            ← Back to Topic
                        </button>

                    </div>

                )}

            </div>

        </div>

    );
}


// ============================================
// STYLES
// ============================================

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
        maxWidth: "1080px",
        margin: "0 auto"
    },


    // ============================================
    // LOADING
    // ============================================

    centerPage: {
        minHeight: "100vh",
        padding: "30px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        color: "#FFF7FB"
    },


    loadingCard: {
        width: "min(430px, 100%)",

        padding: "42px 34px",

        textAlign: "center",

        borderRadius: "24px",

        background:
            "linear-gradient(145deg, rgba(24,22,28,.90), rgba(7,7,10,.86))",

        border:
            "1px solid rgba(240,90,157,.20)",

        backdropFilter: "blur(24px)",

        boxShadow:
            "0 30px 90px rgba(0,0,0,.55)"
    },


    loadingIcon: {
        width: "58px",
        height: "58px",

        margin: "0 auto 18px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        borderRadius: "17px",

        color: "#F05A9D",

        background:
            "rgba(240,90,157,.10)",

        border:
            "1px solid rgba(240,90,157,.22)",

        fontSize: "24px",

        boxShadow:
            "0 0 35px rgba(240,90,157,.12)"
    },


    loadingTitle: {
        margin: "0 0 9px",

        color: "#FFF9FC",

        fontSize: "25px"
    },


    mutedText: {
        margin: 0,

        color: "#A99DA4",

        lineHeight: "1.6",

        fontSize: "14px"
    },


    // ============================================
    // NAV
    // ============================================

    topNav: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",

        gap: "20px",

        marginBottom: "22px"
    },


    backButton: {
        display: "inline-flex",
        alignItems: "center",

        gap: "8px",

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


    secondaryButton: {
        minHeight: "42px",

        padding: "0 17px",

        borderRadius: "10px",

        border:
            "1px solid rgba(240,90,157,.22)",

        background:
            "rgba(13,13,17,.72)",

        color: "#F7A3C8",

        cursor: "pointer",

        fontSize: "13px",

        fontWeight: "600"
    },


    // ============================================
    // HERO
    // ============================================

    heroCard: {
        position: "relative",

        overflow: "hidden",

        padding: "36px",

        marginBottom: "22px",

        borderRadius: "26px",

        background:
            "linear-gradient(145deg, rgba(24,21,27,.90), rgba(7,7,10,.82))",

        border:
            "1px solid rgba(240,90,157,.22)",

        backdropFilter: "blur(24px)",

        boxShadow:
            "0 30px 85px rgba(0,0,0,.42)"
    },


    heroGlow: {
        position: "absolute",

        width: "420px",
        height: "420px",

        top: "-300px",
        right: "-70px",

        borderRadius: "50%",

        background:
            "rgba(240,90,157,.17)",

        filter: "blur(90px)",

        pointerEvents: "none"
    },


    heroTop: {
        position: "relative",

        zIndex: 1,

        display: "flex",

        alignItems: "flex-start",

        justifyContent: "space-between",

        gap: "30px"
    },


    heroContent: {
        maxWidth: "720px"
    },


    masteryBadge: {
        display: "inline-flex",

        alignItems: "center",

        gap: "7px",

        padding: "6px 10px",

        marginBottom: "15px",

        borderRadius: "999px",

        background:
            "rgba(240,90,157,.09)",

        border:
            "1px solid rgba(240,90,157,.22)",

        color: "#F7A3C8",

        fontSize: "10px",

        fontWeight: "800",

        letterSpacing: "1.4px"
    },


    heroTitle: {
        margin: 0,

        color: "#FFF9FC",

        fontSize:
            "clamp(30px, 5vw, 48px)",

        lineHeight: "1.08",

        letterSpacing: "-1.4px",

        fontWeight: "800"
    },


    heroDescription: {
        maxWidth: "650px",

        margin: "15px 0 0",

        color: "#B7AAB1",

        lineHeight: "1.7",

        fontSize: "14px"
    },


    highlightText: {
        color: "#F7A3C8"
    },


    testIconBox: {
        flexShrink: 0,

        width: "64px",
        height: "64px",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        borderRadius: "18px",

        background:
            "rgba(240,90,157,.11)",

        border:
            "1px solid rgba(240,90,157,.25)",

        color: "#FF69AD",

        fontSize: "26px",

        boxShadow:
            "0 0 35px rgba(240,90,157,.10)"
    },


    heroStats: {
        position: "relative",

        zIndex: 1,

        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",

        gap: "12px",

        marginTop: "30px"
    },


    heroStatCard: {
        minHeight: "90px",

        padding: "17px",

        display: "flex",

        flexDirection: "column",

        justifyContent: "center",

        gap: "7px",

        borderRadius: "14px",

        background:
            "rgba(7,7,10,.46)",

        border:
            "1px solid rgba(255,255,255,.07)"
    },


    statLabel: {
        color: "#81747B",

        fontSize: "9px",

        fontWeight: "800",

        letterSpacing: "1.2px"
    },


    statValue: {
        color: "#FFF7FB",

        fontSize: "20px",

        lineHeight: "1",

        fontWeight: "800"
    },


    // ============================================
    // PROGRESS
    // ============================================

    progressSection: {
        position: "relative",

        zIndex: 1,

        marginTop: "23px"
    },


    progressHeader: {
        display: "flex",

        justifyContent: "space-between",

        gap: "15px",

        marginBottom: "9px",

        color: "#9F9298",

        fontSize: "12px"
    },


    progressTrack: {
        width: "100%",

        height: "8px",

        overflow: "hidden",

        borderRadius: "999px",

        background:
            "rgba(255,255,255,.06)"
    },


    progressFill: {
        height: "100%",

        borderRadius: "999px",

        background:
            "linear-gradient(90deg, #D93478, #F05A9D, #FF69AD)",

        boxShadow:
            "0 0 20px rgba(240,90,157,.35)",

        transition:
            "width .3s ease"
    },


    // ============================================
    // MESSAGE
    // ============================================

    message: {
        display: "flex",

        alignItems: "center",

        gap: "10px",

        padding: "14px 16px",

        marginBottom: "22px",

        borderRadius: "12px",

        fontSize: "13px"
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


    // ============================================
    // RESULT
    // ============================================

    resultCard: {
        marginBottom: "26px",

        padding: "38px 30px",

        textAlign: "center",

        borderRadius: "24px",

        background:
            "linear-gradient(145deg, rgba(22,20,25,.90), rgba(7,7,10,.84))",

        border:
            "1px solid rgba(240,90,157,.20)",

        backdropFilter: "blur(22px)",

        boxShadow:
            "0 26px 75px rgba(0,0,0,.40)"
    },


    resultIcon: {
        width: "66px",
        height: "66px",

        margin: "0 auto 18px",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        borderRadius: "20px",

        fontSize: "28px",

        fontWeight: "800"
    },


    passedIcon: {
        color: "#FF8DC1",

        background:
            "rgba(240,90,157,.11)",

        border:
            "1px solid rgba(240,90,157,.28)"
    },


    failedIcon: {
        color: "#FF91A9",

        background:
            "rgba(255,90,120,.09)",

        border:
            "1px solid rgba(255,110,140,.22)"
    },


    resultEyebrow: {
        margin: "0 0 8px",

        color: "#F05A9D",

        fontSize: "10px",

        fontWeight: "800",

        letterSpacing: "1.7px"
    },


    resultTitle: {
        margin: 0,

        color: "#FFF9FC",

        fontSize: "31px",

        letterSpacing: "-.7px"
    },


    resultDescription: {
        maxWidth: "650px",

        margin: "11px auto 25px",

        color: "#A99DA4",

        lineHeight: "1.7",

        fontSize: "14px"
    },


    resultScoreCircle: {
        width: "130px",
        height: "130px",

        margin: "0 auto 28px",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        borderRadius: "50%",

        background:
            "radial-gradient(circle at center, rgba(240,90,157,.16), rgba(240,90,157,.04))",

        border:
            "1px solid rgba(240,90,157,.28)",

        boxShadow:
            "0 0 40px rgba(240,90,157,.10)"
    },


    resultScoreCircleStrong: {
        fontSize: "30px"
    },


    resultStats: {
        maxWidth: "700px",

        margin: "0 auto",

        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(130px, 1fr))",

        gap: "11px"
    },


    resultStatCard: {
        minHeight: "88px",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        gap: "8px",

        padding: "14px",

        borderRadius: "13px",

        background:
            "rgba(7,7,10,.48)",

        border:
            "1px solid rgba(255,255,255,.06)"
    },


    // ============================================
    // QUESTIONS
    // ============================================

    questionList: {
        display: "grid",

        gap: "18px"
    },


    questionCard: {
        padding: "28px",

        borderRadius: "20px",

        background:
            "linear-gradient(145deg, rgba(19,19,24,.88), rgba(7,7,10,.80))",

        border:
            "1px solid rgba(240,90,157,.15)",

        backdropFilter: "blur(20px)",

        boxShadow:
            "0 20px 55px rgba(0,0,0,.28)"
    },


    questionHeader: {
        display: "flex",

        alignItems: "flex-start",

        justifyContent: "space-between",

        gap: "22px",

        marginBottom: "23px"
    },


    questionNumber: {
        margin: "0 0 10px",

        color: "#F05A9D",

        fontSize: "10px",

        fontWeight: "800",

        letterSpacing: "1.4px"
    },


    questionText: {
        maxWidth: "760px",

        margin: 0,

        color: "#FFF9FC",

        fontSize: "20px",

        lineHeight: "1.5",

        letterSpacing: "-.25px"
    },


    difficultyBadge: {
        flexShrink: 0,

        padding: "6px 10px",

        borderRadius: "999px",

        background:
            "rgba(240,90,157,.09)",

        border:
            "1px solid rgba(240,90,157,.17)",

        color: "#F7A3C8",

        fontSize: "10px",

        fontWeight: "700",

        textTransform: "capitalize"
    },


    // ============================================
    // OPTIONS
    // ============================================

    options: {
        display: "grid",

        gap: "10px"
    },


    option: {
        position: "relative",

        minHeight: "58px",

        display: "flex",

        alignItems: "center",

        gap: "13px",

        padding: "12px 16px",

        borderRadius: "13px",

        background:
            "rgba(7,7,10,.46)",

        border:
            "1px solid rgba(255,255,255,.08)",

        color: "#D9CDD3",

        cursor: "pointer",

        transition:
            "border-color .2s ease, background .2s ease"
    },


    selectedOption: {
        background:
            "rgba(240,90,157,.08)",

        border:
            "1px solid rgba(240,90,157,.38)",

        color: "#FFF7FB"
    },


    correctOption: {
        background:
            "rgba(240,90,157,.12)",

        border:
            "1px solid rgba(255,120,180,.52)"
    },


    wrongOption: {
        background:
            "rgba(170,50,70,.12)",

        border:
            "1px solid rgba(255,105,135,.32)"
    },


    radioInput: {
        position: "absolute",

        opacity: 0,

        pointerEvents: "none"
    },


    optionLetter: {
        flexShrink: 0,

        width: "34px",
        height: "34px",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        borderRadius: "10px",

        background:
            "rgba(255,255,255,.045)",

        border:
            "1px solid rgba(255,255,255,.08)",

        color: "#9A8D94",

        fontSize: "12px",

        fontWeight: "800"
    },


    selectedLetter: {
        color: "#FFD4E7",

        background:
            "rgba(240,90,157,.13)",

        border:
            "1px solid rgba(240,90,157,.26)"
    },


    optionText: {
        flex: 1,

        lineHeight: "1.55",

        fontSize: "13px"
    },


    correctMark: {
        color: "#FF87BE",

        fontSize: "18px",

        fontWeight: "800"
    },


    wrongMark: {
        color: "#FF829D",

        fontSize: "20px",

        fontWeight: "800"
    },


    // ============================================
    // FEEDBACK
    // ============================================

    answerFeedback: {
        marginTop: "18px",

        padding: "20px",

        borderRadius: "14px"
    },


    correctFeedback: {
        background:
            "rgba(240,90,157,.07)",

        border:
            "1px solid rgba(240,90,157,.18)"
    },


    incorrectFeedback: {
        background:
            "rgba(180,55,80,.08)",

        border:
            "1px solid rgba(255,100,135,.18)"
    },


    feedbackHeader: {
        display: "flex",

        alignItems: "center",

        gap: "9px",

        marginBottom: "16px",

        color: "#F7EEF2",

        fontSize: "14px"
    },


    feedbackIcon: {
        width: "28px",
        height: "28px",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        borderRadius: "50%",

        fontWeight: "800"
    },


    correctFeedbackIcon: {
        color: "#FF92C4",

        background:
            "rgba(240,90,157,.12)"
    },


    incorrectFeedbackIcon: {
        color: "#FF8BA6",

        background:
            "rgba(255,90,120,.10)"
    },


    feedbackGrid: {
        display: "grid",

        gridTemplateColumns:
            "repeat(auto-fit, minmax(150px, 1fr))",

        gap: "10px",

        marginBottom: "14px"
    },


    feedbackLabel: {
        display: "block",

        marginBottom: "6px",

        color: "#81747B",

        fontSize: "9px",

        fontWeight: "800",

        letterSpacing: "1.1px"
    },


    feedbackValue: {
        color: "#FFF7FB",

        fontSize: "16px"
    },


    explanationBox: {
        paddingTop: "14px",

        borderTop:
            "1px solid rgba(255,255,255,.06)",

        color: "#B9ADB3",

        lineHeight: "1.7",

        fontSize: "13px"
    },


    // ============================================
    // SUBMIT
    // ============================================

    submitSection: {
        marginTop: "26px",

        padding: "26px",

        display: "flex",

        alignItems: "center",

        justifyContent: "space-between",

        gap: "28px",

        borderRadius: "20px",

        background:
            "linear-gradient(145deg, rgba(22,19,25,.90), rgba(7,7,10,.84))",

        border:
            "1px solid rgba(240,90,157,.18)",

        backdropFilter: "blur(22px)"
    },


    submitEyebrow: {
        margin: "0 0 7px",

        color: "#F05A9D",

        fontSize: "9px",

        fontWeight: "800",

        letterSpacing: "1.4px"
    },


    submitTitle: {
        margin: 0,

        color: "#FFF9FC",

        fontSize: "21px"
    },


    submitDescription: {
        maxWidth: "540px",

        margin: "8px 0 0",

        color: "#A99DA4",

        lineHeight: "1.6",

        fontSize: "13px"
    },


    submitRight: {
        flexShrink: 0,

        display: "flex",

        flexDirection: "column",

        alignItems: "flex-end",

        gap: "10px"
    },


    answerCount: {
        color: "#8F8389",

        fontSize: "11px",

        fontWeight: "600"
    },


    submitButton: {
        minWidth: "170px",

        minHeight: "48px",

        padding: "0 20px",

        border: "none",

        borderRadius: "11px",

        background:
            "linear-gradient(100deg, #D93478, #F05A9D, #FF69AD)",

        color: "#FFFFFF",

        cursor: "pointer",

        fontSize: "13px",

        fontWeight: "800",

        boxShadow:
            "0 12px 34px rgba(240,90,157,.24)"
    },


    disabledSubmit: {
        opacity: ".55",

        cursor: "wait"
    },


    primaryButton: {
        minHeight: "45px",

        padding: "0 20px",

        border: "none",

        borderRadius: "11px",

        background:
            "linear-gradient(100deg, #D93478, #F05A9D, #E63E83)",

        color: "#FFFFFF",

        cursor: "pointer",

        fontSize: "13px",

        fontWeight: "700",

        boxShadow:
            "0 12px 32px rgba(240,90,157,.20)"
    },


    afterTest: {
        display: "flex",

        justifyContent: "center",

        marginTop: "28px",

        marginBottom: "30px"
    }

};


export default Test;