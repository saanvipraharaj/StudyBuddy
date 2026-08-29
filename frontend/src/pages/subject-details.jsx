import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../services/api";


function SubjectDetails() {

    const { id } =
        useParams();

    const navigate =
        useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [subject, setSubject] =
        useState(null);

    const [chapters, setChapters] =
        useState([]);

    const [chapterName, setChapterName] =
        useState("");

    const [chapterDescription, setChapterDescription] =
        useState("");

    const [chapterNumber, setChapterNumber] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [deletingChapterId, setDeletingChapterId] =
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
    // FETCH SUBJECT
    // ============================================

    const fetchSubject = async () => {

        try {

            const response =
                await api.get(
                    `/api/subjects/${id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setSubject(
                response.data.subject ||
                response.data
            );


        } catch (error) {

            console.error(
                "Fetch subject error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to load subject."
            );

            setMessageType(
                "error"
            );
        }
    };


    // ============================================
    // FETCH CHAPTERS
    // ============================================

    const fetchChapters = async () => {

        try {

            const response =
                await api.get(
                    `/api/chapters/subject/${id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setChapters(
                response.data.chapters ||
                []
            );


        } catch (error) {

            console.error(
                "Fetch chapters error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to load chapters."
            );

            setMessageType(
                "error"
            );
        }
    };


    // ============================================
    // LOAD
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


                await Promise.all([
                    fetchSubject(),
                    fetchChapters()
                ]);


                setLoading(
                    false
                );
            };


        loadPage();

    }, [id]);


    // ============================================
    // ADD CHAPTER
    // ============================================

    const handleAddChapter = async (
        event
    ) => {

        event.preventDefault();


        if (
            !chapterName.trim() ||
            !chapterNumber
        ) {

            setMessage(
                "Chapter name and chapter number are required."
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


            const response =
                await api.post(
                    "/api/chapters",
                    {
                        subject_id:
                            Number(id),

                        name:
                            chapterName.trim(),

                        description:
                            chapterDescription.trim(),

                        chapter_number:
                            Number(
                                chapterNumber
                            )
                    },
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setMessage(
                response.data.message ||
                "Chapter added successfully."
            );

            setMessageType(
                "success"
            );


            setChapterName("");
            setChapterDescription("");
            setChapterNumber("");


            await fetchChapters();


        } catch (error) {

            console.error(
                "Add chapter error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to add chapter."
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
    // DELETE CHAPTER
    // ============================================

    const handleDeleteChapter = async (
        chapter
    ) => {

        const confirmed =
            window.confirm(
                `Delete "${chapter.name}"?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setDeletingChapterId(
                chapter.id
            );


            await api.delete(
                `/api/chapters/${chapter.id}`,
                {
                    headers:
                        getAuthHeaders()
                }
            );


            setMessage(
                "Chapter deleted successfully."
            );

            setMessageType(
                "success"
            );


            await fetchChapters();


        } catch (error) {

            console.error(
                "Delete chapter error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                "Unable to delete chapter."
            );

            setMessageType(
                "error"
            );


        } finally {

            setDeletingChapterId(
                null
            );
        }
    };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (
            <main className="subject-details-page">

                <div className="subject-details-loading">
                    Loading subject...
                </div>

            </main>
        );
    }


    // ============================================
    // PAGE
    // ============================================

    return (

        <main className="subject-details-page">

            <div className="subject-details-shell">


                {/* ================================= */}
                {/* TOP NAV */}
                {/* ================================= */}

                <div className="subject-details-top-nav">

                    <button
                        type="button"
                        className="subject-details-back-button"
                        onClick={() =>
                            navigate(
                                "/subjects"
                            )
                        }
                    >
                        ← Back to Subjects
                    </button>


                    <button
                        type="button"
                        className="subject-details-dashboard-button"
                        onClick={() =>
                            navigate(
                                "/dashboard"
                            )
                        }
                    >
                        Dashboard
                    </button>

                </div>


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <header className="subject-details-header">

                    <div className="subject-details-header-icon">
                        ▤
                    </div>


                    <div>

                        <p className="subject-details-eyebrow">
                            SUBJECT
                        </p>


                        <h1>
                            {
                                subject?.name ||
                                "Subject"
                            }
                        </h1>


                        <p>
                            {
                                subject?.description ||
                                "Manage chapters, topics and study materials for this subject."
                            }
                        </p>

                    </div>

                </header>


                {/* ================================= */}
                {/* MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div
                        className={
                            messageType === "error"
                                ? "subject-details-message subject-details-message-error"
                                : "subject-details-message subject-details-message-success"
                        }
                    >
                        {message}
                    </div>

                )}


                {/* ================================= */}
                {/* ADD CHAPTER */}
                {/* ================================= */}

                <section className="subject-details-card subject-details-add-card">

                    <div className="subject-details-card-top-line" />


                    <div className="subject-details-section-heading">

                        <div>

                            <p className="subject-details-section-label">
                                NEW CHAPTER
                            </p>

                            <h2>
                                Add Chapter
                            </h2>

                            <p>
                                Build your subject chapter
                                by chapter.
                            </p>

                        </div>


                        <div className="subject-details-section-icon">
                            ＋
                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleAddChapter
                        }
                    >

                        <div className="subject-details-form-grid">


                            <div className="subject-details-field">

                                <label>
                                    Chapter Name
                                </label>

                                <input
                                    type="text"
                                    placeholder="Example: Introduction to Machine Learning"
                                    value={
                                        chapterName
                                    }
                                    onChange={(event) =>
                                        setChapterName(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="subject-details-field">

                                <label>
                                    Chapter Number
                                </label>

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Example: 1"
                                    value={
                                        chapterNumber
                                    }
                                    onChange={(event) =>
                                        setChapterNumber(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="subject-details-field subject-details-full-field">

                                <label>
                                    Chapter Description
                                </label>

                                <textarea
                                    placeholder="Optional description..."
                                    value={
                                        chapterDescription
                                    }
                                    onChange={(event) =>
                                        setChapterDescription(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="subject-details-primary-button"
                            disabled={
                                saving
                            }
                        >
                            {saving
                                ? "Adding Chapter..."
                                : "＋ Add Chapter"}
                        </button>

                    </form>

                </section>


                {/* ================================= */}
                {/* CHAPTERS */}
                {/* ================================= */}

                <section className="subject-details-chapters-section">

                    <div className="subject-details-section-title-row">

                        <div>

                            <p className="subject-details-section-label">
                                CONTENT
                            </p>

                            <h2>
                                Chapters
                            </h2>

                            <p>
                                Open a chapter to manage
                                its study materials and topics.
                            </p>

                        </div>


                        <div className="subject-details-count">

                            {chapters.length}

                            <span>
                                Chapters
                            </span>

                        </div>

                    </div>


                    {chapters.length === 0 ? (

                        <div className="subject-details-card subject-details-empty-card">

                            <div className="subject-details-empty-icon">
                                ▤
                            </div>


                            <h3>
                                No chapters yet
                            </h3>


                            <p>
                                Add your first chapter above
                                to begin organizing this subject.
                            </p>

                        </div>

                    ) : (

                        <div className="subject-details-chapter-grid">

                            {chapters.map(
                                (
                                    chapter,
                                    index
                                ) => {

                                    const deleting =
                                        Number(
                                            deletingChapterId
                                        ) ===
                                        Number(
                                            chapter.id
                                        );


                                    return (

                                        <article
                                            className="subject-details-card subject-details-chapter-card"
                                            key={
                                                chapter.id
                                            }
                                        >

                                            <div className="subject-details-card-top-line" />


                                            <div className="subject-details-chapter-top">

                                                <div className="subject-details-chapter-number">

                                                    CHAPTER{" "}

                                                    {
                                                        chapter.chapter_number ||
                                                        index + 1
                                                    }

                                                </div>


                                                <div className="subject-details-chapter-icon">
                                                    ▤
                                                </div>

                                            </div>


                                            <div className="subject-details-chapter-content">

                                                <h3>
                                                    {
                                                        chapter.name
                                                    }
                                                </h3>


                                                <p>
                                                    {
                                                        chapter.description ||
                                                        "No description added for this chapter."
                                                    }
                                                </p>

                                            </div>


                                            <div className="subject-details-divider" />


                                            <div className="subject-details-chapter-actions">

                                                <button
                                                    type="button"
                                                    className="subject-details-primary-button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/chapters/${chapter.id}`
                                                        )
                                                    }
                                                >
                                                    Open Chapter
                                                </button>


                                                <button
                                                    type="button"
                                                    className="subject-details-delete-button"
                                                    disabled={
                                                        deleting
                                                    }
                                                    onClick={() =>
                                                        handleDeleteChapter(
                                                            chapter
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


export default SubjectDetails;