import { useEffect, useState } from "react"
import { MdClose } from "react-icons/md"
import { useSelector } from "react-redux"

export default function ChipInput({
  label,
  name,
  placeholder,
  register,
  errors,
  setValue,
}) {
  const { editCourse, course } = useSelector((state) => state.course)

  const [chips, setChips] = useState([])
  const [inputValue, setInputValue] = useState("")

  // ✅ Register field properly
  useEffect(() => {
    register(name, {
      required: true,
      validate: (value) => value.length > 0,
    })
  }, [register, name])

  // ✅ Prefill in edit mode
  useEffect(() => {
    if (editCourse && course?.tag) {
      setChips(course.tag)
      setValue(name, course.tag)
    }
  }, [editCourse, course, name, setValue])

  // ✅ Sync chips with form
  useEffect(() => {
    setValue(name, chips, { shouldValidate: true }) // ✅ IMPORTANT
  }, [chips, name, setValue])

  // ✅ Add chip
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault()

      const chipValue = inputValue.trim()

      if (chipValue && !chips.includes(chipValue)) {
        const newChips = [...chips, chipValue]
        setChips(newChips)
      }

      setInputValue("")
    }
  }

  // ✅ Delete chip
  const handleDeleteChip = (index) => {
    const newChips = chips.filter((_, i) => i !== index)
    setChips(newChips)
  }

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-sm text-richblack-5">
        {label} <sup className="text-pink-200">*</sup>
      </label>

      <div className="flex w-full flex-wrap gap-2 border p-2 rounded-md">
        {chips.map((chip, index) => (
          <div
            key={index}
            className="flex items-center bg-yellow-400 text-black px-2 py-1 rounded-full"
          >
            {chip}
            <button
              type="button"
              onClick={() => handleDeleteChip(index)}
              className="ml-2"
            >
              <MdClose />
            </button>
          </div>
        ))}

        <input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 outline-none bg-transparent"
        />
      </div>

      {errors[name] && (
        <span className="text-xs text-pink-200">
          {label} is required
        </span>
      )}
    </div>
  )
}