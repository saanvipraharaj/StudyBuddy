import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function ExamPlanner() {

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [subjects, setSubjects] =
        useState([]);

    const [exams, setExams] =
        useState([]);


    const [subjectId, setSubjectId] =
        useState("");

    const [examName, setExamName] =
        useState("");

    const [examDate, setExamDate] =
        useState("");

    const [examTime, setExamTime] =
        useState("");

    const [examType, setExamType] =
        useState("");

    const [customExamType, setCustomExamType] =
        useState("");

    const [priority, setPriority] =
        useState("medium");

    const [notes, setNotes] =
        useState("");


    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [
        generatingPlanExamId,
        setGeneratingPlanExamId
    ] = useState(null);


    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");


    // ============================================
    // USER
    // ============================================

    const user =
        JSON.parse(
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "null"
        );


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
    // EXAM TYPE DISPLAY NAME
    // ============================================

    const getExamTypeLabel = (
        type,
        customType = null
    ) => {

        switch (type) {

            case "internal":

                return "Internal Exam";


            case "practical":

                return "Practical Exam";


            case "external_midterm":

                return "External Midterm Exam";


            case "external_endterm":

                return "External Endterm Exam";


            case "other":

                return (
                    customType ||
                    "Other Exam"
                );


            default:

                return (
                    type ||
                    "Exam"
                );
        }
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


        return String(
            value
        ).slice(
            0,
            10
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
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    };


    const getDaysLeft = (
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


        const examDateObject =
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


        examDateObject.setHours(
            0,
            0,
            0,
            0
        );


        return Math.ceil(
            (
                examDateObject.getTime() -
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
    // FETCH SUBJECTS
    // ============================================

    const fetchSubjects =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/subjects",
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setSubjects(
                    response.data.subjects ||
                    []
                );


            } catch (error) {

                console.error(
                    "Fetch subjects error:",
                    error
                );
            }
        };


    // ============================================
    // FETCH EXAMS
    // ============================================

    const fetchExams =
        async () => {

            try {

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


                setMessage(
                    error.response?.data?.message ||
                    "Unable to load your exams."
                );


                setMessageType(
                    "error"
                );
            }
        };


    // ============================================
    // LOAD PAGE
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
                        fetchSubjects(),
                        fetchExams()
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
    // ADD EXAM
    // ============================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            // ========================================
            // REQUIRED FIELDS
            // ========================================

            if (
                !subjectId ||
                !examName.trim() ||
                !examDate ||
                !examType
            ) {

                setMessage(
                    "Subject, exam name, exam date and exam type are required."
                );


                setMessageType(
                    "error"
                );


                return;
            }


            // ========================================
            // CUSTOM TYPE REQUIRED FOR OTHER
            // ========================================

            if (
                examType === "other" &&
                !customExamType.trim()
            ) {

                setMessage(
                    "Please enter your exam type."
                );


                setMessageType(
                    "error"
                );


                return;
            }


            // ========================================
            // CHECK DATE
            // ========================================

            const daysLeft =
                getDaysLeft(
                    examDate
                );


            if (
                daysLeft !== null &&
                daysLeft < 0
            ) {

                setMessage(
                    "Exam date cannot be in the past."
                );


                setMessageType(
                    "error"
                );


                return;
            }


            try {

                setSaving(
                    true
                );


                setMessage(
                    ""
                );


                // ====================================
                // CREATE EXAM
                // ====================================

                const response =
                    await api.post(
                        "/api/exams",
                        {
                            subject_id:
                                Number(
                                    subjectId
                                ),

                            exam_name:
                                examName.trim(),

                            exam_date:
                                examDate,

                            exam_time:
                                examTime ||
                                null,

                            // IMPORTANT:
                            // canonical backend value
                            exam_type:
                                examType,

                            custom_exam_type:
                                examType === "other"
                                    ? customExamType.trim()
                                    : null,

                            priority:
                                priority,

                            notes:
                                notes.trim() ||
                                null
                        },
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "Exam added successfully."
                );


                setMessageType(
                    "success"
                );


                // ====================================
                // RESET FORM
                // ====================================

                setSubjectId(
                    ""
                );

                setExamName(
                    ""
                );

                setExamDate(
                    ""
                );

                setExamTime(
                    ""
                );

                setExamType(
                    ""
                );

                setCustomExamType(
                    ""
                );

                setPriority(
                    "medium"
                );

                setNotes(
                    ""
                );


                await fetchExams();


            } catch (error) {

                console.error(
                    "Create exam error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to add exam."
                );


                setMessageType(
                    "error"
                );


            } finally {

                setSaving(
                    false
                );
            }
        };


    // ============================================
    // DELETE EXAM
    // ============================================

    const handleDelete =
        async (exam) => {

            const confirmed =
                window.confirm(
                    `Delete "${exam.exam_name}"?`
                );


            if (!confirmed) {

                return;
            }


            try {

                await api.delete(
                    `/api/exams/${exam.id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


                setMessage(
                    "Exam deleted successfully."
                );


                setMessageType(
                    "success"
                );


                await fetchExams();


            } catch (error) {

                console.error(
                    "Delete exam error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to delete exam."
                );


                setMessageType(
                    "error"
                );
            }
        };


    // ============================================
    // GENERATE MASTER STUDY PLAN
    // ============================================

    const handleGenerateStudyPlan =
        async (exam) => {

            // ========================================
            // VALIDATE EXAM GROUP
            // ========================================

            const groupId =
                Number(
                    exam.exam_group_id
                );


            if (
                !Number.isFinite(
                    groupId
                ) ||
                groupId <= 0
            ) {

                setMessage(
                    "This exam is not connected to a valid exam group."
                );


                setMessageType(
                    "error"
                );


                return;
            }


            // ========================================
            // VALIDATE UPCOMING EXAM
            // ========================================

            const daysLeft =
                getDaysLeft(
                    exam.exam_date
                );


            if (
                daysLeft === null ||
                daysLeft <= 0
            ) {

                setMessage(
                    "Study plans can only be generated for upcoming exams."
                );


                setMessageType(
                    "error"
                );


                return;
            }


            try {

                setGeneratingPlanExamId(
                    exam.id
                );


                setMessage(
                    "StudyBuddy is creating your master AI study plan..."
                );


                setMessageType(
                    "success"
                );


                // ====================================
                // STUDY HOURS
                // ====================================

                const studyHours =
                    Number(
                        user
                            ?.study_hours_per_day
                    ) || 2;


                // ====================================
                // GENERATE PLAN USING EXAM GROUP ID
                // ====================================

                const response =
                    await api.post(
                        `/api/study-plans/generate/${groupId}`,
                        {
                            study_hours_per_day:
                                studyHours
                        },
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                const studyPlan =
                    response.data
                        .study_plan;


                if (
                    !studyPlan?.id
                ) {

                    throw new Error(
                        "Study plan ID was not returned."
                    );
                }


                navigate(
                    `/study-plans/${studyPlan.id}`
                );


            } catch (error) {

                console.error(
                    "Generate master plan error:",
                    error
                );


                // ====================================
                // ACTIVE PLAN ALREADY EXISTS
                // ====================================

                if (
                    error.response?.status ===
                        409 &&
                    error.response?.data
                        ?.study_plan_id
                ) {

                    navigate(
                        `/study-plans/${
                            error.response
                                .data
                                .study_plan_id
                        }`
                    );


                    return;
                }


                setMessage(
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to generate study plan."
                );


                setMessageType(
                    "error"
                );


            } finally {

                setGeneratingPlanExamId(
                    null
                );
            }
        };


    // ============================================
    // GROUP EXAMS
    // ============================================

    const groupedExams =
        useMemo(
            () => {

                const groups =
                    new Map();


                exams.forEach(
                    (exam) => {

                        const key =
                            exam.exam_group_id
                                ? `group-${exam.exam_group_id}`
                                : (
                                    `${exam.exam_type || "other"}-` +
                                    `${exam.exam_name || "exam"}`
                                );


                        if (
                            !groups.has(
                                key
                            )
                        ) {

                            groups.set(
                                key,
                                {
                                    id:
                                        exam.exam_group_id ||
                                        key,

                                    name:
                                        exam.group_name ||
                                        getExamTypeLabel(
                                            exam.exam_type,
                                            exam.custom_exam_type
                                        ),

                                    examType:
                                        getExamTypeLabel(
                                            exam.exam_type,
                                            exam.custom_exam_type
                                        ),

                                    exams:
                                        []
                                }
                            );
                        }


                        groups
                            .get(
                                key
                            )
                            .exams
                            .push(
                                exam
                            );
                    }
                );


                return Array.from(
                    groups.values()
                );

            },
            [exams]
        );


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <main className="planner-page">

                <div className="planner-loading">

                    Loading Exam Planner...

                </div>

            </main>
        );
    }


    // ============================================
    // PAGE
    // ============================================

    return (

        <main className="planner-page">

            <div className="planner-shell">


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <header className="planner-header">

                    <button
                        type="button"
                        className="planner-back-button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>


                    <div className="planner-heading">

                        <div className="planner-heading-icon">

                            ▦

                        </div>


                        <div>

                            <p className="planner-eyebrow">

                                EXAM MANAGEMENT

                            </p>


                            <h1>

                                Exam{" "}

                                <span>
                                    Planner
                                </span>

                            </h1>


                            <p>

                                Add your exam subjects
                                and let StudyBuddy
                                organize your preparation
                                into an intelligent
                                timetable.

                            </p>

                        </div>

                    </div>

                </header>


                {/* ================================= */}
                {/* MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div
                        className={
                            messageType ===
                            "error"
                                ? "planner-message planner-message-error"
                                : "planner-message planner-message-success"
                        }
                    >

                        {message}

                    </div>

                )}


                {/* ================================= */}
                {/* ADD EXAM */}
                {/* ================================= */}

                <section className="planner-card planner-add-card">

                    <div className="planner-card-top-line" />


                    <div className="planner-section-heading">

                        <div>

                            <p className="planner-section-label">

                                NEW EXAM

                            </p>


                            <h2>

                                Add Exam

                            </h2>


                            <p>

                                Enter your exam
                                information below.

                            </p>

                        </div>


                        <div className="planner-section-icon">

                            ＋

                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleSubmit
                        }
                    >

                        <div className="planner-form-grid">


                            {/* SUBJECT */}

                            <div className="planner-field">

                                <label>

                                    Subject

                                </label>


                                <select
                                    value={
                                        subjectId
                                    }
                                    onChange={(event) =>
                                        setSubjectId(
                                            event.target
                                                .value
                                        )
                                    }
                                >

                                    <option value="">

                                        Select Subject

                                    </option>


                                    {subjects.map(
                                        (
                                            subject
                                        ) => (

                                            <option
                                                value={
                                                    subject.id
                                                }
                                                key={
                                                    subject.id
                                                }
                                            >

                                                {
                                                    subject.name
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* EXAM NAME */}

                            <div className="planner-field">

                                <label>

                                    Exam Name

                                </label>


                                <input
                                    type="text"
                                    placeholder="Example: Semester 5 Internal"
                                    value={
                                        examName
                                    }
                                    onChange={(event) =>
                                        setExamName(
                                            event.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* DATE */}

                            <div className="planner-field">

                                <label>

                                    Exam Date

                                </label>


                                <input
                                    type="date"
                                    value={
                                        examDate
                                    }
                                    onChange={(event) =>
                                        setExamDate(
                                            event.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* TIME */}

                            <div className="planner-field">

                                <label>

                                    Exam Time

                                </label>


                                <input
                                    type="time"
                                    value={
                                        examTime
                                    }
                                    onChange={(event) =>
                                        setExamTime(
                                            event.target
                                                .value
                                        )
                                    }
                                />

                            </div>


                            {/* ================================= */}
                            {/* EXAM TYPE */}
                            {/* ================================= */}

                            <div className="planner-field">

                                <label>

                                    Exam Type

                                </label>


                                <select
                                    value={
                                        examType
                                    }
                                    onChange={(event) => {

                                        const value =
                                            event.target
                                                .value;


                                        setExamType(
                                            value
                                        );


                                        if (
                                            value !==
                                            "other"
                                        ) {

                                            setCustomExamType(
                                                ""
                                            );
                                        }
                                    }}
                                >

                                    <option value="">

                                        Select Exam Type

                                    </option>


                                    <option value="internal">

                                        Internal Exam

                                    </option>


                                    <option value="practical">

                                        Practical Exam

                                    </option>


                                    <option value="external_midterm">

                                        External (Midterm) Exam

                                    </option>


                                    <option value="external_endterm">

                                        External (Endterm) Exam

                                    </option>


                                    <option value="other">

                                        Other

                                    </option>

                                </select>

                            </div>


                            {/* PRIORITY */}

                            <div className="planner-field">

                                <label>

                                    Priority

                                </label>


                                <select
                                    value={
                                        priority
                                    }
                                    onChange={(event) =>
                                        setPriority(
                                            event.target
                                                .value
                                        )
                                    }
                                >

                                    <option value="low">

                                        Low

                                    </option>


                                    <option value="medium">

                                        Medium

                                    </option>


                                    <option value="high">

                                        High

                                    </option>

                                </select>

                            </div>


                            {/* CUSTOM TYPE */}

                            {examType ===
                                "other" && (

                                <div className="planner-field planner-full-field">

                                    <label>

                                        Custom Exam Type

                                    </label>


                                    <input
                                        type="text"
                                        placeholder="Example: Viva, Class Test, Presentation"
                                        value={
                                            customExamType
                                        }
                                        onChange={(event) =>
                                            setCustomExamType(
                                                event.target
                                                    .value
                                            )
                                        }
                                    />

                                </div>

                            )}

                        </div>


                        {/* NOTES */}

                        <div className="planner-field planner-notes-field">

                            <label>

                                Notes

                            </label>


                            <textarea
                                placeholder="Optional exam notes..."
                                value={
                                    notes
                                }
                                onChange={(event) =>
                                    setNotes(
                                        event.target
                                            .value
                                    )
                                }
                            />

                        </div>


                        <button
                            type="submit"
                            className="planner-primary-button"
                            disabled={
                                saving
                            }
                        >

                            {
                                saving
                                    ? "Adding Exam..."
                                    : "＋ Add Exam"
                            }

                        </button>

                    </form>

                </section>


                {/* ================================= */}
                {/* EXAM GROUPS */}
                {/* ================================= */}

                <section className="planner-groups-section">

                    <div className="planner-section-title-row">

                        <div>

                            <p className="planner-section-label">

                                TIMETABLE

                            </p>


                            <h2>

                                Exam Groups

                            </h2>


                            <p>

                                Related exams appear
                                together so StudyBuddy
                                can plan around all of
                                your subjects.

                            </p>

                        </div>


                        <div className="planner-count">

                            {exams.length}

                            <span>

                                {
                                    exams.length ===
                                    1
                                        ? "Exam"
                                        : "Exams"
                                }

                            </span>

                        </div>

                    </div>


                    {groupedExams.length ===
                    0 ? (

                        <div className="planner-card planner-empty">

                            <div className="planner-empty-icon">

                                ▦

                            </div>


                            <h3>

                                No exam groups yet

                            </h3>


                            <p>

                                Add your first exam
                                above to begin building
                                your timetable.

                            </p>

                        </div>

                    ) : (

                        <div className="planner-group-list">

                            {groupedExams.map(
                                (
                                    group
                                ) => (

                                    <div
                                        className="planner-card planner-group-card"
                                        key={
                                            group.id
                                        }
                                    >

                                        <div className="planner-card-top-line" />


                                        {/* GROUP HEADER */}

                                        <div className="planner-group-header">

                                            <div>

                                                <span className="planner-group-type">

                                                    {
                                                        group.examType
                                                    }

                                                </span>


                                                <h3>

                                                    {
                                                        group.name
                                                    }

                                                </h3>


                                                <p>

                                                    {
                                                        group
                                                            .exams
                                                            .length
                                                    }

                                                    {" "}

                                                    subject

                                                    {
                                                        group
                                                            .exams
                                                            .length ===
                                                        1
                                                            ? ""
                                                            : "s"
                                                    }

                                                    {" "}

                                                    in this
                                                    exam group

                                                </p>

                                            </div>


                                            <div className="planner-group-icon">

                                                ✦

                                            </div>

                                        </div>


                                        {/* EXAM CARDS */}

                                        <div className="planner-exam-grid">

                                            {group.exams.map(
                                                (
                                                    exam
                                                ) => {

                                                    const daysLeft =
                                                        getDaysLeft(
                                                            exam.exam_date
                                                        );


                                                    const generating =
                                                        Number(
                                                            generatingPlanExamId
                                                        ) ===
                                                        Number(
                                                            exam.id
                                                        );


                                                    return (

                                                        <article
                                                            className="planner-exam-card"
                                                            key={
                                                                exam.id
                                                            }
                                                        >

                                                            {/* TOP */}

                                                            <div className="planner-exam-top">

                                                                <div>

                                                                    <span className="planner-subject-name">

                                                                        {
                                                                            exam.subject_name
                                                                        }

                                                                    </span>


                                                                    <h4>

                                                                        {
                                                                            exam.exam_name
                                                                        }

                                                                    </h4>

                                                                </div>


                                                                <span
                                                                    className={
                                                                        `planner-priority planner-priority-${
                                                                            exam.priority ||
                                                                            "medium"
                                                                        }`
                                                                    }
                                                                >

                                                                    {
                                                                        exam.priority ||
                                                                        "medium"
                                                                    }

                                                                </span>

                                                            </div>


                                                            {/* EXAM TYPE */}

                                                            <div className="planner-exam-type-label">

                                                                {
                                                                    exam.exam_type_display ||
                                                                    getExamTypeLabel(
                                                                        exam.exam_type,
                                                                        exam.custom_exam_type
                                                                    )
                                                                }

                                                            </div>


                                                            {/* DETAILS */}

                                                            <div className="planner-exam-details">

                                                                <span>

                                                                    ◷{" "}

                                                                    {
                                                                        formatDate(
                                                                            exam.exam_date
                                                                        )
                                                                    }

                                                                </span>


                                                                {exam.exam_time && (

                                                                    <span>

                                                                        ◉{" "}

                                                                        {
                                                                            String(
                                                                                exam.exam_time
                                                                            ).slice(
                                                                                0,
                                                                                5
                                                                            )
                                                                        }

                                                                    </span>

                                                                )}

                                                            </div>


                                                            {/* DAYS LEFT */}

                                                            <div className="planner-days-left">

                                                                {
                                                                    daysLeft ===
                                                                    null
                                                                        ? "Date unavailable"

                                                                        : daysLeft >
                                                                            1
                                                                            ? `${daysLeft} days remaining`

                                                                            : daysLeft ===
                                                                                1
                                                                                ? "Exam tomorrow"

                                                                                : daysLeft ===
                                                                                    0
                                                                                    ? "Exam today"

                                                                                    : "Exam completed"
                                                                }

                                                            </div>


                                                            {/* NOTES */}

                                                            {exam.notes && (

                                                                <p className="planner-exam-notes">

                                                                    {
                                                                        exam.notes
                                                                    }

                                                                </p>

                                                            )}


                                                            {/* ACTIONS */}

                                                            <div className="planner-exam-actions">

                                                                {daysLeft !==
                                                                    null &&
                                                                daysLeft >
                                                                    0 && (

                                                                    <button
                                                                        type="button"
                                                                        className="planner-primary-button"
                                                                        disabled={
                                                                            generating
                                                                        }
                                                                        onClick={() =>
                                                                            handleGenerateStudyPlan(
                                                                                exam
                                                                            )
                                                                        }
                                                                    >

                                                                        {
                                                                            generating
                                                                                ? "Creating..."
                                                                                : "✦ Generate Master Plan"
                                                                        }

                                                                    </button>

                                                                )}


                                                                <button
                                                                    type="button"
                                                                    className="planner-delete-button"
                                                                    disabled={
                                                                        generating
                                                                    }
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            exam
                                                                        )
                                                                    }
                                                                >

                                                                    Delete

                                                                </button>

                                                            </div>

                                                        </article>

                                                    );
                                                }
                                            )}

                                        </div>

                                    </div>

                                )
                            )}

                        </div>

                    )}

                </section>

            </div>

        </main>
    );
}


export default ExamPlanner;