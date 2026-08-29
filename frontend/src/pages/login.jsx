import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";


function Login() {
    const navigate = useNavigate();

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [rememberMe, setRememberMe] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");


    // ============================================
    // LOGIN
    // ============================================

    const handleLogin = async (event) => {
        event.preventDefault();

        setMessage("");
        setMessageType("");


        if (
            !email.trim() ||
            !password
        ) {
            setMessage(
                "Please enter your email and password."
            );

            setMessageType(
                "error"
            );

            return;
        }


        try {
            setLoading(true);


            const response =
                await api.post(
                    "/api/auth/login",
                    {
                        email:
                            email
                                .trim()
                                .toLowerCase(),

                        password
                    }
                );


            const token =
                response.data.token;

            const user =
                response.data.user;


            if (!token) {
                throw new Error(
                    "Authentication token was not returned."
                );
            }


            if (rememberMe) {
                localStorage.setItem(
                    "token",
                    token
                );

                if (user) {
                    localStorage.setItem(
                        "user",
                        JSON.stringify(user)
                    );
                }

                sessionStorage.removeItem(
                    "token"
                );

                sessionStorage.removeItem(
                    "user"
                );

            } else {
                sessionStorage.setItem(
                    "token",
                    token
                );

                if (user) {
                    sessionStorage.setItem(
                        "user",
                        JSON.stringify(user)
                    );
                }

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );
            }


            setMessage(
                response.data.message ||
                "Login successful."
            );

            setMessageType(
                "success"
            );


            /*
                If your backend returns
                setup_completed, this will send
                unfinished users to setup.
            */

            if (
                user &&
                user.setup_completed === false
            ) {
                navigate(
                    "/setup"
                );
            } else {
                navigate(
                    "/dashboard"
                );
            }


        } catch (error) {
            console.error(
                "Login error:",
                error
            );


            setMessage(
                error.response?.data?.message ||
                error.message ||
                "Unable to log in."
            );

            setMessageType(
                "error"
            );


        } finally {
            setLoading(false);
        }
    };


    // ============================================
    // GOOGLE LOGIN
    // ============================================

    const handleGoogleLogin = () => {
        window.location.href =
            "http://localhost:5000/api/auth/google";
    };


    // ============================================
    // PAGE
    // ============================================

    return (
        <main className="auth-page exact-login-page">

            <section className="exact-login-card">

                <div className="exact-login-top-line" />


                {/* ================================= */}
                {/* LOGO */}
                {/* ================================= */}

                <div className="exact-login-logo">
                    ✦
                </div>


                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div className="exact-login-header">

                    <h1>
                        StudyBuddy <span>AI</span>
                    </h1>

                    <h2>
                        Welcome back
                    </h2>

                    <p>
                        Continue your personalized
                        learning journey.
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
                                ? "sb-success"
                                : "sb-error"
                        }
                    >
                        {message}
                    </div>
                )}


                {/* ================================= */}
                {/* GOOGLE */}
                {/* ================================= */}

                <button
                    type="button"
                    className="exact-login-google-button"
                    onClick={
                        handleGoogleLogin
                    }
                >

                    <span className="exact-login-google-icon">
                        G
                    </span>

                    <span>
                        Continue with Google
                    </span>

                </button>


                {/* ================================= */}
                {/* DIVIDER */}
                {/* ================================= */}

                <div className="exact-login-divider">

                    <span />

                    <p>
                        OR
                    </p>

                    <span />

                </div>


                {/* ================================= */}
                {/* FORM */}
                {/* ================================= */}

                <form
                    className="exact-login-form"
                    onSubmit={
                        handleLogin
                    }
                >


                    {/* EMAIL */}

                    <div className="exact-login-field">

                        <label>
                            <span className="exact-login-field-icon">
                                ✉
                            </span>

                            Email
                        </label>

                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={
                                email
                            }
                            onChange={(event) =>
                                setEmail(
                                    event.target.value
                                )
                            }
                            autoComplete="email"
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="exact-login-field">

                        <label>
                            <span className="exact-login-field-icon">
                                ♙
                            </span>

                            Password
                        </label>

                        <div className="exact-login-password-wrap">

                            <input
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Enter your password"
                                value={
                                    password
                                }
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="current-password"
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


                    {/* REMEMBER + FORGOT */}

                    <div className="exact-login-options">

                        <label className="exact-remember">

                            <input
                                type="checkbox"
                                checked={
                                    rememberMe
                                }
                                onChange={(event) =>
                                    setRememberMe(
                                        event.target.checked
                                    )
                                }
                            />

                            <span>
                                Remember me
                            </span>

                        </label>


                        <Link
                            to="/forgot-password"
                            className="exact-forgot-link"
                        >
                            Forgot password?
                        </Link>

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        className="exact-login-submit"
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Logging in..."
                            : "Log In"}
                    </button>

                </form>


                {/* ================================= */}
                {/* REGISTER */}
                {/* ================================= */}

                <p className="exact-login-register">

                    Don&apos;t have an account?{" "}

                    <Link to="/register">
                        Create Account
                    </Link>

                </p>

            </section>

        </main>
    );
}


export default Login;