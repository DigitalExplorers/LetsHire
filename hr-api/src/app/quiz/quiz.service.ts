import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { QuizConfig } from './entities/quiz-config.entity';
import { Option } from './entities/option.entity';
import { Candidate } from '../candidate/entities/candidate.entity';
import { Score } from './entities/score.entity';
import * as xlsx from 'xlsx'; // Import XLSX
import * as fs from 'fs'; // Import File System (fs)
import { UserRole } from '../user-role/entities/user.role.entity';
import { AdminUser } from '../users/entities/users.entity';
import { CandidateTestAttempt } from './entities/candidate-test-attempt.entity';

interface QuizRow {
  Question: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  CorrectOption: string;
  Round?: number | string;
}

type QuestionOptionMap = Record<string, { id: number; text: string }>;

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,

    @InjectRepository(Option)
    private optionRepository: Repository<Option>,

    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,

    @InjectRepository(Candidate)
    private candidateRepo: Repository<Candidate>,

    @InjectRepository(QuizConfig)
    private quizConfigRepository: Repository<QuizConfig>,

    @InjectRepository(UserRole)
    private roleRepository: Repository<UserRole>,

    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,

    @InjectRepository(CandidateTestAttempt)
    private attemptRepo: Repository<CandidateTestAttempt>,
  ) { }


  /**
   * Fetch all quiz questions with options
   */
  async getQuestions(adminId: number) {

    // Step 1: Fetch the quiz configuration
    const config = await this.getQuizConfig(adminId);
    const numberOfQuestions = config.numberOfQuestions;

    // Step 2: Fetch questions created by this admin
    const allQuestions = await this.quizRepository.find({
      where: { createdBy: { id: adminId }, status: 'active' },
      relations: ['options'],
    });

    if (allQuestions.length === 0) {
      return allQuestions;
    }

    // Step 3: Shuffle questions
    const shuffledQuestions = this.fisherYatesShuffle(allQuestions);

    // Step 4: Select top N questions based on config
    const selectedQuestions = shuffledQuestions.slice(0, numberOfQuestions);

    // Step 5: Format response
    return selectedQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.reduce<QuestionOptionMap>((acc, option, index) => {
        const key = String.fromCharCode(97 + index); // 'a', 'b', 'c', 'd'
        acc[key] = { id: option.id, text: option.text };
        return acc;
      }, {}),
    }));
  }

  async getQuestionsByRoleToAPP(roleId: number, adminId: number, candidateId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const candidate = await this.candidateRepo.findOne({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Candidate not found');

    // Save test attempt
    const isShortlisted = candidate.status === 'Shortlisted';
    const round = isShortlisted ? 2 : 1

    const config = await this.getQuizConfigByRole(roleId, adminId);
    const numberOfQuestions = config.numberOfQuestions;

    const allQuestions = await this.quizRepository.find({
      where: { role: { id: roleId }, createdBy: { id: adminId }, status: 'active', round },
      relations: ['options'],
    });

    if (allQuestions.length === 0) {
      return allQuestions;
    }

    const shuffled = this.fisherYatesShuffle(allQuestions);
    const selected = shuffled.slice(0, numberOfQuestions);


    // Pre-create unattempted records
    for (const question of selected) {
      const existingAttempt = await this.attemptRepo.findOne({
        where: { candidate: { id: candidateId }, quiz: { id: question.id }, round }
      });

      if (!existingAttempt) {
        const newAttempt = this.attemptRepo.create({
          candidate,
          quiz: question,
          selectedOption: null,
          isCorrect: false,
          round: round,
          question_status: "unattempted",
        });
        await this.attemptRepo.save(newAttempt);
      }
    }

    return selected.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.reduce<QuestionOptionMap>((acc, option, idx) => {
        const key = String.fromCharCode(97 + idx); // a, b, c, d
        acc[key] = { id: option.id, text: option.text };
        return acc;
      }, {}),
    }));
  }

  async getQuestionCountByRole(roleId?: number, adminId?: number, candidatedId?: number): Promise<number> {
    try {
      if (roleId && adminId !== undefined && candidatedId !== undefined) {
        const totalQuestionsServed = await this.getQuestionsByRoleToAPP(roleId, adminId, candidatedId);
        console.log(totalQuestionsServed);
        return totalQuestionsServed.length;
      }
      return 0;
    } catch {
      return 0;
    }
  };


  /**
   * Fisher-Yates shuffle algorithm for randomizing the array
   */
  private fisherYatesShuffle<T>(array: T[]): T[] {
    const shuffledArray = [...array]; // Copy array
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Get random index
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]]; // Swap elements
    }
    return shuffledArray;
  }



  async validateAnswer(quizId: number, selectedOptionId: number) {
    const selectedOption = await this.optionRepository.findOne({ where: { id: selectedOptionId } });

    if (!selectedOption) {
      return { message: 'Invalid Option Selected' };
    }

    return {
      isCorrect: selectedOption.isCorrect,
      message: selectedOption.isCorrect ? 'Correct Answer' : 'Wrong Answer',
    };
  }

  /**
   * Validate user's selected answer
   */
  async validateUserSelectedAnswer(quizId: number, selectedOptionId: number | null, userId: number, skipped: boolean = false) {
    
    const user = await this.candidateRepo.findOne({ where: { id: userId } });
    if (!user) return { message: 'User not found' };
    
    const quiz = await this.quizRepository.findOne({ where: { id: quizId } });
    if (!quiz) return { message: 'Quiz not found' };

    const isShortlisted = user.status === 'Shortlisted';
    const round = isShortlisted ? 2 : 1;

    // Fetch the pre-created attempt
    let attempt = await this.attemptRepo.findOne({
      where: { candidate: { id: userId }, quiz: { id: quizId }, round }
    });

    if (!attempt) {
      // fallback if no pre-created, create new
      attempt = this.attemptRepo.create({
        candidate: user,
        quiz: quiz,
        round: round,
        question_status: 'unattempted'
      });
    }
    let isCorrect = false;
    let selectedOption: Option | null = null;

    if (!skipped && selectedOptionId) {
      selectedOption = await this.optionRepository.findOne({ where: { id: selectedOptionId } });
      if (!selectedOption) return { message: 'Invalid Option Selected' };

      isCorrect = selectedOption.isCorrect;
      attempt.selectedOption = selectedOption;
      attempt.isCorrect = isCorrect;
      attempt.question_status = 'answered';
    } else {
      // explicitly marked as skipped
      attempt.selectedOption = null;
      attempt.isCorrect = false;
      attempt.question_status = 'skipped';
    }

    await this.attemptRepo.save(attempt);
  
    // Update user score only if correct
    if (isCorrect) {
      if (isShortlisted) {
        user.secondRoundScore = (user.secondRoundScore || 0) + 1;
      } else {
        user.score += 1;
      }
      await this.candidateRepo.save(user);
    }

    return {};
  }

  async submitScore(userId: number, score: number) {
    const user = await this.candidateRepo.findOne({ where: { id: userId } });

    if (!user) {
      return { message: 'User not found' };
    }

    const newScore = this.scoreRepository.create({ user, score });
    await this.scoreRepository.save(newScore);

    return { message: 'Score Submitted Successfully' };
  }

  async submitQuiz(userId: number, answers: Record<number, string>) {
    let score = 0;

    for (const [quizId, optionKey] of Object.entries(answers)) {
      const question = await this.quizRepository.findOne({ where: { id: parseInt(quizId) }, relations: ['options'] });

      if (!question) continue;

      const correctOption = question.options.find((option) => option.isCorrect);
      const selectedOption = question.options.find((option, index) => String.fromCharCode(97 + index) === optionKey);

      if (selectedOption && selectedOption.id === correctOption?.id) {
        score += 1;
      }
    }

    //  Store score in `score` table
    const newScore = this.scoreRepository.create({ user: { id: userId }, score });
    await this.scoreRepository.save(newScore);

    //  Update `user` table with latest score
    const user = await this.candidateRepo.findOne({ where: { id: userId } });
    if (user) {
      user.score = score;
      await this.candidateRepo.save(user);
    }

    return { score };
  }

  /**
   * Get leaderboard (Top 10 users with highest scores)
   */
  async getLeaderboard() {
    return this.candidateRepo.find({ order: { score: 'DESC' }, take: 10 });
  }

  async getLeaderboardWithUser() {
    return this.scoreRepository.find({
      relations: ['user'],
      order: { score: 'DESC' },
      take: 10,
    });
  }


  /** Add a new question with options */
  async addQuestion(
    questionText: string,
    optionsData: { text: string; isCorrect: boolean }[],
    adminId: number,
    roleId: number
  ) {
    // Step 1: Find role
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException("Invalid role ID");
    }

    // Step 2: Create quiz
    const question = new Quiz();
    question.question = questionText;
    question.createdBy = { id: adminId } as any;
    question.role = role;

    const savedQuiz = await this.quizRepository.save(question);

    // Step 3: Add options
    for (const opt of optionsData) {
      const option = new Option();
      option.text = opt.text;
      option.isCorrect = opt.isCorrect;
      option.quiz = savedQuiz;
      await this.optionRepository.save(option);
    }

    return {
      message: "Question added successfully",
      question: savedQuiz,
    };
  }


  /** Update an existing question */
  async updateQuestion(
    id: number,
    questionText: string,
    optionsData: { id: number; text: string; isCorrect: boolean }[],
    adminId: number
  ) {
    const question = await this.quizRepository.findOne({
      where: { id },
      relations: ['options', 'createdBy'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Step 2: Check Admin-specific access
    if (question.createdBy.id !== adminId) {
      throw new UnauthorizedException('You are not authorized to update this question');
    }
    // Step 3: Update question text
    question.question = questionText;
    await this.quizRepository.save(question);
    for (const opt of optionsData) {
      const option = await this.optionRepository.findOne({ where: { id: opt.id } });
      if (option && option.quiz.id === question.id) { // Extra check to ensure option belongs to the question
        option.text = opt.text;
        option.isCorrect = opt.isCorrect;
        await this.optionRepository.save(option);
      }
    }

    return { message: "Question updated successfully", question };
  }

  /** Delete a question and its options */
  async deleteQuestion(id: number, adminId: number) {
    const question = await this.quizRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
  
    if (!question) {
      throw new NotFoundException('Question not found');
    }
  
    // Admin-specific data isolation check
    if (question.createdBy.id !== adminId) {
      throw new UnauthorizedException('You are not authorized to delete this question');
    }
  
    // Instead of removing, mark as inactive
    question.status = 'inactive';
    await this.quizRepository.save(question);
  
    return { message: "Question marked as inactive successfully" };
  }
  

  async getAllQuestions(adminId: number) {
    const questions = await this.quizRepository.find({
      where: { createdBy: { id: adminId }, status: 'active' },
      relations: ['options'],
    });
    return questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    }));
  }

  /**
   * Get total number of questions
  */
  async getTotalQuestionsCount(adminId: number): Promise<number> {
    const totalQuestionsServed = await this.getQuestions(adminId);
    return totalQuestionsServed.length;
  }

  async processUploadedFile(file: Express.Multer.File, adminId: number) {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const data: QuizRow[] = xlsx.utils.sheet_to_json<QuizRow>(workbook.Sheets[sheetName]);

      if (!data || data.length === 0) {
        throw new BadRequestException('Uploaded file is empty!');
      }
  
      const admin = await this.adminRepo.findOne({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Admin user not found');
      }
  
      const formattedQuestions = [];

      for (const row of data) {
        if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectOption) {
          continue;
        }

        const questionObj = {
          question: row.Question,
          options: [
            { text: row.OptionA, isCorrect: String(row.OptionA).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
            { text: row.OptionB, isCorrect: String(row.OptionB).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
            { text: row.OptionC, isCorrect: String(row.OptionC).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
            { text: row.OptionD, isCorrect: String(row.OptionD).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() }
          ]
        };

        formattedQuestions.push(questionObj);
      }

      for (const q of formattedQuestions) {
        const newQuiz = this.quizRepository.create({
          question: q.question,
          createdBy: admin,
        });
  
        const savedQuiz = await this.quizRepository.save(newQuiz);
  
        for (const opt of q.options) {
          const newOption = this.optionRepository.create({
            text: opt.text,
            isCorrect: opt.isCorrect,
            quiz: savedQuiz,
          });
          await this.optionRepository.save(newOption);
        }
      }

      fs.unlinkSync(file.path);

      return {
        message: 'Questions uploaded successfully',
        totalQuestions: formattedQuestions.length,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw new BadRequestException('Error processing file. Please check the format.');
    }
  }

  /**
   * Process File Upload and Assign Role to Questions
   */
  async processUploadedFileByRole(
    file: Express.Multer.File,
    roleId: number,
    adminId: number
  ) {
    try {
      const workbook = xlsx.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const data: QuizRow[] = xlsx.utils.sheet_to_json<QuizRow>(workbook.Sheets[sheetName]);

      if (!data || data.length === 0) {
        throw new BadRequestException('Uploaded file is empty!');
      }

      const admin = await this.adminRepo.findOne({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Admin user not found');
      }

      const formattedQuestions = [];

      for (const row of data) {
        if (!row.Question || !row.OptionA || !row.OptionB || !row.OptionC || !row.OptionD || !row.CorrectOption || !row.Round) {
          continue;
        }

        const roundNumber = parseInt(row.Round as string) || 1;

        const options = [
          { text: row.OptionA, isCorrect: String(row.OptionA).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
          { text: row.OptionB, isCorrect: String(row.OptionB).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
          { text: row.OptionC, isCorrect: String(row.OptionC).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
          { text: row.OptionD, isCorrect: String(row.OptionD).trim().toLowerCase() === String(row.CorrectOption).trim().toLowerCase() },
        ];

        formattedQuestions.push({ question: row.Question, options, round: roundNumber });
      }

      for (const q of formattedQuestions) {
        await this.addQuestionByRole(q.question, roleId, q.options, adminId, q.round);
      }

      fs.unlinkSync(file.path);

      return {
        message: 'Questions uploaded successfully',
        totalQuestions: formattedQuestions.length,
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw new BadRequestException('Error processing file. Please check the format.');
    }
  }

  // Get current quiz configuration
  async getQuizConfig(adminId: number): Promise<{ numberOfQuestions: number }> {
    let config = await this.quizConfigRepository.findOne({
      where: { createdBy: { id: adminId } },
    });

    // If no config exists, create a default one
    if (!config) {
      const admin = await this.adminRepo.findOne({ where: { id: adminId } });
      if (!admin) throw new NotFoundException('Admin not found');
  
      config = this.quizConfigRepository.create({
        numberOfQuestions: 20,
        createdBy: admin,
      });
      await this.quizConfigRepository.save(config);
    }

    return { numberOfQuestions: config.numberOfQuestions };
  }

  async getQuizConfigByRole(roleId: number, adminId: number): Promise<{ numberOfQuestions: number, timePerQuestionInSeconds:number }> {
    let config = await this.quizConfigRepository.findOne({
      where: { createdBy: { id: adminId }, role: { id: roleId } },
    });

    // If no config exists, create a default one
    if (!config) {
      const admin = await this.adminRepo.findOne({ where: { id: adminId } });
      if (!admin) throw new NotFoundException('Admin not found');

      const role = await this.roleRepository.findOne({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');


      config = this.quizConfigRepository.create({
        numberOfQuestions: 20,
        timePerQuestionInSeconds: 45,
        createdBy: admin,
        role: role,
        organization: {id: admin.organization.id}
      });
      await this.quizConfigRepository.save(config);
    }

    return { numberOfQuestions: config.numberOfQuestions, timePerQuestionInSeconds: config.timePerQuestionInSeconds };
  }

  // Update the number of questions to display
  async updateQuizConfig(newCount: number, adminId: number): Promise<{ message: string }> {
    let config = await this.quizConfigRepository.findOne({
      where: { createdBy: { id: adminId } },
    });

    if (!config) {
      const admin = await this.adminRepo.findOne({ where: { id: adminId } });
      if (!admin) throw new NotFoundException('Admin not found');
      config = this.quizConfigRepository.create({ numberOfQuestions: newCount, createdBy: admin });
    } else {
      config.numberOfQuestions = newCount;
    }

    await this.quizConfigRepository.save(config);
    return { message: `Quiz question count updated to ${newCount}` };
  }

  // Update the number of questions to display by role
  async updateQuizConfigByRole(roleId: number, newCount: number, timePerQuestionInSeconds:number, adminId: number, organizationId: number): Promise<{ message: string }> {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');

    let config = await this.quizConfigRepository.findOne({
      where: { createdBy: { id: adminId }, role: { id: roleId } },
    });

    if (!config) {
      config = this.quizConfigRepository.create({
        numberOfQuestions: 20,
        timePerQuestionInSeconds: 45,
        createdBy: admin,
        role: role,
        organization: {id: organizationId}
      });
      await this.quizConfigRepository.save(config);
    }else {
      config.numberOfQuestions = newCount;
      config.timePerQuestionInSeconds = timePerQuestionInSeconds;
    }
    await this.quizConfigRepository.save(config);

    return { message: `Quiz question count updated to ${newCount}`};
  }

  async getQuestionsForUser(userId: number) {
    const user = await this.candidateRepo.findOne({ where: { id: userId }, relations: ['role'] });
    
    if (!user) {
      throw new Error('User not found');
    }

    return await this.quizRepository.find({ where: { role: user.role, status: 'active' }, relations: ['options'] });
  }

  /**
   * Add a new question based on Role
   */
  async addQuestionByRole(
    questionText: string,
    roleId: number,
    optionsData: { text: string; isCorrect: boolean }[],
    adminId: number,
    round: number
  ) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
  
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');
  
    const question = this.quizRepository.create({
      question: questionText,
      role,
      createdBy: admin,
      round,
    });
    await this.quizRepository.save(question);

    for (const opt of optionsData) {
      const option = this.optionRepository.create({
        text: opt.text,
        isCorrect: opt.isCorrect,
        quiz: question,
      });
      await this.optionRepository.save(option);
    }

    return { message: 'Question added successfully', question };
  }

  /**
   * Fetch all quiz questions for a specific role
   */
  async getQuestionsByRole(roleId: number, adminId: number) {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const questions = await this.quizRepository.find({
      where: {
        role: { id: roleId },
        createdBy: { id: adminId },
        status: 'active',
      },
      relations: ['options'],
    });

    return questions.map((q) => ({
      question: q.question,
      options: q.options.map((opt) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    }));
  }

  async getCandidateAttempts(candidateId: number, round: number) {
    const attempts = await this.attemptRepo.find({
      where: { candidate: { id: candidateId }, round },
      relations: ['quiz', 'selectedOption', 'quiz.options'],
    });

    return attempts.map(attempt => ({
      id: attempt.id,
      question: attempt.quiz.question,
      selectedOption: attempt.selectedOption ? attempt.selectedOption.text : '-',
      correctOption: attempt.quiz.options.find(opt => opt.isCorrect)?.text || null,
      isCorrect: attempt.isCorrect,
      skipped: attempt.question_status === 'skipped',
      unattempted: attempt.question_status === 'unattempted',
      attemptedAt: attempt.attemptedAt,
    }));
  }




}
