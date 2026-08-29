import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function Revisions() {

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [revisions, setRevisions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [
        reschedulingId,
        setReschedulingId
    ] = useState(null);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const [
        selectedFilter,
        setSelectedFilter
    ] = useState("all");


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
    // DATE HELPERS
    // ============================================

    const normalizeDate = (
        value
    ) => {

        if (!value) {

            return "";
        }


        return String(
            value
        ).slice(
            0,
            10
        );
    };


    const getTodayString = () => {

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        return (
            `${year}-` +
            `${month}-` +
            `${day}`
        );
    };


    const formatDate = (
        value
    ) => {

        const clean =
            normalizeDate(
                value
            );


        if (!clean) {

            return "Date unavailable";
        }


        const [
            year,
            month,
            day
        ] =
            clean
                .split("-")
                .map(Number);


        const date =
            new Date(
                year,
                month - 1,
                day
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return clean;
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };


    const getDaysDifference = (
        value
    ) => {

        const clean =
            normalizeDate(
                value
            );


        if (!clean) {

            return null;
        }


        const [
            year,
            month,
            day
        ] =
            clean
                .split("-")
                .map(Number);


        const target =
            new Date(
                year,
                month - 1,
                day
            );


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        target.setHours(
            0,
            0,
            0,
            0
        );


        return Math.round(
            (
                target.getTime() -
                today.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );
    };


    // ============================================
    // FETCH REVISIONS
    // ============================================

    const fetchRevisions =
        async () => {

            try {

                setLoading(
                    true
                );


                const response =
                    await api.get(
                        "/api/revisions",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setRevisions(
                    response.data.revisions ||
                    []
                );


            } catch (error) {

                console.error(
                    "Fetch revisions error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to load revisions."
                );


                setMessageType(
                    "error"
                );


            } finally {

                setLoading(
                    false
                );
            }
        };


    // ============================================
    // LOAD
    // ============================================

    useEffect(
        () => {

            if (!getToken()) {

                navigate(
                    "/login"
                );

                return;
            }


            fetchRevisions();

        },
        []
    );


    // ============================================
    // RESCHEDULE REVISION
    // ============================================

    const handleReschedule =
        async (
            revision,
            days
        ) => {

            try {

                setReschedulingId(
                    revision.id
                );


                setMessage(
                    ""
                );


                const response =
                    await api.patch(
                        `/api/revisions/${revision.id}/reschedule`,
                        {
                            days
                        },
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "Revision rescheduled."
                );


                setMessageType(
                    "success"
                );


                await fetchRevisions();


            } catch (error) {

                console.error(
                    "Reschedule revision error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to reschedule revision."
                );


                setMessageType(
                    "error"
                );


            } finally {

                setReschedulingId(
                    null
                );
            }
        };


    // ============================================
    // DATA GROUPS
    // ============================================

    const today =
        getTodayString();


    const pendingRevisions =
        useMemo(
            () => {

                return revisions.filter(
                    (
                        revision
                    ) =>
                        !revision.completed
                );

            },
            [
                revisions
            ]
        );


    const completedRevisions =
        useMemo(
            () => {

                return revisions.filter(
                    (
                        revision
                    ) =>
                        Boolean(
                            revision.completed
                        )
                );

            },
            [
                revisions
            ]
        );


    const dueTodayRevisions =
        useMemo(
            () => {

                return pendingRevisions.filter(
                    (
                        revision
                    ) =>
                        normalizeDate(
                            revision.scheduled_date
                        ) ===
                        today
                );

            },
            [
                pendingRevisions,
                today
            ]
        );


    const overdueRevisions =
        useMemo(
            () => {

                return pendingRevisions.filter(
                    (
                        revision
                    ) => {

                        const date =
                            normalizeDate(
                                revision.scheduled_date
                            );


                        return (
                            date &&
                            date < today
                        );
                    }
                );

            },
            [
                pendingRevisions,
                today
            ]
        );


    const upcomingRevisions =
        useMemo(
            () => {

                return pendingRevisions.filter(
                    (
                        revision
                    ) => {

                        const date =
                            normalizeDate(
                                revision.scheduled_date
                            );


                        return (
                            date &&
                            date > today
                        );
                    }
                );

            },
            [
                pendingRevisions,
                today
            ]
        );


    // ============================================
    // FILTERED LIST
    // ============================================

    const displayedRevisions =
        useMemo(
            () => {

                switch (
                    selectedFilter
                ) {

                    case "today":

                        return dueTodayRevisions;


                    case "overdue":

                        return overdueRevisions;


                    case "upcoming":

                        return upcomingRevisions;


                    case "completed":

                        return completedRevisions;


                    default:

                        return revisions;
                }

            },
            [
                selectedFilter,
                revisions,
                dueTodayRevisions,
                overdueRevisions,
                upcomingRevisions,
                completedRevisions
            ]
        );


    // ============================================
    // WEAKNESS HELPERS
    // ============================================

    const getWeaknessLabel = (
        level
    ) => {

        switch (
            String(
                level ||
                ""
            ).toLowerCase()
        ) {

            case "high":

                return "High Priority";


            case "medium":

                return "Medium Priority";


            case "low":

                return "Needs Review";


            default:

                return "Revision";
        }
    };


    const getWeaknessStyle = (
        level
    ) => {

        switch (
            String(
                level ||
                ""
            ).toLowerCase()
        ) {

            case "high":

                return styles.highPriority;


            case "medium":

                return styles.mediumPriority;


            case "low":

                return styles.lowPriority;


            default:

                return styles.defaultPriority;
        }
    };


    // ============================================
    // MASTERY TEXT
    // ============================================

    const getMasteryText = (
        score
    ) => {

        const mastery =
            Number(
                score
            ) || 0;


        if (
            mastery >= 80
        ) {

            return "Strong";
        }


        if (
            mastery >= 70
        ) {

            return "Mastered";
        }


        if (
            mastery >= 60
        ) {

            return "Needs Review";
        }


        if (
            mastery >= 40
        ) {

            return "Weak";
        }


        return "Very Weak";
    };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <main style={styles.loadingPage}>

                <div style={styles.loadingCard}>

                    <div style={styles.loadingIcon}>
                        ↻
                    </div>


                    <h2>
                        Loading revisions
                    </h2>


                    <p>
                        StudyBuddy is checking
                        what needs another review.
                    </p>

                </div>

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
                                "/mistakes"
                            )
                        }
                    >
                        Mistake Bank
                    </button>

                </div>


                {/* ================================= */}
                {/* HERO */}
                {/* ================================= */}

                <section className="sb-mobile-hero" style={styles.hero}>

                    <div style={styles.heroGlow} />


                    <div style={styles.heroContent}>

                        <p style={styles.eyebrow}>
                            ADAPTIVE LEARNING
                        </p>


                        <h1 style={styles.heroTitle}>

                            Revision{" "}

                            <span style={styles.pink}>
                                Centre
                            </span>

                        </h1>


                        <p style={styles.heroDescription}>

                            StudyBuddy automatically
                            schedules revision when your
                            mastery falls below the target.
                            Review weak topics, revisit your
                            notes and flashcards, then retake
                            the test when you're ready.

                        </p>

                    </div>


                    <div style={styles.heroIcon}>
                        ↻
                    </div>

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

                        <span style={styles.messageIcon}>

                            {
                                messageType ===
                                "error"
                                    ? "!"
                                    : "✓"
                            }

                        </span>


                        <span>
                            {message}
                        </span>

                    </div>

                )}


                {/* ================================= */}
                {/* SUMMARY */}
                {/* ================================= */}

                <section className="sb-mobile-grid-4" style={styles.summaryGrid}>

                    <button
                        type="button"
                        style={{
                            ...styles.summaryCard,

                            ...(selectedFilter ===
                            "all"
                                ? styles.selectedSummaryCard
                                : {})
                        }}
                        onClick={() =>
                            setSelectedFilter(
                                "all"
                            )
                        }
                    >

                        <span style={styles.summaryIcon}>
                            ↻
                        </span>


                        <span>

                            <span style={styles.summaryLabel}>
                                TOTAL
                            </span>


                            <strong style={styles.summaryValue}>
                                {
                                    revisions.length
                                }
                            </strong>

                        </span>

                    </button>


                    <button
                        type="button"
                        style={{
                            ...styles.summaryCard,

                            ...(selectedFilter ===
                            "today"
                                ? styles.selectedSummaryCard
                                : {})
                        }}
                        onClick={() =>
                            setSelectedFilter(
                                "today"
                            )
                        }
                    >

                        <span style={styles.summaryIcon}>
                            ◷
                        </span>


                        <span>

                            <span style={styles.summaryLabel}>
                                DUE TODAY
                            </span>


                            <strong style={styles.summaryValue}>
                                {
                                    dueTodayRevisions
                                        .length
                                }
                            </strong>

                        </span>

                    </button>


                    <button
                        type="button"
                        style={{
                            ...styles.summaryCard,

                            ...(selectedFilter ===
                            "overdue"
                                ? styles.selectedSummaryCard
                                : {})
                        }}
                        onClick={() =>
                            setSelectedFilter(
                                "overdue"
                            )
                        }
                    >

                        <span style={styles.summaryIcon}>
                            !
                        </span>


                        <span>

                            <span style={styles.summaryLabel}>
                                OVERDUE
                            </span>


                            <strong style={styles.summaryValue}>
                                {
                                    overdueRevisions
                                        .length
                                }
                            </strong>

                        </span>

                    </button>


                    <button
                        type="button"
                        style={{
                            ...styles.summaryCard,

                            ...(selectedFilter ===
                            "completed"
                                ? styles.selectedSummaryCard
                                : {})
                        }}
                        onClick={() =>
                            setSelectedFilter(
                                "completed"
                            )
                        }
                    >

                        <span style={styles.summaryIcon}>
                            ✓
                        </span>


                        <span>

                            <span style={styles.summaryLabel}>
                                COMPLETED
                            </span>


                            <strong style={styles.summaryValue}>
                                {
                                    completedRevisions
                                        .length
                                }
                            </strong>

                        </span>

                    </button>

                </section>


                {/* ================================= */}
                {/* FILTER BAR */}
                {/* ================================= */}

                <section className="sb-mobile-filter" style={styles.filterBar}>

                    <div>

                        <p style={styles.eyebrow}>
                            REVISION QUEUE
                        </p>


                        <h2 style={styles.sectionTitle}>

                            {
                                selectedFilter ===
                                "today"
                                    ? "Due Today"

                                    : selectedFilter ===
                                        "overdue"
                                        ? "Overdue Revisions"

                                        : selectedFilter ===
                                            "upcoming"
                                            ? "Upcoming Revisions"

                                            : selectedFilter ===
                                                "completed"
                                                ? "Completed Revisions"

                                                : "All Revisions"
                            }

                        </h2>

                    </div>


                    <div className="sb-mobile-scroll-row" style={styles.filterButtons}>

                        <button
                            type="button"
                            style={
                                selectedFilter ===
                                "all"
                                    ? styles.activeFilter
                                    : styles.filterButton
                            }
                            onClick={() =>
                                setSelectedFilter(
                                    "all"
                                )
                            }
                        >
                            All
                        </button>


                        <button
                            type="button"
                            style={
                                selectedFilter ===
                                "today"
                                    ? styles.activeFilter
                                    : styles.filterButton
                            }
                            onClick={() =>
                                setSelectedFilter(
                                    "today"
                                )
                            }
                        >
                            Today
                        </button>


                        <button
                            type="button"
                            style={
                                selectedFilter ===
                                "overdue"
                                    ? styles.activeFilter
                                    : styles.filterButton
                            }
                            onClick={() =>
                                setSelectedFilter(
                                    "overdue"
                                )
                            }
                        >
                            Overdue
                        </button>


                        <button
                            type="button"
                            style={
                                selectedFilter ===
                                "upcoming"
                                    ? styles.activeFilter
                                    : styles.filterButton
                            }
                            onClick={() =>
                                setSelectedFilter(
                                    "upcoming"
                                )
                            }
                        >
                            Upcoming
                        </button>


                        <button
                            type="button"
                            style={
                                selectedFilter ===
                                "completed"
                                    ? styles.activeFilter
                                    : styles.filterButton
                            }
                            onClick={() =>
                                setSelectedFilter(
                                    "completed"
                                )
                            }
                        >
                            Completed
                        </button>

                    </div>

                </section>


                {/* ================================= */}
                {/* EMPTY STATE */}
                {/* ================================= */}

                {displayedRevisions.length ===
                0 ? (

                    <section style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            ✓
                        </div>


                        <h2 style={styles.emptyTitle}>
                            Nothing here
                        </h2>


                        <p style={styles.emptyText}>

                            {
                                selectedFilter ===
                                "all"
                                    ? "You currently have no revision tasks. When StudyBuddy detects a weak topic, a revision will automatically appear here."

                                    : selectedFilter ===
                                        "today"
                                        ? "You have no revisions due today."

                                        : selectedFilter ===
                                            "overdue"
                                            ? "Nice — you have no overdue revisions."

                                            : selectedFilter ===
                                                "upcoming"
                                                ? "There are no upcoming revisions scheduled."

                                                : "You have not completed any revisions yet."
                            }

                        </p>

                    </section>

                ) : (

                    <div style={styles.revisionGrid}>

                        {displayedRevisions.map(
                            (
                                revision
                            ) => {

                                const daysDifference =
                                    getDaysDifference(
                                        revision.scheduled_date
                                    );


                                const overdue =
                                    !revision.completed &&
                                    daysDifference !==
                                    null &&
                                    daysDifference < 0;


                                const dueToday =
                                    !revision.completed &&
                                    daysDifference ===
                                    0;


                                const busy =
                                    Number(
                                        reschedulingId
                                    ) ===
                                    Number(
                                        revision.id
                                    );


                                const mastery =
                                    Number(
                                        revision.mastery_score
                                    ) || 0;


                                return (

                                    <article
                                        key={
                                            revision.id
                                        }
                                        style={{
                                            ...styles.revisionCard,

                                            ...(overdue
                                                ? styles.overdueCard
                                                : {}),

                                            ...(revision.completed
                                                ? styles.completedCard
                                                : {})
                                        }}
                                    >

                                        {/* ================================= */}
                                        {/* TOP */}
                                        {/* ================================= */}

                                        <div className="sb-mobile-row" style={styles.cardTop}>

                                            <div style={styles.cardHeading}>

                                                <span style={styles.subjectName}>
                                                    {
                                                        revision.subject_name
                                                    }
                                                </span>


                                                <h3 style={styles.topicName}>
                                                    {
                                                        revision.topic_name
                                                    }
                                                </h3>


                                                <p style={styles.chapterName}>

                                                    {
                                                        revision.chapter_name
                                                    }

                                                </p>

                                            </div>


                                            <span
                                                style={{
                                                    ...styles.priorityBadge,

                                                    ...getWeaknessStyle(
                                                        revision.weakness_level
                                                    )
                                                }}
                                            >

                                                {
                                                    getWeaknessLabel(
                                                        revision.weakness_level
                                                    )
                                                }

                                            </span>

                                        </div>


                                        {/* ================================= */}
                                        {/* STATUS */}
                                        {/* ================================= */}

                                        <div style={styles.statusRow}>

                                            {revision.completed ? (

                                                <span style={styles.completeStatus}>

                                                    ✓ Completed

                                                </span>

                                            ) : overdue ? (

                                                <span style={styles.overdueStatus}>

                                                    Overdue

                                                </span>

                                            ) : dueToday ? (

                                                <span style={styles.todayStatus}>

                                                    Due Today

                                                </span>

                                            ) : (

                                                <span style={styles.upcomingStatus}>

                                                    Upcoming

                                                </span>

                                            )}


                                            <span style={styles.revisionType}>

                                                {
                                                    String(
                                                        revision.revision_type ||
                                                        "revision"
                                                    )
                                                        .replace(
                                                            /_/g,
                                                            " "
                                                        )
                                                }

                                            </span>

                                        </div>


                                        {/* ================================= */}
                                        {/* META */}
                                        {/* ================================= */}

                                        <div className="sb-mobile-grid-4" style={styles.metaGrid}>

                                            <div style={styles.metaCard}>

                                                <span style={styles.metaLabel}>
                                                    REVISION DATE
                                                </span>


                                                <strong style={styles.metaValue}>
                                                    {
                                                        formatDate(
                                                            revision.scheduled_date
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div style={styles.metaCard}>

                                                <span style={styles.metaLabel}>
                                                    MASTERY
                                                </span>


                                                <strong style={styles.metaValue}>
                                                    {
                                                        Math.round(
                                                            mastery
                                                        )
                                                    }
                                                    %
                                                </strong>

                                            </div>


                                            <div style={styles.metaCard}>

                                                <span style={styles.metaLabel}>
                                                    LEVEL
                                                </span>


                                                <strong style={styles.metaValue}>
                                                    {
                                                        getMasteryText(
                                                            mastery
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div style={styles.metaCard}>

                                                <span style={styles.metaLabel}>
                                                    ATTEMPTS
                                                </span>


                                                <strong style={styles.metaValue}>
                                                    {
                                                        Number(
                                                            revision.total_attempts ||
                                                            0
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        {/* ================================= */}
                                        {/* MASTERY BAR */}
                                        {/* ================================= */}

                                        <div style={styles.masterySection}>

                                            <div style={styles.masteryHeader}>

                                                <span>
                                                    Topic Mastery
                                                </span>


                                                <strong>
                                                    {
                                                        Math.round(
                                                            mastery
                                                        )
                                                    }
                                                    %
                                                </strong>

                                            </div>


                                            <div style={styles.masteryTrack}>

                                                <div
                                                    style={{
                                                        ...styles.masteryFill,

                                                        width:
                                                            `${Math.min(
                                                                100,
                                                                Math.max(
                                                                    0,
                                                                    mastery
                                                                )
                                                            )}%`
                                                    }}
                                                />

                                            </div>

                                        </div>


                                        {/* ================================= */}
                                        {/* PERFORMANCE */}
                                        {/* ================================= */}

                                        <div style={styles.performanceRow}>

                                            <span>

                                                Latest{" "}

                                                <strong>
                                                    {
                                                        revision.latest_score !==
                                                        null &&
                                                        revision.latest_score !==
                                                        undefined
                                                            ? `${Math.round(
                                                                Number(
                                                                    revision.latest_score
                                                                )
                                                            )}%`
                                                            : "—"
                                                    }
                                                </strong>

                                            </span>


                                            <span>

                                                Best{" "}

                                                <strong>
                                                    {
                                                        revision.best_score !==
                                                        null &&
                                                        revision.best_score !==
                                                        undefined
                                                            ? `${Math.round(
                                                                Number(
                                                                    revision.best_score
                                                                )
                                                            )}%`
                                                            : "—"
                                                    }
                                                </strong>

                                            </span>


                                            <span>

                                                Average{" "}

                                                <strong>
                                                    {
                                                        revision.average_score !==
                                                        null &&
                                                        revision.average_score !==
                                                        undefined
                                                            ? `${Math.round(
                                                                Number(
                                                                    revision.average_score
                                                                )
                                                            )}%`
                                                            : "—"
                                                    }
                                                </strong>

                                            </span>

                                        </div>


                                        {/* ================================= */}
                                        {/* GUIDANCE */}
                                        {/* ================================= */}

                                        {!revision.completed && (

                                            <div style={styles.tipBox}>

                                                <span style={styles.tipIcon}>
                                                    ✦
                                                </span>


                                                <p>

                                                    Review your topic notes
                                                    and flashcards first.
                                                    Then retake the topic
                                                    test to improve your
                                                    mastery and complete
                                                    this revision.

                                                </p>

                                            </div>

                                        )}


                                        {/* ================================= */}
                                        {/* COMPLETED SCORE */}
                                        {/* ================================= */}

                                        {revision.completed && (

                                            <div style={styles.completedInfo}>

                                                <span>
                                                    Revision completed
                                                </span>


                                                {revision.score !==
                                                null &&
                                                revision.score !==
                                                undefined && (

                                                    <strong>
                                                        Score:{" "}
                                                        {
                                                            Number(
                                                                revision.score
                                                            ).toFixed(
                                                                0
                                                            )
                                                        }
                                                        %
                                                    </strong>

                                                )}

                                            </div>

                                        )}


                                        {/* ================================= */}
                                        {/* ACTIONS */}
                                        {/* ================================= */}

                                        <div style={styles.actions}>

                                            <button
                                                type="button"
                                                style={styles.primaryButton}
                                                onClick={() =>
                                                    navigate(
                                                        `/topics/${revision.topic_id}`
                                                    )
                                                }
                                            >

                                                {
                                                    revision.completed
                                                        ? "Open Topic →"
                                                        : "Review Topic →"
                                                }

                                            </button>


                                            {!revision.completed && (

                                                <>
                                                    <button
                                                        type="button"
                                                        disabled={
                                                            busy
                                                        }
                                                        style={
                                                            busy
                                                                ? styles.disabledButton
                                                                : styles.secondaryButton
                                                        }
                                                        onClick={() =>
                                                            handleReschedule(
                                                                revision,
                                                                1
                                                            )
                                                        }
                                                    >

                                                        {
                                                            busy
                                                                ? "Moving..."
                                                                : "Tomorrow"
                                                        }

                                                    </button>


                                                    <button
                                                        type="button"
                                                        disabled={
                                                            busy
                                                        }
                                                        style={
                                                            busy
                                                                ? styles.disabledButton
                                                                : styles.secondaryButton
                                                        }
                                                        onClick={() =>
                                                            handleReschedule(
                                                                revision,
                                                                3
                                                            )
                                                        }
                                                    >
                                                        +3 Days
                                                    </button>

                                                </>

                                            )}

                                        </div>

                                    </article>

                                );
                            }
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
        padding: "36px 22px 75px",
        background: "transparent",
        color: "#FFF7FB",
        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    loadingPage: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "25px",
        background: "transparent",
        color: "#FFF7FB",
        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif'
    },


    loadingCard: {
        width: "min(420px, 100%)",
        padding: "38px",
        textAlign: "center",
        borderRadius: "23px",
        background:
            "linear-gradient(145deg, rgba(23,20,26,.92), rgba(7,7,10,.88))",
        border:
            "1px solid rgba(240,90,157,.20)",
        boxShadow:
            "0 28px 80px rgba(0,0,0,.45)"
    },


    loadingIcon: {
        width: "56px",
        height: "56px",
        margin: "0 auto 15px",
        display: "grid",
        placeItems: "center",
        borderRadius: "16px",
        background:
            "rgba(240,90,157,.09)",
        border:
            "1px solid rgba(240,90,157,.20)",
        color: "#F05A9D",
        fontSize: "24px"
    },


    container: {
        width: "100%",
        maxWidth: "1150px",
        margin: "0 auto"
    },


    topNav: {
        display: "flex",
        justifyContent: "space-between",
        gap: "14px",
        marginBottom: "22px"
    },


    hero: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "30px",
        padding: "38px",
        marginBottom: "20px",
        borderRadius: "26px",
        background:
            "linear-gradient(145deg, rgba(24,20,27,.94), rgba(7,7,10,.88))",
        border:
            "1px solid rgba(240,90,157,.28)",
        backdropFilter: "blur(24px)",
        boxShadow:
            "0 30px 85px rgba(0,0,0,.45)"
    },


    heroGlow: {
        position: "absolute",
        width: "340px",
        height: "340px",
        right: "-100px",
        top: "-220px",
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


    eyebrow: {
        margin: "0 0 8px",
        color: "#F05A9D",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "1.7px"
    },


    heroTitle: {
        margin: 0,
        color: "#FFF9FC",
        fontSize:
            "clamp(35px, 5vw, 52px)",
        lineHeight: "1.05",
        letterSpacing: "-1.4px"
    },


    pink: {
        color: "#F05A9D"
    },


    heroDescription: {
        maxWidth: "700px",
        margin: "14px 0 0",
        color: "#A99DA4",
        lineHeight: "1.75",
        fontSize: "14px"
    },


    heroIcon: {
        position: "relative",
        zIndex: 1,
        width: "76px",
        height: "76px",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "21px",
        background:
            "rgba(240,90,157,.10)",
        border:
            "1px solid rgba(240,90,157,.24)",
        color: "#F05A9D",
        fontSize: "32px",
        boxShadow:
            "0 0 40px rgba(240,90,157,.08)"
    },


    message: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 16px",
        marginBottom: "20px",
        borderRadius: "12px",
        fontSize: "13px"
    },


    messageIcon: {
        width: "27px",
        height: "27px",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        background:
            "rgba(255,255,255,.05)",
        fontWeight: "900"
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
            "rgba(165,45,80,.13)",
        border:
            "1px solid rgba(255,100,145,.22)",
        color: "#FFB3CC"
    },


    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "13px",
        marginBottom: "38px"
    },


    summaryCard: {
        minHeight: "100px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "18px",
        textAlign: "left",
        borderRadius: "16px",
        background:
            "linear-gradient(145deg, rgba(20,18,23,.90), rgba(7,7,10,.82))",
        border:
            "1px solid rgba(240,90,157,.14)",
        color: "#FFF7FB",
        cursor: "pointer"
    },


    selectedSummaryCard: {
        border:
            "1px solid rgba(240,90,157,.44)",
        background:
            "linear-gradient(145deg, rgba(240,90,157,.10), rgba(7,7,10,.86))",
        boxShadow:
            "0 0 30px rgba(240,90,157,.06)"
    },


    summaryIcon: {
        width: "42px",
        height: "42px",
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "12px",
        background:
            "rgba(240,90,157,.08)",
        color: "#F05A9D",
        fontSize: "18px"
    },


    summaryLabel: {
        display: "block",
        color: "#897D83",
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1.1px"
    },


    summaryValue: {
        display: "block",
        marginTop: "6px",
        color: "#FFF9FC",
        fontSize: "27px",
        lineHeight: "1"
    },


    filterBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        flexWrap: "wrap",
        gap: "18px",
        marginBottom: "17px"
    },


    sectionTitle: {
        margin: 0,
        color: "#FFF9FC",
        fontSize: "27px"
    },


    filterButtons: {
        display: "flex",
        flexWrap: "wrap",
        gap: "7px"
    },


    filterButton: {
        minHeight: "36px",
        padding: "0 12px",
        borderRadius: "9px",
        border:
            "1px solid rgba(255,255,255,.07)",
        background:
            "rgba(8,8,11,.52)",
        color: "#978B91",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700"
    },


    activeFilter: {
        minHeight: "36px",
        padding: "0 12px",
        borderRadius: "9px",
        border:
            "1px solid rgba(240,90,157,.30)",
        background:
            "rgba(240,90,157,.10)",
        color: "#F7A3C8",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "800"
    },


    revisionGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(330px, 1fr))",
        gap: "15px"
    },


    revisionCard: {
        padding: "22px",
        borderRadius: "18px",
        background:
            "linear-gradient(145deg, rgba(21,19,24,.92), rgba(7,7,10,.85))",
        border:
            "1px solid rgba(240,90,157,.15)",
        backdropFilter: "blur(20px)",
        boxShadow:
            "0 20px 55px rgba(0,0,0,.24)"
    },


    overdueCard: {
        border:
            "1px solid rgba(255,95,140,.35)",
        boxShadow:
            "0 20px 55px rgba(0,0,0,.25), 0 0 28px rgba(210,55,95,.05)"
    },


    completedCard: {
        opacity: .82
    },


    cardTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "15px"
    },


    cardHeading: {
        minWidth: 0
    },


    subjectName: {
        color: "#F05A9D",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: ".6px"
    },


    topicName: {
        margin: "7px 0 4px",
        color: "#FFF9FC",
        fontSize: "20px",
        lineHeight: "1.35"
    },


    chapterName: {
        margin: 0,
        color: "#84787E",
        fontSize: "12px"
    },


    priorityBadge: {
        flexShrink: 0,
        padding: "5px 8px",
        borderRadius: "999px",
        fontSize: "9px",
        fontWeight: "800"
    },


    highPriority: {
        background:
            "rgba(200,48,88,.12)",
        border:
            "1px solid rgba(255,95,135,.23)",
        color: "#FF9BB6"
    },


    mediumPriority: {
        background:
            "rgba(240,90,157,.10)",
        border:
            "1px solid rgba(240,90,157,.20)",
        color: "#F7A3C8"
    },


    lowPriority: {
        background:
            "rgba(240,90,157,.07)",
        border:
            "1px solid rgba(240,90,157,.14)",
        color: "#DFA0BB"
    },


    defaultPriority: {
        background:
            "rgba(255,255,255,.05)",
        border:
            "1px solid rgba(255,255,255,.07)",
        color: "#A99DA4"
    },


    statusRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
        marginTop: "17px"
    },


    todayStatus: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.11)",
        color: "#F7A3C8",
        fontSize: "9px",
        fontWeight: "900"
    },


    overdueStatus: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(205,50,87,.12)",
        color: "#FF9BB4",
        fontSize: "9px",
        fontWeight: "900"
    },


    upcomingStatus: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(255,255,255,.045)",
        color: "#9F9298",
        fontSize: "9px",
        fontWeight: "800"
    },


    completeStatus: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(75,170,105,.10)",
        color: "#A8E8B8",
        fontSize: "9px",
        fontWeight: "900"
    },


    revisionType: {
        color: "#746970",
        fontSize: "9px",
        fontWeight: "700",
        textTransform: "capitalize"
    },


    metaGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "9px",
        marginTop: "15px"
    },


    metaCard: {
        minWidth: 0,
        padding: "12px",
        borderRadius: "11px",
        background:
            "rgba(7,7,10,.48)",
        border:
            "1px solid rgba(255,255,255,.055)"
    },


    metaLabel: {
        display: "block",
        color: "#756970",
        fontSize: "8px",
        fontWeight: "800",
        letterSpacing: ".8px"
    },


    metaValue: {
        display: "block",
        marginTop: "6px",
        color: "#FFF7FB",
        fontSize: "13px",
        lineHeight: "1.4"
    },


    masterySection: {
        marginTop: "17px"
    },


    masteryHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        marginBottom: "7px",
        color: "#95888F",
        fontSize: "11px"
    },


    masteryTrack: {
        height: "7px",
        overflow: "hidden",
        borderRadius: "999px",
        background:
            "rgba(255,255,255,.06)"
    },


    masteryFill: {
        height: "100%",
        borderRadius: "999px",
        background:
            "linear-gradient(90deg, #D93478, #F05A9D, #FF69AD)",
        boxShadow:
            "0 0 18px rgba(240,90,157,.28)",
        transition:
            "width .3s ease"
    },


    performanceRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "13px",
        marginTop: "14px",
        color: "#81757B",
        fontSize: "10px"
    },


    tipBox: {
        display: "flex",
        gap: "10px",
        marginTop: "16px",
        padding: "13px",
        borderRadius: "11px",
        background:
            "rgba(240,90,157,.055)",
        border:
            "1px solid rgba(240,90,157,.12)",
        color: "#968A90",
        lineHeight: "1.6",
        fontSize: "11px"
    },


    tipIcon: {
        color: "#F05A9D",
        fontSize: "14px"
    },


    completedInfo: {
        display: "flex",
        justifyContent: "space-between",
        gap: "14px",
        marginTop: "16px",
        padding: "12px",
        borderRadius: "10px",
        background:
            "rgba(75,170,105,.07)",
        border:
            "1px solid rgba(100,200,130,.12)",
        color: "#A8E8B8",
        fontSize: "11px"
    },


    actions: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginTop: "18px"
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
        fontWeight: "800",
        boxShadow:
            "0 10px 27px rgba(240,90,157,.18)"
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


    disabledButton: {
        minHeight: "41px",
        padding: "0 14px",
        borderRadius: "10px",
        border:
            "1px solid rgba(255,255,255,.06)",
        background:
            "rgba(255,255,255,.035)",
        color: "#665C61",
        cursor: "not-allowed",
        fontSize: "12px"
    },


    emptyCard: {
        padding: "48px 28px",
        textAlign: "center",
        borderRadius: "19px",
        background:
            "linear-gradient(145deg, rgba(20,18,23,.9), rgba(7,7,10,.82))",
        border:
            "1px solid rgba(240,90,157,.14)"
    },


    emptyIcon: {
        width: "54px",
        height: "54px",
        margin: "0 auto 15px",
        display: "grid",
        placeItems: "center",
        borderRadius: "15px",
        background:
            "rgba(240,90,157,.09)",
        border:
            "1px solid rgba(240,90,157,.16)",
        color: "#F05A9D",
        fontSize: "22px"
    },


    emptyTitle: {
        margin: "0 0 8px",
        color: "#FFF9FC"
    },


    emptyText: {
        maxWidth: "600px",
        margin: "0 auto",
        color: "#8F8389",
        lineHeight: "1.65",
        fontSize: "13px"
    }

};


export default Revisions;