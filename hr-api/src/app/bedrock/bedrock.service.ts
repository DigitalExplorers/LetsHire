import { Injectable, InternalServerErrorException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../user-role/entities/user.role.entity';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { ChatBedrockConverse } from '@langchain/aws';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { buildPromptMessages, mcqPrompt } from './prompt-builder.util';
import { AdminUser } from '../users/entities/users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../quiz/entities/quiz.entity';
import { Option } from '../quiz/entities/option.entity';
import * as JSON5 from 'json5';

const DEFAULT_BEDROCK_MODEL_ID = 'apac.amazon.nova-pro-v1:0';

@Injectable()
export class BedrockService {
    private readonly logger = new Logger(BedrockService.name);

    private readonly modelId: string;
    private readonly client: BedrockRuntimeClient;
    private readonly llm: ChatBedrockConverse;
    private readonly parser = new JsonOutputParser();
    private readonly chain;

    constructor(
        @InjectRepository(Quiz)
        private quizRepository: Repository<Quiz>,

        @InjectRepository(Option)
        private optionRepository: Repository<Option>,
        @InjectRepository(UserRole)
        private roleRepository: Repository<UserRole>,

        @InjectRepository(AdminUser)
        private readonly adminUserRepo: Repository<AdminUser>,

        private readonly configService: ConfigService,
    ) {
        this.modelId =
            this.configService.get<string>('BEDROCK_MODEL_ID') ?? DEFAULT_BEDROCK_MODEL_ID;

        this.client = new BedrockRuntimeClient({
            region: this.configService.get<string>('AWS_REGION'),
        });

        this.llm = new ChatBedrockConverse({
            model: this.modelId,
            region:
                this.configService.get<string>('BEDROCK_AWS_REGION') ?? 'ap-south-1',
            maxTokens: 9216,
            temperature: 0.5,
            topP: 0.9,
        });

        this.chain = mcqPrompt.pipe(this.llm).pipe(this.parser);
    }

    private getErrorMessage(err: unknown): string {
        return err instanceof Error ? err.message : String(err);
    }

    private safeParseQuestions(raw: string): any[] {
        try {
            const cleaned = raw
                .replace(/^```json/gm, '')
                .replace(/^```/gm, '')
                .trim();

            const start = cleaned.indexOf('[');
            const end = cleaned.lastIndexOf(']');
            if (start === -1 || end === -1) throw new Error('No valid array block found');

            const arrayStr = cleaned.slice(start, end + 1); // Extract just the array
            const wrapper = `{ "questions": ${arrayStr} }`; // Wrap to be parseable

            const parsed = JSON5.parse(wrapper);
            return Array.isArray(parsed.questions) ? parsed.questions : [];
        } catch (err) {
            console.warn('Partial parse failed:', this.getErrorMessage(err));
            return [];
        }
    }

    private normalize(text: string): string {
        return text.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
    }

    async extractTopicsFromJobDescription(jobDescription: string): Promise<string[]> {
        const prompt = `
      You are a helpful assistant. Analyze the following job description and extract 5-10 concise, relevant technical topics or goals the job focuses on. Return only the list of topics as a JSON array of strings.
      
      Job Description:
      ${jobDescription}
      
      Return format:
      ["Topic 1", "Topic 2", "Topic 3", ...]
        `.trim();

        const command = new ConverseCommand({
            modelId: this.modelId,
            system: [{ text: "Extract topics from job descriptions." }],
            messages: [{ role: 'user', content: [{ text: prompt }] }],
            inferenceConfig: {
                maxTokens: 1024,
                temperature: 0.5
            }
        });

        try {
            const response = await this.client.send(command);
            const raw = response.output?.message?.content?.[0]?.text || '';

            // Try parsing a JSON array from the response
            const start = raw.indexOf('[');
            const end = raw.lastIndexOf(']');
            if (start === -1 || end === -1) throw new Error('Invalid format');
            const jsonStr = raw.slice(start, end + 1);
            const topics = JSON5.parse(jsonStr);

            if (!Array.isArray(topics)) throw new Error('Not an array');
            return topics;
        } catch (err) {
            this.logger.error('Failed to extract topics:', this.getErrorMessage(err));
            return [];
        }
    }


    async generateQuestions(userRole: UserRole, numQuestions: number, adminId: string, organizationId: string) {
        const admin = await this.adminUserRepo.findOne({ where: { id: adminId } });
        if (!admin) {
            return { success: false, message: 'Invalid adminId' };
        }
        // Fetch previous memory for prompt-level deduplication
        const pastQuestions = await this.quizRepository.find({
            where: { role: { id: userRole.id } },
        });
        // const memory = pastQuestions.map((q) => q.question.toLowerCase().trim());
        let memory = pastQuestions
            // .slice(0, 30) // Instead of 50+
            .map((q) => this.normalize(q.question));
        console.log("memory ", memory);

        const maxAttempts = 3;
        let attempt = 0;
        let questions: any[] = [];
        let result: any = null;
        let currentNumQuestions = numQuestions;

        while (attempt < maxAttempts) {
            attempt++;
            this.logger.log(`Attempt ${attempt}: generating ${currentNumQuestions} questions...`);

            const topics = await this.extractTopicsFromJobDescription(userRole.description);
            console.log("topics ", topics);
            const input = buildPromptMessages(userRole, currentNumQuestions, memory, topics);
            console.log("prompt input", input);

            try {
                result = await this.chain.invoke(input);
                questions = result?.questions || [];

                if (questions.length) {
                    break; // success
                } else {
                    this.logger.warn('No valid questions parsed. Retrying with fewer...');
                    currentNumQuestions = Math.max(5, Math.floor(currentNumQuestions * 0.75));
                    memory = memory.slice(0, Math.floor(memory.length * 0.75));
                }
            } catch (err) {
                this.logger.error(`Attempt ${attempt} failed: ${this.getErrorMessage(err)}`);
                currentNumQuestions = Math.max(5, Math.floor(currentNumQuestions * 0.75));
                memory = memory.slice(0, Math.floor(memory.length * 0.75));
            }
        }

        // All attempts failed
        if (!questions.length) {
            return {
                success: false,
                message: 'Failed to generate valid questions after multiple attempts.',
            };
        }

        // Proceed to save valid questions
        const savedQuizzes: Quiz[] = [];

        for (const q of questions) {
            // const text = q.question?.trim().toLowerCase();
            const cleanedText = this.normalize(q.question);
            if (!q.question || !Array.isArray(q.options)) {
                this.logger.warn(`Skipping invalid format: ${JSON.stringify(q)}`);
                continue;
            }

            if (memory.includes(cleanedText)) {
                this.logger.log(`Prompt-level duplicate: ${q.question}`);
                continue;
            }

            const exists = await this.quizRepository.findOne({
                where: {
                    question: q.question,
                    role: { id: userRole.id },
                },
            });

            if (exists) {
                this.logger.log(`DB-level duplicate: ${q.question}`);
                continue;
            }

            const quiz = this.quizRepository.create({
                question: q.question,
                role: userRole,
                createdBy: admin,
                organization: { id: organizationId },
            });
            await this.quizRepository.save(quiz);

            for (const opt of q.options) {
                const option = this.optionRepository.create({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    quiz,
                });
                await this.optionRepository.save(option);
            }

            savedQuizzes.push(quiz);
        }

        return {
            success: true,
            role: userRole.name,
            createdBy: admin.name,
            created: savedQuizzes.length,
            skippedDuplicates: (questions.length ?? 0) - savedQuizzes.length,
            originalRequested: numQuestions,
            finalGenerated: currentNumQuestions,
            attempts: attempt,
            questions: result?.questions || [],
        };
    }


    async generateMoreQuestionsForRole(roleId: string, numQuestions: number, adminId: string, organizationId: string) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, createdBy: { id: adminId } },
        });

        if (!role) {
            throw new NotFoundException('Role not found or access denied');
        }

        try {
            const result = await this.generateQuestions(role, numQuestions, adminId, organizationId);
            return {
                success: true,
                createdBy: result.createdBy,
                created: result.created,
                message: `${result.created} new questions generated.`,
                skippedDuplicates: result.skippedDuplicates,
                originalRequested: result.originalRequested,
                finalGenerated: result.finalGenerated,
                attempts: result.attempts,
                questions: result.questions
            };
        } catch (err) {
            console.error('Error generating more questions:', this.getErrorMessage(err));
            throw new InternalServerErrorException('Failed to generate more questions');
        }
    }

    async regenerateQuestionsForRole(roleId: string, numQuestions: number, adminId: string, organizationId: string) {
        const role = await this.roleRepository.findOne({
            where: { id: roleId, createdBy: { id: adminId } },
            relations: ['organization', 'quizzes'],
        });

        if (!role) {
            throw new NotFoundException('Role not found or access denied');
        }

        // Step 1: Mark all old questions as inactive (do not delete)
        const oldQuizzes = await this.quizRepository.find({
            where: { role: { id: roleId } },
        });

        for (const quiz of oldQuizzes) {
            quiz.status = 'inactive';
            await this.quizRepository.save(quiz);
        }

        // Step 2: Generate new questions
        try {
            const result = await this.generateQuestions(role, numQuestions, adminId, organizationId);
            return {
                success: true,
                createdBy: result.createdBy,
                created: result.created,
                message: `Old questions removed. ${result.created} new questions regenerated.`,
                skippedDuplicates: result.skippedDuplicates,
                originalRequested: result.originalRequested,
                finalGenerated: result.finalGenerated,
                attempts: result.attempts,
                questions: result.questions
            };
        } catch (err) {
            console.error('Error regenerating questions:', this.getErrorMessage(err));
            throw new InternalServerErrorException('Failed to regenerate questions');
        }
    }


}
