import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1776333694605 implements MigrationInterface {
    name = 'InitialSchema1776333694605'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "website" character varying, "contactEmail" character varying, "contactPhone" character varying, "address" character varying, "logoUrl" character varying, "bgImageUrl" character varying, "primaryColor" character varying, "policy" character varying, "status" character varying NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c21e615583a3ebbb0977452afb0" UNIQUE ("name"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "interview" ("id" SERIAL NOT NULL, "round" integer NOT NULL DEFAULT '1', "feedback" text, "score" double precision, "status" character varying NOT NULL DEFAULT 'Pending', "scheduledDate" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer, "interviewerId" integer, "createdById" integer, "organizationId" integer, CONSTRAINT "PK_44c49a4feadefa5c6fa78bfb7d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "interviewer" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "email" character varying NOT NULL, "skills" text NOT NULL, "department" character varying NOT NULL, "availability" character varying NOT NULL DEFAULT 'Available', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" integer, "organizationId" integer, CONSTRAINT "UQ_7e361bf20cba2cfb9f707cdb241" UNIQUE ("email"), CONSTRAINT "PK_352d642efb1fa333420aa07205c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "option" ("id" SERIAL NOT NULL, "text" character varying NOT NULL, "isCorrect" boolean NOT NULL, "quizId" integer, CONSTRAINT "PK_e6090c1c6ad8962eea97abdbe63" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quiz" ("id" SERIAL NOT NULL, "question" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'active', "round" integer NOT NULL DEFAULT '1', "roleId" integer, "createdById" integer, "organizationId" integer, CONSTRAINT "PK_422d974e7217414e029b3e641d0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying, "experienceRequired" integer, "createdById" integer, "organizationId" integer, CONSTRAINT "PK_fb2e442d14add3cefbdf33c4561" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "candidate" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "countryCode" character varying, "phoneNumber" character varying NOT NULL, "email" character varying NOT NULL, "qualification" character varying, "yearOfPassedOut" integer, "passPercentage" double precision, "otp" integer NOT NULL, "currentCity" character varying, "desiredRole" character varying, "workExperience" integer, "resume" character varying, "idProof" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "score" integer NOT NULL DEFAULT '0', "secondRoundScore" integer NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'Applied', "videoPath" character varying, "videoAnalysis" jsonb, "interviewScheduledAt" TIMESTAMP, "application_stage" character varying NOT NULL DEFAULT 'registered', "attempt_number" integer NOT NULL DEFAULT '1', "secondRoundAttemptNumber" integer NOT NULL DEFAULT '0', "secondRoundFinalized" boolean NOT NULL DEFAULT false, "finalized" boolean NOT NULL DEFAULT false, "otpVerifiedAt" TIMESTAMP, "testCompletedAt" TIMESTAMP, "videoSubmittedAt" TIMESTAMP, "admin_user_id" integer, "roleId" integer, "assignedInterviewerId" integer, "organizationId" integer, CONSTRAINT "UQ_d04bb5f6724186b6478c08d8bc3" UNIQUE ("email", "admin_user_id"), CONSTRAINT "PK_b0ddec158a9a60fbc785281581b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "feedback" ("id" SERIAL NOT NULL, "comment" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer, "submittedById" integer, CONSTRAINT "PK_8389f9e087a57689cd5be8b2b13" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "displayName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "isSuperAdmin" boolean NOT NULL DEFAULT false, "organizationId" integer, "roleId" integer, CONSTRAINT "UQ_ddfb7904324cdba38d3c73de93a" UNIQUE ("email", "organizationId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "registration_link" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "adminId" integer NOT NULL, "organizationId" integer NOT NULL, "roleId" integer NOT NULL, "examStartTime" TIMESTAMP, "examEndTime" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f7d3094c261e0e244c83e6428b5" UNIQUE ("token"), CONSTRAINT "PK_f4b4bf4eb64c220b2d46e268318" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "score" ("id" SERIAL NOT NULL, "score" integer NOT NULL, "userId" integer, CONSTRAINT "PK_1770f42c61451103f5514134078" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "quiz_config" ("id" SERIAL NOT NULL, "numberOfQuestions" integer NOT NULL DEFAULT '20', "timePerQuestionInSeconds" integer NOT NULL DEFAULT '45', "roleId" integer, "createdById" integer, "organizationId" integer, CONSTRAINT "PK_ce2ff12b236275a51a24dedcb4d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "candidate_test_attempt" ("id" SERIAL NOT NULL, "isCorrect" boolean NOT NULL DEFAULT false, "round" integer NOT NULL DEFAULT '1', "question_status" character varying, "attemptedAt" TIMESTAMP NOT NULL DEFAULT now(), "candidateId" integer, "quizId" integer, "selectedOptionId" integer, CONSTRAINT "PK_bc1f0e6e23009ba731756795500" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reset_token" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "token" character varying NOT NULL, "expires" TIMESTAMP NOT NULL, CONSTRAINT "PK_93e1171b4a87d2d0478295f1a99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "admin_role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_64731f1d2dc5072a911fd206ac3" UNIQUE ("name"), CONSTRAINT "PK_fd32421f2d93414e46a8fcfd86b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "interview" ADD CONSTRAINT "FK_18cc27524dc11b3ef4ba4001a42" FOREIGN KEY ("candidateId") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interview" ADD CONSTRAINT "FK_540ce8c6be84d9286b5cd0de493" FOREIGN KEY ("interviewerId") REFERENCES "interviewer"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interview" ADD CONSTRAINT "FK_aca2c6a0ad56530c31220820f56" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interview" ADD CONSTRAINT "FK_5f95724a85c45e62ab642a0a13b" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interviewer" ADD CONSTRAINT "FK_4dc18e9266229962139ce8938fa" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "interviewer" ADD CONSTRAINT "FK_b5dc10d9b91508154083cf59dec" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "option" ADD CONSTRAINT "FK_bf1eab460a1ae7ff6f099166c59" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz" ADD CONSTRAINT "FK_1ad4db4e6d1d244eb33c4e85e27" FOREIGN KEY ("roleId") REFERENCES "user_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz" ADD CONSTRAINT "FK_fc8816eda592f8df0f4c1786960" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz" ADD CONSTRAINT "FK_53b352c6d6aab6cd177f610e417" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_c21047f02971482ebcce5620627" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role" ADD CONSTRAINT "FK_339e1acb0a796455e23593e6bb9" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate" ADD CONSTRAINT "FK_22c18502cee4a334202d8d7b86a" FOREIGN KEY ("roleId") REFERENCES "user_role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate" ADD CONSTRAINT "FK_0b70ba33e49d30fb0b37df567c1" FOREIGN KEY ("assignedInterviewerId") REFERENCES "interviewer"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate" ADD CONSTRAINT "FK_16fb27ffd1a99c6506c92ad57a7" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD CONSTRAINT "FK_7ed9735199bbf7067f3ea3a28a6" FOREIGN KEY ("candidateId") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feedback" ADD CONSTRAINT "FK_90b3ff2f58b5d9894df65dd8d63" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_368e146b785b574f42ae9e53d5e" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "score" ADD CONSTRAINT "FK_327e5a5890df4462edf4ac9fa30" FOREIGN KEY ("userId") REFERENCES "candidate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_config" ADD CONSTRAINT "FK_4feb3d0e9f5121800f168413e63" FOREIGN KEY ("roleId") REFERENCES "user_role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_config" ADD CONSTRAINT "FK_616ecaf9c4de695aa6998110c64" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "quiz_config" ADD CONSTRAINT "FK_a5cc34d0adfb702254ec60efb8f" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" ADD CONSTRAINT "FK_faaaf6135b255055886c65c08ae" FOREIGN KEY ("candidateId") REFERENCES "candidate"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" ADD CONSTRAINT "FK_f75605458a9e7caab3262a80dfd" FOREIGN KEY ("quizId") REFERENCES "quiz"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" ADD CONSTRAINT "FK_0283d86d7bbc331c8ced2e6729e" FOREIGN KEY ("selectedOptionId") REFERENCES "option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" DROP CONSTRAINT "FK_0283d86d7bbc331c8ced2e6729e"`);
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" DROP CONSTRAINT "FK_f75605458a9e7caab3262a80dfd"`);
        await queryRunner.query(`ALTER TABLE "candidate_test_attempt" DROP CONSTRAINT "FK_faaaf6135b255055886c65c08ae"`);
        await queryRunner.query(`ALTER TABLE "quiz_config" DROP CONSTRAINT "FK_a5cc34d0adfb702254ec60efb8f"`);
        await queryRunner.query(`ALTER TABLE "quiz_config" DROP CONSTRAINT "FK_616ecaf9c4de695aa6998110c64"`);
        await queryRunner.query(`ALTER TABLE "quiz_config" DROP CONSTRAINT "FK_4feb3d0e9f5121800f168413e63"`);
        await queryRunner.query(`ALTER TABLE "score" DROP CONSTRAINT "FK_327e5a5890df4462edf4ac9fa30"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_368e146b785b574f42ae9e53d5e"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_90b3ff2f58b5d9894df65dd8d63"`);
        await queryRunner.query(`ALTER TABLE "feedback" DROP CONSTRAINT "FK_7ed9735199bbf7067f3ea3a28a6"`);
        await queryRunner.query(`ALTER TABLE "candidate" DROP CONSTRAINT "FK_16fb27ffd1a99c6506c92ad57a7"`);
        await queryRunner.query(`ALTER TABLE "candidate" DROP CONSTRAINT "FK_0b70ba33e49d30fb0b37df567c1"`);
        await queryRunner.query(`ALTER TABLE "candidate" DROP CONSTRAINT "FK_22c18502cee4a334202d8d7b86a"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_339e1acb0a796455e23593e6bb9"`);
        await queryRunner.query(`ALTER TABLE "user_role" DROP CONSTRAINT "FK_c21047f02971482ebcce5620627"`);
        await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_53b352c6d6aab6cd177f610e417"`);
        await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_fc8816eda592f8df0f4c1786960"`);
        await queryRunner.query(`ALTER TABLE "quiz" DROP CONSTRAINT "FK_1ad4db4e6d1d244eb33c4e85e27"`);
        await queryRunner.query(`ALTER TABLE "option" DROP CONSTRAINT "FK_bf1eab460a1ae7ff6f099166c59"`);
        await queryRunner.query(`ALTER TABLE "interviewer" DROP CONSTRAINT "FK_b5dc10d9b91508154083cf59dec"`);
        await queryRunner.query(`ALTER TABLE "interviewer" DROP CONSTRAINT "FK_4dc18e9266229962139ce8938fa"`);
        await queryRunner.query(`ALTER TABLE "interview" DROP CONSTRAINT "FK_5f95724a85c45e62ab642a0a13b"`);
        await queryRunner.query(`ALTER TABLE "interview" DROP CONSTRAINT "FK_aca2c6a0ad56530c31220820f56"`);
        await queryRunner.query(`ALTER TABLE "interview" DROP CONSTRAINT "FK_540ce8c6be84d9286b5cd0de493"`);
        await queryRunner.query(`ALTER TABLE "interview" DROP CONSTRAINT "FK_18cc27524dc11b3ef4ba4001a42"`);
        await queryRunner.query(`DROP TABLE "admin_role"`);
        await queryRunner.query(`DROP TABLE "reset_token"`);
        await queryRunner.query(`DROP TABLE "candidate_test_attempt"`);
        await queryRunner.query(`DROP TABLE "quiz_config"`);
        await queryRunner.query(`DROP TABLE "score"`);
        await queryRunner.query(`DROP TABLE "registration_link"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "role"`);
        await queryRunner.query(`DROP TABLE "feedback"`);
        await queryRunner.query(`DROP TABLE "candidate"`);
        await queryRunner.query(`DROP TABLE "user_role"`);
        await queryRunner.query(`DROP TABLE "quiz"`);
        await queryRunner.query(`DROP TABLE "option"`);
        await queryRunner.query(`DROP TABLE "interviewer"`);
        await queryRunner.query(`DROP TABLE "interview"`);
        await queryRunner.query(`DROP TABLE "organization"`);
    }

}
