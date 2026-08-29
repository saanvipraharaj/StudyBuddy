import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

import api from "../services/api";


// ============================================================
// DASHBOARD
// ============================================================

function Dashboard() {

    const navigate =
        useNavigate();


    // ========================================================
    // USER
    // ========================================================

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "null"
        );


    // ========================================================
    // PROGRESS STATE
    // ========================================================

    const [
        progress,
        setProgress
    ] = useState(null);


    const [
        loadingProgress,
        setLoadingProgress
    ] = useState(true);


    const [
        progressError,
        setProgressError
    ] = useState("");


    // ========================================================
    // STUDY PLAN STATE
    // ========================================================

    const [
        studyPlans,
        setStudyPlans
    ] = useState([]);


    const [
        todayTasks,
        setTodayTasks
    ] = useState([]);


    const [
        loadingPlan,
        setLoadingPlan
    ] = useState(true);


    // ========================================================
    // REVISION STATE
    // ========================================================

    const [
        revisionSummary,
        setRevisionSummary
    ] = useState({
        pending: 0,
        overdue: 0,
        due_today: 0,
        completed: 0
    });


    // ========================================================
    // MISTAKE STATE
    // ========================================================

    const [
        mistakeSummary,
        setMistakeSummary
    ] = useState({
        total_mistakes: 0,
        affected_topics: 0,
        affected_chapters: 0,
        affected_subjects: 0
    });


    // ========================================================
    // EXAMS
    // ========================================================

    const [
        exams,
        setExams
    ] = useState([]);


    const [
        loadingExams,
        setLoadingExams
    ] = useState(true);


    // ========================================================
    // EXAM READINESS
    // ========================================================

    const [
        readiness,
        setReadiness
    ] = useState(null);


    const [
        loadingReadiness,
        setLoadingReadiness
    ] = useState(true);


    // ========================================================
    // TOKEN
    // ========================================================

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


    // ========================================================
    // LOCAL DATE
    // ========================================================

    const getTodayDate = () => {

        const now =
            new Date();


        const year =
            now.getFullYear();


        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                now.getDate()
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


    // ========================================================
    // NORMALIZE DATE
    // ========================================================

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


    // ========================================================
    // FORMAT DATE
    // ========================================================

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
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };


    // ========================================================
    // FETCH PROGRESS
    // ========================================================

    const fetchProgress =
        async () => {

            try {

                setLoadingProgress(
                    true
                );


                setProgressError(
                    ""
                );


                if (!getToken()) {

                    navigate(
                        "/login"
                    );

                    return;
                }


                const response =
                    await api.get(
                        "/api/progress",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setProgress(
                    response.data
                );


            } catch (error) {

                console.error(
                    "Fetch progress error:",
                    error
                );


                setProgressError(
                    error.response
                        ?.data
                        ?.message ||
                    "Unable to load your progress."
                );


            } finally {

                setLoadingProgress(
                    false
                );
            }
        };


    // ========================================================
    // FETCH STUDY PLANS
    // ========================================================

    const fetchStudyPlans =
        async () => {

            try {

                setLoadingPlan(
                    true
                );


                const response =
                    await api.get(
                        "/api/study-plans",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                const plans =
                    response.data
                        .study_plans ||
                    [];


                setStudyPlans(
                    plans
                );


                const activePlan =
                    plans.find(
                        plan =>
                            plan.status ===
                            "active"
                    );


                if (!activePlan) {

                    setTodayTasks(
                        []
                    );

                    return;
                }


                const taskResponse =
                    await api.get(
                        `/api/study-plans/${activePlan.id}/tasks`,
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                const tasks =
                    taskResponse.data
                        .tasks ||
                    [];


                const today =
                    getTodayDate();


                setTodayTasks(

                    tasks.filter(
                        task =>
                            normalizeDate(
                                task.task_date
                            ) ===
                            today
                    )
                );


            } catch (error) {

                console.error(
                    "Fetch study plan error:",
                    error
                );


            } finally {

                setLoadingPlan(
                    false
                );
            }
        };


    // ========================================================
    // FETCH REVISION SUMMARY
    // ========================================================

    const fetchRevisionSummary =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/revisions/summary",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setRevisionSummary(

                    response.data.summary || {

                        pending: 0,

                        overdue: 0,

                        due_today: 0,

                        completed: 0
                    }
                );


            } catch (error) {

                console.error(
                    "Fetch revision summary error:",
                    error
                );
            }
        };


    // ========================================================
    // FETCH MISTAKE SUMMARY
    // ========================================================

    const fetchMistakeSummary =
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


                setMistakeSummary(

                    response.data.summary || {

                        total_mistakes: 0,

                        affected_topics: 0,

                        affected_chapters: 0,

                        affected_subjects: 0
                    }
                );


            } catch (error) {

                console.error(
                    "Fetch mistake summary error:",
                    error
                );
            }
        };


    // ========================================================
    // FETCH EXAMS
    // ========================================================

    const fetchExams =
        async () => {

            try {

                setLoadingExams(
                    true
                );


                const response =
                    await api.get(
                        "/api/exams",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setExams(
                    response.data.exams ||
                    []
                );


            } catch (error) {

                console.error(
                    "Fetch exams error:",
                    error
                );


                setExams(
                    []
                );


            } finally {

                setLoadingExams(
                    false
                );
            }
        };


    // ========================================================
    // FETCH EXAM READINESS
    // ========================================================

    const fetchReadiness =
        async () => {

            try {

                setLoadingReadiness(
                    true
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


            } catch (error) {

                console.error(
                    "Fetch exam readiness error:",
                    error
                );


                setReadiness(
                    null
                );


            } finally {

                setLoadingReadiness(
                    false
                );
            }
        };


    // ========================================================
    // LOAD DASHBOARD
    // ========================================================

    useEffect(
        () => {

            if (!getToken()) {

                navigate(
                    "/login"
                );

                return;
            }


            Promise.all([

                fetchProgress(),

                fetchStudyPlans(),

                fetchRevisionSummary(),

                fetchMistakeSummary(),

                fetchExams(),

                fetchReadiness()
            ]);

        },
        []
    );


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "token"
        );


        localStorage.removeItem(
            "user"
        );


        sessionStorage.removeItem(
            "token"
        );


        sessionStorage.removeItem(
            "user"
        );


        navigate(
            "/login"
        );
    };


    // ========================================================
    // ACTIVE PLAN
    // ========================================================

    const activePlan =
        useMemo(
            () =>

                studyPlans.find(
                    plan =>
                        plan.status ===
                        "active"
                ) || null,

            [
                studyPlans
            ]
        );


    // ========================================================
    // ACTIVE PLAN PROGRESS
    // ========================================================

    const activePlanTotalTasks =
        Number(
            activePlan
                ?.total_tasks ||
            0
        );


    const activePlanCompletedTasks =
        Number(
            activePlan
                ?.completed_tasks ||
            0
        );


    const activePlanPercentage =
        activePlanTotalTasks > 0

            ? Math.round(
                (
                    activePlanCompletedTasks /
                    activePlanTotalTasks
                ) *
                100
            )

            : 0;


    // ========================================================
    // PROGRESS VALUES
    // ========================================================

    const totalTopics =
        Number(
            progress
                ?.progress
                ?.total_topics
        ) || 0;


    const completedTopics =
        Number(
            progress
                ?.progress
                ?.completed_topics
        ) || 0;


    const inProgressTopics =
        Number(
            progress
                ?.progress
                ?.in_progress_topics
        ) || 0;


    const remainingTopics =
        Number(
            progress
                ?.progress
                ?.remaining_topics
        ) || 0;


    const completionPercentage =
        Number(
            progress
                ?.progress
                ?.completion_percentage
        ) || 0;


    const averageMastery =
        Number(
            progress
                ?.progress
                ?.average_mastery
        ) || 0;


    // ========================================================
    // PROGRESS CHART
    // ========================================================

    const chartData = [

        {
            name:
                "Completed",

            value:
                completedTopics
        },

        {
            name:
                "In Progress",

            value:
                inProgressTopics
        },

        {
            name:
                "Remaining",

            value:
                remainingTopics
        }
    ];


    const CHART_COLORS = [

        "#F05A9D",

        "#A93869",

        "#2A1B23"
    ];


    // ========================================================
    // TODAY
    // ========================================================

    const completedToday =
        todayTasks.filter(
            task =>
                task.completed ||
                task.status ===
                "completed"
        ).length;


    // ========================================================
    // UPCOMING EXAMS
    // ========================================================

    const today =
        getTodayDate();


    const upcomingExams =
        useMemo(
            () => {

                return exams

                    .filter(
                        exam => {

                            const date =
                                normalizeDate(
                                    exam.exam_date
                                );


                            return (
                                date &&
                                date >=
                                today
                            );
                        }
                    )

                    .sort(
                        (
                            a,
                            b
                        ) =>

                            normalizeDate(
                                a.exam_date
                            ).localeCompare(
                                normalizeDate(
                                    b.exam_date
                                )
                            )
                    );

            },
            [
                exams,
                today
            ]
        );


    const nearestExam =
        upcomingExams[0] ||
        null;


    // ========================================================
    // READINESS
    // ========================================================

    const overallReadiness =
        Number(
            readiness
                ?.overall_readiness ||
            0
        );


    const nearestReadinessExam =
        readiness
            ?.exams
            ?.length
            ? readiness.exams[0]
            : null;


    const getReadinessStatus = (
        score
    ) => {

        if (
            score >=
            85
        ) {

            return "Exam Ready";
        }


        if (
            score >=
            70
        ) {

            return "On Track";
        }


        if (
            score >=
            50
        ) {

            return "Needs Revision";
        }


        return "Needs Work";
    };


    const readinessStatus =
        getReadinessStatus(
            overallReadiness
        );


    // ========================================================
    // PAGE
    // ========================================================

    return (

        <main className="dashboard-page">

            <div className="dashboard-shell">


                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <header className="dashboard-header">

                    <div className="dashboard-brand">

                        <div className="dashboard-logo">
                            ✦
                        </div>


                        <div>

                            <h1>

                                StudyBuddy{" "}

                                <span>
                                    AI
                                </span>

                            </h1>


                            <p>
                                Your personalized learning dashboard.
                            </p>

                        </div>

                    </div>


                    <button
                        className="dashboard-logout"
                        onClick={
                            handleLogout
                        }
                    >

                        <span>
                            ↪
                        </span>

                        Logout

                    </button>

                </header>


                {/* ================================================= */}
                {/* WELCOME */}
                {/* ================================================= */}

                <section className="dashboard-welcome">

                    <div className="dashboard-card-top-line" />


                    <p className="dashboard-eyebrow">
                        DASHBOARD
                    </p>


                    <h2>

                        Welcome

                        {
                            user?.name
                                ? ", "
                                : ""
                        }

                        <span>
                            {
                                user?.name ||
                                "Student"
                            }
                        </span>

                        !

                    </h2>


                    <p>

                        Track your progress,
                        continue learning and
                        prepare for your exams.

                    </p>

                </section>


                {/* ================================================= */}
                {/* TODAY'S STUDY PLAN */}
                {/* ================================================= */}

                <section className="dashboard-section">

                    <p className="dashboard-section-label">
                        TODAY
                    </p>


                    <h2 className="dashboard-section-title">
                        Today&apos;s Study Plan
                    </h2>


                    <p className="dashboard-section-description">
                        Your personalized tasks for today.
                    </p>


                    {loadingPlan ? (

                        <div className="dashboard-wide-card dashboard-loading-card">

                            Loading today&apos;s study plan...

                        </div>

                    ) : !activePlan ? (

                        <div className="dashboard-wide-card">

                            <div className="dashboard-feature-icon">
                                ▦
                            </div>


                            <div className="dashboard-wide-content">

                                <h3>
                                    No active study plan yet
                                </h3>


                                <p>

                                    Add your exam timetable
                                    and generate your
                                    personalized AI study plan.

                                </p>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/exam-planner"
                                    )
                                }
                            >
                                ▣ Open Exam Planner
                            </button>

                        </div>

                    ) : todayTasks.length ===
                    0 ? (

                        <div className="dashboard-wide-card">

                            <div className="dashboard-feature-icon">
                                ✓
                            </div>


                            <div className="dashboard-wide-content">

                                <h3>
                                    No tasks scheduled for today
                                </h3>


                                <p>

                                    Your active study plan is{" "}

                                    <strong>
                                        {activePlanPercentage}%
                                    </strong>

                                    {" "}complete.

                                </p>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        `/study-plans/${activePlan.id}`
                                    )
                                }
                            >
                                Open Study Plan
                            </button>

                        </div>

                    ) : (

                        <div className="dashboard-today-card">

                            <div className="dashboard-today-top">

                                <div>

                                    <h3>

                                        {completedToday}

                                        {" / "}

                                        {todayTasks.length}

                                        {" "}tasks completed

                                    </h3>


                                    <p>

                                        Your master study plan
                                        is currently{" "}

                                        <strong>
                                            {activePlanPercentage}%
                                        </strong>

                                        {" "}complete.

                                    </p>

                                </div>


                                <button
                                    className="dashboard-primary-button"
                                    onClick={() =>
                                        navigate(
                                            `/study-plans/${activePlan.id}`
                                        )
                                    }
                                >
                                    Open Full Plan
                                </button>

                            </div>


                            <div className="dashboard-mini-task-list">

                                {todayTasks
                                    .slice(
                                        0,
                                        3
                                    )
                                    .map(
                                        task => (

                                            <div
                                                className="dashboard-mini-task"
                                                key={
                                                    task.id
                                                }
                                            >

                                                <div>

                                                    <span className="dashboard-mini-dot" />


                                                    <strong>

                                                        {
                                                            task.topic_name ||
                                                            "Study Task"
                                                        }

                                                    </strong>

                                                </div>


                                                <span>

                                                    {
                                                        task.duration_minutes ||
                                                        30
                                                    }

                                                    {" "}min

                                                </span>

                                            </div>

                                        )
                                    )}

                            </div>

                        </div>

                    )}

                </section>


                {/* ================================================= */}
                {/* EXAM READINESS */}
                {/* ================================================= */}

                <section className="dashboard-section">

                    <p className="dashboard-section-label">
                        EXAM INTELLIGENCE
                    </p>


                    <h2 className="dashboard-section-title">
                        Exam Readiness
                    </h2>


                    <p className="dashboard-section-description">

                        StudyBuddy combines your
                        syllabus progress, mastery,
                        tests, revisions and study
                        plan performance.

                    </p>


                    {loadingReadiness ? (

                        <div className="dashboard-wide-card dashboard-loading-card">

                            Calculating your exam readiness...

                        </div>

                    ) : !nearestReadinessExam ? (

                        <div className="dashboard-wide-card">

                            <div className="dashboard-feature-icon">
                                ◷
                            </div>


                            <div className="dashboard-wide-content">

                                <h3>
                                    No upcoming exam readiness yet
                                </h3>


                                <p>

                                    Add an upcoming exam to
                                    start calculating your
                                    readiness.

                                </p>

                            </div>


                            <button
                                className="dashboard-primary-button"
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

                        <div
                            className="dashboard-wide-card"
                            style={{
                                alignItems:
                                    "center"
                            }}
                        >

                            {/* READINESS CIRCLE */}

                            <div
                                style={{
                                    width:
                                        "112px",

                                    height:
                                        "112px",

                                    flexShrink:
                                        0,

                                    padding:
                                        "7px",

                                    display:
                                        "grid",

                                    placeItems:
                                        "center",

                                    borderRadius:
                                        "50%",

                                    background:
                                        `conic-gradient(
                                            #F05A9D 0% ${overallReadiness}%,
                                            rgba(255,255,255,.07)
                                            ${overallReadiness}% 100%
                                        )`,

                                    boxShadow:
                                        "0 0 35px rgba(240,90,157,.12)"
                                }}
                            >

                                <div
                                    style={{
                                        width:
                                            "100%",

                                        height:
                                            "100%",

                                        display:
                                            "flex",

                                        flexDirection:
                                            "column",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "center",

                                        borderRadius:
                                            "50%",

                                        background:
                                            "#0A090C",

                                        border:
                                            "1px solid rgba(240,90,157,.18)"
                                    }}
                                >

                                    <strong
                                        style={{
                                            color:
                                                "#FFF",

                                            fontSize:
                                                "25px"
                                        }}
                                    >
                                        {
                                            Math.round(
                                                overallReadiness
                                            )
                                        }
                                        %
                                    </strong>


                                    <span
                                        style={{
                                            color:
                                                "#8F8389",

                                            fontSize:
                                                "9px",

                                            marginTop:
                                                "3px"
                                        }}
                                    >
                                        Overall
                                    </span>

                                </div>

                            </div>


                            {/* READINESS INFO */}

                            <div className="dashboard-wide-content">

                                <span
                                    style={{
                                        display:
                                            "inline-flex",

                                        marginBottom:
                                            "7px",

                                        padding:
                                            "5px 9px",

                                        borderRadius:
                                            "999px",

                                        background:
                                            "rgba(240,90,157,.09)",

                                        border:
                                            "1px solid rgba(240,90,157,.18)",

                                        color:
                                            "#F7A3C8",

                                        fontSize:
                                            "9px",

                                        fontWeight:
                                            "800"
                                    }}
                                >
                                    {readinessStatus}
                                </span>


                                <h3>
                                    {
                                        nearestReadinessExam
                                            .exam_name
                                    }
                                </h3>


                                <p>

                                    {
                                        nearestReadinessExam
                                            .subject_name
                                    }

                                    {" • "}

                                    {
                                        nearestReadinessExam
                                            .days_left
                                    }

                                    {" "}

                                    {
                                        nearestReadinessExam
                                            .days_left ===
                                        1
                                            ? "day"
                                            : "days"
                                    }

                                    {" remaining"}

                                </p>


                                <p
                                    style={{
                                        marginTop:
                                            "5px",

                                        color:
                                            "#83777D",

                                        fontSize:
                                            "11px"
                                    }}
                                >

                                    {
                                        readiness
                                            ?.exam_count ||
                                        0
                                    }

                                    {" upcoming "}

                                    {
                                        readiness
                                            ?.exam_count ===
                                        1
                                            ? "exam"
                                            : "exams"
                                    }

                                    {" being tracked"}

                                </p>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/exam-readiness"
                                    )
                                }
                            >
                                View Readiness
                            </button>

                        </div>

                    )}

                </section>


                {/* ================================================= */}
                {/* STUDY PROGRESS */}
                {/* ================================================= */}

                <section className="dashboard-section">

                    <p className="dashboard-section-label">
                        PROGRESS
                    </p>


                    <h2 className="dashboard-section-title">
                        Study Progress
                    </h2>


                    <p className="dashboard-section-description">

                        Your overall syllabus progress
                        across all subjects.

                    </p>


                    {loadingProgress ? (

                        <div className="dashboard-wide-card dashboard-loading-card">

                            Loading your progress...

                        </div>

                    ) : progressError ? (

                        <div className="dashboard-error-card">

                            <p>
                                {progressError}
                            </p>


                            <button
                                className="dashboard-secondary-button"
                                onClick={
                                    fetchProgress
                                }
                            >
                                Try Again
                            </button>

                        </div>

                    ) : totalTopics === 0 ? (

                        <div className="dashboard-wide-card">

                            <div className="dashboard-feature-icon">
                                ◇
                            </div>


                            <div className="dashboard-wide-content">

                                <h3>
                                    No progress yet
                                </h3>


                                <p>

                                    Add subjects,
                                    chapters and topics
                                    to begin tracking
                                    your learning.

                                </p>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/subjects"
                                    )
                                }
                            >
                                Add Subjects
                            </button>

                        </div>

                    ) : (

                        <div className="dashboard-progress-layout">


                            {/* CHART */}

                            <div className="dashboard-chart-card">

                                <div className="dashboard-card-top-line" />


                                <h3>
                                    Overall Completion
                                </h3>


                                <div className="dashboard-chart-wrapper">

                                    <ResponsiveContainer
                                        width="100%"
                                        height={260}
                                    >

                                        <PieChart>

                                            <Pie
                                                data={
                                                    chartData
                                                }
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={72}
                                                outerRadius={103}
                                                startAngle={90}
                                                endAngle={-270}
                                                paddingAngle={3}
                                                stroke="none"
                                            >

                                                {chartData.map(
                                                    (
                                                        item,
                                                        index
                                                    ) => (

                                                        <Cell
                                                            key={
                                                                item.name
                                                            }
                                                            fill={
                                                                CHART_COLORS[
                                                                    index
                                                                ]
                                                            }
                                                        />

                                                    )
                                                )}

                                            </Pie>


                                            <Tooltip
                                                contentStyle={{
                                                    background:
                                                        "#111116",

                                                    border:
                                                        "1px solid rgba(240,90,157,.35)",

                                                    borderRadius:
                                                        "10px",

                                                    color:
                                                        "#fff"
                                                }}
                                            />

                                        </PieChart>

                                    </ResponsiveContainer>


                                    <div className="dashboard-chart-center">

                                        <strong>

                                            {
                                                completionPercentage
                                                    .toFixed(
                                                        0
                                                    )
                                            }

                                            %

                                        </strong>


                                        <span>
                                            Complete
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* STATS */}

                            <div className="dashboard-stat-grid">

                                <div className="dashboard-stat-card">

                                    <span className="dashboard-stat-icon">
                                        ♙
                                    </span>


                                    <div>

                                        <p>
                                            Total Topics
                                        </p>


                                        <strong>
                                            {totalTopics}
                                        </strong>

                                    </div>

                                </div>


                                <div className="dashboard-stat-card">

                                    <span className="dashboard-stat-icon">
                                        ✓
                                    </span>


                                    <div>

                                        <p>
                                            Completed
                                        </p>


                                        <strong>
                                            {completedTopics}
                                        </strong>

                                    </div>

                                </div>


                                <div className="dashboard-stat-card">

                                    <span className="dashboard-stat-icon">
                                        ◷
                                    </span>


                                    <div>

                                        <p>
                                            In Progress
                                        </p>


                                        <strong>
                                            {inProgressTopics}
                                        </strong>

                                    </div>

                                </div>


                                <div className="dashboard-stat-card">

                                    <span className="dashboard-stat-icon">
                                        ⧖
                                    </span>


                                    <div>

                                        <p>
                                            Remaining
                                        </p>


                                        <strong>
                                            {remainingTopics}
                                        </strong>

                                    </div>

                                </div>


                                <div className="dashboard-mastery-card">

                                    <div>

                                        <p>
                                            Average Mastery
                                        </p>


                                        <strong>

                                            {
                                                averageMastery
                                                    .toFixed(
                                                        0
                                                    )
                                            }

                                            %

                                        </strong>

                                    </div>


                                    <span>

                                        Based on your
                                        test performance.

                                    </span>

                                </div>

                            </div>

                        </div>

                    )}

                </section>


                {/* ================================================= */}
                {/* SUBJECT PROGRESS */}
                {/* ================================================= */}

                {progress
                    ?.subjects
                    ?.length >
                0 && (

                    <section className="dashboard-section">

                        <p className="dashboard-section-label">
                            SUBJECTS
                        </p>


                        <h2 className="dashboard-section-title">
                            Subject Progress
                        </h2>


                        <p className="dashboard-section-description">

                            See how much of each
                            subject you have completed.

                        </p>


                        <div className="dashboard-subject-grid">

                            {progress.subjects.map(
                                subject => {

                                    const percentage =
                                        Math.min(
                                            Number(
                                                subject
                                                    .completion_percentage ||
                                                0
                                            ),
                                            100
                                        );


                                    return (

                                        <div
                                            className="dashboard-subject-card"
                                            key={
                                                subject.subject_id
                                            }
                                        >

                                            <div className="dashboard-subject-heading">

                                                <h3>
                                                    {
                                                        subject.subject_name
                                                    }
                                                </h3>


                                                <strong>

                                                    {
                                                        percentage
                                                            .toFixed(
                                                                0
                                                            )
                                                    }

                                                    %

                                                </strong>

                                            </div>


                                            <div className="dashboard-progress-track">

                                                <div
                                                    className="dashboard-progress-fill"
                                                    style={{
                                                        width:
                                                            `${percentage}%`
                                                    }}
                                                />

                                            </div>


                                            <div className="dashboard-subject-meta">

                                                <span>

                                                    {
                                                        subject.completed_topics
                                                    }

                                                    {" "}completed

                                                </span>


                                                <span>

                                                    {
                                                        subject.remaining_topics
                                                    }

                                                    {" "}remaining

                                                </span>

                                            </div>


                                            <button
                                                className="dashboard-secondary-button"
                                                onClick={() =>
                                                    navigate(
                                                        `/subjects/${subject.subject_id}`
                                                    )
                                                }
                                            >
                                                Open Subject
                                            </button>

                                        </div>

                                    );
                                }
                            )}

                        </div>

                    </section>

                )}


                {/* ================================================= */}
                {/* ADAPTIVE LEARNING */}
                {/* ================================================= */}

                <section className="dashboard-section">

                    <p className="dashboard-section-label">
                        ADAPTIVE LEARNING
                    </p>


                    <h2 className="dashboard-section-title">
                        Improve Weak Areas
                    </h2>


                    <p className="dashboard-section-description">

                        StudyBuddy uses your test
                        performance to identify what
                        needs more attention.

                    </p>


                    <div className="dashboard-tool-grid">


                        {/* REVISION CENTRE */}

                        <div className="dashboard-tool-card">

                            <div className="dashboard-tool-icon">
                                ↻
                            </div>


                            <h3>
                                Revision Centre
                            </h3>


                            <p>

                                Review weak topics,
                                complete scheduled
                                revisions and improve
                                your mastery.

                            </p>


                            <div className="dashboard-adaptive-stats">

                                <span>

                                    <strong>
                                        {
                                            Number(
                                                revisionSummary
                                                    .due_today ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Due Today

                                </span>


                                <span>

                                    <strong>
                                        {
                                            Number(
                                                revisionSummary
                                                    .overdue ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Overdue

                                </span>


                                <span>

                                    <strong>
                                        {
                                            Number(
                                                revisionSummary
                                                    .pending ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Pending

                                </span>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/revisions"
                                    )
                                }
                            >
                                Open Revision Centre
                            </button>

                        </div>


                        {/* MISTAKE BANK */}

                        <div className="dashboard-tool-card">

                            <div className="dashboard-tool-icon">
                                ✕
                            </div>


                            <h3>
                                Mistake Bank
                            </h3>


                            <p>

                                Revisit incorrect test
                                answers, understand your
                                errors and review the
                                correct explanations.

                            </p>


                            <div className="dashboard-adaptive-stats">

                                <span>

                                    <strong>
                                        {
                                            Number(
                                                mistakeSummary
                                                    .total_mistakes ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Mistakes

                                </span>


                                <span>

                                    <strong>
                                        {
                                            Number(
                                                mistakeSummary
                                                    .affected_topics ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Topics

                                </span>


                                <span>

                                    <strong>
                                        {
                                            Number(
                                                mistakeSummary
                                                    .affected_subjects ||
                                                0
                                            )
                                        }
                                    </strong>

                                    Subjects

                                </span>

                            </div>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/mistakes"
                                    )
                                }
                            >
                                Open Mistake Bank
                            </button>

                        </div>

                    </div>

                </section>


                {/* ================================================= */}
                {/* STUDY TOOLS */}
                {/* ================================================= */}

                <section className="dashboard-section dashboard-bottom-section">

                    <p className="dashboard-section-label">
                        LEARNING
                    </p>


                    <h2 className="dashboard-section-title">
                        Study Tools
                    </h2>


                    <div className="dashboard-tool-grid">


                        {/* SUBJECTS */}

                        <div className="dashboard-tool-card">

                            <div className="dashboard-tool-icon">
                                ▤
                            </div>


                            <h3>
                                My Subjects
                            </h3>


                            <p>

                                Manage subjects,
                                chapters, topics and
                                study materials.

                            </p>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/subjects"
                                    )
                                }
                            >
                                View Subjects
                            </button>

                        </div>


                        {/* EXAM PLANNER */}

                        <div className="dashboard-tool-card">

                            <div className="dashboard-tool-icon">
                                ▦
                            </div>


                            <h3>
                                Exam Planner
                            </h3>


                            <p>

                                {
                                    loadingExams
                                        ? "Loading your exam timetable..."

                                        : upcomingExams.length ===
                                            0
                                            ? "No upcoming exams yet. Add your exam timetable."

                                            : `${upcomingExams.length} upcoming ${
                                                upcomingExams.length ===
                                                1
                                                    ? "exam"
                                                    : "exams"
                                            }. ${
                                                nearestExam
                                                    ? `Next: ${nearestExam.exam_name} on ${formatDate(
                                                        nearestExam.exam_date
                                                    )}.`
                                                    : ""
                                            }`
                                }

                            </p>


                            <button
                                className="dashboard-primary-button"
                                onClick={() =>
                                    navigate(
                                        "/exam-planner"
                                    )
                                }
                            >
                                Open Exam Planner
                            </button>

                        </div>


                        {/* AI STUDY PLAN */}

                        <div className="dashboard-tool-card">

                            <div className="dashboard-tool-icon">
                                ✦
                            </div>


                            <h3>
                                AI Study Plan
                            </h3>


                            <p>

                                {
                                    activePlan

                                        ? `${activePlanCompletedTasks} of ${activePlanTotalTasks} tasks completed — ${activePlanPercentage}% of your active master plan.`

                                        : "Generate a personalized master study timetable from your upcoming exams."
                                }

                            </p>


                            <button
                                className={
                                    activePlan
                                        ? "dashboard-primary-button"
                                        : "dashboard-secondary-button"
                                }
                                onClick={() => {

                                    if (
                                        activePlan
                                    ) {

                                        navigate(
                                            `/study-plans/${activePlan.id}`
                                        );


                                    } else {

                                        navigate(
                                            "/exam-planner"
                                        );
                                    }
                                }}
                            >

                                {
                                    activePlan
                                        ? "Open Study Plan"
                                        : "Create Study Plan"
                                }

                            </button>

                        </div>

                    </div>

                </section>

            </div>

        </main>
    );
}


export default Dashboard;