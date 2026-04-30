const crypto = require('crypto');
const bcrypt = require('bcrypt');

const randomId = () => crypto.randomBytes(12).toString('hex');

const store = {
  users: [],
  profiles: [],
  otps: [],
  categories: [],
  courses: [],
  reviews: [],
};

let initialized = false;

const initialize = () => {
  if (initialized) return;
  initialized = true;

  const instructorId = randomId();
  const categoryId1 = randomId();
  const categoryId2 = randomId();
  const courseId1 = randomId();
  const courseId2 = randomId();

  const instructor = {
    _id: instructorId,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    password: bcrypt.hashSync('Password123!', 10),
    accountType: 'Instructor',
    active: true,
    approved: true,
    additionalDetails: null,
    courses: [courseId1, courseId2],
    image: 'https://api.dicebear.com/5.x/initials/svg?seed=Jane%20Doe',
    token: null,
    courseProgress: [],
  };

  const student = {
    _id: randomId(),
    firstName: 'Student',
    lastName: 'One',
    email: 'student.one@example.com',
    password: bcrypt.hashSync('Password123!', 10),
    accountType: 'Student',
    active: true,
    approved: true,
    additionalDetails: null,
    courses: [courseId1],
    image: 'https://api.dicebear.com/5.x/initials/svg?seed=Student%20One',
    token: null,
    courseProgress: [],
  };

  const course1 = {
    _id: courseId1,
    courseName: 'React Bootcamp',
    courseDescription: 'Build modern React applications using hooks, context, and router.',
    instructor: {
      _id: instructorId,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      image: 'https://api.dicebear.com/5.x/initials/svg?seed=Jane%20Doe',
    },
    category: {
      _id: categoryId1,
      name: 'Web Development',
      description: 'Learn how to build websites and web apps.',
    },
    price: 129,
    thumbnail: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80',
    ratingAndReviews: [],
    studentsEnrolled: [student._id],
    status: 'Published',
    courseContent: [
      {
        _id: randomId(),
        title: 'Introduction',
        subSection: [
          {
            _id: randomId(),
            title: 'Course Overview',
            timeDuration: '300',
            description: 'Get started with the course structure and goals.',
          },
          {
            _id: randomId(),
            title: 'React Setup',
            timeDuration: '420',
            description: 'Install tools and create a starter app.',
          },
        ],
      },
    ],
  };

  const course2 = {
    _id: courseId2,
    courseName: 'JavaScript Fundamentals',
    courseDescription: 'Master the language that powers the web.',
    instructor: instructor,
    category: {
      _id: categoryId2,
      name: 'Programming',
      description: 'Core programming skills and logic.',
    },
    price: 99,
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    ratingAndReviews: [],
    studentsEnrolled: [],
    status: 'Published',
    courseContent: [
      {
        _id: randomId(),
        title: 'Basics',
        subSection: [
          {
            _id: randomId(),
            title: 'Variables and Types',
            timeDuration: '360',
            description: 'Understand JavaScript data types and variables.',
          },
        ],
      },
    ],
  };

  const category1 = {
    _id: categoryId1,
    name: 'Web Development',
    description: 'Learn web development in a simple way.',
    courses: [courseId1],
  };

  const category2 = {
    _id: categoryId2,
    name: 'Programming',
    description: 'Build your programming fundamentals.',
    courses: [courseId2],
  };

  store.users.push(instructor, student);
  store.categories.push(category1, category2);
  store.courses.push(course1, course2);
  store.reviews.push(
    {
      rating: 5,
      review: 'Fantastic course with great examples.',
      user: { firstName: 'Student', lastName: 'One', email: 'student.one@example.com' },
      course: { courseName: 'React Bootcamp' },
    },
    {
      rating: 4,
      review: 'Really helped me understand JavaScript.',
      user: { firstName: 'Another', lastName: 'Student', email: 'another.student@example.com' },
      course: { courseName: 'JavaScript Fundamentals' },
    }
  );
};

const getUserByEmail = (email) => store.users.find((user) => user.email === email);

const getUserById = (userId) => store.users.find((user) => user._id === userId);

const createUser = ({ firstName, lastName, email, password, contactNumber, accountType, approved, image, additionalDetails }) => {
  const newUser = {
    _id: randomId(),
    firstName,
    lastName,
    email,
    password,
    accountType,
    active: true,
    approved,
    additionalDetails,
    courses: [],
    image,
    token: null,
    courseProgress: [],
  };
  store.users.push(newUser);
  return newUser;
};

const createProfile = () => {
  const profile = {
    _id: randomId(),
    gender: null,
    dateOfBirth: null,
    about: null,
    contactNumber: null,
  };
  store.profiles.push(profile);
  return profile;
};

const createOtp = ({ email, otp }) => {
  const otpObj = { _id: randomId(), email, otp, createdAt: new Date() };
  store.otps.push(otpObj);
  return otpObj;
};

const getLatestOtp = (email) => {
  const otps = store.otps.filter((item) => item.email === email);
  if (!otps.length) return null;
  return otps.sort((a, b) => b.createdAt - a.createdAt)[0];
};

const getCategoryById = (categoryId) => store.categories.find((category) => category._id === categoryId);

const getAllCategories = () => store.categories;

const getAllCourses = () => store.courses;

const getCourseById = (courseId) => store.courses.find((course) => course._id === courseId);

const getCatalogPageData = (categoryId) => {
  const selectedCategory = getCategoryById(categoryId);
  if (!selectedCategory) return null;
  const selectedCourses = store.courses.filter((course) => course.category._id === categoryId);
  const differentCategory = store.categories.find((category) => category._id !== categoryId);
  const mostSellingCourses = [...store.courses].sort((a, b) => (b.studentsEnrolled.length || 0) - (a.studentsEnrolled.length || 0)).slice(0, 10);
  return {
    selectedCategory: { ...selectedCategory, courses: selectedCourses },
    differentCategory: differentCategory ? { ...differentCategory, courses: store.courses.filter((course) => course.category._id === differentCategory._id) } : null,
    mostSellingCourses,
  };
};

const getAllReviews = () => store.reviews;

const addCourse = ({ courseName, courseDescription, whatYouWillLearn, price, category, tag, status, instructions, thumbnail, instructor }) => {
  const newCourse = {
    _id: randomId(),
    courseName,
    courseDescription,
    whatYouWillLearn,
    price,
    category,
    tag,
    status,
    instructions,
    thumbnail,
    instructor,
    ratingAndReviews: [],
    studentsEnrolled: [],
    courseContent: [],
  };
  store.courses.push(newCourse);
  const categoryObj = getCategoryById(category._id || category);
  if (categoryObj) {
    categoryObj.courses.push(newCourse._id);
  }
  return newCourse;
};

module.exports = {
  store,
  initialize,
  getUserByEmail,
  getUserById,
  createUser,
  createProfile,
  createOtp,
  getLatestOtp,
  getCategoryById,
  getAllCategories,
  getAllCourses,
  getCourseById,
  getCatalogPageData,
  getAllReviews,
  addCourse,
};
