-- ============================================
-- STUDYBUDDY AI DATABASE
-- ============================================

-- ============================================
-- USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    password_hash TEXT NOT NULL,

    course VARCHAR(150),

    college VARCHAR(200),

    study_hours_per_day INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- SUBJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================
-- CHAPTERS
-- ============================================

CREATE TABLE IF NOT EXISTS chapters (
    id SERIAL PRIMARY KEY,

    subject_id INTEGER NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    chapter_order INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
);


-- ============================================
-- TOPICS
-- ============================================

CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,

    chapter_id INTEGER NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT,

    topic_order INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (chapter_id)
        REFERENCES chapters(id)
        ON DELETE CASCADE,

    UNIQUE (chapter_id, topic_order)
);


-- ============================================
-- STUDY MATERIALS
-- ============================================

CREATE TABLE IF NOT EXISTS study_materials (
    id SERIAL PRIMARY KEY,

    topic_id INTEGER NOT NULL,

    title VARCHAR(250) NOT NULL,

    content TEXT,

    material_type VARCHAR(50) DEFAULT 'text',

    resource_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE CASCADE
);


-- ============================================
-- TESTS
-- ============================================

CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,

    topic_id INTEGER NOT NULL,

    title VARCHAR(250) NOT NULL,

    description TEXT,

    passing_percentage INTEGER DEFAULT 50,

    is_mandatory BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE CASCADE
);


-- ============================================
-- QUESTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,

    test_id INTEGER NOT NULL,

    question_text TEXT NOT NULL,

    question_type VARCHAR(50) DEFAULT 'mcq',

    option_a TEXT,

    option_b TEXT,

    option_c TEXT,

    option_d TEXT,

    correct_answer VARCHAR(10) NOT NULL,

    explanation TEXT,

    marks INTEGER DEFAULT 1,

    FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE CASCADE
);


-- ============================================
-- TEST ATTEMPTS
-- ============================================

CREATE TABLE IF NOT EXISTS test_attempts (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    test_id INTEGER NOT NULL,

    score INTEGER DEFAULT 0,

    total_marks INTEGER DEFAULT 0,

    percentage DECIMAL(5,2),

    passed BOOLEAN DEFAULT FALSE,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    completed_at TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE CASCADE
);


-- ============================================
-- STUDENT ANSWERS
-- ============================================

CREATE TABLE IF NOT EXISTS student_answers (
    id SERIAL PRIMARY KEY,

    attempt_id INTEGER NOT NULL,

    question_id INTEGER NOT NULL,

    selected_answer VARCHAR(10),

    is_correct BOOLEAN DEFAULT FALSE,

    marks_obtained INTEGER DEFAULT 0,

    FOREIGN KEY (attempt_id)
        REFERENCES test_attempts(id)
        ON DELETE CASCADE,

    FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    UNIQUE (attempt_id, question_id)
);


-- ============================================
-- TOPIC PROGRESS
-- ============================================

CREATE TABLE IF NOT EXISTS topic_progress (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    topic_id INTEGER NOT NULL,

    status VARCHAR(30) DEFAULT 'locked',

    test_completed BOOLEAN DEFAULT FALSE,

    best_score DECIMAL(5,2) DEFAULT 0,

    attempts INTEGER DEFAULT 0,

    completed_at TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE CASCADE,

    UNIQUE (user_id, topic_id)
);


-- ============================================
-- STUDY PLANS
-- ============================================

CREATE TABLE IF NOT EXISTS study_plans (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    title VARCHAR(250),

    description TEXT,

    start_date DATE,

    end_date DATE,

    daily_study_hours INTEGER,

    status VARCHAR(30) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- ============================================
-- STUDY PLAN TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS study_plan_tasks (
    id SERIAL PRIMARY KEY,

    study_plan_id INTEGER NOT NULL,

    topic_id INTEGER,

    task_date DATE NOT NULL,

    duration_minutes INTEGER,

    completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (study_plan_id)
        REFERENCES study_plans(id)
        ON DELETE CASCADE,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE SET NULL
);


-- ============================================
-- WEAK TOPICS
-- ============================================

CREATE TABLE IF NOT EXISTS weak_topics (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    topic_id INTEGER NOT NULL,

    average_score DECIMAL(5,2),

    weakness_level VARCHAR(30),

    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE CASCADE,

    UNIQUE (user_id, topic_id)
);


-- ============================================
-- AI RECOMMENDATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    topic_id INTEGER,

    recommendation_type VARCHAR(100),

    recommendation TEXT NOT NULL,

    priority VARCHAR(30) DEFAULT 'medium',

    is_completed BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE SET NULL
);


-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_chapters_subject
ON chapters(subject_id);


CREATE INDEX IF NOT EXISTS idx_topics_chapter
ON topics(chapter_id);


CREATE INDEX IF NOT EXISTS idx_materials_topic
ON study_materials(topic_id);


CREATE INDEX IF NOT EXISTS idx_tests_topic
ON tests(topic_id);


CREATE INDEX IF NOT EXISTS idx_questions_test
ON questions(test_id);


CREATE INDEX IF NOT EXISTS idx_attempts_user
ON test_attempts(user_id);


CREATE INDEX IF NOT EXISTS idx_attempts_test
ON test_attempts(test_id);


CREATE INDEX IF NOT EXISTS idx_progress_user
ON topic_progress(user_id);


CREATE INDEX IF NOT EXISTS idx_progress_topic
ON topic_progress(topic_id);


CREATE INDEX IF NOT EXISTS idx_weak_topics_user
ON weak_topics(user_id);


-- ============================================
-- COMPLETE
-- ============================================