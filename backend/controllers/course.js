const Course = require('../models/course');
const User = require('../models/user');
const Category = require('../models/category');
const Section = require('../models/section')
const SubSection = require('../models/subSection')
const CourseProgress = require('../models/courseProgress')

const { uploadImageToCloudinary, deleteResourceFromCloudinary } = require('../utils/imageUploader');
const { convertSecondsToDuration } = require("../utils/secToDuration")
const { getUserById, getCategoryById, getAllCourses: getFallbackCourses, getCourseById, addCourse } = require('../utils/inMemoryDB');
const mongoose = require('mongoose');



// ================ create new course ================
exports.createCourse = async (req, res) => {
  try {
    let {
      courseName,
      courseDescription,
      whatYouWillLearn,
      price,
      category,
      instructions: _instructions,
      status,
      tag: _tag,
    } = req.body;

    // ✅ Safe parsing
    const tag = typeof _tag === "string" ? JSON.parse(_tag) : _tag || [];
    const instructions =
      typeof _instructions === "string"
        ? JSON.parse(_instructions)
        : _instructions || [];

    // ✅ Thumbnail safe
    const thumbnail = req.files?.thumbnailImage || null;

    // ✅ Auth check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const instructorId = req.user.id;

    // ✅ Validate fields
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail ||
      tag.length === 0 ||
      instructions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!status) status = "Draft";

    // ✅ Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // ✅ Upload image
    const thumbnailDetails = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorId,
      whatYouWillLearn,
      price,
      category,
      tag,
      status,
      instructions,
      thumbnail: thumbnailDetails.secure_url,
    });

    // ✅ Update user + category
    await User.findByIdAndUpdate(instructorId, {
      $push: { courses: newCourse._id },
    });

    await Category.findByIdAndUpdate(category, {
      $push: { courses: newCourse._id },
    });

    return res.status(200).json({
      success: true,
      data: newCourse,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error creating course",
      error: error.message,
    });
  }
};


// ================ show all courses ================
exports.getAllCourses = async (req, res) => {
    try {
        const dbConnected = mongoose.connection.readyState === 1;
        if (!dbConnected) {
            const allCourses = getFallbackCourses();
            return res.status(200).json({
                success: true,
                data: allCourses,
                message: 'Mock courses returned because DB is not connected',
            });
        }

        const allCourses = await Course.find({},
            {
                courseName: true, courseDescription: true, price: true, thumbnail: true, instructor: true,
                ratingAndReviews: true, studentsEnrolled: true
            })
            .populate({
                path: 'instructor',
                select: 'firstName lastName email image'
            })
            .exec();

        return res.status(200).json({
            success: true,
            data: allCourses,
            message: 'Data for all courses fetched successfully',
        });
    }
    catch (error) {
        console.log('Error while fetching data of all courses', error);
        const allCourses = getFallbackCourses();
        return res.status(200).json({
            success: true,
            data: allCourses,
            message: 'Mock courses returned because an error occurred fetching courses',
        });
    }
};



// ================ Get Course Details ================
exports.getCourseDetails = async (req, res) => {
    try {
        // get course ID
        const { courseId } = req.body;

        // find course details
        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")

            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                    select: "-videoUrl",
                },
            })
            .exec()


        //validation
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the course with ${courseId}`,
            });
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        // console.log('courseDetails -> ', courseDetails)
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        //return response
        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
            },
            message: 'Fetched course data successfully'
        })
    }

    catch (error) {
        console.log('Error while fetching course details', error);
        const sampleCourse = getFallbackCourses()[0];
        if (!sampleCourse) {
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error while fetching course details',
            });
        }

        const totalDuration = '12 mins';
        return res.status(200).json({
            success: true,
            data: {
                courseDetails: sampleCourse,
                totalDuration,
            },
            message: 'Mock course details returned because DB is not connected',
        });
    }
};


// ================ Get Full Course Details ================
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id
        // console.log('courseId userId  = ', courseId, " == ", userId)

        const courseDetails = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        let courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId,
        })

        //   console.log("courseProgressCount : ", courseProgressCount)

        const dbConnected = mongoose.connection.readyState === 1;
        if (!courseDetails) {
            if (!dbConnected) {
                const fallbackCourse = getCourseById(courseId);
                if (fallbackCourse) {
                    return res.status(200).json({
                        success: true,
                        data: {
                            courseDetails: fallbackCourse,
                            totalDuration: '12 mins',
                            completedVideos: [],
                        },
                        message: 'Mock full course details returned because DB is not connected',
                    });
                }
            }
            return res.status(404).json({
                success: false,
                message: `Could not find course with id: ${courseId}`,
            });
        }

        // if (courseDetails.status === "Draft") {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Accessing a draft course is forbidden`,
        //   });
        // }

        //   count total time duration of course
        let totalDurationInSeconds = 0
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration)
                totalDurationInSeconds += timeDurationInSeconds
            })
        })

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds)

        return res.status(200).json({
            success: true,
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : [],
            },
        })
    } catch (error) {
        const dbConnected = mongoose.connection.readyState === 1;
        if (!dbConnected) {
            const fallbackCourse = getCourseById(req.body.courseId);
            if (fallbackCourse) {
                return res.status(200).json({
                    success: true,
                    data: {
                        courseDetails: fallbackCourse,
                        totalDuration: '12 mins',
                        completedVideos: [],
                    },
                    message: 'Mock full course details returned because DB is not connected',
                });
            }
        }
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}



// ================ Edit Course Details ================
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body
        const updates = req.body
        const course = await Course.findById(courseId)

        if (!course) {
            return res.status(404).json({ error: "Course not found" })
        }

        // If Thumbnail Image is found, update it
        if (req.files) {
            // console.log("thumbnail update")
            const thumbnail = req.files.thumbnailImage
            const thumbnailImage = await uploadImageToCloudinary(
                thumbnail,
                process.env.FOLDER_NAME
            )
            course.thumbnail = thumbnailImage.secure_url
        }

        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tag" || key === "instructions") {
                    course[key] = JSON.parse(updates[key])
                } else {
                    course[key] = updates[key]
                }
            }
        }

        // updatedAt
        course.updatedAt = Date.now();

        //   save data
        await course.save()

        const updatedCourse = await Course.findOne({
            _id: courseId,
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails",
                },
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                },
            })
            .exec()

        // success response
        res.status(200).json({
            success: true,
            message: "Course updated successfully",
            data: updatedCourse,
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Error while updating course",
            error: error.message,
        })
    }
}



// ================ Get a list of Course for a given Instructor ================
exports.getInstructorCourses = async (req, res) => {
    try {
        // Get the instructor ID from the authenticated user or request body
        const instructorId = req.user.id

        // Find all courses belonging to the instructor
        const instructorCourses = await Course.find({ instructor: instructorId, }).sort({ createdAt: -1 })


        // Return the instructor's courses
        res.status(200).json({
            success: true,
            data: instructorCourses,
            // totalDurationInSeconds:totalDurationInSeconds,
            message: 'Courses made by Instructor fetched successfully'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message,
        })
    }
}



// ================ Delete the Course ================
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body

        // Find the course
        const course = await Course.findById(courseId)
        if (!course) {
            return res.status(404).json({ message: "Course not found" })
        }

        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: { courses: courseId },
            })
        }

        // delete course thumbnail From Cloudinary
        await deleteResourceFromCloudinary(course?.thumbnail);

        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId)
            if (section) {
                const subSections = section.subSection
                for (const subSectionId of subSections) {
                    const subSection = await SubSection.findById(subSectionId)
                    if (subSection) {
                        await deleteResourceFromCloudinary(subSection.videoUrl) // delete course videos From Cloudinary
                    }
                    await SubSection.findByIdAndDelete(subSectionId)
                }
            }

            // Delete the section
            await Section.findByIdAndDelete(sectionId)
        }

        // Delete the course
        await Course.findByIdAndDelete(courseId)

        return res.status(200).json({
            success: true,
            message: "Course deleted successfully",
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Error while Deleting course",
            error: error.message,
        })
    }
}




