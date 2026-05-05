import { ChatPromptTemplate } from '@langchain/core/prompts';
import { UserRole } from '../user-role/entities/user.role.entity';

function getDifficultyLevelFromExperience(exp: number | null | undefined): 'Beginner' | 'Intermediate' | 'Advanced' {
  if (!exp || exp <= 1) return 'Beginner';
  if (exp >= 2 && exp <= 4) return 'Intermediate';
  return 'Advanced';
}

export function buildPromptMessages(role: UserRole, numQuestions: number, memory: string[] = [], topics: string[] = []) {
  const difficulty = getDifficultyLevelFromExperience(role.experienceRequired);
  const memoryBlock = memory.length
    ? `Avoid repeating or rephrasing any of the following:\n${memory.join('\n')}`
    : 'Ensure all questions are unique.';
  
    const topicsBlock = topics.length > 0 ? topics : ['general software engineering'];


  return {
    memory_block: memoryBlock,
    role: role.name,
    experience_level: `${role.experienceRequired ?? 0} years (${difficulty})`,
    topics: topicsBlock,
    num_questions: `Generate ${numQuestions} UNIQUE MCQs for the role "${role.name}"`,
    question: 'Start generating 50 MCQ questions which are unique of past_questions'
  };
}

export const mcqPrompt = ChatPromptTemplate.fromMessages([
  ['system', `
    You are an AI tutor that generates high-quality multiple-choice questions (MCQs).

    CRITICAL RULES:
    - DO NOT repeat, rephrase, or paraphrase ANY of the following questions.
    - Your output will be discarded if even ONE duplicate appears.
    - Rewording, changing synonyms, or altering structure is NOT acceptable if the meaning is the same.
    - Treat all items in the <memory_block> as banned ideas.


    <context>
      {memory_block}

      ROLE: {role}
      EXPERIENCE: {experience_level}
      Topics: {topics}

      Generate {num_questions} unique MCQs:
      - Each should be entirely new in concept, not semantically related to any previous question.
      - Format as strict JSON (see below).
    </context>

    Return JSON only:

    {{
      "questions": [
        {{
          "question": "...",
          "options": [
            {{ "text": "...", "isCorrect": false }},
            {{ "text": "...", "isCorrect": true }},
            ...
          ]
        }}
      ]
    }}

    Do NOT include markdown or commentary. Return ONLY JSON.`.trim()],
  ['user', '{question}']
]);
