const { GoogleGenAI } = require("@google/genai");


// ============================================
// GEMINI SETUP
// ============================================

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ============================================
// GEMINI MODEL
// ============================================

const GEMINI_MODEL =
    "gemini-3.6-flash";


// ============================================
// CLEAN GEMINI JSON
// ============================================

const parseGeminiJSON = (text) => {

    if (!text) {

        throw new Error(
            "Gemini returned an empty response"
        );
    }


    const cleanedText =
        String(text)
            .trim()
            .replace(
                /^```json\s*/i,
                ""
            )
            .replace(
                /^```\s*/i,
                ""
            )
            .replace(
                /\s*```$/i,
                ""
            )
            .trim();


    try {

        return JSON.parse(
            cleanedText
        );

    } catch (error) {

        console.error(
            "Gemini raw response:",
            text
        );


        throw new Error(
            "Gemini returned invalid JSON"
        );
    }
};


// ============================================
// GEMINI GENERATE CONTENT HELPER
// ============================================

const generateContent = async (
    prompt
) => {

    try {

        const response =
            await ai.models.generateContent({
                model:
                    GEMINI_MODEL,

                contents:
                    prompt
            });


        if (
            !response ||
            !response.text
        ) {

            throw new Error(
                "Gemini returned an empty response"
            );
        }


        return response.text;


    } catch (error) {

        console.error(
            "Gemini API error:",
            error
        );


        throw error;
    }
};


// ============================================
// GET LOCAL YYYY-MM-DD
// ============================================

const getLocalDateString = () => {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;
};


// ============================================
// GENERATE TOPICS FROM CHAPTER
// ============================================

const generateTopicsFromChapter = async (
    chapterName,
    combinedText
) => {

    try {

        if (
            !combinedText ||
            !combinedText.trim()
        ) {

            throw new Error(
                "Chapter text is empty"
            );
        }


        const prompt = `
You are helping organize study material for a college student.

Chapter:

${chapterName}

Below is the combined text extracted from all PDFs uploaded for this chapter.

Your task:

1. Identify the main study topics.
2. Avoid duplicate or overlapping topics.
3. Keep topics in logical learning order.
4. Give every topic a short description.
5. Estimate the study time required in minutes.
6. Use only information supported by the supplied material.
7. Return ONLY valid JSON.
8. Do not use markdown.
9. Do not include text before or after the JSON.

Return exactly this structure:

{
    "topics": [
        {
            "topic_number": 1,
            "name": "Topic name",
            "description": "Short description",
            "estimated_minutes": 30
        }
    ]
}

Chapter content:

${combinedText}
`;


        const text =
            await generateContent(
                prompt
            );


        const parsed =
            parseGeminiJSON(
                text
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.topics
            )
        ) {

            throw new Error(
                "Gemini response does not contain topics"
            );
        }


        const topics =
            parsed.topics
                .filter(
                    (topic) =>
                        topic &&
                        topic.name &&
                        String(
                            topic.name
                        ).trim()
                )
                .map(
                    (
                        topic,
                        index
                    ) => {

                        return {

                            topic_number:
                                Number(
                                    topic.topic_number
                                ) ||
                                index + 1,


                            name:
                                String(
                                    topic.name
                                ).trim(),


                            description:
                                topic.description
                                    ? String(
                                        topic.description
                                    ).trim()
                                    : null,


                            estimated_minutes:
                                Math.min(
                                    Math.max(
                                        Number(
                                            topic.estimated_minutes
                                        ) || 30,
                                        10
                                    ),
                                    180
                                )
                        };
                    }
                );


        if (
            topics.length === 0
        ) {

            throw new Error(
                "Gemini generated no usable topics"
            );
        }


        return topics;


    } catch (error) {

        console.error(
            "Topic generation error:",
            error
        );


        throw error;
    }
};


// ============================================
// GENERATE LEARNING CONTENT
// ============================================

const generateTopicLearningContent = async (
    topic,
    chapterName,
    combinedText
) => {

    try {

        if (!topic) {

            throw new Error(
                "Topic is required"
            );
        }


        if (
            !combinedText ||
            !combinedText.trim()
        ) {

            throw new Error(
                "Chapter text is empty"
            );
        }


        const prompt = `
You are StudyBuddy AI, an AI tutor for a college student.

Generate learning material ONLY for the specified topic.

Chapter:

${chapterName}

Topic:

${topic.name}

Topic description:

${topic.description || "No description provided"}

The following material comes from all PDFs uploaded for this chapter.

IMPORTANT RULES:

1. Focus only on the requested topic.
2. Use the supplied study material as the source.
3. Do not invent unsupported facts.
4. Remove duplicate explanations.
5. Explain concepts clearly.
6. Keep important technical terminology.
7. Provide useful explanations suitable for a college student.
8. Return ONLY valid JSON.
9. Do not use markdown code fences.
10. Do not include text outside the JSON.

Return exactly:

{
    "notes": "Detailed but easy-to-understand study notes.",

    "key_concepts": [
        {
            "name": "Concept name",
            "explanation": "Clear explanation"
        }
    ],

    "examples": [
        {
            "title": "Example title",
            "example": "Example explanation"
        }
    ],

    "important_points": [
        "Important point 1",
        "Important point 2"
    ]
}

Combined chapter material:

${combinedText}
`;


        const text =
            await generateContent(
                prompt
            );


        const parsed =
            parseGeminiJSON(
                text
            );


        if (
            !parsed.notes ||
            typeof parsed.notes !==
            "string"
        ) {

            throw new Error(
                "Gemini did not generate valid notes"
            );
        }


        return {

            notes:
                parsed.notes.trim(),


            key_concepts:
                Array.isArray(
                    parsed.key_concepts
                )
                    ? parsed.key_concepts
                    : [],


            examples:
                Array.isArray(
                    parsed.examples
                )
                    ? parsed.examples
                    : [],


            important_points:
                Array.isArray(
                    parsed.important_points
                )
                    ? parsed.important_points
                    : []
        };


    } catch (error) {

        console.error(
            "Learning content error:",
            error
        );


        throw error;
    }
};


// ============================================
// GENERATE TOPIC TEST
// ============================================

const generateTopicTest = async (
    topic,
    learningContent,
    numberOfQuestions = 10
) => {

    try {

        if (!topic) {

            throw new Error(
                "Topic is required"
            );
        }


        if (!learningContent) {

            throw new Error(
                "Learning content is required"
            );
        }


        const questionCount =
            Math.min(
                Math.max(
                    Number(
                        numberOfQuestions
                    ) || 10,
                    5
                ),
                20
            );


        const prompt = `
You are StudyBuddy AI.

Create a mandatory college-level test for the following topic.

Topic:

${topic.name}

Topic description:

${topic.description || "No description"}

Learning content:

${JSON.stringify(
    learningContent,
    null,
    2
)}

Create exactly ${questionCount} multiple-choice questions.

RULES:

1. Use ONLY the supplied learning content.
2. Test understanding, not only memorization.
3. Avoid duplicate questions.
4. Include easy, medium and hard questions.
5. Every question must have exactly four options.
6. Only one answer may be correct.
7. correct_answer must be exactly:
   "A", "B", "C", or "D".
8. Give a short explanation.
9. question_type must always be "mcq".
10. Return ONLY valid JSON.
11. Do not use markdown.

Return exactly:

{
    "title": "${topic.name} Topic Test",

    "test_type": "topic_test",

    "difficulty": "adaptive",

    "passing_percentage": 70,

    "questions": [
        {
            "question_text": "Question",
            "question_type": "mcq",
            "option_a": "Option A",
            "option_b": "Option B",
            "option_c": "Option C",
            "option_d": "Option D",
            "correct_answer": "A",
            "explanation": "Explanation",
            "difficulty": "easy"
        }
    ]
}
`;


        const text =
            await generateContent(
                prompt
            );


        const parsed =
            parseGeminiJSON(
                text
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.questions
            )
        ) {

            throw new Error(
                "Gemini response does not contain questions"
            );
        }


        const allowedDifficulties = [
            "easy",
            "medium",
            "hard"
        ];


        const cleanedQuestions =
            parsed.questions.map(
                (
                    question,
                    index
                ) => {

                    const correctAnswer =
                        String(
                            question.correct_answer ||
                            ""
                        )
                            .trim()
                            .toUpperCase();


                    if (
                        ![
                            "A",
                            "B",
                            "C",
                            "D"
                        ].includes(
                            correctAnswer
                        )
                    ) {

                        throw new Error(
                            `Invalid correct answer for question ${index + 1}`
                        );
                    }


                    const rawDifficulty =
                        String(
                            question.difficulty ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    const difficulty =
                        allowedDifficulties.includes(
                            rawDifficulty
                        )
                            ? rawDifficulty
                            : "medium";


                    return {

                        question_text:
                            String(
                                question.question_text ||
                                ""
                            ).trim(),


                        question_type:
                            "mcq",


                        option_a:
                            String(
                                question.option_a ||
                                ""
                            ).trim(),


                        option_b:
                            String(
                                question.option_b ||
                                ""
                            ).trim(),


                        option_c:
                            String(
                                question.option_c ||
                                ""
                            ).trim(),


                        option_d:
                            String(
                                question.option_d ||
                                ""
                            ).trim(),


                        correct_answer:
                            correctAnswer,


                        explanation:
                            question.explanation
                                ? String(
                                    question.explanation
                                ).trim()
                                : null,


                        difficulty
                    };
                }
            );


        return {

            title:
                parsed.title ||
                `${topic.name} Topic Test`,


            test_type:
                "topic_test",


            difficulty:
                "adaptive",


            total_questions:
                cleanedQuestions.length,


            passing_percentage:
                Number(
                    parsed.passing_percentage
                ) || 70,


            is_mandatory:
                true,


            questions:
                cleanedQuestions
        };


    } catch (error) {

        console.error(
            "Test generation error:",
            error
        );


        throw error;
    }
};


// ============================================
// GENERATE FLASHCARDS
// ============================================

const generateTopicFlashcards = async (
    topic,
    learningContent,
    numberOfFlashcards = 12
) => {

    try {

        if (!topic) {

            throw new Error(
                "Topic is required"
            );
        }


        if (!learningContent) {

            throw new Error(
                "Learning content is required"
            );
        }


        const flashcardCount =
            Math.min(
                Math.max(
                    Number(
                        numberOfFlashcards
                    ) || 12,
                    5
                ),
                20
            );


        const prompt = `
You are StudyBuddy AI.

Create revision flashcards for a college student.

Topic:

${topic.name}

Topic description:

${topic.description || "No description"}

Learning content:

${JSON.stringify(
    learningContent,
    null,
    2
)}

Create exactly ${flashcardCount} flashcards.

RULES:

1. Each flashcard contains one question and one answer.
2. Questions must be clear.
3. Answers should be concise but complete.
4. Focus on important concepts.
5. Avoid duplicate flashcards.
6. Include definition, conceptual and understanding questions.
7. Use easy, medium and hard difficulty.
8. Do not create MCQs.
9. Do not include A/B/C/D options.
10. Use ONLY the supplied learning content.
11. Return ONLY valid JSON.
12. Do not use markdown.

Difficulty must be exactly:

"easy"
"medium"
"hard"

Return exactly:

{
    "flashcards": [
        {
            "question": "Question",
            "answer": "Answer",
            "difficulty": "easy"
        }
    ]
}
`;


        const text =
            await generateContent(
                prompt
            );


        const parsed =
            parseGeminiJSON(
                text
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.flashcards
            )
        ) {

            throw new Error(
                "Gemini response does not contain flashcards"
            );
        }


        const allowedDifficulties = [
            "easy",
            "medium",
            "hard"
        ];


        const cleanedFlashcards =
            parsed.flashcards.map(
                (
                    flashcard,
                    index
                ) => {

                    if (
                        !flashcard.question ||
                        !String(
                            flashcard.question
                        ).trim()
                    ) {

                        throw new Error(
                            `Flashcard ${index + 1} has no question`
                        );
                    }


                    if (
                        !flashcard.answer ||
                        !String(
                            flashcard.answer
                        ).trim()
                    ) {

                        throw new Error(
                            `Flashcard ${index + 1} has no answer`
                        );
                    }


                    const rawDifficulty =
                        String(
                            flashcard.difficulty ||
                            ""
                        )
                            .trim()
                            .toLowerCase();


                    return {

                        question:
                            String(
                                flashcard.question
                            ).trim(),


                        answer:
                            String(
                                flashcard.answer
                            ).trim(),


                        difficulty:
                            allowedDifficulties.includes(
                                rawDifficulty
                            )
                                ? rawDifficulty
                                : "medium"
                    };
                }
            );


        return cleanedFlashcards;


    } catch (error) {

        console.error(
            "Flashcard generation error:",
            error
        );


        throw error;
    }
};


// ============================================
// GENERATE MASTER MULTI-SUBJECT STUDY PLAN
// ============================================

const generatePersonalizedStudyPlan = async (
    planningData
) => {

    try {

        if (!planningData) {

            throw new Error(
                "Planning data is required"
            );
        }


        const {
            examGroup,
            exams,
            dailyStudyMinutes,
            topics,
            weakTopics,
            flashcardPerformance
        } = planningData;


        // ============================================
        // VALIDATE EXAM GROUP
        // ============================================

        if (!examGroup) {

            throw new Error(
                "Exam group is required"
            );
        }


        // ============================================
        // VALIDATE EXAMS
        // ============================================

        if (
            !Array.isArray(
                exams
            ) ||
            exams.length === 0
        ) {

            throw new Error(
                "Exam group does not contain any upcoming exams"
            );
        }


        // ============================================
        // VALIDATE TOPICS
        // ============================================

        if (
            !Array.isArray(
                topics
            ) ||
            topics.length === 0
        ) {

            throw new Error(
                "No topics are available for study plan generation"
            );
        }


        // ============================================
        // DAILY STUDY LIMIT
        // ============================================

        const availableMinutes =
            Math.min(
                Math.max(
                    Number(
                        dailyStudyMinutes
                    ) || 120,
                    30
                ),
                720
            );


        // ============================================
        // CURRENT DATE
        // ============================================

        const today =
            getLocalDateString();


        // ============================================
        // NORMALIZED EXAM DATA
        // ============================================

        const normalizedExams =
            exams.map(
                (exam) => ({

                    id:
                        Number(
                            exam.id
                        ),


                    subject_id:
                        Number(
                            exam.subject_id
                        ),


                    subject_name:
                        exam.subject_name,


                    exam_name:
                        exam.exam_name,


                    exam_date:
                        String(
                            exam.exam_date
                        )
                            .split("T")[0]
                            .split(" ")[0],


                    exam_time:
                        exam.exam_time ||
                        null,


                    priority:
                        exam.priority ||
                        "medium"
                })
            );


        // ============================================
        // PROMPT
        // ============================================

        const prompt = `
You are the intelligent scheduling engine for StudyBuddy AI.

Create ONE MASTER PERSONALIZED STUDY TIMETABLE for a college student.

The timetable must cover ALL subjects belonging to the same exam group.

Do NOT create separate isolated plans for each subject.

==================================================
CURRENT DATE
==================================================

${today}


==================================================
EXAM GROUP
==================================================

Group Name:
${examGroup.group_name}

Exam Type:
${examGroup.exam_type}

Custom Exam Type:
${examGroup.custom_exam_type || "None"}


==================================================
UPCOMING EXAMS
==================================================

${JSON.stringify(
    normalizedExams,
    null,
    2
)}


==================================================
DAILY AVAILABLE STUDY TIME
==================================================

${availableMinutes} minutes per day


==================================================
ALL AVAILABLE TOPICS
==================================================

${JSON.stringify(
    topics,
    null,
    2
)}


==================================================
WEAK TOPICS
==================================================

${JSON.stringify(
    weakTopics || [],
    null,
    2
)}


==================================================
FLASHCARD PERFORMANCE
==================================================

${JSON.stringify(
    flashcardPerformance || [],
    null,
    2
)}


==================================================
YOUR TASK
==================================================

Create one intelligent study timetable covering all subjects and all upcoming exams in this exam group.

For example, if the group contains:

- Natural Language Processing exam on September 5
- Statistics exam on September 7
- Business Analytics exam on September 10

the timetable should intelligently divide the student's available daily study time between these subjects.

A single day MAY contain multiple subjects.

Example:

August 26:

Natural Language Processing - Topic A - 45 minutes

Statistics - Topic B - 40 minutes

Business Analytics - Topic C - 35 minutes


==================================================
IMPORTANT SCHEDULING RULES
==================================================

1. Create ONE combined timetable for the complete exam group.

2. Do NOT make separate independent timetables.

3. Schedule tasks starting from ${today}.

4. A day may contain tasks from multiple subjects.

5. Respect the student's maximum daily study time:
   ${availableMinutes} minutes.

6. The total duration of all tasks scheduled on one day should normally NOT exceed ${availableMinutes} minutes.

7. Prioritize subjects whose exam dates are closest.

8. However, do NOT completely ignore subjects with later exam dates.

9. As an exam approaches, gradually increase study priority for that subject.

10. NEVER schedule a topic belonging to a subject on or after that subject's exam date.

11. After a subject's exam date passes, do not schedule that subject anymore.

12. Redistribute study time toward the remaining subjects after earlier exams are completed.

13. Prioritize unfinished topics.

14. Give weak topics additional study or revision time.

15. Give topics with low test scores additional revision.

16. Topics marked revision_required should receive revision sessions.

17. Use mastery_score, latest_score, average_score and completion data when available.

18. Use flashcard performance to identify concepts needing more revision.

19. Topics with many incorrect flashcard reviews should receive additional revision.

20. Strong or mastered topics can receive less study time.

21. Follow chapter and topic learning order whenever practical.

22. Do not schedule advanced topics too early if prerequisite topics are unfinished.

23. Use estimated_minutes when deciding how much time a topic requires.

24. Large topics may be split across multiple study sessions.

25. Avoid unnecessarily repeating the same topic every day.

26. Include revision sessions before each subject's exam.

27. The final one or two days before an exam should contain stronger revision focus for that subject.

28. Include practice sessions where appropriate.

29. Include flashcard revision where appropriate.

30. Try to create a balanced timetable so the student is not studying only one subject every day.

31. When multiple exams are close together, divide study time intelligently according to:
    - exam date
    - subject priority
    - unfinished topics
    - weak topics
    - test performance
    - mastery scores
    - flashcard performance

32. Every task MUST reference a valid topic_id from ALL AVAILABLE TOPICS.

33. Never invent topic IDs.

34. Never invent subjects.

35. task_date MUST use YYYY-MM-DD.

36. duration_minutes must be a realistic integer.

37. Individual study sessions should normally be between 20 and 90 minutes.

38. Very short revision sessions may be between 10 and 30 minutes.

39. task_type MUST be exactly one of:

"study"
"revision"
"practice"
"flashcards"

40. priority MUST be exactly one of:

"low"
"medium"
"high"

41. Return ONLY valid JSON.

42. Do NOT use markdown.

43. Do NOT use code fences.

44. Do NOT provide explanations outside the JSON.


==================================================
RETURN EXACTLY THIS STRUCTURE
==================================================

{
    "tasks": [
        {
            "topic_id": 1,
            "task_date": "2026-08-26",
            "duration_minutes": 45,
            "task_type": "study",
            "priority": "high",
            "reason": "This topic belongs to an upcoming exam and has not been completed"
        },

        {
            "topic_id": 7,
            "task_date": "2026-08-26",
            "duration_minutes": 40,
            "task_type": "revision",
            "priority": "medium",
            "reason": "This topic has weak previous performance"
        }
    ]
}
`;


        // ============================================
        // GENERATE
        // ============================================

        console.log(
            "========================================"
        );

        console.log(
            "GENERATING MASTER STUDY PLAN"
        );

        console.log(
            "Exam group:",
            examGroup.group_name
        );

        console.log(
            "Number of exams:",
            normalizedExams.length
        );

        console.log(
            "Number of topics:",
            topics.length
        );

        console.log(
            "Daily study minutes:",
            availableMinutes
        );

        console.log(
            "Model:",
            GEMINI_MODEL
        );

        console.log(
            "========================================"
        );


        const text =
            await generateContent(
                prompt
            );


        // ============================================
        // PARSE
        // ============================================

        const parsed =
            parseGeminiJSON(
                text
            );


        if (
            !parsed ||
            !Array.isArray(
                parsed.tasks
            )
        ) {

            throw new Error(
                "Gemini response does not contain study plan tasks"
            );
        }


        if (
            parsed.tasks.length === 0
        ) {

            throw new Error(
                "Gemini generated an empty master study plan"
            );
        }


        // ============================================
        // TOPIC MAP
        // ============================================

        const topicMap =
            new Map();


        topics.forEach(
            (topic) => {

                topicMap.set(
                    Number(
                        topic.id
                    ),
                    topic
                );
            }
        );


        // ============================================
        // VALID VALUES
        // ============================================

        const allowedTaskTypes = [
            "study",
            "revision",
            "practice",
            "flashcards"
        ];


        const allowedPriorities = [
            "low",
            "medium",
            "high"
        ];


        // ============================================
        // CLEAN GENERATED TASKS
        // ============================================

        const cleanedTasks =
            parsed.tasks
                .filter(
                    (task) => {

                        if (!task) {
                            return false;
                        }


                        const topicId =
                            Number(
                                task.topic_id
                            );


                        return topicMap.has(
                            topicId
                        );
                    }
                )
                .map(
                    (task) => {

                        const topicId =
                            Number(
                                task.topic_id
                            );


                        const topic =
                            topicMap.get(
                                topicId
                            );


                        const rawTaskType =
                            String(
                                task.task_type ||
                                "study"
                            )
                                .trim()
                                .toLowerCase();


                        const rawPriority =
                            String(
                                task.priority ||
                                "medium"
                            )
                                .trim()
                                .toLowerCase();


                        const taskDate =
                            String(
                                task.task_date ||
                                ""
                            )
                                .trim()
                                .split("T")[0]
                                .split(" ")[0];


                        return {

                            topic_id:
                                topicId,


                            subject_id:
                                Number(
                                    topic.subject_id
                                ),


                            subject_name:
                                topic.subject_name,


                            topic_name:
                                topic.name,


                            chapter_name:
                                topic.chapter_name,


                            task_date:
                                taskDate,


                            duration_minutes:
                                Math.min(
                                    Math.max(
                                        Number(
                                            task.duration_minutes
                                        ) || 30,
                                        10
                                    ),
                                    180
                                ),


                            task_type:
                                allowedTaskTypes.includes(
                                    rawTaskType
                                )
                                    ? rawTaskType
                                    : "study",


                            priority:
                                allowedPriorities.includes(
                                    rawPriority
                                )
                                    ? rawPriority
                                    : "medium",


                            reason:
                                task.reason
                                    ? String(
                                        task.reason
                                    ).trim()
                                    : null
                        };
                    }
                );


        // ============================================
        // VALIDATE DATE FORMAT
        // ============================================

        const validDateTasks =
            cleanedTasks.filter(
                (task) =>
                    /^\d{4}-\d{2}-\d{2}$/.test(
                        task.task_date
                    )
            );


        if (
            validDateTasks.length === 0
        ) {

            console.error(
                "Raw Gemini tasks:",
                parsed.tasks
            );


            throw new Error(
                "No valid master study plan tasks were generated"
            );
        }


        // ============================================
        // CHECK DAILY LOAD
        // ============================================

        const dailyLoad =
            new Map();


        const finalTasks = [];


        for (
            const task
            of validDateTasks
        ) {

            const currentLoad =
                dailyLoad.get(
                    task.task_date
                ) || 0;


            /*
                We allow a small margin because
                Gemini may occasionally exceed the
                requested daily limit slightly.

                The controller will still verify
                exam-specific dates.
            */

            if (
                currentLoad +
                    task.duration_minutes >
                availableMinutes + 30
            ) {

                continue;
            }


            dailyLoad.set(
                task.task_date,

                currentLoad +
                    task.duration_minutes
            );


            finalTasks.push(
                task
            );
        }


        if (
            finalTasks.length === 0
        ) {

            throw new Error(
                "Master timetable contained no usable tasks"
            );
        }


        // ============================================
        // DEBUG SUMMARY
        // ============================================

        console.log(
            "Master study plan generated."
        );

        console.log(
            "Tasks:",
            finalTasks.length
        );


        console.log(
            "Subjects included:",
            [
                ...new Set(
                    finalTasks.map(
                        (
                            task
                        ) =>
                            task.subject_name
                    )
                )
            ]
        );


        console.log(
            "========================================"
        );


        // ============================================
        // RETURN
        // ============================================

        return finalTasks;


    } catch (error) {

        console.error(
            "========================================"
        );

        console.error(
            "MASTER STUDY PLAN GENERATION ERROR"
        );

        console.error(
            "========================================"
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Status:",
            error?.status
        );

        console.error(
            "Error:",
            error
        );

        console.error(
            "========================================"
        );


        throw error;
    }
};


// ============================================
// EXPORT
// ============================================

module.exports = {

    generateTopicsFromChapter,

    generateTopicLearningContent,

    generateTopicTest,

    generateTopicFlashcards,

    generatePersonalizedStudyPlan
};