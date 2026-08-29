import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function VerifyEmail() {
    const { token } = useParams();

    const [status, setStatus] = useState("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await api.get(
                    `/api/auth/verify-email/${token}`
                );

                setStatus("success");
                setMessage(
                    response.data.message ||
                    "Your email has been verified successfully."
                );

            } catch (error) {
                console.error(
                    "Email verification error:",
                    error
                );

                const errorMessage =
                    error.response?.data?.message ||
                    "Unable to verify your email.";

                // If the token was already used,
                // check whether the account is already verified.
                if (
                    errorMessage.includes(
                        "Invalid or expired verification link"
                    )
                ) {
                    setStatus("already-verified");
                    setMessage(
                        "Your email has already been verified. You can log in now."
                    );
                } else {
                    setStatus("error");
                    setMessage(errorMessage);
                }
            }
        };

        if (token) {
            verifyEmail();
        } else {
            setStatus("error");
            setMessage("Verification link is invalid.");
        }
    }, [token]);

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "30px",
                fontFamily: "Arial, sans-serif",
                backgroundColor: "#f7f7f7"
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "450px",
                    padding: "35px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    textAlign: "center"
                }}
            >

                <h1>StudyBuddy AI</h1>

                {status === "loading" && (
                    <>
                        <h2>Verifying Your Email...</h2>

                        <p>
                            Please wait while we verify your email address.
                        </p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <h2>Email Verified Successfully!</h2>

                        <p>
                            {message}
                        </p>

                        <Link to="/login">
                            <button
                                style={{
                                    marginTop: "15px",
                                    padding: "12px 25px",
                                    cursor: "pointer"
                                }}
                            >
                                Go to Login
                            </button>
                        </Link>
                    </>
                )}

                {status === "already-verified" && (
                    <>
                        <h2>Email Already Verified</h2>

                        <p>
                            {message}
                        </p>

                        <Link to="/login">
                            <button
                                style={{
                                    marginTop: "15px",
                                    padding: "12px 25px",
                                    cursor: "pointer"
                                }}
                            >
                                Go to Login
                            </button>
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <h2>Verification Failed</h2>

                        <p>
                            {message}
                        </p>

                        <Link to="/login">
                            <button
                                style={{
                                    marginTop: "15px",
                                    padding: "12px 25px",
                                    cursor: "pointer"
                                }}
                            >
                                Back to Login
                            </button>
                        </Link>
                    </>
                )}

            </div>
        </div>
    );
}

export default VerifyEmail;