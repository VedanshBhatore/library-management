// Seeds the database with a demo-ready dataset: 2 librarians, 10 students,
// 30 books (1-5 copies each), and a deliberately varied spread of rentals,
// fines and reservations so every UI state (green/amber/red countdowns,
// blocked renewals, paid/unpaid fines, reservation queues) has real data on
// first load. Run with `node prisma/seed.js` (also runs after `npm run seed`).
//
// Demo login credentials (see README for the full table):
//   Librarians: librarian1@library.com / Librarian@123
//   Students:   student1@library.com   / Student@123   (student1..student10)

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth.js';
import { LOAN_DAYS } from '../src/rules.js';

const prisma = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // noon, to avoid timezone edge cases in day-math
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log('Clearing existing data...');
  // Delete in dependency order (children before parents).
  await prisma.activityLog.deleteMany();
  await prisma.fine.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // --- Users -----------------------------------------------------------
  console.log('Creating users...');
  const librarianPasswordHash = await hashPassword('Librarian@123');
  const studentPasswordHash = await hashPassword('Student@123');

  const librarians = await Promise.all(
    [
      { name: 'Ananya Desai', email: 'librarian1@library.com' },
      { name: 'Rohan Kulkarni', email: 'librarian2@library.com' },
    ].map((l) =>
      prisma.user.create({
        data: { ...l, passwordHash: librarianPasswordHash, role: 'LIBRARIAN' },
      })
    )
  );
  const [librarian1, librarian2] = librarians;

  const studentSeeds = [
    { name: 'Alice Sharma', email: 'student1@library.com', enrollmentNo: 'ENR1001' },
    { name: 'Bob Verma', email: 'student2@library.com', enrollmentNo: 'ENR1002' },
    { name: 'Carol Nair', email: 'student3@library.com', enrollmentNo: 'ENR1003' },
    { name: 'David Iyer', email: 'student4@library.com', enrollmentNo: 'ENR1004' },
    { name: 'Emma Joshi', email: 'student5@library.com', enrollmentNo: 'ENR1005' },
    { name: 'Farhan Khan', email: 'student6@library.com', enrollmentNo: 'ENR1006' },
    { name: 'Gita Reddy', email: 'student7@library.com', enrollmentNo: 'ENR1007' },
    { name: 'Harish Menon', email: 'student8@library.com', enrollmentNo: 'ENR1008' },
    { name: 'Isha Kapoor', email: 'student9@library.com', enrollmentNo: 'ENR1009' },
    { name: 'Jatin Malhotra', email: 'student10@library.com', enrollmentNo: 'ENR1010' },
  ];
  const students = await Promise.all(
    studentSeeds.map((s) =>
      prisma.user.create({
        data: { ...s, passwordHash: studentPasswordHash, role: 'STUDENT' },
      })
    )
  );
  const [alice, bob, carol, david, emma, farhan, gita, harish, isha, jatin] = students;

  // Deactivate one student to exercise the activate/deactivate flow in the UI.
  await prisma.user.update({ where: { id: jatin.id }, data: { isActive: false } });

  // --- Books -------------------------------------------------------------
  console.log('Creating books and copies...');
  const bookSeeds = [
    { isbn: '9780132350884', title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', category: 'Technology', year: 2008, copies: 4 },
    { isbn: '9780201616224', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', publisher: 'Addison-Wesley', category: 'Technology', year: 1999, copies: 3 },
    { isbn: '9780262033848', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', publisher: 'MIT Press', category: 'Technology', year: 2009, copies: 5 },
    { isbn: '9781491950357', title: 'Building Microservices', author: 'Sam Newman', publisher: "O'Reilly Media", category: 'Technology', year: 2015, copies: 2 },
    { isbn: '9780596007126', title: 'Head First Design Patterns', author: 'Eric Freeman', publisher: "O'Reilly Media", category: 'Technology', year: 2004, copies: 1 },
    { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', category: 'Fiction', year: 1813, copies: 3 },
    { isbn: '9780061120084', title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Perennial', category: 'Fiction', year: 1960, copies: 4 },
    { isbn: '9780451524935', title: 'Nineteen Eighty-Four', author: 'George Orwell', publisher: 'Signet Classics', category: 'Fiction', year: 1949, copies: 2 },
    { isbn: '9780743273565', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: "Scribner", category: 'Fiction', year: 1925, copies: 3 },
    { isbn: '9780316769488', title: 'The Catcher in the Rye', author: 'J. D. Salinger', publisher: 'Little, Brown', category: 'Fiction', year: 1951, copies: 1 },
    { isbn: '9780544003415', title: 'The Lord of the Rings', author: 'J. R. R. Tolkien', publisher: 'Houghton Mifflin', category: 'Fantasy', year: 1954, copies: 5 },
    { isbn: '9780439708180', title: "Harry Potter and the Sorcerer's Stone", author: 'J. K. Rowling', publisher: 'Scholastic', category: 'Fantasy', year: 1997, copies: 5 },
    { isbn: '9780553103540', title: 'A Game of Thrones', author: 'George R. R. Martin', publisher: 'Bantam Books', category: 'Fantasy', year: 1996, copies: 2 },
    { isbn: '9780345391803', title: "The Hitchhiker's Guide to the Galaxy", author: 'Douglas Adams', publisher: 'Del Rey', category: 'Fantasy', year: 1979, copies: 1 },
    { isbn: '9780307474278', title: 'The Da Vinci Code', author: 'Dan Brown', publisher: 'Anchor', category: 'Mystery', year: 2003, copies: 3 },
    { isbn: '9780062073488', title: 'And Then There Were None', author: 'Agatha Christie', publisher: 'William Morrow', category: 'Mystery', year: 1939, copies: 2 },
    { isbn: '9780385504201', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', publisher: 'Knopf', category: 'Mystery', year: 2005, copies: 2 },
    { isbn: '9780553380163', title: 'A Brief History of Time', author: 'Stephen Hawking', publisher: 'Bantam Books', category: 'Science', year: 1988, copies: 3 },
    { isbn: '9780307887894', title: 'Sapiens', author: 'Yuval Noah Harari', publisher: 'Harper', category: 'Science', year: 2011, copies: 4 },
    { isbn: '9780143127741', title: 'The Selfish Gene', author: 'Richard Dawkins', publisher: 'Oxford University Press', category: 'Science', year: 1976, copies: 2 },
    { isbn: '9780375508269', title: 'Cosmos', author: 'Carl Sagan', publisher: 'Random House', category: 'Science', year: 1980, copies: 1 },
    { isbn: '9780553386790', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publisher: 'W. W. Norton', category: 'History', year: 1997, copies: 3 },
    { isbn: '9780679783275', title: 'A People’s History of the United States', author: 'Howard Zinn', publisher: 'Harper Perennial', category: 'History', year: 1980, copies: 2 },
    { isbn: '9780306825033', title: 'The Diary of a Young Girl', author: 'Anne Frank', publisher: 'Bantam', category: 'History', year: 1947, copies: 2 },
    { isbn: '9781451648539', title: 'Steve Jobs', author: 'Walter Isaacson', publisher: 'Simon & Schuster', category: 'Biography', year: 2011, copies: 3 },
    { isbn: '9780553296983', title: 'Long Walk to Freedom', author: 'Nelson Mandela', publisher: 'Back Bay Books', category: 'Biography', year: 1994, copies: 2 },
    { isbn: '9780062457714', title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson', publisher: 'Harper', category: 'Self-Help', year: 2016, copies: 4 },
    { isbn: '9780743269513', title: 'Atomic Habits', author: 'James Clear', publisher: 'Avery', category: 'Self-Help', year: 2018, copies: 5 },
    { isbn: '9780199540548', title: 'Meditations', author: 'Marcus Aurelius', publisher: 'Oxford University Press', category: 'Philosophy', year: 180, copies: 2 },
    { isbn: '9780307352159', title: 'Freakonomics', author: 'Steven D. Levitt', publisher: 'William Morrow', category: 'Economics', year: 2005, copies: 3 },
  ];

  const books = [];
  for (const [index, b] of bookSeeds.entries()) {
    const { copies: copyCount, ...bookData } = b;
    const book = await prisma.book.create({ data: bookData });
    const copies = await Promise.all(
      Array.from({ length: copyCount }, (_, i) =>
        prisma.bookCopy.create({
          data: {
            bookId: book.id,
            barcode: `BC-${String(index + 1).padStart(3, '0')}-${String(i + 1).padStart(2, '0')}`,
            status: 'AVAILABLE',
          },
        })
      )
    );
    books.push({ ...book, copies });
  }

  const byIsbn = (isbn) => books.find((b) => b.isbn === isbn);

  // --- Rentals, fines, reservations ---------------------------------------
  // Every scenario below is deliberately chosen to exercise a distinct UI/
  // business-rule state. Helper issues a copy and marks it ISSUED.
  async function issue({ copy, student, librarian, issueDate, dueDate, renewalsCount = 0 }) {
    await prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'ISSUED' } });
    return prisma.rental.create({
      data: {
        copyId: copy.id,
        studentId: student.id,
        issuedById: librarian.id,
        issueDate,
        dueDate,
        renewalsCount,
        status: dueDate < new Date() ? 'OVERDUE' : 'ACTIVE',
      },
    });
  }

  async function returnRental({ rental, copy, returnDate, fineAmount, finePaid }) {
    await prisma.bookCopy.update({ where: { id: copy.id }, data: { status: 'AVAILABLE' } });
    await prisma.rental.update({
      where: { id: rental.id },
      data: { returnDate, status: 'RETURNED' },
    });
    if (fineAmount > 0) {
      await prisma.fine.create({
        data: {
          rentalId: rental.id,
          amount: fineAmount,
          isPaid: finePaid,
          paidAt: finePaid ? returnDate : null,
        },
      });
    }
  }

  console.log('Creating rentals, fines, and reservations...');

  // Alice: 2 healthy active rentals, plenty of room to borrow/renew.
  const cleanCode = byIsbn('9780132350884');
  const pragmatic = byIsbn('9780201616224');
  await issue({ copy: cleanCode.copies[0], student: alice, librarian: librarian1, issueDate: daysFromNow(-3), dueDate: daysFromNow(LOAN_DAYS - 3) });
  await issue({ copy: pragmatic.copies[0], student: alice, librarian: librarian1, issueDate: daysFromNow(-1), dueDate: daysFromNow(LOAN_DAYS - 1) });

  // Bob: exactly at MAX_ACTIVE_RENTALS (3) -> cannot borrow more.
  const algorithms = byIsbn('9780262033848');
  const gatsby = byIsbn('9780743273565');
  const mockingbird = byIsbn('9780061120084');
  await issue({ copy: algorithms.copies[0], student: bob, librarian: librarian1, issueDate: daysFromNow(-2), dueDate: daysFromNow(LOAN_DAYS - 2) });
  await issue({ copy: gatsby.copies[0], student: bob, librarian: librarian2, issueDate: daysFromNow(-5), dueDate: daysFromNow(LOAN_DAYS - 5) });
  await issue({ copy: mockingbird.copies[0], student: bob, librarian: librarian2, issueDate: daysFromNow(-1), dueDate: daysFromNow(LOAN_DAYS - 1) });

  // Carol: one overdue active rental -> blocked from borrowing/renewing.
  const nineteenEightyFour = byIsbn('9780451524935');
  await issue({ copy: nineteenEightyFour.copies[0], student: carol, librarian: librarian1, issueDate: daysFromNow(-19), dueDate: daysFromNow(-5) });

  // David: returned late, fine UNPAID -> blocked from borrowing/renewing.
  const daVinci = byIsbn('9780307474278');
  const davidRental = await issue({ copy: daVinci.copies[0], student: david, librarian: librarian1, issueDate: daysFromNow(-20), dueDate: daysFromNow(-6) });
  await returnRental({ rental: davidRental, copy: daVinci.copies[0], returnDate: daysFromNow(-2), fineAmount: 20, finePaid: false });

  // Emma: returned late, fine PAID -> clean standing, can borrow again.
  const dragonTattoo = byIsbn('9780385504201');
  const emmaRental = await issue({ copy: dragonTattoo.copies[0], student: emma, librarian: librarian2, issueDate: daysFromNow(-25), dueDate: daysFromNow(-11) });
  await returnRental({ rental: emmaRental, copy: dragonTattoo.copies[0], returnDate: daysFromNow(-9), fineAmount: 10, finePaid: true });

  // Farhan: active rental already renewed once (MAX_RENEWALS reached), due
  // soon (amber zone) -> renew button should be disabled with a clear reason.
  const briefHistory = byIsbn('9780553380163');
  await issue({
    copy: briefHistory.copies[0],
    student: farhan,
    librarian: librarian1,
    issueDate: daysFromNow(-16),
    dueDate: daysFromNow(2),
    renewalsCount: 1,
  });

  // Gita: no rentals at all -> fresh student, everything eligible.

  // Harish: active rental due tomorrow (amber), plus he is WAITING on a
  // title where every copy is currently issued (queue-position demo).
  const sapiens = byIsbn('9780307887894');
  await issue({ copy: sapiens.copies[0], student: harish, librarian: librarian2, issueDate: daysFromNow(-13), dueDate: daysFromNow(1) });

  const catcherInTheRye = byIsbn('9780316769488'); // single copy title
  await issue({ copy: catcherInTheRye.copies[0], student: bob, librarian: librarian1, issueDate: daysFromNow(-4), dueDate: daysFromNow(LOAN_DAYS - 4) });
  await prisma.reservation.create({
    data: { bookId: catcherInTheRye.id, studentId: harish.id, status: 'WAITING' },
  });
  await prisma.reservation.create({
    data: { bookId: catcherInTheRye.id, studentId: isha.id, status: 'WAITING' },
  });

  // Isha: overdue active rental (heavier, 10 days late) + a READY reservation
  // (promoted already, within its 48h window) on a different single-copy title.
  const hitchhikers = byIsbn('9780345391803'); // single copy title
  await issue({ copy: hitchhikers.copies[0], student: gita, librarian: librarian1, issueDate: daysFromNow(-30), dueDate: daysFromNow(-16) });
  await prisma.reservation.create({
    data: {
      bookId: hitchhikers.id,
      studentId: isha.id,
      status: 'READY',
      expiresAt: daysFromNow(1), // still within its 48h window
    },
  });

  const cosmos = byIsbn('9780375508269');
  await issue({ copy: cosmos.copies[0], student: isha, librarian: librarian2, issueDate: daysFromNow(-24), dueDate: daysFromNow(-10) });

  // Jatin (deactivated account): one on-time return in his history, plus one
  // healthy active rental, to show history still renders for inactive users.
  const atomicHabits = byIsbn('9780743269513');
  const jatinRental = await issue({ copy: atomicHabits.copies[0], student: jatin, librarian: librarian1, issueDate: daysFromNow(-30), dueDate: daysFromNow(-16) });
  await returnRental({ rental: jatinRental, copy: atomicHabits.copies[0], returnDate: daysFromNow(-18), fineAmount: 0, finePaid: false });

  const subtleArt = byIsbn('9780062457714');
  await issue({ copy: subtleArt.copies[0], student: jatin, librarian: librarian2, issueDate: daysFromNow(-2), dueDate: daysFromNow(LOAN_DAYS - 2) });

  // A couple of plain on-time returns scattered across other students, so
  // "my history" pages have more than one row.
  const selfishGene = byIsbn('9780143127741');
  const selfishGeneRental = await issue({ copy: selfishGene.copies[0], student: alice, librarian: librarian2, issueDate: daysFromNow(-40), dueDate: daysFromNow(-26) });
  await returnRental({ rental: selfishGeneRental, copy: selfishGene.copies[0], returnDate: daysFromNow(-28), fineAmount: 0, finePaid: false });

  const meditations = byIsbn('9780199540548');
  const meditationsRental = await issue({ copy: meditations.copies[0], student: gita, librarian: librarian1, issueDate: daysFromNow(-45), dueDate: daysFromNow(-31) });
  await returnRental({ rental: meditationsRental, copy: meditations.copies[0], returnDate: daysFromNow(-33), fineAmount: 0, finePaid: false });

  // --- Activity log --------------------------------------------------------
  console.log('Creating activity log entries...');
  await prisma.activityLog.createMany({
    data: [
      { actorId: librarian1.id, action: 'ISSUE', entityType: 'Rental', entityId: davidRental.id },
      { actorId: librarian1.id, action: 'RETURN', entityType: 'Rental', entityId: davidRental.id },
      { actorId: librarian2.id, action: 'ISSUE', entityType: 'Rental', entityId: emmaRental.id },
      { actorId: librarian2.id, action: 'RETURN', entityType: 'Rental', entityId: emmaRental.id },
      { actorId: librarian1.id, action: 'DEACTIVATE_STUDENT', entityType: 'User', entityId: jatin.id },
    ],
  });

  console.log('Seed complete.');
  console.log(`  Librarians: ${librarians.length}`);
  console.log(`  Students:   ${students.length}`);
  console.log(`  Books:      ${books.length}`);
  const totalCopies = books.reduce((sum, b) => sum + b.copies.length, 0);
  console.log(`  Copies:     ${totalCopies}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
