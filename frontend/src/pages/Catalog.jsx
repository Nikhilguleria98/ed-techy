import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import Footer from "../components/common/Footer"
import Course_Card from "../components/core/Catalog/Course_Card"
import Course_Slider from "../components/core/Catalog/Course_Slider"
import Loading from "../components/common/Loading"

import { getCatalogPageData } from "../services/operations/pageAndComponentData"
import { fetchCourseCategories } from "../services/operations/courseDetailsAPI"

function Catalog() {
    const { catalogName } = useParams()

    const [catalogPageData, setCatalogPageData] = useState(null)
    const [categoryId, setCategoryId] = useState("")
    const [loading, setLoading] = useState(false)

    // ✅ STEP 1: Get categoryId from slug
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                const categories = await fetchCourseCategories()

                console.log("Categories:", categories)

                const match = categories.find(
                    (ct) =>
                        ct.name
                            .split(" ")
                            .join("-")
                            .toLowerCase() === catalogName
                )

                if (match?._id) {
                    setCategoryId(match._id)
                } else {
                    console.log("❌ Category not found")
                }
            } catch (error) {
                console.log("Category fetch error:", error)
            }
        }

        fetchCategory()
    }, [catalogName])

    // ✅ STEP 2: Fetch catalog data using categoryId
    useEffect(() => {
        if (!categoryId) return

        const fetchData = async () => {
            setLoading(true)
            try {
                const data = await getCatalogPageData(categoryId)

                console.log("Catalog Data:", data)

                setCatalogPageData(data)
            } catch (error) {
                console.log("Catalog fetch error:", error)
            }
            setLoading(false)
        }

        fetchData()
    }, [categoryId])

    // ✅ Loading UI
    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center">
                <Loading />
            </div>
        )
    }

    // ✅ Empty state
    if (!catalogPageData?.selectedCategory) {
        return (
            <div className="text-white text-2xl text-center mt-20">
                No Courses Found
            </div>
        )
    }

    return (
        <>
            {/* Hero Section */}
            <div className="bg-richblack-800 px-4 py-10 text-white">
                <p>
                    Home / Catalog /{" "}
                    {catalogPageData.selectedCategory.name}
                </p>
                <h1 className="text-3xl">
                    {catalogPageData.selectedCategory.name}
                </h1>
                <p>
                    {catalogPageData.selectedCategory.description}
                </p>
            </div>

            {/* Section 1 - Category Courses */}
            <div className="p-10">
                <h2 className="text-xl font-semibold mb-4">
                    Courses to get you started
                </h2>
                <Course_Slider
                    Courses={
                        catalogPageData.selectedCategory.courses || []
                    }
                />
            </div>

            {/* Section 2 - Different Category */}
            <div className="p-10">
                <h2 className="text-xl font-semibold mb-4">
                    Top Courses
                </h2>
                <Course_Slider
                    Courses={
                        catalogPageData.differentCategory?.courses || []
                    }
                />
            </div>

            {/* Section 3 - Most Selling */}
            <div className="p-10">
                <h2 className="text-xl font-semibold mb-4">
                    Frequently Bought
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {catalogPageData.mostSellingCourses
                        ?.slice(0, 4)
                        .map((course, i) => (
                            <Course_Card key={i} course={course} />
                        ))}
                </div>
            </div>

            <Footer />
        </>
    )
}

export default Catalog