const passport = require("passport");

const GoogleStrategy =
    require("passport-google-oauth20").Strategy;

const pool =
    require("./db");


passport.use(

    new GoogleStrategy(
        {
            clientID:
                process.env.GOOGLE_CLIENT_ID,

            clientSecret:
                process.env.GOOGLE_CLIENT_SECRET,

            callbackURL:
                process.env.GOOGLE_CALLBACK_URL
        },

        async (
            accessToken,
            refreshToken,
            profile,
            done
        ) => {

            try {

                const email =
                    profile.emails?.[0]?.value
                        ?.trim()
                        .toLowerCase();


                const name =
                    profile.displayName ||
                    "StudyBuddy User";


                const googleId =
                    profile.id;


                if (!email) {

                    return done(
                        new Error(
                            "Google account did not provide an email address."
                        ),
                        null
                    );
                }


                // ========================================
                // CHECK EXISTING USER
                // ========================================

                const existingResult =
                    await pool.query(
                        `SELECT *
                         FROM users
                         WHERE email = $1`,
                        [email]
                    );


                if (
                    existingResult.rows.length >
                    0
                ) {

                    const user =
                        existingResult.rows[0];


                    // ------------------------------------
                    // EXISTING GOOGLE USER
                    // ------------------------------------

                    if (
                        user.auth_provider ===
                        "google"
                    ) {

                        return done(
                            null,
                            user
                        );
                    }


                    // ------------------------------------
                    // EXISTING LOCAL USER
                    //
                    // Link Google login to the same
                    // StudyBuddy account.
                    // ------------------------------------

                    const updatedResult =
                        await pool.query(
                            `UPDATE users
                             SET
                                google_id = $1,
                                email_verified = TRUE,
                                updated_at = NOW()
                             WHERE id = $2
                             RETURNING *`,
                            [
                                googleId,
                                user.id
                            ]
                        );


                    return done(
                        null,
                        updatedResult.rows[0]
                    );
                }


                // ========================================
                // CREATE GOOGLE USER
                // ========================================

                const result =
                    await pool.query(
                        `INSERT INTO users
                        (
                            name,
                            email,
                            password_hash,
                            auth_provider,
                            google_id,
                            email_verified,
                            account_status
                        )
                        VALUES
                        (
                            $1,
                            $2,
                            NULL,
                            'google',
                            $3,
                            TRUE,
                            'active'
                        )
                        RETURNING *`,
                        [
                            name,
                            email,
                            googleId
                        ]
                    );


                return done(
                    null,
                    result.rows[0]
                );


            } catch (error) {

                console.error(
                    "Google strategy error:",
                    error
                );


                return done(
                    error,
                    null
                );
            }
        }
    )
);


module.exports =
    passport;