import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import api from "../services/api";


function ChapterDetails() {

    const { id } = useParams();
    const navigate = useNavigate();


    // ============================================
    // STATE
    // ============================================

    const [chapter, setChapter] = useState(null);

    const [materials, setMaterials] = useState([]);

    const [topics, setTopics] = useState([]);

    const [materialTitle, setMaterialTitle] =
        useState("");

    const [selectedFile, setSelectedFile] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [uploading, setUploading] =
        useState(false);

    const [generatingTopics, setGeneratingTopics] =
        useState(false);

    const [
        deletingMaterialId,
        setDeletingMaterialId
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
    // FETCH CHAPTER
    // ============================================

    const fetchChapter = async () => {

        try {

            const response =
                await api.get(
                    `/api/chapters/${id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setChapter(
                response.data.chapter ||
                response.data
            );

        } catch (error) {

            console.error(
                "Fetch chapter error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to load chapter."
            );

            setMessageType("error");
        }
    };


    // ============================================
    // FETCH MATERIALS
    // ============================================

    const fetchMaterials = async () => {

        try {

            const response =
                await api.get(
                    `/api/materials/chapter/${id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setMaterials(
                response.data.materials ||
                []
            );

        } catch (error) {

            console.error(
                "Fetch materials error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to load study materials."
            );

            setMessageType("error");
        }
    };


    // ============================================
    // FETCH GENERATED TOPICS
    // ============================================

    const fetchTopics = async () => {

        try {

            const response =
                await api.get(
                    `/api/topics/chapter/${id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


            setTopics(
                response.data.topics ||
                []
            );

        } catch (error) {

            console.error(
                "Fetch topics error:",
                error
            );

            setTopics([]);
        }
    };


    // ============================================
    // LOAD PAGE
    // ============================================

    useEffect(
        () => {

            const loadPage =
                async () => {

                    if (!getToken()) {

                        navigate("/login");

                        return;
                    }


                    setLoading(true);


                    await Promise.all([
                        fetchChapter(),
                        fetchMaterials(),
                        fetchTopics()
                    ]);


                    setLoading(false);
                };


            loadPage();

        },
        [id]
    );


    // ============================================
    // SELECT FILE
    // ============================================

    const handleFileChange =
        (event) => {

            const file =
                event.target.files?.[0] ||
                null;


            if (!file) {

                setSelectedFile(null);

                return;
            }


            // PDF ONLY

            if (
                file.type !==
                "application/pdf"
            ) {

                setMessage(
                    "Only PDF files are allowed."
                );

                setMessageType("error");

                event.target.value = "";

                setSelectedFile(null);

                return;
            }


            // MAXIMUM 15 MB

            const maxSize =
                15 *
                1024 *
                1024;


            if (file.size > maxSize) {

                setMessage(
                    "PDF must be smaller than 15 MB."
                );

                setMessageType("error");

                event.target.value = "";

                setSelectedFile(null);

                return;
            }


            setSelectedFile(file);


            if (!materialTitle.trim()) {

                const defaultTitle =
                    file.name.replace(
                        /\.pdf$/i,
                        ""
                    );


                setMaterialTitle(
                    defaultTitle
                );
            }


            setMessage("");
        };


    // ============================================
    // UPLOAD PDF
    // ============================================

    const handleUploadMaterial =
        async (event) => {

            event.preventDefault();


            if (!selectedFile) {

                setMessage(
                    "Please select a PDF file."
                );

                setMessageType("error");

                return;
            }


            try {

                setUploading(true);

                setMessage(
                    "Uploading and processing your PDF..."
                );

                setMessageType("success");


                const formData =
                    new FormData();


                formData.append(
                    "chapter_id",
                    id
                );


                if (materialTitle.trim()) {

                    formData.append(
                        "title",
                        materialTitle.trim()
                    );
                }


                formData.append(
                    "file",
                    selectedFile
                );


                const response =
                    await api.post(
                        "/api/materials/upload",
                        formData,
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "PDF uploaded successfully."
                );

                setMessageType("success");


                setMaterialTitle("");

                setSelectedFile(null);


                const fileInput =
                    document.getElementById(
                        "chapter-material-file"
                    );


                if (fileInput) {

                    fileInput.value = "";
                }


                await fetchMaterials();

            } catch (error) {

                console.error(
                    "Upload material error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to upload study material."
                );

                setMessageType("error");

            } finally {

                setUploading(false);
            }
        };


    // ============================================
    // DELETE MATERIAL
    // ============================================

    const handleDeleteMaterial =
        async (material) => {

            const confirmed =
                window.confirm(
                    `Delete "${material.title}"?`
                );


            if (!confirmed) {

                return;
            }


            try {

                setDeletingMaterialId(
                    material.id
                );


                await api.delete(
                    `/api/materials/${material.id}`,
                    {
                        headers:
                            getAuthHeaders()
                    }
                );


                setMessage(
                    "Study material deleted successfully."
                );

                setMessageType("success");


                await fetchMaterials();

            } catch (error) {

                console.error(
                    "Delete material error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to delete study material."
                );

                setMessageType("error");

            } finally {

                setDeletingMaterialId(null);
            }
        };


    // ============================================
    // GENERATE TOPICS
    // ============================================

    const handleGenerateTopics =
        async () => {

            if (materials.length === 0) {

                setMessage(
                    "Upload at least one PDF before generating topics."
                );

                setMessageType("error");

                return;
            }


            const usableMaterials =
                materials.filter(
                    (material) =>
                        material.extracted_text &&
                        String(
                            material.extracted_text
                        ).trim()
                );


            if (usableMaterials.length === 0) {

                setMessage(
                    "No readable text was extracted from your PDFs. Try uploading a PDF containing selectable text."
                );

                setMessageType("error");

                return;
            }


            const confirmed =
                window.confirm(
                    topics.length > 0
                        ? "Topics already exist for this chapter. Generate topics again?"
                        : "Generate AI topics using all PDFs uploaded for this chapter?"
                );


            if (!confirmed) {

                return;
            }


            try {

                setGeneratingTopics(true);

                setMessage(
                    "StudyBuddy is analyzing all uploaded materials and generating topics..."
                );

                setMessageType("success");


                const response =
                    await api.post(
                        `/api/topics/generate/${id}`,
                        {},
                        {
                            headers:
                                getAuthHeaders()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "Topics generated successfully."
                );

                setMessageType("success");


                await fetchTopics();

            } catch (error) {

                console.error(
                    "Generate topics error:",
                    error
                );


                if (
                    error.response?.status ===
                    409
                ) {

                    await fetchTopics();

                    setMessage(
                        error.response?.data?.message ||
                        "Topics already exist for this chapter."
                    );

                    setMessageType("success");

                    return;
                }


                setMessage(
                    error.response?.data?.message ||
                    "Unable to generate topics."
                );

                setMessageType("error");

            } finally {

                setGeneratingTopics(false);
            }
        };


    // ============================================
    // OPEN PDF
    // ============================================

    const handleOpenPdf =
        (material) => {

            if (!material.file_url) {

                setMessage(
                    "PDF URL is unavailable."
                );

                setMessageType("error");

                return;
            }


            const baseUrl =
                api.defaults.baseURL ||
                "http://localhost:5000";


            const cleanBaseUrl =
                String(baseUrl).replace(
                    /\/$/,
                    ""
                );


            const cleanFileUrl =
                String(
                    material.file_url
                ).startsWith("/")
                    ? material.file_url
                    : `/${material.file_url}`;


            window.open(
                `${cleanBaseUrl}${cleanFileUrl}`,
                "_blank",
                "noopener,noreferrer"
            );
        };


    // ============================================
    // FORMAT DATE
    // ============================================

    const formatDate =
        (value) => {

            if (!value) {

                return "";
            }


            const date =
                new Date(value);


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
    // FILE NAME
    // ============================================

    const getFileName =
        (material) => {

            return (
                material.file_name ||
                "PDF document"
            );
        };


    // ============================================
    // TOPIC UNLOCKING
    // ============================================

    const isTopicUnlocked =
        (topic, index) => {

            /*
                Topic 1 must always be available.

                Every later topic depends on the
                backend is_active value.

                This prevents the UI from making
                every generated topic clickable.
            */

            if (index === 0) {

                return true;
            }


            return (
                topic.is_active === true ||
                topic.is_active === 1 ||
                topic.is_active === "true"
            );
        };


    // ============================================
    // LOADING
    // ============================================

    if (loading) {

        return (

            <main className="chapter-page">

                <div className="chapter-loading">

                    Loading chapter...

                </div>

            </main>
        );
    }


    // ============================================
    // PAGE
    // ============================================

    return (

        <main className="chapter-page">

            <div className="chapter-shell">


                {/* ================================= */}
                {/* NAVIGATION */}
                {/* ================================= */}

                <div className="chapter-top-nav">

                    <button
                        type="button"
                        className="chapter-secondary-button"
                        onClick={() => {

                            if (
                                chapter?.subject_id
                            ) {

                                navigate(
                                    `/subjects/${chapter.subject_id}`
                                );

                            } else {

                                navigate(
                                    "/subjects"
                                );
                            }
                        }}
                    >

                        ← Back to Subject

                    </button>


                    <button
                        type="button"
                        className="chapter-secondary-button"
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
                {/* CHAPTER HEADER */}
                {/* ================================= */}

                <header className="chapter-header">

                    <div className="chapter-header-icon">

                        ▤

                    </div>


                    <div>

                        <p className="chapter-eyebrow">

                            CHAPTER{" "}

                            {
                                chapter?.chapter_number ||
                                ""
                            }

                        </p>


                        <h1>

                            {
                                chapter?.name ||
                                "Chapter"
                            }

                        </h1>


                        <p>

                            {
                                chapter?.description ||
                                "Upload your study material and let StudyBuddy create your personalized learning path."
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
                            messageType ===
                            "error"
                                ? "chapter-message chapter-message-error"
                                : "chapter-message chapter-message-success"
                        }
                    >

                        {message}

                    </div>

                )}


                {/* ================================= */}
                {/* UPLOAD PDF */}
                {/* ================================= */}

                <section className="chapter-card chapter-upload-card">

                    <div className="chapter-card-top-line" />


                    <div className="chapter-section-heading">

                        <div>

                            <p className="chapter-section-label">

                                STUDY MATERIAL

                            </p>


                            <h2>

                                Add Study Material

                            </h2>


                            <p>

                                Upload one or more PDFs.
                                StudyBuddy will combine all
                                readable material when
                                generating topics.

                            </p>

                        </div>


                        <div className="chapter-section-icon">

                            ↑

                        </div>

                    </div>


                    <form
                        onSubmit={
                            handleUploadMaterial
                        }
                    >

                        <div className="chapter-upload-grid">


                            {/* MATERIAL TITLE */}

                            <div className="chapter-field">

                                <label>

                                    Material Title

                                </label>


                                <input
                                    type="text"
                                    placeholder="Example: Unit 1 Lecture Notes"
                                    value={
                                        materialTitle
                                    }
                                    onChange={(event) =>
                                        setMaterialTitle(
                                            event.target.value
                                        )
                                    }
                                />

                            </div>


                            {/* PDF */}

                            <div className="chapter-field">

                                <label>

                                    PDF File

                                </label>


                                <label className="chapter-file-picker">

                                    <span className="chapter-file-icon">

                                        PDF

                                    </span>


                                    <span className="chapter-file-content">

                                        <strong>

                                            {
                                                selectedFile
                                                    ? selectedFile.name
                                                    : "Choose a PDF file"
                                            }

                                        </strong>


                                        <small>

                                            {
                                                selectedFile
                                                    ? `${(
                                                        selectedFile.size /
                                                        (
                                                            1024 *
                                                            1024
                                                        )
                                                    ).toFixed(2)} MB selected`
                                                    : "PDF only • Maximum 15 MB"
                                            }

                                        </small>

                                    </span>


                                    <span className="chapter-file-action">

                                        Browse

                                    </span>


                                    <input
                                        id="chapter-material-file"
                                        type="file"
                                        accept="application/pdf,.pdf"
                                        onChange={
                                            handleFileChange
                                        }
                                    />

                                </label>

                            </div>

                        </div>


                        <button
                            type="submit"
                            className="chapter-primary-button"
                            disabled={
                                uploading
                            }
                            style={{
                                display:
                                    "block",

                                width:
                                    "220px",

                                margin:
                                    "20px auto 0"
                            }}
                        >

                            {
                                uploading
                                    ? "Uploading PDF..."
                                    : "↑ Upload PDF"
                            }

                        </button>

                    </form>

                </section>


                {/* ================================= */}
                {/* MATERIAL LIST */}
                {/* ================================= */}

                <section className="chapter-materials-section">

                    <div className="chapter-list-heading">

                        <div>

                            <p className="chapter-section-label">

                                LIBRARY

                            </p>


                            <h2>

                                Study Materials

                            </h2>


                            <p>

                                Every PDF listed here belongs
                                to this chapter.

                            </p>

                        </div>


                        <div className="chapter-material-count">

                            {materials.length}

                            <span>

                                {
                                    materials.length ===
                                    1
                                        ? "File"
                                        : "Files"
                                }

                            </span>

                        </div>

                    </div>


                    {materials.length === 0 ? (

                        <div className="chapter-card chapter-empty-card">

                            <div className="chapter-empty-icon">

                                PDF

                            </div>


                            <h3>

                                No study materials yet

                            </h3>


                            <p>

                                Upload your first PDF above.
                                You can upload multiple PDFs
                                to the same chapter.

                            </p>

                        </div>

                    ) : (

                        <div className="chapter-material-grid">

                            {materials.map(
                                (
                                    material,
                                    index
                                ) => {

                                    const deleting =
                                        Number(
                                            deletingMaterialId
                                        ) ===
                                        Number(
                                            material.id
                                        );


                                    const hasExtractedText =
                                        Boolean(
                                            material.extracted_text &&
                                            String(
                                                material.extracted_text
                                            ).trim()
                                        );


                                    return (

                                        <article
                                            key={
                                                material.id
                                            }
                                            className="chapter-card chapter-material-card"
                                        >

                                            <div className="chapter-card-top-line" />


                                            <div className="chapter-material-top">

                                                <div className="chapter-material-number">

                                                    {
                                                        String(
                                                            index + 1
                                                        ).padStart(
                                                            2,
                                                            "0"
                                                        )
                                                    }

                                                </div>


                                                <div className="chapter-pdf-icon">

                                                    PDF

                                                </div>

                                            </div>


                                            <div className="chapter-material-content">

                                                <span>

                                                    STUDY MATERIAL

                                                </span>


                                                <h3>

                                                    {
                                                        material.title ||
                                                        "Study Material"
                                                    }

                                                </h3>


                                                <p
                                                    title={
                                                        getFileName(
                                                            material
                                                        )
                                                    }
                                                >

                                                    {
                                                        getFileName(
                                                            material
                                                        )
                                                    }

                                                </p>


                                                {material.uploaded_at && (

                                                    <small>

                                                        Uploaded{" "}

                                                        {
                                                            formatDate(
                                                                material.uploaded_at
                                                            )
                                                        }

                                                    </small>

                                                )}


                                                <div
                                                    style={{
                                                        marginTop:
                                                            "12px",

                                                        fontSize:
                                                            "10px",

                                                        color:
                                                            hasExtractedText
                                                                ? "#F7A3C8"
                                                                : "#B7889D"
                                                    }}
                                                >

                                                    {
                                                        hasExtractedText
                                                            ? "✓ Text extracted and ready for AI"
                                                            : "No readable text extracted"
                                                    }

                                                </div>

                                            </div>


                                            <div className="chapter-material-divider" />


                                            <div className="chapter-material-actions">

                                                <button
                                                    type="button"
                                                    className="chapter-primary-button"
                                                    onClick={() =>
                                                        handleOpenPdf(
                                                            material
                                                        )
                                                    }
                                                >

                                                    View PDF

                                                </button>


                                                <button
                                                    type="button"
                                                    className="chapter-delete-button"
                                                    disabled={
                                                        deleting
                                                    }
                                                    onClick={() =>
                                                        handleDeleteMaterial(
                                                            material
                                                        )
                                                    }
                                                >

                                                    {
                                                        deleting
                                                            ? "Deleting..."
                                                            : "Delete"
                                                    }

                                                </button>

                                            </div>

                                        </article>

                                    );
                                }
                            )}

                        </div>

                    )}

                </section>


                {/* ================================= */}
                {/* AI GENERATION */}
                {/* ================================= */}

                <section className="chapter-ai-card">

                    <div className="chapter-ai-glow" />


                    <div className="chapter-ai-icon">

                        ✦

                    </div>


                    <div className="chapter-ai-content">

                        <p className="chapter-section-label">

                            STUDYBUDDY AI

                        </p>


                        <h2>

                            Generate Learning Topics

                        </h2>


                        <p>

                            StudyBuddy analyzes the
                            extracted text from all PDFs
                            in this chapter, removes
                            duplicate ideas and creates
                            an ordered learning path.

                        </p>


                        {materials.length > 0 && (

                            <p
                                style={{
                                    marginTop:
                                        "10px",

                                    color:
                                        "#F7A3C8",

                                    fontSize:
                                        "11px"
                                }}
                            >

                                {
                                    materials.filter(
                                        (material) =>
                                            material.extracted_text &&
                                            String(
                                                material.extracted_text
                                            ).trim()
                                    ).length
                                }

                                {" / "}

                                {materials.length}

                                {" "}PDFs contain readable text.

                            </p>

                        )}

                    </div>


                    <button
                        type="button"
                        className="chapter-primary-button chapter-generate-button"
                        disabled={
                            generatingTopics ||
                            materials.length === 0
                        }
                        onClick={
                            handleGenerateTopics
                        }
                    >

                        {
                            generatingTopics
                                ? "Analyzing Materials..."
                                : topics.length > 0
                                    ? "✦ Regenerate Topics"
                                    : "✦ Generate Topics"
                        }

                    </button>

                </section>


                {/* ================================= */}
                {/* GENERATED TOPICS */}
                {/* ================================= */}

                <section className="chapter-topics-section">

                    <div className="chapter-list-heading">

                        <div>

                            <p className="chapter-section-label">

                                AI LEARNING PATH

                            </p>


                            <h2>

                                Generated Topics

                            </h2>


                            <p>

                                Study topics in order.
                                Complete each topic and its
                                mandatory test to unlock
                                the next one.

                            </p>

                        </div>


                        <div className="chapter-material-count">

                            {topics.length}

                            <span>

                                {
                                    topics.length === 1
                                        ? "Topic"
                                        : "Topics"
                                }

                            </span>

                        </div>

                    </div>


                    {topics.length === 0 ? (

                        <div className="chapter-card chapter-empty-card">

                            <div className="chapter-empty-icon">

                                ✦

                            </div>


                            <h3>

                                No topics generated yet

                            </h3>


                            <p>

                                Upload your chapter PDFs
                                and click Generate Topics
                                above.

                            </p>

                        </div>

                    ) : (

                        <div className="chapter-topic-grid">

                            {topics.map(
                                (
                                    topic,
                                    index
                                ) => {

                                    const unlocked =
                                        isTopicUnlocked(
                                            topic,
                                            index
                                        );


                                    return (

                                        <article
                                            key={
                                                topic.id
                                            }
                                            className={
                                                unlocked
                                                    ? "chapter-card chapter-topic-card"
                                                    : "chapter-card chapter-topic-card chapter-topic-locked"
                                            }
                                        >

                                            <div className="chapter-card-top-line" />


                                            {/* TOP */}

                                            <div className="chapter-topic-top">

                                                <span className="chapter-topic-number">

                                                    TOPIC{" "}

                                                    {
                                                        topic.topic_number ||
                                                        index + 1
                                                    }

                                                </span>


                                                <div
                                                    className={
                                                        unlocked
                                                            ? "chapter-topic-icon"
                                                            : "chapter-topic-icon chapter-topic-icon-locked"
                                                    }
                                                >

                                                    {
                                                        unlocked
                                                            ? "✦"
                                                            : "🔒"
                                                    }

                                                </div>

                                            </div>


                                            {/* CONTENT */}

                                            <div className="chapter-topic-content">

                                                <h3>

                                                    {
                                                        topic.name ||
                                                        "Topic"
                                                    }

                                                </h3>


                                                <p>

                                                    {
                                                        topic.description ||
                                                        "AI-generated learning topic."
                                                    }

                                                </p>


                                                {/* META */}

                                                <div className="chapter-topic-meta">

                                                    <div className="chapter-topic-meta-item">

                                                        <span className="chapter-meta-icon">

                                                            ◷

                                                        </span>


                                                        <span>

                                                            {
                                                                topic.estimated_minutes ||
                                                                30
                                                            } min

                                                        </span>

                                                    </div>


                                                    <span className="chapter-meta-divider">

                                                        •

                                                    </span>


                                                    <div
                                                        className={
                                                            unlocked
                                                                ? "chapter-topic-status chapter-topic-status-active"
                                                                : "chapter-topic-status chapter-topic-status-locked"
                                                        }
                                                    >

                                                        {
                                                            unlocked
                                                                ? "Unlocked"
                                                                : "Locked"
                                                        }

                                                    </div>

                                                </div>

                                            </div>


                                            <div className="chapter-material-divider" />


                                            {/* BUTTON */}

                                            <button
                                                type="button"
                                                className={
                                                    unlocked
                                                        ? "chapter-primary-button chapter-open-topic-button"
                                                        : "chapter-locked-topic-button"
                                                }
                                                disabled={
                                                    !unlocked
                                                }
                                                onClick={() => {

                                                    if (
                                                        !unlocked
                                                    ) {

                                                        return;
                                                    }


                                                    navigate(
                                                        `/topics/${topic.id}`
                                                    );
                                                }}
                                            >

                                                {
                                                    unlocked
                                                        ? "Open Topic →"
                                                        : "🔒 Complete Previous Topic"
                                                }

                                            </button>

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


export default ChapterDetails;