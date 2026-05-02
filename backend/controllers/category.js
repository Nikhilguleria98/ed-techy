const Category = require('../models/category')

// get Random Integer
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

// ================= create Category =================
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body

        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            })
        }

        const categoryDetails = await Category.create({
            name,
            description
        })

        res.status(200).json({
            success: true,
            data: categoryDetails,
            message: 'Category created successfully'
        })
    } catch (error) {
        console.log('Error while creating Category', error)
        res.status(500).json({
            success: false,
            message: 'Error while creating Category',
            error: error.message
        })
    }
}

// ================= get All Categories =================
exports.showAllCategories = async (req, res) => {
    try {
        // ✅ IMPORTANT: include _id
        const allCategories = await Category.find({}, {
            name: 1,
            description: 1,
            _id: 1
        })

        // If no categories found in DB, provide fallback dummy categories
        if (!allCategories || allCategories.length === 0) {
            return res.status(200).json({
                success: true,
                data: [
                    { _id: "1", name: "Python", description: "Python Programming" },
                    { _id: "2", name: "Web Development", description: "Learn web dev" },
                    { _id: "3", name: "Data Science", description: "Learn DS" }
                ]
            });
        }

        res.status(200).json({
            success: true,
            data: allCategories
        })
    } catch (error) {
        console.log('Error while fetching categories:', error)

        // fallback
        res.status(200).json({
            success: true,
            data: [
                { _id: "1", name: "Python", description: "Python Programming" },
                { _id: "2", name: "Web Development", description: "Learn web dev" },
                { _id: "3", name: "Data Science", description: "Learn DS" }
            ]
        })
    }
}

// ================= get Category Page Details =================
exports.getCategoryPageDetails = async (req, res) => {
    try {
        // ✅ FIX: use params (NOT body)
        const { categoryId } = req.params

        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews",
            })

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            })
        }

        if (!selectedCategory.courses.length) {
            return res.status(200).json({
                success: true,
                data: {
                    selectedCategory,
                    differentCategory: null,
                    mostSellingCourses: []
                }
            })
        }

        // other categories
        const categoriesExceptSelected = await Category.find({
            _id: { $ne: categoryId },
        })

        const randomCategory =
            categoriesExceptSelected[
                getRandomInt(categoriesExceptSelected.length)
            ]

        const differentCategory = await Category.findById(randomCategory._id)
            .populate({
                path: "courses",
                match: { status: "Published" }
            })

        // top selling
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" }
            })

        const allCourses = allCategories.flatMap(cat => cat.courses)

        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10)

        res.status(200).json({
            success: true,
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses
            }
        })

    } catch (error) {
        console.log('Error in getCategoryPageDetails:', error)

        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}