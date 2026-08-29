import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setMessageType("");

        if (!password || !confirmPassword) {
            setMessage("Please enter both password fields.");
            setMessageType("error");
            return;
        }

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters long.");
            setMessageType("error");
            return;
        }

        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            setMessageType("error");
            return;
        }

        if (!token) {
            setMessage("Invalid password reset link.");
            setMessageType("error");
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                `/api/password/reset-password/${token}`,
                { password }
            );

            setMessage(
                response.data.message ||
                "Password reset successfully!"
            );
            setMessageType("success");
            setPassword("");
            setConfirmPassword("");

            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (error) {
            console.error("Reset password error:", error);
            setMessage(
                error.response?.data?.message ||
                "Unable to reset password."
            );
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="reset-password-page">
            <section className="reset-password-card">
                <header className="reset-password-brand">
                    <div className="reset-password-logo">✦</div>
                    <h1>
                        StudyBuddy <span>AI</span>
                    </h1>
                    <h2>Reset Password</h2>
                    <p>
                        Create a new secure password for your
                        StudyBuddy account.
                    </p>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="reset-password-field">
                        <label>New Password</label>
                        <div className="reset-password-input-row">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                className="reset-password-show"
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        <p className="reset-password-helper">
                            Password must contain at least 8 characters.
                        </p>
                    </div>

                    <div className="reset-password-field">
                        <label>Confirm New Password</label>
                        <div className="reset-password-input-row">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                className="reset-password-show"
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                                {showConfirmPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="reset-password-submit"
                        disabled={loading}
                    >
                        {loading ? "Resetting Password..." : "Reset Password"}
                    </button>
                </form>

                {message && (
                    <div
                        className={
                            messageType === "error"
                                ? "reset-password-message reset-password-error"
                                : "reset-password-message reset-password-success"
                        }
                    >
                        {message}
                    </div>
                )}

                <p className="reset-password-footer">
                    Remember your password?{" "}
                    <Link to="/login">Back to Login</Link>
                </p>
            </section>
        </main>
    );
}

export default ResetPassword;
