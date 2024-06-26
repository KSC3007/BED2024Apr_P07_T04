const sql = require("mssql");
const fs = require("fs");
const path = require("path");
const dbConfig = require("./dbConfig");

// SQL data for seeding the database
const seedSQL = `
-- Drop foreign key constraints
IF OBJECT_ID('FK_CourseLectures_CourseID', 'F') IS NOT NULL
  ALTER TABLE CourseLectures DROP CONSTRAINT FK_CourseLectures_CourseID;

IF OBJECT_ID('FK_CourseLectures_LectureID', 'F') IS NOT NULL
  ALTER TABLE CourseLectures DROP CONSTRAINT FK_CourseLectures_LectureID;

declare @sqlf nvarchar(max) = (
    select 
        'alter table ' + quotename(schema_name(schema_id)) + '.' +
        quotename(object_name(parent_object_id)) +
        ' drop constraint '+quotename(name) + ';'
    from sys.foreign_keys
    for xml path('')
);
exec sp_executesql @sqlf;

-- Drop all tables
IF OBJECT_ID('UserCourses', 'U') IS NOT NULL DROP TABLE UserCourses;
IF OBJECT_ID('CourseLectures', 'U') IS NOT NULL DROP TABLE CourseLectures;
IF OBJECT_ID('Lectures', 'U') IS NOT NULL DROP TABLE Lectures;
IF OBJECT_ID('Courses', 'U') IS NOT NULL DROP TABLE Courses;
IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users;
IF OBJECT_ID('Answers', 'U') IS NOT NULL DROP TABLE Answers;
IF OBJECT_ID('Questions', 'U') IS NOT NULL DROP TABLE Questions;
IF OBJECT_ID('Quizzes', 'U') IS NOT NULL DROP TABLE Quizzes;
IF OBJECT_ID('Results', 'U') IS NOT NULL DROP TABLE Results;
IF OBJECT_ID('IncorrectQuestions', 'U') IS NOT NULL DROP TABLE IncorrectQuestions;

DECLARE @sql NVARCHAR(max)=''

SELECT @sql += ' Drop table ' + QUOTENAME(TABLE_SCHEMA) + '.'+ QUOTENAME(TABLE_NAME) + '; '
FROM   INFORMATION_SCHEMA.TABLES
WHERE  TABLE_TYPE = 'BASE TABLE'

Exec Sp_executesql @sql

-- Create tables
CREATE TABLE Users (
  id INT PRIMARY KEY IDENTITY,
  first_name VARCHAR(40) NOT NULL,
  last_name VARCHAR(40) NOT NULL,
  email VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  about_me VARCHAR(250) NOT NULL,
  country VARCHAR(100) NOT NULL,
);

CREATE TABLE Profile_Pictures (
    pic_id INT PRIMARY KEY IDENTITY,
    user_id INT NOT NULL UNIQUE,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    img VARCHAR(MAX) NOT NULL
);

CREATE TABLE Courses (
  CourseID INT PRIMARY KEY IDENTITY(1,1),
  Title NVARCHAR(255) NOT NULL,
  Thumbnail VARBINARY(MAX) NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Category NVARCHAR(MAX) NOT NULL,
  TotalRate INT NOT NULL,
  Ratings INT NOT NULL,
  Video VARBINARY(MAX) NOT NULL
);

CREATE TABLE Lectures (
  LectureID INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(255) NOT NULL,
  Description NVARCHAR(MAX) NOT NULL,
  Category NVARCHAR(MAX) NOT NULL,
  Duration INT NOT NULL,
  Video VARBINARY(MAX) NOT NULL
);

CREATE TABLE CourseLectures (
  id INT PRIMARY KEY IDENTITY(1,1),
  CourseID INT FOREIGN KEY REFERENCES Courses(CourseID),
  LectureID INT FOREIGN KEY REFERENCES Lectures(LectureID)
);

CREATE TABLE Quizzes (
  id INT PRIMARY KEY IDENTITY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  totalQuestions INT NOT NULL,
  totalMarks INT NOT NULL,
  duration INT NOT NULL
);

CREATE TABLE Questions (
  id INT PRIMARY KEY IDENTITY,
  quizId INT NOT NULL,
  text VARCHAR(500) NOT NULL,
  options NVARCHAR(MAX) NOT NULL,
  correctAnswer INT NOT NULL,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id)
);

CREATE TABLE Answers (
  id INT PRIMARY KEY IDENTITY,
  quizId INT NOT NULL,
  questionId INT NOT NULL,
  answer INT NOT NULL,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id),
  FOREIGN KEY (questionId) REFERENCES Questions(id)
);

CREATE TABLE Results (
  id INT PRIMARY KEY IDENTITY,
  quizId INT NOT NULL,
  score INT NOT NULL,
  totalQuestions INT NOT NULL,
  correctAnswers INT NOT NULL,
  timeTaken INT NOT NULL,
  totalMarks INT NOT NULL,
  grade VARCHAR(2) NOT NULL,
  FOREIGN KEY (quizId) REFERENCES Quizzes(id)
);

CREATE TABLE IncorrectQuestions (
  id INT PRIMARY KEY IDENTITY,
  resultId INT NOT NULL,
  text NVARCHAR(MAX),
  userAnswer INT,
  correctAnswer INT,
  FOREIGN KEY (resultId) REFERENCES Results(id)
);

`;

const systemData = [
  {
    "title": "Angular JS",
    "thumbnail": "angular-js.png",
    "description": "A JavaScript-based open-source front-end web framework for developing single-page applications.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 2000,
    "ratings": 500,
    "video": "ads_video.mp4"
  },
  {
    "title": "AWS",
    "thumbnail": "aws.png",
    "description": "AWS Coaching and Certification helps you build and validate your skills so you can get more out of the cloud.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 1200,
    "ratings": 500,
    "video": "ads_video.mp4"
  },
  {
    "title": "Vue JS",
    "thumbnail": "vue-js.png",
    "description": "An open-source model-view–viewmodel front end JavaScript framework for building user interfaces & single-page applications.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 1000,
    "ratings": 500,
    "video": "ads_video.mp4"
  },
  {
    "title": "Python",
    "thumbnail": "python.png",
    "description": "Python is an interpreted high-level general-purpose programming language.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 400,
    "ratings": 200,
    "video": "ads_video.mp4"
  },
  {
    "title": "React JS",
    "thumbnail": "react-js.png",
    "description": "React is a free and open-source front-end JavaScript library for building user interfaces based on UI components.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 3000,
    "ratings": 5000,
    "video": "ads_video.mp4"
  },
  {
    "title": "Software Testing",
    "thumbnail": "software-testing.png",
    "description": "The process of evaluating and verifying that a software product or application does what it is supposed to do.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 6000,
    "ratings": 2000,
    "video": "ads_video.mp4"
  },
  {
    "title": "Core UI",
    "thumbnail": "core-ui.png",
    "description": "Learn the fastest way to build a modern dashboard for any platforms, browser, or device.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 6000,
    "ratings": 3000,
    "video": "ads_video.mp4"
  },
  {
    "title": "Power BI",
    "thumbnail": "power-bi.png",
    "description": "An interactive data visualization software developed by Microsoft with primary focus on business intelligence.",
    "category": "commercial, office, shop, educate, academy, single family home, studio, university",
    "totalRate": 8000,
    "ratings": 7000,
    "video": "ads_video.mp4"
  },
];

const lectureData = [
  {
    "name": "Introduction to Angular",
    "description": "An introduction to the Angular framework.",
    "category": "education",
    "duration": 30,
    "video": "ads_video.mp4"
  },
  {
    "name": "Components and Templates",
    "description": "Learn about components and templates in Angular.",
    "category": "education",
    "duration": 45,
    "video": "ads_video.mp4"
  },
  {
    "name": "Data Binding",
    "description": "Understand data binding in Angular.",
    "category": "education",
    "duration": 40,
    "video": "ads_video.mp4"
  },
  {
    "name": "Angular Services",
    "description": "Dive into Angular services.",
    "category": "education",
    "duration": 35,
    "video": "ads_video.mp4"
  }
];

const quizData = [
  {
      "title": "Sample Quiz 1",
      "description": "This is a sample quiz.",
      "totalQuestions": 3,
      "totalMarks": 30,
      "duration": 60,
      "questions": [
          {
              "text": "What is 2 + 2?",
              "options": JSON.stringify(["1", "2", "3", "4"]),
              "correctAnswer": 3
          },
          {
              "text": "What is the capital of France?",
              "options": JSON.stringify(["Berlin", "Madrid", "Paris", "Rome"]),
              "correctAnswer": 2
          },
          {
              "text": "What is the color of the sky?",
              "options": JSON.stringify(["Green", "Blue", "Red", "Yellow"]),
              "correctAnswer": 1
          }
      ]
  }
];

async function insertCoursesAndLectures(connection) {
  for (const course of systemData) {
    // Read the image file
    const imagePath = path.join(__dirname, '..', 'public', 'assets', 'courses', 'topic-thumbnail', course.thumbnail);
    const imageBuffer = fs.readFileSync(imagePath);

    // Read the video file
    const videoPath = path.join(__dirname, '..', 'public', 'assets', 'lectures', course.video);
    const videoBuffer = fs.readFileSync(videoPath);

    // Insert the course data into the database
    const result = await connection.request()
      .input('Title', sql.NVarChar, course.title)
      .input('Thumbnail', sql.VarBinary, imageBuffer)
      .input('Description', sql.NVarChar, course.description)
      .input('Category', sql.NVarChar, course.category)
      .input('TotalRate', sql.Int, course.totalRate)
      .input('Ratings', sql.Int, course.ratings)
      .input('Video', sql.VarBinary, videoBuffer)
      .query(`
        INSERT INTO Courses (Title, Thumbnail, Description, Category, TotalRate, Ratings, Video)
        VALUES (@Title, @Thumbnail, @Description, @Category, @TotalRate, @Ratings, @Video);
        SELECT SCOPE_IDENTITY() AS CourseID;
      `);

    const courseID = result.recordset[0].CourseID;

    // Insert lecture data for the Angular JS course
    if (course.title === "Angular JS") {
      for (const lecture of lectureData) {
        const lectureVideoPath = path.join(__dirname, '..', 'public', 'assets', 'lectures', lecture.video);
        const lectureVideoBuffer = fs.readFileSync(lectureVideoPath);

        const lectureResult = await connection.request()
          .input('Name', sql.NVarChar, lecture.name)
          .input('Description', sql.NVarChar, lecture.description)
          .input('Category', sql.NVarChar, lecture.category)
          .input('Duration', sql.Int, lecture.duration)
          .input('Video', sql.VarBinary, lectureVideoBuffer)
          .query(`
            INSERT INTO Lectures (Name, Description, Category, Duration, Video)
            VALUES (@Name, @Description, @Category, @Duration, @Video);
            SELECT SCOPE_IDENTITY() AS LectureID;
          `);

        const lectureID = lectureResult.recordset[0].LectureID;

        // Insert into CourseLectures junction table
        await connection.request()
          .input('CourseID', sql.Int, courseID)
          .input('LectureID', sql.Int, lectureID)
          .query(`
            INSERT INTO CourseLectures (CourseID, LectureID)
            VALUES (@CourseID, @LectureID);
          `);
      }
    }
  }
}

async function insertQuizzes(connection) {
  for (const quiz of quizData) {
      const result = await connection.request()
          .input('title', sql.VarChar, quiz.title)
          .input('description', sql.VarChar, quiz.description)
          .input('totalQuestions', sql.Int, quiz.totalQuestions)
          .input('totalMarks', sql.Int, quiz.totalMarks)
          .input('duration', sql.Int, quiz.duration)
          .query(`
              INSERT INTO Quizzes (title, description, totalQuestions, totalMarks, duration)
              VALUES (@title, @description, @totalQuestions, @totalMarks, @duration);
              SELECT SCOPE_IDENTITY() AS id;
          `);

      const quizId = result.recordset[0].id;

      for (const question of quiz.questions) {
          await connection.request()
              .input('quizId', sql.Int, quizId)
              .input('text', sql.VarChar, question.text)
              .input('options', sql.NVarChar, question.options)
              .input('correctAnswer', sql.Int, question.correctAnswer)
              .query(`
                  INSERT INTO Questions (quizId, text, options, correctAnswer)
                  VALUES (@quizId, @text, @options, @correctAnswer);
              `);
      }
  }
} 

// Load the SQL and run the seed process
async function run() {
  try {
    // Make sure that any items are correctly URL encoded in the connection string
    const connection = await sql.connect(dbConfig);
    const request = connection.request();
    await request.query(seedSQL);
    console.log("Database reset and tables created");

    // Insert course and lecture data
    await insertCoursesAndLectures(connection);
    console.log("Courses and lectures inserted");

    // Insert quiz data
    await insertQuizzes(connection);
    console.log("Quizzes inserted");

    connection.close();
    console.log("Seeding completed");
  } catch (err) {
    console.log("Seeding error:", err);
  }
}

run();
