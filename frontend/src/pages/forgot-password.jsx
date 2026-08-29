import {
    useState
} from "react";

import {
    Link
} from "react-router-dom";

import api from "../services/api";


function ForgotPassword() {

    const [email, setEmail] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [resetUrl, setResetUrl] =
        useState("");


    // ============================================
    // SUBMIT
    // ============================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            setMessage("");
            setMessageType("");
            setResetUrl("");


            if (!email.trim()) {

                setMessage(
                    "Please enter your email address."
                );

                setMessageType(
                    "error"
                );

                return;
            }


            try {

                setLoading(
                    true
                );


                const response =
                    await api.post(
                        "/api/password/forgot-password",
                        {
                            email:
                                email
                                    .trim()
                                    .toLowerCase()
                        }
                    );


                setMessage(
                    response.data.message ||
                    "If an account exists, a password reset link has been sent."
                );


                setMessageType(
                    "success"
                );


                if (
                    response.data.reset_url
                ) {

                    setResetUrl(
                        response.data.reset_url
                    );
                }


            } catch (error) {

                console.error(
                    "Forgot password error:",
                    error
                );


                setMessage(
                    error.response?.data?.message ||
                    "Unable to process your request."
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


    return (

        <main className="auth-page exact-forgot-page">

            <section className="exact-forgot-card">


                {/* ================================= */}
                {/* TOP GLOW */}
                {/* ================================= */}

                <div className="exact-forgot-top-line" />

                <div className="exact-forgot-glow" />


                {/* ================================= */}
                {/* LOGO */}
                {/* ================================= */}

                <div className="exact-forgot-logo">
                    ✦
                </div>


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div className="exact-forgot-header">

                    <h1>
                        StudyBuddy <span>AI</span>
                    </h1>


                    <h2>
                        Forgot your password?
                    </h2>


                    <p>
                        Enter the email linked to your
                        StudyBuddy account and we&apos;ll
                        send you a reset link.
                    </p>

                </div>


                {/* ================================= */}
                {/* MESSAGE */}
                {/* ================================= */}

                {message && (

                    <div
                        className={
                            messageType ===
                            "success"
                                ? "exact-forgot-message exact-forgot-success"
                                : "exact-forgot-message exact-forgot-error"
                        }
                    >

                        <span className="exact-forgot-message-icon">

                            {
                                messageType ===
                                "success"
                                    ? "✓"
                                    : "!"
                            }

                        </span>


                        <span>
                            {message}
                        </span>

                    </div>

                )}


                {/* ================================= */}
                {/* FORM */}
                {/* ================================= */}

                <form
                    className="exact-forgot-form"
                    onSubmit={
                        handleSubmit
                    }
                >

                    <div className="exact-forgot-field">

                        <label>

                            <span className="exact-forgot-field-icon">
                                ✉
                            </span>

                            Email address

                        </label>


                        <input
                            type="email"
                            value={
                                email
                            }
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="exact-forgot-submit"
                        disabled={
                            loading
                        }
                    >

                        {
                            loading
                                ? "Sending reset link..."
                                : "Send Reset Link"
                        }

                    </button>

                </form>


                {/* ================================= */}
                {/* DEVELOPMENT RESET URL */}
                {/* ================================= */}

                {resetUrl && (

                    <div className="exact-forgot-dev-link">

                        <span className="exact-forgot-dev-label">
                            DEVELOPMENT RESET LINK
                        </span>


                        <a
                            href={
                                resetUrl
                            }
                        >
                            {
                                resetUrl
                            }
                        </a>


                        <p>
                            This appears only during
                            development.
                        </p>

                    </div>

                )}


                {/* ================================= */}
                {/* FOOTER */}
                {/* ================================= */}

                <p className="exact-forgot-footer">

                    Remember your password?{" "}

                    <Link to="/login">
                        Back to Login
                    </Link>

                </p>

            </section>

        </main>
    );
}


export default ForgotPassword;