import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { MdNavigateNext } from "react-icons/md"
import { HiOutlineCurrencyRupee } from "react-icons/hi"
import { toast } from "react-hot-toast"

import {
  addCourseDetails,
  editCourseDetails,
  fetchCourseCategories,
} from "../../../../../services/operations/courseDetailsAPI"

import { setCourse, setStep } from "../../../../../slices/courseSlice"
import IconBtn from "../../../../common/IconBtn"
import Upload from "../Upload"

export default function CourseInformationForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  const dispatch = useDispatch()
  const { token } = useSelector((state) => state.auth)
  const { course, editCourse } = useSelector((state) => state.course)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)

  // ================= FETCH CATEGORIES =================
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetchCourseCategories()
      setCategories(res || [])
    }

    if (editCourse && course) {
      setValue("courseTitle", course.courseName)
      setValue("courseDesc", course.courseDescription)
      setValue("coursePrice", course.price)
      setValue("courseCategory", course.category?._id)
      setValue("courseImage", course.thumbnail)
    }

    fetchData()
  }, [])

  // ================= SUBMIT =================
  const onSubmit = async (data) => {
    try {
      setLoading(true)

      const formData = new FormData()

      formData.append("courseName", data.courseTitle)
      formData.append("courseDescription", data.courseDesc)
      formData.append("price", data.coursePrice)
      formData.append("category", data.courseCategory)

      // ✅ IMPORTANT
      if (data.courseImage && typeof data.courseImage !== "string") {
        formData.append("thumbnailImage", data.courseImage)
      }

      let result

      if (editCourse) {
        formData.append("courseId", course._id)
        result = await editCourseDetails(formData, token)
      } else {
        result = await addCourseDetails(formData, token)
      }

      if (result) {
        dispatch(setCourse(result))
        dispatch(setStep(2))
        toast.success("Course saved successfully")
      } else {
        toast.error("Failed to save course")
      }
    } catch (err) {
      console.error(err)
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 bg-richblack-800 p-6 rounded-md border border-richblack-700"
    >
      {/* TITLE */}
      <div>
        <label className="text-sm text-white">Course Name *</label>
        <input
          {...register("courseTitle", { required: true })}
          className="form-style w-full"
          placeholder="Enter course name"
        />
        {errors.courseTitle && <span className="text-pink-200 text-xs">Required</span>}
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="text-sm text-white">Description *</label>
        <textarea
          {...register("courseDesc", { required: true })}
          className="form-style w-full min-h-[120px]"
          placeholder="Enter description"
        />
      </div>

      {/* PRICE */}
      <div>
        <label className="text-sm text-white">Price *</label>
        <div className="relative">
          <input
            {...register("coursePrice", { required: true })}
            className="form-style w-full pl-10"
            placeholder="Enter price"
          />
          <HiOutlineCurrencyRupee className="absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* CATEGORY */}
      <div>
        <label className="text-sm text-white">Category *</label>
        <select
          {...register("courseCategory", { required: true })}
          className="form-style w-full"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* THUMBNAIL */}
      <Upload
        name="courseImage"
        label="Thumbnail"
        register={register}
        setValue={setValue}
        errors={errors}
        editData={editCourse ? course?.thumbnail : null}
      />

      {/* BUTTON */}
      <div className="flex justify-end">
        <IconBtn disabled={loading} text={editCourse ? "Save" : "Next"}>
          <MdNavigateNext />
        </IconBtn>
      </div>
    </form>
  )
}