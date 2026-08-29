import {
    useEffect
} from "react";

import {
    useNavigate,
    useSearchParams
} from "react-router-dom";


function GoogleAuthSuccess() {

    const navigate =
        useNavigate();


    const [
        searchParams
    ] =
        useSearchParams();


    useEffect(
        () => {

            const token =
                searchParams.get(
                    "token"
                );


            const id =
                searchParams.get(
                    "id"
                );


            const name =
                searchParams.get(
                    "name"
                );


            const email =
                searchParams.get(
                    "email"
                );


            const setupCompleted =
                searchParams.get(
                    "setup_completed"
                ) ===
                "true";


            if (!token) {

                navigate(
                    "/login",
                    {
                        replace: true
                    }
                );

                return;
            }


            const user = {
                id:
                    Number(id),

                name,

                email,

                auth_provider:
                    "google",

                email_verified:
                    true,

                setup_completed:
                    setupCompleted
            };


            localStorage.setItem(
                "token",
                token
            );


            localStorage.setItem(
                "user",
                JSON.stringify(
                    user
                )
            );


            sessionStorage.removeItem(
                "token"
            );


            sessionStorage.removeItem(
                "user"
            );


            if (
                setupCompleted
            ) {

                navigate(
                    "/dashboard",
                    {
                        replace: true
                    }
                );


            } else {

                navigate(
                    "/setup",
                    {
                        replace: true
                    }
                );
            }

        },
        [
            navigate,
            searchParams
        ]
    );


    return (

        <main className="auth-page">

            <section
                className="auth-card"
                style={{
                    textAlign:
                        "center"
                }}
            >

                <div className="studybuddy-logo">
                    ✦
                </div>


                <h2>
                    Signing you in...
                </h2>


                <p>
                    Connecting your Google
                    account to StudyBuddy AI.
                </p>

            </section>

        </main>
    );
}


export default GoogleAuthSuccess;