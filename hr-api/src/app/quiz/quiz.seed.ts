import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { Option } from './entities/option.entity';

@Injectable()
export class QuizSeeder {
  constructor(
    @InjectRepository(Quiz)
    private quizRepository: Repository<Quiz>,

    @InjectRepository(Option)
    private optionRepository: Repository<Option>,
  ) {}

  async seed() {
    const questions = [
      {
        question: "What is the capital of France?",
        options: [
          { text: "Berlin", isCorrect: false },
          { text: "Madrid", isCorrect: false },
          { text: "Paris", isCorrect: true },
          { text: "Rome", isCorrect: false },
        ],
      },
      {
        question: "Which is the largest ocean on Earth?",
        options: [
          { text: "Atlantic Ocean", isCorrect: false },
          { text: "Indian Ocean", isCorrect: false },
          { text: "Pacific Ocean", isCorrect: true },
          { text: "Arctic Ocean", isCorrect: false },
        ],
      },
      {
        question: "What is the capital of Japan?",
        options: [
          { text: "Seoul", isCorrect: false },
          { text: "Beijing", isCorrect: false },
          { text: "Tokyo", isCorrect: true },
          { text: "Bangkok", isCorrect: false },
        ],
      },
      {
        question: "Which gas do plants absorb from the atmosphere?",
        options: [
          { text: "Oxygen", isCorrect: false },
          { text: "Carbon Dioxide", isCorrect: true },
          { text: "Nitrogen", isCorrect: false },
          { text: "Hydrogen", isCorrect: false },
        ],
      },
      {
        question: "What is the tallest mountain in the world?",
        options: [
          { text: "Mount Kilimanjaro", isCorrect: false },
          { text: "Mount Everest", isCorrect: true },
          { text: "K2", isCorrect: false },
          { text: "Mount Fuji", isCorrect: false },
        ],
      },
    ];

    for (const q of questions) {
      const quiz = this.quizRepository.create({ question: q.question });
      await this.quizRepository.save(quiz);

      for (const opt of q.options) {
        const option = this.optionRepository.create({
          text: opt.text,
          isCorrect: opt.isCorrect,
          quiz: quiz,
        });
        await this.optionRepository.save(option);
      }
    }

    return { message: "Seeding completed successfully" };
  }
}
