import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";


function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");


    const handleRegister = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");

        if (
            !name.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {
            setMessage("Please complete all fields.");
            setMessageType("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            setMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/api/auth/register",
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password
                }
            );

            setMessage(
                response.data.message ||
                "Account created successfully."
            );

            setMessageType("success");

            if (response.data.token) {
                localStorage.setItem(
                    "token",
                    response.data.token
                );
            }

            if (response.data.user) {
                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data.user)
                );
            }

            if (response.data.token) {
                navigate("/setup");
            }

        } catch (error) {
            console.error(
                "Register error:",
                error
            );

            setMessage(
                error.response?.data?.message ||
                "Unable to create your account."
            );

            setMessageType("error");

        } finally {
            setLoading(false);
        }
    };


    const handleGoogleRegister = () => {
        window.location.href =
            "http://localhost:5000/api/auth/google";
    };


    return (
        <main className="auth-page exact-register-page">

            <section className="exact-register-card">

                <div className="exact-register-top-line" />

                <div className="exact-register-logo">
                    ✦
                </div>

                <div className="exact-register-header">
                    <h1>
                        StudyBuddy <span>AI</span>
                    </h1>

                    <h2>
                        Create your account
                    </h2>

                    <p>
                        Build smarter study plans around your exams,
                        progress and performance.
                    </p>
                </div>


                {message && (
                    <div
                        className={
                            messageType === "success"
                                ? "sb-success"
                                : "sb-error"
                        }
                    >
                        {message}
                    </div>
                )}


                <button
                    type="button"
                    className="exact-google-button"
                    onClick={handleGoogleRegister}
                >
                    <span className="exact-google-icon">
                        G
                    </span>

                    <span>
                        Continue with Google
                    </span>
                </button>


                <div className="exact-divider">
                    <span />
                    <p>OR</p>
                    <span />
                </div>


                <form
                    className="exact-register-form"
                    onSubmit={handleRegister}
                >

                    <div className="exact-field">
                        <label>
                            <span className="exact-field-icon">
                                ♙
                            </span>

                            Name
                        </label>

                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            autoComplete="name"
                        />
                    </div>


                    <div className="exact-field">
                        <label>
                            <span className="exact-field-icon">
                                ✉
                            </span>

                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            autoComplete="email"
                        />
                    </div>


                    <div className="exact-field">
                        <label>
                            <span className="exact-field-icon">
                                ♙
                            </span>

                            Password
                        </label>

                        <div className="exact-password-wrap">
                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Create a password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>
                        </div>
                    </div>


                    <div className="exact-field">
                        <label>
                            <span className="exact-field-icon">
                                ♙
                            </span>

                            Confirm Password
                        </label>

                        <div className="exact-password-wrap">
                            <input
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Repeat your password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >
                                {showConfirmPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>
                        </div>
                    </div>


                    <button
                        type="submit"
                        className="exact-register-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>

                </form>


                <p className="exact-register-login">
                    Already have an account?{" "}
                    <Link to="/login">
                        Log in
                    </Link>
                </p>

            </section>

        </main>
    );
}


export default Register;