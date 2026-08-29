import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Register from "./pages/register";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import VerifyEmail from "./pages/verify-email";
import GoogleAuthSuccess from "./pages/google-auth-success";

import Setup from "./pages/setup";

import Subjects from "./pages/subjects";
import SubjectDetails from "./pages/subject-details";
import ChapterDetails from "./pages/chapter-details";
import TopicDetails from "./pages/topic-details";

import Test from "./pages/test";

import Revisions from "./pages/revisions";
import Mistakes from "./pages/mistakes";

import ExamPlanner from "./pages/exam-planner";
import StudyPlan from "./pages/study-plan";
import ExamReadiness from "./pages/exam-readiness";

import ProtectedRoute from "./components/ProtectedRoute";
import InteractiveWaveBackground from "./components/InteractiveWaveBackground";


function App() {

    return (

        <BrowserRouter>


            {/* ================================= */}
            {/* GLOBAL INTERACTIVE BACKGROUND */}
            {/* ================================= */}

            <InteractiveWaveBackground />


            {/* ================================= */}
            {/* APP CONTENT */}
            {/* ================================= */}

            <div className="app-shell">

                <Routes>


                    {/* ================================= */}
                    {/* PUBLIC ROUTES */}
                    {/* ================================= */}

                    <Route
                        path="/"
                        element={
                            <Login />
                        }
                    />


                    <Route
                        path="/login"
                        element={
                            <Login />
                        }
                    />


                    <Route
                        path="/register"
                        element={
                            <Register />
                        }
                    />


                    <Route
                        path="/verify-email/:token"
                        element={
                            <VerifyEmail />
                        }
                    />


                    <Route
                        path="/forgot-password"
                        element={
                            <ForgotPassword />
                        }
                    />


                    <Route
                        path="/reset-password/:token"
                        element={
                            <ResetPassword />
                        }
                    />


                    {/* ================================= */}
                    {/* GOOGLE AUTH SUCCESS */}
                    {/* ================================= */}

                    <Route
                        path="/google-auth-success"
                        element={
                            <GoogleAuthSuccess />
                        }
                    />


                    {/* ================================= */}
                    {/* STUDENT SETUP */}
                    {/* ================================= */}

                    <Route
                        path="/setup"
                        element={
                            <ProtectedRoute>

                                <Setup />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* DASHBOARD */}
                    {/* ================================= */}

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>

                                <Dashboard />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* SUBJECTS */}
                    {/* ================================= */}

                    <Route
                        path="/subjects"
                        element={
                            <ProtectedRoute>

                                <Subjects />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* SUBJECT DETAILS */}
                    {/* ================================= */}

                    <Route
                        path="/subjects/:id"
                        element={
                            <ProtectedRoute>

                                <SubjectDetails />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* CHAPTER DETAILS */}
                    {/* ================================= */}

                    <Route
                        path="/chapters/:id"
                        element={
                            <ProtectedRoute>

                                <ChapterDetails />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* TOPIC DETAILS */}
                    {/* ================================= */}

                    <Route
                        path="/topics/:id"
                        element={
                            <ProtectedRoute>

                                <TopicDetails />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* TOPIC TEST */}
                    {/* ================================= */}

                    <Route
                        path="/tests/:id"
                        element={
                            <ProtectedRoute>

                                <Test />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* REVISION CENTRE */}
                    {/* ================================= */}

                    <Route
                        path="/revisions"
                        element={
                            <ProtectedRoute>

                                <Revisions />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* MISTAKE BANK */}
                    {/* ================================= */}

                    <Route
                        path="/mistakes"
                        element={
                            <ProtectedRoute>

                                <Mistakes />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* EXAM PLANNER */}
                    {/* ================================= */}

                    <Route
                        path="/exam-planner"
                        element={
                            <ProtectedRoute>

                                <ExamPlanner />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* EXAM READINESS */}
                    {/* ================================= */}

                    <Route
                        path="/exam-readiness"
                        element={
                            <ProtectedRoute>

                                <ExamReadiness />

                            </ProtectedRoute>
                        }
                    />


                    {/* ================================= */}
                    {/* AI MASTER STUDY PLAN */}
                    {/* ================================= */}

                    <Route
                        path="/study-plans/:id"
                        element={
                            <ProtectedRoute>

                                <StudyPlan />

                            </ProtectedRoute>
                        }
                    />


                </Routes>

            </div>

        </BrowserRouter>
    );
}


export default App;