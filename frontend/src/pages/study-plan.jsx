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
import StudyBuddyLoader from "../components/StudyBuddyLoader";


function StudyPlan() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [plan, setPlan] =
        useState(null);

    const [tasks, setTasks] =
        useState([]);

    const [exams, setExams] =
        useState([]);

    const [statistics, setStatistics] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        completingTaskId,
        setCompletingTaskId
    ] = useState(null);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");


    // ============================================
    // TOKEN
    // ============================================

    const getToken = () => {

        return (
            localStorage.getItem(
                "token"
            ) ||
            sessionStorage.getItem(
                "token"
            )
        );
    };


    const getAuthHeaders = () => {

        return {
            Authorization:
                `Bearer ${getToken()}`
        };
    };


    // ============================================
    // DATE HELPERS
    // ============================================

    const normalizeDate = (
        value
    ) => {

        if (!value) {
            return "";
        }


        const text =
            String(
                value
            );


        const match =
            text.match(
                /\d{4}-\d{2}-\d{2}/
            );


        return match
            ? match[0]
            : "";
    };


    const getDateObject = (
        value
    ) => {

        const cleanDate =
            normalizeDate(
                value
            );


        if (!cleanDate) {
            return null;
        }


        const [
            year,
            month,
            day
        ] =
            cleanDate
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
            return null;
        }


        return date;
    };


    const formatDate = (
        value
    ) => {

        const date =
            getDateObject(
                value
            );


        if (!date) {
            return "Date unavailable";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "long",
                day:
                    "numeric",
                month:
                    "long",
                year:
                    "numeric"
            }
        );
    };


    const formatShortDate = (
        value
    ) => {

        const date =
            getDateObject(
                value
            );


        if (!date) {
            return "Date unavailable";
        }


        return date.toLocaleDateString(
            "en-IN",
            {
                day:
                    "numeric",
                month:
                    "short"
            }
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


        return `${year}-${month}-${day}`;
    };


    const getDaysLeft = (
        value
    ) => {

        const examDate =
            getDateObject(
                value
            );


        if (!examDate) {
            return null;
        }


        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        examDate.setHours(
            0,
            0,
            0,
            0
        );


        return Math.ceil(
            (
                examDate.getTime() -
                today.getTime()
            ) /
            86400000
        );
    };


    // ============================================
    // FETCH PLAN + TASKS
    // ============================================

    const fetchStudyPlan = async (
        showNotification = true
    ) => {

        try {

            const response =
                await api.get(
                    `/api/study-plans/${id}/tasks`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setPlan(
                response.data
                    .study_plan ||
                null
            );


            setTasks(
                response.data
                    .tasks ||
                []
            );


            setExams(
                response.data
                    .exams ||
                []
            );


            setStatistics(
                response.data
                    .statistics ||
                null
            );


            if (
                showNotification &&
                response.data.notification
            ) {

                setMessage(
                    response.data.notification
                );

                setMessageType(
                    "success"
                );
            }


        } catch (error) {

            console.error(
                "Fetch study plan error:",
                error
            );


            setMessage(
                error.response
                    ?.data
                    ?.message ||
                "Unable to load study plan."
            );


            setMessageType(
                "error"
            );
        }
    };


    // ============================================
    // LOAD PAGE
    // ============================================

    useEffect(() => {

        const loadPage =
            async () => {

                if (!getToken()) {

                    navigate(
                        "/login"
                    );

                    return;
                }


                await fetchStudyPlan(
                    true
                );


                setLoading(
                    false
                );
            };


        loadPage();

    }, [id]);


    // ============================================
    // COMPLETE TASK
    // ============================================

    const handleCompleteTask =
        async (
            task
        ) => {

            if (
                task.completed ||
                completingTaskId
            ) {
                return;
            }


            try {

                setCompletingTaskId(
                    task.id
                );


                const response =
                    await api.patch(
                        `/api/study-plans/tasks/${task.id}/complete`,
                        {},
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "Study task completed."
                );


                setMessageType(
                    "success"
                );


                await fetchStudyPlan(
                    false
                );


            } catch (error) {

                console.error(
                    "Complete task error:",
                    error
                );


                setMessage(
                    error.response
                        ?.data
                        ?.message ||
                    "Unable to complete task."
                );


                setMessageType(
                    "error"
                );


            } finally {

                setCompletingTaskId(
                    null
                );
            }
        };


    // ============================================
    // GROUP TASKS BY DATE
    // ============================================

    const groupedTasks =
        useMemo(
            () => {

                const groups = {};


                tasks.forEach(
                    (
                        task
                    ) => {

                        const date =
                            normalizeDate(
                                task.task_date
                            );


                        if (!date) {
                            return;
                        }


                        if (!groups[date]) {

                            groups[date] =
                                [];
                        }


                        groups[date].push(
                            task
                        );
                    }
                );


                return Object.entries(
                    groups
                ).sort(
                    (
                        [dateA],
                        [dateB]
                    ) =>
                        dateA.localeCompare(
                            dateB
                        )
                );

            },
            [tasks]
        );


    // ============================================
    // LOCAL STATS FALLBACK
    // ============================================

    const totalTasks =
        statistics
            ?.total_tasks ??
        tasks.length;


    const completedTasks =
        statistics
            ?.completed_tasks ??
        tasks.filter(
            (
                task
            ) =>
                task.completed ||
                task.status ===
                    "completed"
        ).length;


    const missedTasks =
        statistics
            ?.missed_tasks ??
        tasks.filter(
            (
                task
            ) =>
                task.status ===
                "missed"
        ).length;


    const rescheduledTasks =
        statistics
            ?.rescheduled_tasks ??
        tasks.filter(
            (
                task
            ) =>
                task.status ===
                "rescheduled"
        ).length;


    const completionPercentage =
        statistics
            ?.completion_percentage ??
        (
            totalTasks > 0
                ? Math.round(
                    (
                        completedTasks /
                        totalTasks
                    ) *
                    100
                )
                : 0
        );


    const dailyLimitMinutes =
        Number(
            statistics
                ?.daily_limit_minutes ??
            plan
                ?.planned_minutes ??
            120
        );


    const todayMinutes =
        Number(
            statistics
                ?.today_minutes ??
            0
        );


    // ============================================
    // TODAY'S TASKS
    // ============================================

    const todayString =
        getTodayString();


    const todaysTasks =
        tasks.filter(
            (
                task
            ) =>
                normalizeDate(
                    task.task_date
                ) ===
                todayString
        );


    const todaysCompleted =
        todaysTasks.filter(
            (
                task
            ) =>
                task.completed ||
                task.status ===
                    "completed"
        ).length;


    const todayPercentage =
        todaysTasks.length > 0
            ? Math.round(
                (
                    todaysCompleted /
                    todaysTasks.length
                ) *
                100
            )
            : 0;


    const workloadPercentage =
        dailyLimitMinutes > 0
            ? Math.min(
                Math.round(
                    (
                        todayMinutes /
                        dailyLimitMinutes
                    ) *
                    100
                ),
                100
            )
            : 0;


    // ============================================
    // TOTAL MINUTES
    // ============================================

    const totalMinutes =
        tasks.reduce(
            (
                total,
                task
            ) => {

                return (
                    total +
                    Number(
                        task.duration_minutes ||
                        0
                    )
                );
            },
            0
        );


    // ============================================
    // NEXT EXAM
    // ============================================

    const nextExam =
        useMemo(
            () => {

                const future =
                    exams
                        .map(
                            (
                                exam
                            ) => ({
                                ...exam,
                                daysLeft:
                                    getDaysLeft(
                                        exam.exam_date
                                    )
                            })
                        )
                        .filter(
                            (
                                exam
                            ) =>
                                exam.daysLeft !==
                                    null &&
                                exam.daysLeft >=
                                    0
                        )
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                a.daysLeft -
                                b.daysLeft
                        );


                return future[0] ||
                    null;

            },
            [exams]
        );


    // ============================================
    // BADGE STYLES
    // ============================================

    const getStatusStyle = (
        status
    ) => {

        if (
            status ===
            "completed"
        ) {
            return styles.completedBadge;
        }


        if (
            status ===
            "missed"
        ) {
            return styles.missedBadge;
        }


        if (
            status ===
            "rescheduled"
        ) {
            return styles.rescheduledBadge;
        }


        return styles.pendingBadge;
    };


    const getTaskTypeLabel = (
        type
    ) => {

        switch (
            String(
                type ||
                "study"
            ).toLowerCase()
        ) {

            case "revision":
                return "Revision";

            case "practice":
                return "Practice";

            case "flashcards":
                return "Flashcards";

            default:
                return "Study";
        }
    };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (
            <StudyBuddyLoader
                title="Loading your study plan"
                text="StudyBuddy is preparing your personalized timetable, progress and daily tasks."
            />
        );
    }


    // ============================================
    // PLAN NOT FOUND
    // ============================================

    if (!plan) {

        return (
            <div className="sb-mobile-page" style={styles.page}>

                <div className="sb-mobile-container" style={styles.container}>

                    <button
                        onClick={() =>
                            navigate(
                                "/exam-planner"
                            )
                        }
                        style={
                            styles.secondaryButton
                        }
                    >
                        ← Exam Planner
                    </button>


                    <div style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            📅
                        </div>

                        <h2>
                            Study Plan Not Found
                        </h2>

                        <p style={styles.mutedText}>
                            This study plan could
                            not be loaded.
                        </p>

                    </div>

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

                <div className="sb-mobile-nav" style={styles.topBar}>

                    <button
                        onClick={() =>
                            navigate(
                                "/exam-planner"
                            )
                        }
                        style={
                            styles.secondaryButton
                        }
                    >
                        ← Exam Planner
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

                <div className="sb-mobile-hero" style={styles.heroCard}>

                    <div className="sb-mobile-hero-content" style={styles.heroContent}>

                        <p style={styles.smallHeading}>
                            ✨ AI PERSONALIZED TIMETABLE
                        </p>


                        <h1 className="sb-mobile-title" style={styles.heroTitle}>
                            {plan.group_name ||
                                "Master Study Plan"}
                        </h1>


                        <p style={styles.heroDescription}>
                            StudyBuddy has organized
                            your preparation across
                            your exam subjects based
                            on exam dates, topic
                            progress and available
                            study time.
                        </p>


                        <div style={styles.heroTags}>

                            <span style={styles.heroTag}>
                                {exams.length}{" "}
                                {exams.length === 1
                                    ? "Exam"
                                    : "Exams"}
                            </span>


                            <span style={styles.heroTag}>
                                {dailyLimitMinutes} min/day
                            </span>


                            <span style={styles.heroTag}>
                                {plan.status ||
                                    "active"}
                            </span>

                        </div>

                    </div>


                    <div style={styles.heroProgress}>

                        <span style={styles.progressCircleNumber}>
                            {Math.round(
                                Number(
                                    completionPercentage
                                ) || 0
                            )}
                            %
                        </span>

                        <span style={styles.progressCircleLabel}>
                            Complete
                        </span>

                    </div>

                </div>


                {/* ================================= */}
                {/* AUTOMATIC ADJUSTMENT MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div
                        style={
                            messageType ===
                                "error"
                                ? styles.errorMessage
                                : styles.successMessage
                        }
                    >

                        <div style={styles.messageIcon}>
                            {messageType ===
                                "error"
                                ? "!"
                                : "✓"}
                        </div>


                        <div>

                            <strong>
                                {messageType ===
                                    "error"
                                    ? "Something went wrong"
                                    : "Schedule updated"}
                            </strong>

                            <p style={styles.messageText}>
                                {message}
                            </p>

                        </div>

                    </div>

                )}


                {/* ================================= */}
                {/* SUMMARY */}
                {/* ================================= */}

                <div className="sb-mobile-grid-4" style={styles.summaryGrid}>

                    <div style={styles.summaryCard}>

                        <span style={styles.summaryIcon}>
                            ✅
                        </span>

                        <div>

                            <span style={styles.statLabel}>
                                Completed
                            </span>

                            <strong style={styles.statValue}>
                                {completedTasks}
                                <small style={styles.statSmall}>
                                    {" "}
                                    / {totalTasks}
                                </small>
                            </strong>

                        </div>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryIcon}>
                            ⏱
                        </span>

                        <div>

                            <span style={styles.statLabel}>
                                Total Plan Time
                            </span>

                            <strong style={styles.statValue}>
                                {Math.floor(
                                    totalMinutes /
                                    60
                                )}
                                h{" "}
                                {totalMinutes %
                                    60}
                                m
                            </strong>

                        </div>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryIcon}>
                            🔄
                        </span>

                        <div>

                            <span style={styles.statLabel}>
                                Rescheduled
                            </span>

                            <strong style={styles.statValue}>
                                {rescheduledTasks}
                            </strong>

                        </div>

                    </div>


                    <div style={styles.summaryCard}>

                        <span style={styles.summaryIcon}>
                            📚
                        </span>

                        <div>

                            <span style={styles.statLabel}>
                                Subjects
                            </span>

                            <strong style={styles.statValue}>
                                {
                                    new Set(
                                        tasks
                                            .map(
                                                (
                                                    task
                                                ) =>
                                                    task.subject_id
                                            )
                                            .filter(
                                                Boolean
                                            )
                                    ).size
                                }
                            </strong>

                        </div>

                    </div>

                </div>


                {/* ================================= */}
                {/* TODAY */}
                {/* ================================= */}

                <div style={styles.todayCard}>

                    <div style={styles.todayTop}>

                        <div>

                            <p style={styles.smallHeading}>
                                TODAY
                            </p>

                            <h2 style={styles.sectionTitle}>
                                Today's Study Plan
                            </h2>

                            <p style={styles.mutedText}>
                                {todaysTasks.length ===
                                    0
                                    ? "You do not have any tasks scheduled for today."
                                    : `${todaysCompleted} of ${todaysTasks.length} tasks completed today.`}
                            </p>

                        </div>


                        <div style={styles.todayPercentage}>
                            {todayPercentage}%
                        </div>

                    </div>


                    <div style={styles.workloadRow}>

                        <span>
                            Today's workload
                        </span>

                        <strong>
                            {todayMinutes} /{" "}
                            {dailyLimitMinutes} min
                        </strong>

                    </div>


                    <div style={styles.progressBackground}>

                        <div
                            style={{
                                ...styles.workloadFill,
                                width:
                                    `${workloadPercentage}%`
                            }}
                        />

                    </div>


                    {todaysTasks.length >
                        0 && (

                        <div style={styles.todayTaskPreview}>

                            {todaysTasks
                                .slice(
                                    0,
                                    3
                                )
                                .map(
                                    (
                                        task
                                    ) => (

                                        <div
                                            key={
                                                task.id
                                            }
                                            style={styles.todayTaskRow}
                                        >

                                            <div>

                                                <strong>
                                                    {
                                                        task.subject_name
                                                    }
                                                </strong>

                                                <span style={styles.todayTopic}>
                                                    {
                                                        task.topic_name
                                                    }
                                                </span>

                                            </div>


                                            <span>
                                                {
                                                    task.duration_minutes
                                                }{" "}
                                                min
                                            </span>

                                        </div>

                                    )
                                )}

                        </div>

                    )}

                </div>


                {/* ================================= */}
                {/* UPCOMING EXAMS */}
                {/* ================================= */}

                <div style={styles.sectionHeader}>

                    <div>

                        <p style={styles.smallHeading}>
                            EXAMS
                        </p>

                        <h2 style={styles.sectionTitle}>
                            Upcoming Exams
                        </h2>

                    </div>


                    {nextExam && (

                        <span style={styles.nextExamBadge}>
                            Next exam in{" "}
                            {nextExam.daysLeft}{" "}
                            {nextExam.daysLeft === 1
                                ? "day"
                                : "days"}
                        </span>

                    )}

                </div>


                <div style={styles.examGrid}>

                    {exams.map(
                        (
                            exam
                        ) => {

                            const daysLeft =
                                getDaysLeft(
                                    exam.exam_date
                                );


                            return (

                                <div
                                    key={
                                        exam.id
                                    }
                                    style={styles.examCard}
                                >

                                    <div style={styles.examTopRow}>

                                        <div>

                                            <span style={styles.examSubject}>
                                                {
                                                    exam.subject_name
                                                }
                                            </span>

                                            <h3 style={styles.examName}>
                                                {
                                                    exam.exam_name
                                                }
                                            </h3>

                                        </div>


                                        <span style={styles.priorityBadge}>
                                            {
                                                exam.priority ||
                                                "medium"
                                            }
                                        </span>

                                    </div>


                                    <p style={styles.examDateText}>
                                        📅{" "}
                                        {formatDate(
                                            exam.exam_date
                                        )}
                                    </p>


                                    <strong style={styles.daysRemaining}>
                                        {daysLeft ===
                                            null
                                            ? ""
                                            : daysLeft >
                                                1
                                                ? `${daysLeft} days remaining`
                                                : daysLeft ===
                                                    1
                                                    ? "Exam tomorrow"
                                                    : daysLeft ===
                                                        0
                                                        ? "Exam today"
                                                        : "Exam completed"}
                                    </strong>

                                </div>

                            );
                        }
                    )}

                </div>


                {/* ================================= */}
                {/* OVERALL PROGRESS */}
                {/* ================================= */}

                <div style={styles.progressCard}>

                    <div style={styles.progressHeader}>

                        <div>

                            <strong>
                                Overall Plan Progress
                            </strong>

                            <p style={styles.progressDescription}>
                                {completedTasks} of{" "}
                                {totalTasks} study
                                tasks completed
                            </p>

                        </div>


                        <strong style={styles.progressValue}>
                            {Math.round(
                                Number(
                                    completionPercentage
                                ) || 0
                            )}
                            %
                        </strong>

                    </div>


                    <div style={styles.progressBackground}>

                        <div
                            style={{
                                ...styles.progressFill,

                                width:
                                    `${Math.min(
                                        Number(
                                            completionPercentage
                                        ) || 0,
                                        100
                                    )}%`
                            }}
                        />

                    </div>

                </div>


                {/* ================================= */}
                {/* TIMETABLE HEADER */}
                {/* ================================= */}

                <div style={styles.sectionHeader}>

                    <div>

                        <p style={styles.smallHeading}>
                            SCHEDULE
                        </p>

                        <h2 style={styles.sectionTitle}>
                            Your Study Timetable
                        </h2>

                        <p style={styles.mutedText}>
                            Your timetable adjusts
                            automatically when a
                            study session is missed.
                        </p>

                    </div>

                </div>


                {/* ================================= */}
                {/* TIMETABLE */}
                {/* ================================= */}

                {groupedTasks.length ===
                    0 ? (

                    <div style={styles.emptyCard}>

                        <div style={styles.emptyIcon}>
                            📚
                        </div>

                        <h3>
                            No study tasks
                        </h3>

                        <p style={styles.mutedText}>
                            There are currently no
                            tasks in this plan.
                        </p>

                    </div>

                ) : (

                    <div style={styles.dayList}>

                        {groupedTasks.map(
                            (
                                [
                                    date,
                                    dayTasks
                                ]
                            ) => {

                                const dayMinutes =
                                    dayTasks.reduce(
                                        (
                                            total,
                                            task
                                        ) =>
                                            total +
                                            Number(
                                                task.duration_minutes ||
                                                0
                                            ),
                                        0
                                    );


                                const dayCompleted =
                                    dayTasks.filter(
                                        (
                                            task
                                        ) =>
                                            task.completed ||
                                            task.status ===
                                                "completed"
                                    ).length;


                                const isToday =
                                    date ===
                                    todayString;


                                return (

                                    <div
                                        key={
                                            date
                                        }
                                        style={
                                            isToday
                                                ? {
                                                    ...styles.dayCard,
                                                    ...styles.todayDayCard
                                                }
                                                : styles.dayCard
                                        }
                                    >

                                        {/* DAY HEADER */}

                                        <div style={styles.dayHeader}>

                                            <div>

                                                <div style={styles.dayTitleRow}>

                                                    <h3 style={styles.dayTitle}>
                                                        {
                                                            formatDate(
                                                                date
                                                            )
                                                        }
                                                    </h3>


                                                    {isToday && (

                                                        <span style={styles.todayBadge}>
                                                            Today
                                                        </span>

                                                    )}

                                                </div>


                                                <span style={styles.daySubtitle}>
                                                    {dayCompleted}
                                                    {" / "}
                                                    {
                                                        dayTasks.length
                                                    }{" "}
                                                    completed
                                                </span>

                                            </div>


                                            <div style={styles.dayMinutes}>
                                                {dayMinutes} min
                                            </div>

                                        </div>


                                        {/* TASKS */}

                                        <div style={styles.taskList}>

                                            {dayTasks.map(
                                                (
                                                    task
                                                ) => {

                                                    const completed =
                                                        task.completed ||
                                                        task.status ===
                                                            "completed";


                                                    const isCompleting =
                                                        Number(
                                                            completingTaskId
                                                        ) ===
                                                        Number(
                                                            task.id
                                                        );


                                                    return (

                                                        <div
                                                            key={
                                                                task.id
                                                            }
                                                            style={
                                                                completed
                                                                    ? {
                                                                        ...styles.taskCard,
                                                                        ...styles.completedTask
                                                                    }
                                                                    : styles.taskCard
                                                            }
                                                        >

                                                            <div style={styles.taskLeftAccent} />


                                                            <div style={styles.taskMain}>

                                                                <div style={styles.taskTopRow}>

                                                                    <div style={styles.taskBadges}>

                                                                        <span
                                                                            style={
                                                                                getStatusStyle(
                                                                                    task.status
                                                                                )
                                                                            }
                                                                        >
                                                                            {
                                                                                task.status ||
                                                                                "pending"
                                                                            }
                                                                        </span>


                                                                        <span style={styles.subjectBadge}>
                                                                            {
                                                                                task.subject_name ||
                                                                                "Subject"
                                                                            }
                                                                        </span>

                                                                    </div>


                                                                    <span style={styles.priorityText}>
                                                                        {
                                                                            task.priority ||
                                                                            "medium"
                                                                        }{" "}
                                                                        priority
                                                                    </span>

                                                                </div>


                                                                <h3 style={styles.topicTitle}>
                                                                    {
                                                                        task.topic_name ||
                                                                        "Study Task"
                                                                    }
                                                                </h3>


                                                                {task.chapter_name && (

                                                                    <p style={styles.chapterText}>
                                                                        {
                                                                            task.chapter_name
                                                                        }
                                                                    </p>

                                                                )}


                                                                <div style={styles.taskMeta}>

                                                                    <span style={styles.metaItem}>
                                                                        ⏱{" "}
                                                                        {
                                                                            task.duration_minutes ||
                                                                            30
                                                                        }{" "}
                                                                        min
                                                                    </span>


                                                                    <span style={styles.metaItem}>
                                                                        📖{" "}
                                                                        {
                                                                            getTaskTypeLabel(
                                                                                task.task_type
                                                                            )
                                                                        }
                                                                    </span>

                                                                </div>


                                                                {task.reason && (

                                                                    <p style={styles.reasonText}>
                                                                        {
                                                                            task.reason
                                                                        }
                                                                    </p>

                                                                )}

                                                            </div>


                                                            <div style={styles.taskAction}>

                                                                {completed ? (

                                                                    <span style={styles.completedText}>
                                                                        ✓ Completed
                                                                    </span>

                                                                ) : task.status ===
                                                                    "missed" ? (

                                                                    <span style={styles.missedText}>
                                                                        Unable to reschedule
                                                                    </span>

                                                                ) : (

                                                                    <button
                                                                        onClick={() =>
                                                                            handleCompleteTask(
                                                                                task
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isCompleting
                                                                        }
                                                                        style={
                                                                            isCompleting
                                                                                ? styles.disabledButton
                                                                                : styles.completeButton
                                                                        }
                                                                    >
                                                                        {isCompleting
                                                                            ? "Saving..."
                                                                            : "Mark Complete"}
                                                                    </button>

                                                                )}

                                                            </div>

                                                        </div>

                                                    );
                                                }
                                            )}

                                        </div>

                                    </div>

                                );
                            }
                        )}

                    </div>

                )}


                {/* ================================= */}
                {/* FOOTER INFO */}
                {/* ================================= */}

                {(missedTasks > 0 ||
                    rescheduledTasks >
                        0) && (

                    <div className="sb-mobile-row" style={styles.adaptiveInfo}>

                        <span style={styles.adaptiveIcon}>
                            🧠
                        </span>

                        <div>

                            <strong>
                                Adaptive Scheduling Active
                            </strong>

                            <p style={styles.adaptiveText}>
                                StudyBuddy monitors
                                missed sessions and
                                automatically moves
                                unfinished work into
                                available study time
                                before each subject's
                                exam.
                            </p>

                        </div>

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
        padding: "34px 22px 72px",
        fontFamily:
            'Inter, "Segoe UI", Arial, sans-serif',
        color: "#FFF7FB",
        background: "transparent"
    },


    container: {
        width: "100%",
        maxWidth: "1180px",
        margin: "0 auto"
    },


    topBar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        marginBottom: "22px"
    },


    secondaryButton: {
        minHeight: "42px",
        padding: "0 17px",
        border:
            "1px solid rgba(240,90,157,.24)",
        background:
            "rgba(10,10,13,.72)",
        color: "#F7A3C8",
        borderRadius: "11px",
        cursor: "pointer",
        fontWeight: "700",
        fontSize: "13px",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
            "0 10px 28px rgba(0,0,0,.18)"
    },


    heroCard: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "34px",
        padding: "38px",
        marginBottom: "22px",
        borderRadius: "26px",
        background:
            "linear-gradient(145deg, rgba(24,20,27,.93), rgba(7,7,10,.88))",
        border:
            "1px solid rgba(240,90,157,.30)",
        color: "#FFF7FB",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow:
            "0 30px 85px rgba(0,0,0,.46), 0 0 60px rgba(240,90,157,.06)"
    },


    heroContent: {
        position: "relative",
        zIndex: 1,
        flex: 1
    },


    smallHeading: {
        margin: "0 0 9px",
        color: "#F05A9D",
        fontSize: "10px",
        fontWeight: "900",
        letterSpacing: "1.9px"
    },


    heroTitle: {
        margin: "0 0 14px",
        color: "#FFF9FC",
        fontSize: "clamp(34px, 5vw, 50px)",
        lineHeight: "1.05",
        fontWeight: "850",
        letterSpacing: "-1.3px"
    },


    heroDescription: {
        maxWidth: "720px",
        margin: "0 0 22px",
        color: "#B8ABB2",
        lineHeight: "1.75",
        fontSize: "14px"
    },


    heroTags: {
        display: "flex",
        flexWrap: "wrap",
        gap: "9px"
    },


    heroTag: {
        padding: "7px 11px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.18)",
        color: "#F7A3C8",
        fontSize: "11px",
        fontWeight: "700",
        textTransform: "capitalize"
    },


    heroProgress: {
        position: "relative",
        zIndex: 1,
        width: "148px",
        height: "148px",
        minWidth: "148px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        border:
            "9px solid rgba(240,90,157,.12)",
        outline:
            "1px solid rgba(240,90,157,.28)",
        background:
            "radial-gradient(circle, rgba(240,90,157,.13), rgba(8,8,11,.72) 68%)",
        boxShadow:
            "0 0 45px rgba(240,90,157,.12), inset 0 0 30px rgba(240,90,157,.05)"
    },


    progressCircleNumber: {
        color: "#FFF9FC",
        fontSize: "34px",
        lineHeight: "1",
        fontWeight: "850"
    },


    progressCircleLabel: {
        marginTop: "6px",
        color: "#A99DA4",
        fontSize: "11px",
        fontWeight: "600"
    },


    successMessage: {
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        marginBottom: "20px",
        padding: "15px 17px",
        borderRadius: "14px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.20)",
        color: "#FFD4E7",
        backdropFilter: "blur(18px)"
    },


    errorMessage: {
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        marginBottom: "20px",
        padding: "15px 17px",
        borderRadius: "14px",
        background:
            "rgba(177,42,75,.12)",
        border:
            "1px solid rgba(255,105,145,.24)",
        color: "#FFB8CE",
        backdropFilter: "blur(18px)"
    },


    messageIcon: {
        width: "29px",
        height: "29px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        background:
            "rgba(240,90,157,.12)",
        color: "#F7A3C8",
        fontWeight: "900"
    },


    messageText: {
        margin: "4px 0 0",
        color: "#B8ABB2",
        lineHeight: "1.55",
        fontSize: "13px"
    },


    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "14px",
        marginBottom: "24px"
    },


    summaryCard: {
        minHeight: "112px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "20px",
        borderRadius: "17px",
        background:
            "linear-gradient(145deg, rgba(21,19,24,.90), rgba(8,8,11,.80))",
        border:
            "1px solid rgba(240,90,157,.15)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
            "0 18px 45px rgba(0,0,0,.24)"
    },


    summaryIcon: {
        width: "45px",
        height: "45px",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "13px",
        background:
            "rgba(240,90,157,.09)",
        border:
            "1px solid rgba(240,90,157,.16)",
        fontSize: "21px"
    },


    statLabel: {
        display: "block",
        marginBottom: "6px",
        color: "#8F8389",
        fontSize: "11px",
        fontWeight: "700"
    },


    statValue: {
        display: "block",
        color: "#FFF9FC",
        fontSize: "26px",
        lineHeight: "1.05",
        fontWeight: "850"
    },


    statSmall: {
        color: "#8F8389",
        fontSize: "14px",
        fontWeight: "600"
    },


    todayCard: {
        marginBottom: "36px",
        padding: "27px",
        borderRadius: "20px",
        background:
            "linear-gradient(145deg, rgba(22,19,25,.91), rgba(8,8,11,.84))",
        border:
            "1px solid rgba(240,90,157,.17)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
        boxShadow:
            "0 22px 58px rgba(0,0,0,.28)"
    },


    todayTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "20px"
    },


    todayPercentage: {
        color: "#F05A9D",
        fontSize: "31px",
        lineHeight: "1",
        fontWeight: "900"
    },


    workloadRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: "15px",
        marginTop: "21px",
        marginBottom: "9px",
        color: "#A99DA4",
        fontSize: "12px"
    },


    todayTaskPreview: {
        display: "grid",
        gap: "9px",
        marginTop: "20px"
    },


    todayTaskRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "13px 15px",
        borderRadius: "12px",
        background:
            "rgba(7,7,10,.52)",
        border:
            "1px solid rgba(255,255,255,.055)",
        color: "#F7EEF2",
        fontSize: "13px"
    },


    todayTopic: {
        display: "block",
        marginTop: "4px",
        color: "#8F8389",
        fontSize: "12px"
    },


    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: "20px",
        marginBottom: "17px"
    },


    sectionTitle: {
        margin: 0,
        color: "#FFF9FC",
        fontSize: "25px",
        letterSpacing: "-.4px"
    },


    mutedText: {
        margin: "7px 0 0",
        color: "#9D9097",
        lineHeight: "1.65",
        fontSize: "13px"
    },


    nextExamBadge: {
        padding: "8px 12px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.20)",
        color: "#F7A3C8",
        fontSize: "11px",
        fontWeight: "800"
    },


    examGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "14px",
        marginBottom: "30px"
    },


    examCard: {
        padding: "20px",
        borderRadius: "16px",
        background:
            "linear-gradient(145deg, rgba(20,18,23,.90), rgba(7,7,10,.82))",
        border:
            "1px solid rgba(240,90,157,.14)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
    },


    examTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "12px"
    },


    examSubject: {
        color: "#F05A9D",
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: ".7px"
    },


    examName: {
        margin: "6px 0 0",
        color: "#FFF9FC",
        fontSize: "18px"
    },


    priorityBadge: {
        height: "fit-content",
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.16)",
        color: "#F7A3C8",
        fontSize: "10px",
        fontWeight: "800",
        textTransform: "capitalize"
    },


    examDateText: {
        marginTop: "18px",
        color: "#A99DA4",
        fontSize: "13px"
    },


    daysRemaining: {
        display: "block",
        marginTop: "10px",
        color: "#F7EEF2",
        fontSize: "13px"
    },


    progressCard: {
        marginBottom: "36px",
        padding: "23px",
        borderRadius: "17px",
        background:
            "linear-gradient(145deg, rgba(21,19,24,.90), rgba(8,8,11,.82))",
        border:
            "1px solid rgba(240,90,157,.15)",
        backdropFilter: "blur(20px)"
    },


    progressHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "15px",
        color: "#FFF7FB"
    },


    progressDescription: {
        margin: "5px 0 0",
        color: "#8F8389",
        fontSize: "12px"
    },


    progressValue: {
        color: "#F05A9D",
        fontSize: "25px",
        fontWeight: "900"
    },


    progressBackground: {
        height: "9px",
        overflow: "hidden",
        borderRadius: "999px",
        background:
            "rgba(255,255,255,.07)"
    },


    progressFill: {
        height: "100%",
        borderRadius: "999px",
        background:
            "linear-gradient(90deg, #D93478, #F05A9D, #FF69AD)",
        boxShadow:
            "0 0 18px rgba(240,90,157,.35)",
        transition: "width .35s ease"
    },


    workloadFill: {
        height: "100%",
        borderRadius: "999px",
        background:
            "linear-gradient(90deg, #C72F70, #F05A9D)",
        boxShadow:
            "0 0 16px rgba(240,90,157,.28)",
        transition: "width .35s ease"
    },


    dayList: {
        display: "grid",
        gap: "20px"
    },


    dayCard: {
        padding: "23px",
        borderRadius: "19px",
        background:
            "linear-gradient(145deg, rgba(20,18,23,.91), rgba(7,7,10,.84))",
        border:
            "1px solid rgba(240,90,157,.14)",
        backdropFilter: "blur(21px)",
        WebkitBackdropFilter: "blur(21px)",
        boxShadow:
            "0 20px 55px rgba(0,0,0,.23)"
    },


    todayDayCard: {
        border:
            "1px solid rgba(240,90,157,.42)",
        boxShadow:
            "0 24px 65px rgba(0,0,0,.28), 0 0 34px rgba(240,90,157,.07)"
    },


    dayHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        paddingBottom: "17px",
        marginBottom: "15px",
        borderBottom:
            "1px solid rgba(255,255,255,.065)"
    },


    dayTitleRow: {
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "9px"
    },


    dayTitle: {
        margin: 0,
        color: "#FFF9FC",
        fontSize: "18px"
    },


    daySubtitle: {
        display: "block",
        marginTop: "5px",
        color: "#8F8389",
        fontSize: "12px"
    },


    todayBadge: {
        padding: "4px 8px",
        borderRadius: "999px",
        background:
            "linear-gradient(90deg, #D93478, #F05A9D)",
        color: "#FFF",
        fontSize: "9px",
        fontWeight: "900",
        letterSpacing: ".5px"
    },


    dayMinutes: {
        padding: "8px 11px",
        borderRadius: "9px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.15)",
        color: "#F7A3C8",
        fontSize: "12px",
        fontWeight: "800"
    },


    taskList: {
        display: "grid",
        gap: "11px"
    },


    taskCard: {
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "18px 18px 18px 23px",
        borderRadius: "14px",
        background:
            "rgba(7,7,10,.48)",
        border:
            "1px solid rgba(255,255,255,.065)"
    },


    taskLeftAccent: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "4px",
        height: "100%",
        background:
            "linear-gradient(180deg, #F05A9D, #D93478)"
    },


    completedTask: {
        opacity: .68,
        background:
            "rgba(28,55,38,.22)",
        border:
            "1px solid rgba(104,190,130,.13)"
    },


    taskMain: {
        flex: 1,
        minWidth: 0
    },


    taskTopRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
        marginBottom: "8px"
    },


    taskBadges: {
        display: "flex",
        flexWrap: "wrap",
        gap: "7px"
    },


    pendingBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.08)",
        border:
            "1px solid rgba(240,90,157,.15)",
        color: "#F7A3C8",
        fontSize: "9px",
        fontWeight: "900",
        textTransform: "capitalize"
    },


    completedBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(77,168,103,.11)",
        border:
            "1px solid rgba(107,205,132,.17)",
        color: "#A8E8B8",
        fontSize: "9px",
        fontWeight: "900",
        textTransform: "capitalize"
    },


    missedBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(199,56,88,.11)",
        border:
            "1px solid rgba(255,104,139,.18)",
        color: "#FF9AB2",
        fontSize: "9px",
        fontWeight: "900",
        textTransform: "capitalize"
    },


    rescheduledBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background:
            "rgba(240,90,157,.09)",
        border:
            "1px solid rgba(240,90,157,.18)",
        color: "#F7A3C8",
        fontSize: "9px",
        fontWeight: "900",
        textTransform: "capitalize"
    },


    subjectBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        border:
            "1px solid rgba(255,255,255,.08)",
        color: "#D7CAD0",
        fontSize: "9px",
        fontWeight: "800"
    },


    priorityText: {
        color: "#82767C",
        fontSize: "10px",
        textTransform: "capitalize"
    },


    topicTitle: {
        margin: "0 0 5px",
        color: "#FFF9FC",
        fontSize: "18px",
        lineHeight: "1.35"
    },


    chapterText: {
        margin: "0 0 13px",
        color: "#8F8389",
        fontSize: "12px"
    },


    taskMeta: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "11px"
    },


    metaItem: {
        color: "#B8ABB2",
        fontSize: "12px"
    },


    reasonText: {
        margin: 0,
        color: "#81757B",
        fontSize: "12px",
        lineHeight: "1.6"
    },


    taskAction: {
        flexShrink: 0
    },


    completeButton: {
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
        whiteSpace: "nowrap",
        boxShadow:
            "0 10px 26px rgba(240,90,157,.20)"
    },


    disabledButton: {
        minHeight: "41px",
        padding: "0 14px",
        borderRadius: "10px",
        border:
            "1px solid rgba(255,255,255,.07)",
        background:
            "rgba(255,255,255,.04)",
        color: "#6F656A",
        cursor: "not-allowed",
        whiteSpace: "nowrap"
    },


    completedText: {
        color: "#A8E8B8",
        fontSize: "12px",
        fontWeight: "800",
        whiteSpace: "nowrap"
    },


    missedText: {
        maxWidth: "155px",
        color: "#FF9AB2",
        fontSize: "11px",
        textAlign: "right"
    },


    adaptiveInfo: {
        display: "flex",
        alignItems: "flex-start",
        gap: "15px",
        marginTop: "26px",
        padding: "19px",
        borderRadius: "15px",
        background:
            "rgba(240,90,157,.065)",
        border:
            "1px solid rgba(240,90,157,.14)",
        backdropFilter: "blur(18px)"
    },


    adaptiveIcon: {
        fontSize: "22px"
    },


    adaptiveText: {
        margin: "5px 0 0",
        color: "#9D9097",
        lineHeight: "1.65",
        fontSize: "12px"
    },


    emptyCard: {
        marginTop: "18px",
        padding: "44px 28px",
        textAlign: "center",
        borderRadius: "19px",
        background:
            "linear-gradient(145deg, rgba(20,18,23,.90), rgba(7,7,10,.82))",
        border:
            "1px solid rgba(240,90,157,.14)",
        color: "#FFF7FB",
        backdropFilter: "blur(20px)"
    },


    emptyIcon: {
        width: "52px",
        height: "52px",
        margin: "0 auto 15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "15px",
        background:
            "rgba(240,90,157,.09)",
        border:
            "1px solid rgba(240,90,157,.16)",
        fontSize: "23px"
    },


};


export default StudyPlan;