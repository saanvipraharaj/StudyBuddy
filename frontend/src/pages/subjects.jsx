import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";


function Subjects() {

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [subjects, setSubjects] =
        useState([]);

    const [subjectName, setSubjectName] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deletingId, setDeletingId] =
        useState(null);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");


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
    // FETCH SUBJECTS
    // ============================================

    const fetchSubjects =
        async () => {

            try {

                setLoading(true);


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


                setMessage(
                    error.response?.data?.message ||
                    "Unable to load subjects."
                );

                setMessageType(
                    "error"
                );


            } finally {

                setLoading(false);
            }
        };


    // ============================================
    // LOAD PAGE
    // ============================================

    useEffect(
        () => {

            if (!getToken()) {

                navigate(
                    "/login"
                );

                return;
            }


            fetchSubjects();

        },
        []
    );


    // ============================================
    // ADD SUBJECT
    // ============================================

    const handleAddSubject =
        async (event) => {

            event.preventDefault();


            if (
                !subjectName.trim()
            ) {

                setMessage(
                    "Please enter a subject name."
                );

                setMessageType(
                    "error"
                );

                return;
            }


            try {

                setSaving(true);

                setMessage("");


                const response =
                    await api.post(
                        "/api/subjects",
                        {
                            name:
                                subjectName.trim()
                        },
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "Subject added successfully."
                );

                setMessageType(
                    "success"
                );


                setSubjectName("");


                await fetchSubjects();


            } catch (error) {

                console.error(
                    "Add subject error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to add subject."
                );

                setMessageType(
                    "error"
                );


            } finally {

                setSaving(false);
            }
        };


    // ============================================
    // DELETE SUBJECT
    // ============================================

    const handleDeleteSubject =
        async (subject) => {

            const confirmed =
                window.confirm(
                    `Delete "${subject.name}"? This may also remove related chapters, topics and study material depending on your backend rules.`
                );


            if (!confirmed) {
                return;
            }


            try {

                setDeletingId(
                    subject.id
                );


                await api.delete(
                    `/api/subjects/${subject.id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


                setMessage(
                    "Subject deleted successfully."
                );

                setMessageType(
                    "success"
                );


                await fetchSubjects();


            } catch (error) {

                console.error(
                    "Delete subject error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to delete subject."
                );

                setMessageType(
                    "error"
                );


            } finally {

                setDeletingId(
                    null
                );
            }
        };


    // ============================================
    // PAGE
    // ============================================

    return (

        <main className="subjects-page">

            <div className="subjects-shell">


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <header className="subjects-header">

                    <button
                        type="button"
                        className="subjects-back-button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        ← Dashboard
                    </button>


                    <div className="subjects-heading">

                        <div className="subjects-heading-icon">
                            ▤
                        </div>


                        <div>

                            <p className="subjects-eyebrow">
                                LEARNING LIBRARY
                            </p>

                            <h1>
                                My <span>Subjects</span>
                            </h1>

                            <p>
                                Organize your courses,
                                chapters, topics and study
                                materials in one place.
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
                            messageType === "error"
                                ? "subjects-message subjects-message-error"
                                : "subjects-message subjects-message-success"
                        }
                    >
                        {message}
                    </div>

                )}


                {/* ================================= */}
                {/* ADD SUBJECT */}
                {/* ================================= */}

                <section className="subjects-card subjects-add-card">

                    <div className="subjects-card-top-line" />


                    <div className="subjects-section-heading">

                        <div>

                            <p className="subjects-section-label">
                                NEW SUBJECT
                            </p>

                            <h2>
                                Add Subject
                            </h2>

                            <p>
                                Create a subject before
                                adding chapters, PDFs and
                                topics.
                            </p>

                        </div>


                        <div className="subjects-section-icon">
                            ＋
                        </div>

                    </div>


                    <form
                        className="subjects-add-form"
                        onSubmit={
                            handleAddSubject
                        }
                    >

                        <div className="subjects-field">

                            <label>
                                Subject Name
                            </label>

                            <input
                                type="text"
                                placeholder="Example: Natural Language Processing"
                                value={
                                    subjectName
                                }
                                onChange={(event) =>
                                    setSubjectName(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <button
                            type="submit"
                            className="subjects-primary-button"
                            disabled={
                                saving
                            }
                        >
                            {saving
                                ? "Adding Subject..."
                                : "＋ Add Subject"}
                        </button>

                    </form>

                </section>


                {/* ================================= */}
                {/* SUBJECT LIST HEADER */}
                {/* ================================= */}

                <section className="subjects-list-section">

                    <div className="subjects-section-title-row">

                        <div>

                            <p className="subjects-section-label">
                                YOUR LIBRARY
                            </p>

                            <h2>
                                Subjects
                            </h2>

                            <p>
                                Open a subject to manage
                                its chapters, topics and
                                learning material.
                            </p>

                        </div>


                        <div className="subjects-count">

                            {subjects.length}

                            <span>
                                Subjects
                            </span>

                        </div>

                    </div>


                    {/* ================================= */}
                    {/* LOADING */}
                    {/* ================================= */}

                    {loading ? (

                        <div className="subjects-card subjects-loading-card">
                            Loading your subjects...
                        </div>

                    ) : subjects.length === 0 ? (

                        /* ================================= */
                        /* EMPTY */
                        /* ================================= */

                        <div className="subjects-card subjects-empty-card">

                            <div className="subjects-empty-icon">
                                ▤
                            </div>

                            <h3>
                                No subjects yet
                            </h3>

                            <p>
                                Add your first subject above
                                to begin building your
                                StudyBuddy learning library.
                            </p>

                        </div>

                    ) : (

                        /* ================================= */
                        /* SUBJECT GRID */
                        /* ================================= */

                        <div className="subjects-grid">

                            {subjects.map(
                                (
                                    subject,
                                    index
                                ) => {

                                    const deleting =
                                        Number(
                                            deletingId
                                        ) ===
                                        Number(
                                            subject.id
                                        );


                                    return (

                                        <article
                                            className="subjects-card subjects-subject-card"
                                            key={
                                                subject.id
                                            }
                                        >

                                            <div className="subjects-card-top-line" />


                                            <div className="subjects-subject-card-top">

                                                <div className="subjects-subject-number">
                                                    {
                                                        String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )
                                                    }
                                                </div>


                                                <div className="subjects-subject-icon">
                                                    ▤
                                                </div>

                                            </div>


                                            <div className="subjects-subject-content">

                                                <p className="subjects-subject-label">
                                                    SUBJECT
                                                </p>


                                                <h3>
                                                    {
                                                        subject.name
                                                    }
                                                </h3>


                                                <p>
                                                    Manage chapters,
                                                    topics, uploaded
                                                    study materials,
                                                    tests and progress.
                                                </p>

                                            </div>


                                            <div className="subjects-subject-divider" />


                                            <div className="subjects-subject-actions">

                                                <button
                                                    type="button"
                                                    className="subjects-primary-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/subjects/${subject.id}`
                                                        )
                                                    }
                                                >
                                                    Open Subject
                                                </button>


                                                <button
                                                    type="button"
                                                    className="subjects-delete-button"
                                                    disabled={
                                                        deleting
                                                    }
                                                    onClick={() =>
                                                        handleDeleteSubject(
                                                            subject
                                                        )
                                                    }
                                                >
                                                    {deleting
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>

                                            </div>

                                        </article>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>

            </div>

        </main>
    );
}


export default Subjects;