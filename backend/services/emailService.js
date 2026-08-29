const { Resend } = require("resend");

const resend = new Resend(
    process.env.RESEND_API_KEY
);

const sendEmail = async ({
    to,
    subject,
    html
}) => {
    try {
        const response = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [to],
            subject: subject,
            html: html
        });

        console.log(
            "Email sent successfully:",
            response
        );

        return response;

    } catch (error) {
        console.error(
            "Email sending error:",
            error
        );

        throw error;
    }
};


// ============================================
// PASSWORD RESET EMAIL
// ============================================

const sendPasswordResetEmail = async (
    email,
    resetUrl
) => {

    return sendEmail({
        to: email,

        subject:
            "Reset Your StudyBuddy AI Password",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
            ">

                <h1>StudyBuddy AI</h1>

                <h2>Password Reset</h2>

                <p>
                    We received a request to reset
                    your StudyBuddy AI password.
                </p>

                <p>
                    Click the button below to create
                    a new password.
                </p>

                <a
                    href="${resetUrl}"
                    style="
                        display: inline-block;
                        padding: 12px 20px;
                        background: #000;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 6px;
                    "
                >
                    Reset Password
                </a>

                <p style="
                    margin-top: 25px;
                    color: #666;
                ">
                    This link will expire in
                    15 minutes.
                </p>

                <p style="
                    color: #666;
                ">
                    If you did not request a password
                    reset, you can safely ignore this
                    email.
                </p>

            </div>
        `
    });
};


// ============================================
// EMAIL VERIFICATION
// ============================================

const sendVerificationEmail = async (
    email,
    verificationUrl
) => {

    return sendEmail({
        to: email,

        subject:
            "Verify Your StudyBuddy AI Account",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
            ">

                <h1>StudyBuddy AI</h1>

                <h2>
                    Verify Your Email
                </h2>

                <p>
                    Welcome to StudyBuddy AI!
                </p>

                <p>
                    Please verify your email address
                    to activate your account.
                </p>

                <a
                    href="${verificationUrl}"
                    style="
                        display: inline-block;
                        padding: 12px 20px;
                        background: #000;
                        color: #fff;
                        text-decoration: none;
                        border-radius: 6px;
                    "
                >
                    Verify Email
                </a>

                <p style="
                    margin-top: 25px;
                    color: #666;
                ">
                    If you did not create this account,
                    you can safely ignore this email.
                </p>

            </div>
        `
    });
};


module.exports = {
    sendEmail,
    sendPasswordResetEmail,
    sendVerificationEmail
};