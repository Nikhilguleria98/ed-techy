import React, { useState, useEffect } from 'react'
import { Link, matchPath, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'

import { NavbarLinks } from "../../../data/navbar-links"
import studyNotionLogo from '../../assets/Logo/Logo-Full-Light.png'
import { fetchCourseCategories } from './../../services/operations/courseDetailsAPI'

import ProfileDropDown from '../core/Auth/ProfileDropDown'
import MobileProfileDropDown from '../core/Auth/MobileProfileDropDown'

import { AiOutlineShoppingCart } from "react-icons/ai"
import { MdKeyboardArrowDown } from "react-icons/md"

const Navbar = () => {
    const { token } = useSelector((state) => state.auth)
    const { user } = useSelector((state) => state.profile)
    const { totalItems } = useSelector((state) => state.cart)
    const location = useLocation()

    const [subLinks, setSubLinks] = useState([])
    const [loading, setLoading] = useState(false)

    // ✅ Fetch Categories FIXED
    const fetchSublinks = async () => {
        try {
            setLoading(true)
            const res = await fetchCourseCategories()
            setSubLinks(res?.data || res || [])   // ✅ Handles both API formats
        } catch (error) {
            console.log("Category fetch error:", error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSublinks()
    }, [])

    // ✅ Active route check
    const matchRoute = (route) => {
        return matchPath({ path: route }, location.pathname)
    }

    // ✅ Navbar scroll behavior FIXED
    const [showNavbar, setShowNavbar] = useState('top')
    const [lastScrollY, setLastScrollY] = useState(0)

    const controlNavbar = () => {
        if (window.scrollY > 200) {
            if (window.scrollY > lastScrollY) {
                setShowNavbar('hide')
            } else {
                setShowNavbar('show')
            }
        } else {
            setShowNavbar('top')
        }
        setLastScrollY(window.scrollY)
    }

    useEffect(() => {
        window.addEventListener('scroll', controlNavbar)
        return () => {
            window.removeEventListener('scroll', controlNavbar)
        }
    }, [lastScrollY])

    return (
        <nav className={`z-[10] flex h-14 w-full items-center justify-center border-b border-richblack-700 text-white transition-all ${showNavbar}`}>
            <div className='flex w-11/12 max-w-maxContent items-center justify-between'>

                {/* Logo */}
                <Link to="/">
                    <img src={studyNotionLogo} width={160} alt="Logo" />
                </Link>

                {/* Nav Links */}
                <ul className='hidden sm:flex gap-x-6 text-richblack-25'>
                    {NavbarLinks.map((link, index) => (
                        <li key={index}>
                            {link.title === "Catalog" ? (
                                <div className={`group relative flex cursor-pointer items-center gap-1 px-3 py-1 rounded-xl ${matchRoute("/catalog/:catalogName") ? "bg-yellow-25 text-black" : ""}`}>
                                    <p>{link.title}</p>
                                    <MdKeyboardArrowDown />

                                    {/* Dropdown */}
                                    <div className="invisible absolute left-1/2 top-[calc(100%+5px)] z-50 w-[250px] -translate-x-1/2 flex flex-col rounded-lg bg-white text-black opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100 p-4">
                                        {/* Invisible bridge to prevent hover loss */}
                                        <div className="absolute -top-6 left-0 h-6 w-full bg-transparent"></div>
                                        {loading ? (
                                            <p className="text-center">Loading...</p>
                                        ) : subLinks.length > 0 ? (
                                            subLinks.map((cat, i) => (
                                                <Link
                                                    key={i}
                                                    to={`/catalog/${cat.name.split(" ").join("-").toLowerCase()}`}
                                                    className="block px-3 py-2 rounded hover:bg-gray-100"
                                                >
                                                    {cat.name}
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="text-center">No Categories</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link to={link.path}>
                                    <p className={`px-3 py-1 rounded-xl ${matchRoute(link.path) ? "bg-yellow-25 text-black" : ""}`}>
                                        {link.title}
                                    </p>
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>

                {/* Right Side */}
                <div className='flex gap-x-4 items-center'>
                    {user && user.accountType !== "Instructor" && (
                        <Link to="/dashboard/cart" className="relative">
                            <AiOutlineShoppingCart className="text-2xl" />
                            {totalItems > 0 && (
                                <span className="absolute -bottom-2 -right-2 bg-yellow-100 text-black text-xs px-1 rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    )}

                    {!token && (
                        <>
                            <Link to="/login">
                                <button className="border px-3 py-1 rounded">Login</button>
                            </Link>
                            <Link to="/signup">
                                <button className="border px-3 py-1 rounded">Signup</button>
                            </Link>
                        </>
                    )}

                    {token && <ProfileDropDown />}
                    {token && <MobileProfileDropDown />}
                </div>
            </div>
        </nav>
    )
}

export default Navbar