// prisma/seed.ts
// Сид базы данных: один учитель (код "ABC123") и один ученик + демо-ДЗ.
// Запуск: npm run db:seed  (использует tsx, см. package.json → prisma.seed)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  // Очистка перед сидом (порядок важен из-за внешних ключей)
  await prisma.answer.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.homework.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.teacherProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Учитель ────────────────────────────────
  const teacherPasswordHash = await bcrypt.hash('teacher123', SALT_ROUNDS);

  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@example.com',
      passwordHash: teacherPasswordHash,
      role: 'TEACHER',
    },
  });

  const teacherProfile = await prisma.teacherProfile.create({
    data: {
      userId: teacherUser.id,
      fullName: 'Иванов Иван Иванович',
      subject: 'Математика',
      teacherCode: 'ABC123',
      bio: 'Учитель алгебры и геометрии, 15 лет стажа.',
    },
  });

  // ── Ученик ─────────────────────────────────
  const studentPasswordHash = await bcrypt.hash('student123', SALT_ROUNDS);

  const studentUser = await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash: studentPasswordHash,
      role: 'STUDENT',
    },
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      userId: studentUser.id,
      fullName: 'Петров Пётр Петрович',
      grade: '7Б',
      teacherId: teacherProfile.id, // уже привязан к учителю по коду ABC123
    },
  });

  // ── Демо-домашнее задание ──────────────────
  const homework = await prisma.homework.create({
    data: {
      teacherId: teacherProfile.id,
      title: 'Квадратные уравнения. Базовый уровень',
      description:
        'Решите уравнения, используя дискриминант. Формула: $$x = \\frac{-b \\pm \\sqrt{D}}{2a}$$',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
      tasks: {
        create: [
          {
            order: 1,
            content: 'Решите уравнение: $x^2 - 5x + 6 = 0$. Укажите больший корень.',
            correctAnswer: '3',
            requirePhoto: false,
          },
          {
            order: 2,
            content:
              'Найдите дискриминант уравнения $2x^2 + 3x - 2 = 0$. Формула: $D = b^2 - 4ac$',
            correctAnswer: '25',
            requirePhoto: false,
          },
          {
            order: 3,
            content:
              'Полное решение уравнения $x^2 + 4x - 5 = 0$ оформите письменно и сфотографируйте.',
            correctAnswer: null,
            requirePhoto: true,
          },
        ],
      },
    },
    include: { tasks: { orderBy: { order: 'asc' } } },
  });

  // ── Демо-черновик отправки (Submission в статусе DRAFT) ──
  await prisma.submission.create({
    data: {
      studentId: studentProfile.id,
      homeworkId: homework.id,
      status: 'DRAFT',
      answers: {
        create: homework.tasks.map((task) => ({
          taskId: task.id,
          textAnswer: task.order === 1 ? '3' : null,
        })),
      },
    },
  });

  console.log('✅ Seed finished:');
  console.log('   👨‍🏫 teacher@example.com / teacher123 (код: ABC123)');
  console.log('   🎓 student@example.com / student123');
  console.log(`   📚 Homework: "${homework.title}" (${homework.tasks.length} tasks)`);
}

main()
  .catch((e: unknown) => {
    console.error('❌ Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
