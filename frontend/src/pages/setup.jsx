import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import StudyBuddyLoader from "../components/StudyBuddyLoader";

function Setup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        current_semester: "",
        academic_year: "",
        preferred_study_time: "",
        preferred_session_minutes: 60,
        study_days_per_week: 5,
        exam_date: "",
        learning_goal: "",
        difficulty_preference: "adaptive"
    });

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState("");

    const token =
        localStorage.getItem("token") ||
        sessionStorage.getItem("token");

    useEffect(() => {
        const fetchSetup = async () => {
            try {
                const response = await api.get("/api/setup", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.profile) {
                    const profile = response.data.profile;

                    if (profile.setup_completed) {
                        navigate("/dashboard");
                        return;
                    }

                    setFormData({
                        current_semester: profile.current_semester || "",
                        academic_year: profile.academic_year || "",
                        preferred_study_time: profile.preferred_study_time || "",
                        preferred_session_minutes:
                            profile.preferred_session_minutes || 60,
                        study_days_per_week:
                            profile.study_days_per_week || 5,
                        exam_date: profile.exam_date
                            ? profile.exam_date.substring(0, 10)
                            : "",
                        learning_goal: profile.learning_goal || "",
                        difficulty_preference:
                            profile.difficulty_preference || "adaptive"
                    });
                }
            } catch (error) {
                console.error("Setup fetch error:", error);
                setMessage("Unable to load your setup information.");
            } finally {
                setFetching(false);
            }
        };

        if (!token) {
            navigate("/login");
            return;
        }

        fetchSetup();
    }, [navigate, token]);

    const handleChange = (e) => {
        setFormData((previous) => ({
            ...previous,
            [e.target.name]: e.target.value
        }));
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            await api.put(
                "/api/setup",
                {
                    current_semester: formData.current_semester,
                    academic_year: formData.academic_year,
                    preferred_study_time: formData.preferred_study_time,
                    preferred_session_minutes: Number(
                        formData.preferred_session_minutes
                    ),
                    study_days_per_week: Number(
                        formData.study_days_per_week
                    ),
                    exam_date: formData.exam_date || null,
                    learning_goal: formData.learning_goal,
                    difficulty_preference:
                        formData.difficulty_preference,
                    setup_completed: true
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            navigate("/dashboard");
        } catch (error) {
            console.error("Setup save error:", error);
            setMessage(
                error.response?.data?.message ||
                "Unable to save your setup."
            );
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <StudyBuddyLoader
                title="Preparing your profile"
                text="StudyBuddy is loading your learning preferences."
            />
        );
    }

    return (
        <main className="setup-page">
            <section className="setup-card">
                <header className="setup-header">
                    <div className="setup-logo">✦</div>
                    <h1>
                        StudyBuddy <span>AI</span>
                    </h1>
                    <h2>Set Up Your Learning Profile</h2>
                    <p>
                        Tell StudyBuddy how you prefer to study so your
                        learning experience can be personalized around you.
                    </p>
                </header>

                <form className="setup-form" onSubmit={handleSubmit}>
                    <div className="setup-field">
                        <label>Current Semester</label>
                        <input
                            type="text"
                            name="current_semester"
                            value={formData.current_semester}
                            onChange={handleChange}
                            placeholder="Example: Semester 5"
                        />
                    </div>

                    <div className="setup-field">
                        <label>Academic Year</label>
                        <input
                            type="text"
                            name="academic_year"
                            value={formData.academic_year}
                            onChange={handleChange}
                            placeholder="Example: 2026-27"
                        />
                    </div>

                    <div className="setup-field">
                        <label>Preferred Study Time</label>
                        <select
                            name="preferred_study_time"
                            value={formData.preferred_study_time}
                            onChange={handleChange}
                        >
                            <option value="">Select preferred time</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                            <option value="evening">Evening</option>
                            <option value="night">Night</option>
                        </select>
                    </div>

                    <div className="setup-field">
                        <label>Preferred Study Session (minutes)</label>
                        <input
                            type="number"
                            name="preferred_session_minutes"
                            value={formData.preferred_session_minutes}
                            onChange={handleChange}
                            min="15"
                            max="480"
                            step="15"
                        />
                    </div>

                    <div className="setup-field">
                        <label>Study Days Per Week</label>
                        <input
                            type="number"
                            name="study_days_per_week"
                            value={formData.study_days_per_week}
                            onChange={handleChange}
                            min="1"
                            max="7"
                        />
                    </div>

                    <div className="setup-field">
                        <label>Exam Date</label>
                        <input
                            type="date"
                            name="exam_date"
                            value={formData.exam_date}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="setup-field setup-full">
                        <label>Learning Goal</label>
                        <textarea
                            name="learning_goal"
                            value={formData.learning_goal}
                            onChange={handleChange}
                            placeholder="Example: Complete my syllabus before exams and improve weak topics."
                            rows="4"
                        />
                    </div>

                    <div className="setup-field setup-full">
                        <label>Difficulty Preference</label>
                        <select
                            name="difficulty_preference"
                            value={formData.difficulty_preference}
                            onChange={handleChange}
                        >
                            <option value="adaptive">Adaptive</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {message && (
                        <div className="setup-error">{message}</div>
                    )}

                    <button
                        type="submit"
                        className="setup-submit"
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "Continue to Dashboard →"}
                    </button>
                </form>
            </section>
        </main>
    );
}

export default Setup;
