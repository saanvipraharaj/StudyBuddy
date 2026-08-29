function StudyBuddyLoader({
    title = "StudyBuddy is thinking",
    text = "Preparing everything for you..."
}) {

    return (

        <div className="studybuddy-loader-page">

            <div className="studybuddy-loader-glow studybuddy-loader-glow-one" />
            <div className="studybuddy-loader-glow studybuddy-loader-glow-two" />


            <div className="studybuddy-loader-content">

                <div className="studybuddy-loader-logo">

                    <div className="studybuddy-loader-orbit orbit-one" />
                    <div className="studybuddy-loader-orbit orbit-two" />

                    <div className="studybuddy-loader-core">
                        ✦
                    </div>

                </div>


                <div className="studybuddy-loader-brand">
                    Study<span>Buddy</span>
                </div>


                <h2 className="studybuddy-loader-title">
                    {title}
                </h2>


                <p className="studybuddy-loader-text">
                    {text}
                </p>


                <div className="studybuddy-loader-bar">

                    <div className="studybuddy-loader-bar-fill" />

                </div>


                <div className="studybuddy-loader-dots">

                    <span />
                    <span />
                    <span />

                </div>

            </div>


            <style>{`

                .studybuddy-loader-page {
                    min-height: 100vh;
                    width: 100%;

                    display: flex;
                    align-items: center;
                    justify-content: center;

                    position: relative;
                    overflow: hidden;

                    background:
                        radial-gradient(
                            circle at 50% 40%,
                            rgba(240, 90, 157, 0.08),
                            transparent 35%
                        ),
                        #050507;

                    color: #fff7fb;

                    font-family:
                        Inter,
                        "Segoe UI",
                        Arial,
                        sans-serif;
                }


                /* ==========================================
                   BACKGROUND GLOW
                ========================================== */

                .studybuddy-loader-glow {
                    position: absolute;

                    border-radius: 50%;

                    filter: blur(110px);

                    pointer-events: none;
                }


                .studybuddy-loader-glow-one {
                    width: 420px;
                    height: 420px;

                    background:
                        rgba(240, 90, 157, 0.11);

                    top: -180px;
                    right: -120px;

                    animation:
                        studybuddyGlow 5s ease-in-out infinite;
                }


                .studybuddy-loader-glow-two {
                    width: 350px;
                    height: 350px;

                    background:
                        rgba(217, 52, 120, 0.07);

                    bottom: -180px;
                    left: -100px;

                    animation:
                        studybuddyGlow 6s ease-in-out infinite reverse;
                }


                @keyframes studybuddyGlow {

                    0%,
                    100% {
                        opacity: 0.45;
                        transform: scale(1);
                    }

                    50% {
                        opacity: 1;
                        transform: scale(1.15);
                    }
                }


                /* ==========================================
                   CONTENT
                ========================================== */

                .studybuddy-loader-content {
                    position: relative;
                    z-index: 2;

                    width: min(90%, 420px);

                    display: flex;
                    flex-direction: column;
                    align-items: center;

                    text-align: center;
                }


                /* ==========================================
                   ANIMATED LOGO
                ========================================== */

                .studybuddy-loader-logo {
                    width: 112px;
                    height: 112px;

                    position: relative;

                    display: grid;
                    place-items: center;

                    margin-bottom: 25px;
                }


                .studybuddy-loader-core {
                    width: 64px;
                    height: 64px;

                    display: grid;
                    place-items: center;

                    border-radius: 20px;

                    background:
                        linear-gradient(
                            135deg,
                            #d93478,
                            #f05a9d,
                            #ff79b5
                        );

                    color: white;

                    font-size: 27px;

                    box-shadow:
                        0 0 35px rgba(240, 90, 157, 0.38),
                        0 12px 35px rgba(0, 0, 0, 0.45);

                    animation:
                        studybuddyCore 2s ease-in-out infinite;
                }


                @keyframes studybuddyCore {

                    0%,
                    100% {
                        transform:
                            scale(1)
                            rotate(0deg);
                    }

                    50% {
                        transform:
                            scale(1.08)
                            rotate(8deg);
                    }
                }


                /* ==========================================
                   ORBITS
                ========================================== */

                .studybuddy-loader-orbit {
                    position: absolute;

                    border-radius: 50%;

                    border:
                        1px solid
                        rgba(240, 90, 157, 0.25);
                }


                .orbit-one {
                    width: 90px;
                    height: 90px;

                    border-top-color:
                        #f05a9d;

                    animation:
                        studybuddySpin 2s linear infinite;
                }


                .orbit-two {
                    width: 108px;
                    height: 108px;

                    border-bottom-color:
                        rgba(255, 121, 181, 0.75);

                    animation:
                        studybuddySpinReverse
                        3.2s
                        linear
                        infinite;
                }


                @keyframes studybuddySpin {

                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }


                @keyframes studybuddySpinReverse {

                    from {
                        transform: rotate(360deg);
                    }

                    to {
                        transform: rotate(0deg);
                    }
                }


                /* ==========================================
                   BRAND
                ========================================== */

                .studybuddy-loader-brand {
                    margin-bottom: 18px;

                    color: #fff;

                    font-size: 15px;
                    font-weight: 800;

                    letter-spacing: 0.3px;
                }


                .studybuddy-loader-brand span {
                    color: #f05a9d;
                }


                /* ==========================================
                   TEXT
                ========================================== */

                .studybuddy-loader-title {
                    margin:
                        0 0 10px;

                    color:
                        #fff9fc;

                    font-size:
                        clamp(
                            22px,
                            4vw,
                            29px
                        );

                    font-weight: 800;

                    letter-spacing:
                        -0.6px;
                }


                .studybuddy-loader-text {
                    max-width: 360px;

                    margin:
                        0 0 27px;

                    color:
                        #91858c;

                    font-size:
                        13px;

                    line-height:
                        1.7;
                }


                /* ==========================================
                   LOADING BAR
                ========================================== */

                .studybuddy-loader-bar {
                    width: 250px;
                    max-width: 75%;

                    height: 4px;

                    position: relative;

                    overflow: hidden;

                    border-radius: 999px;

                    background:
                        rgba(255, 255, 255, 0.07);

                    margin-bottom: 20px;
                }


                .studybuddy-loader-bar-fill {
                    position: absolute;

                    width: 45%;
                    height: 100%;

                    left: -45%;

                    border-radius: 999px;

                    background:
                        linear-gradient(
                            90deg,
                            transparent,
                            #d93478,
                            #f05a9d,
                            #ff79b5,
                            transparent
                        );

                    box-shadow:
                        0 0 16px
                        rgba(240, 90, 157, 0.55);

                    animation:
                        studybuddyLoadingBar
                        1.6s
                        ease-in-out
                        infinite;
                }


                @keyframes studybuddyLoadingBar {

                    0% {
                        left: -45%;
                    }

                    100% {
                        left: 100%;
                    }
                }


                /* ==========================================
                   DOTS
                ========================================== */

                .studybuddy-loader-dots {
                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 6px;
                }


                .studybuddy-loader-dots span {
                    width: 5px;
                    height: 5px;

                    border-radius: 50%;

                    background:
                        #f05a9d;

                    opacity: 0.25;

                    animation:
                        studybuddyDot
                        1.3s
                        ease-in-out
                        infinite;
                }


                .studybuddy-loader-dots span:nth-child(2) {
                    animation-delay:
                        0.15s;
                }


                .studybuddy-loader-dots span:nth-child(3) {
                    animation-delay:
                        0.3s;
                }


                @keyframes studybuddyDot {

                    0%,
                    100% {
                        opacity: 0.25;

                        transform:
                            translateY(0)
                            scale(0.85);
                    }

                    50% {
                        opacity: 1;

                        transform:
                            translateY(-4px)
                            scale(1.15);
                    }
                }


                /* ==========================================
                   MOBILE
                ========================================== */

                @media (max-width: 600px) {

                    .studybuddy-loader-logo {
                        width: 96px;
                        height: 96px;
                    }


                    .studybuddy-loader-core {
                        width: 56px;
                        height: 56px;

                        border-radius: 17px;

                        font-size: 23px;
                    }


                    .orbit-one {
                        width: 80px;
                        height: 80px;
                    }


                    .orbit-two {
                        width: 96px;
                        height: 96px;
                    }


                    .studybuddy-loader-text {
                        padding:
                            0 20px;
                    }
                }

            `}</style>

        </div>
    );
}


export default StudyBuddyLoader;