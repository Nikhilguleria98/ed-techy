// sendOtp , signup , login ,  changePassword
const mongoose = require('mongoose');
const User = require('./../models/user');
const Profile = require('./../models/profile');
const optGenerator = require('otp-generator');
const OTP = require('../models/OTP')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookie = require('cookie');
const mailSender = require('../utils/mailSender');
const otpTemplate = require('../mail/templates/emailVerificationTemplate');
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const {
  initialize: initializeFallbackStore,
  getUserByEmail,
  createUser,
  createProfile,
  createOtp,
  getLatestOtp,
} = require('../utils/inMemoryDB');

// ================ SEND-OTP For Email Verification ================
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        const dbConnected = mongoose.connection.readyState === 1;
        const checkUserPresent = dbConnected
            ? await User.findOne({ email })
            : getUserByEmail(email);

        if (checkUserPresent) {
            console.log('(when otp generate) User already registered');
            return res.status(401).json({
                success: false,
                message: 'User is Already Registered',
            });
        }

        const otp = optGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        });

        const otpEntry = dbConnected
            ? await OTP.create({ email, otp })
            : createOtp({ email, otp });

        const name = email.split('@')[0].split('.').map(part => part.replace(/\d+/g, '')).join(' ');
        let emailSent = true;

        try {
            await mailSender(email, 'OTP Verification Email', otpTemplate(otp, name));
        } catch (mailError) {
            emailSent = false;
            console.log('OTP email failed, returning OTP for local development:', mailError.message);
        }

        const responsePayload = {
            success: true,
            message: emailSent ? 'OTP sent successfully' : 'OTP generated successfully. Email not sent because mail is not configured.',
        };

        if (!emailSent) {
            responsePayload.otp = otp;
            responsePayload.warning = 'Email delivery is unavailable in this environment. Use the returned OTP to verify registration.';
        }

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.log('Error while generating OTP - ', error);
        return res.status(500).json({
            success: false,
            message: 'Error while generating OTP',
            error: error.message,
        });
    }
};


// ================ SIGNUP ================
exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp } = req.body;

        if (!firstName || !lastName || !email || !password || !confirmPassword || !accountType || !otp) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required..!',
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Password and confirm password do not match',
            });
        }

        const dbConnected = mongoose.connection.readyState === 1;
        const checkUserAlreadyExists = dbConnected
            ? await User.findOne({ email })
            : getUserByEmail(email);

        if (checkUserAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: 'User registered already, go to Login Page',
            });
        }

        const recentOtp = dbConnected
            ? await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1)
            : getLatestOtp(email);

        if (!recentOtp) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found, please request a new OTP',
            });
        }

        if (otp !== recentOtp.otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const profileDetails = dbConnected
            ? await Profile.create({ gender: null, dateOfBirth: null, about: null, contactNumber: null })
            : createProfile();

        let approved = accountType === 'Instructor' ? false : true;

        const userPayload = {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            contactNumber,
            accountType,
            approved,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
            additionalDetails: dbConnected ? profileDetails._id : profileDetails,
        };

        if (dbConnected) {
            await User.create(userPayload);
        } else {
            createUser(userPayload);
        }

        return res.status(200).json({
            success: true,
            message: 'User Registered Successfully',
        });
    } catch (error) {
        console.log('Error while registering user (signup)', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'User cannot be registered, please try again',
        });
    }
};


// ================ LOGIN ================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        const dbConnected = mongoose.connection.readyState === 1;
        let user = dbConnected
            ? await User.findOne({ email }).populate('additionalDetails')
            : getUserByEmail(email);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'You are not registered with us',
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);
        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: 'Password not matched',
            });
        }

        const payload = {
            email: user.email,
            id: user._id,
            accountType: user.accountType,
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'default_jwt_secret', {
            expiresIn: '24h',
        });

        let userPayload = dbConnected ? user.toObject() : { ...user };
        userPayload.token = token;
        userPayload.password = undefined;

        const cookieOptions = {
            expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            httpOnly: true,
        };

        return res.cookie('token', token, cookieOptions).status(200).json({
            success: true,
            user: userPayload,
            token,
            message: 'User logged in successfully',
        });
    } catch (error) {
        console.log('Error while logging in user', error);
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while logging in user',
        });
    }
};


// ================ CHANGE PASSWORD ================
exports.changePassword = async (req, res) => {
    try {
        // extract data
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        // validation
        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(403).json({
                success: false,
                message: 'All fileds are required'
            });
        }

        // get user
        const userDetails = await User.findById(req.user.id);

        // validate old passowrd entered correct or not
        const isPasswordMatch = await bcrypt.compare(
            oldPassword,
            userDetails.password
        )

        // if old password not match 
        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false, message: "Old password is Incorrect"
            });
        }

        // check both passwords are matched
        if (newPassword !== confirmNewPassword) {
            return res.status(403).json({
                success: false,
                message: 'The password and confirm password do not match'
            })
        }


        // hash password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update in DB
        const updatedUserDetails = await User.findByIdAndUpdate(req.user.id,
            { password: hashedPassword },
            { new: true });


        // send email
        try {
            const emailResponse = await mailSender(
                updatedUserDetails.email,
                'Password for your account has been updated',
                passwordUpdated(
                    updatedUserDetails.email,
                    `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
                )
            );
            // console.log("Email sent successfully:", emailResponse);
        }
        catch (error) {
            console.error("Error occurred while sending email:", error);
            return res.status(500).json({
                success: false,
                message: "Error occurred while sending email",
                error: error.message,
            });
        }


        // return success response
        res.status(200).json({
            success: true,
            mesage: 'Password changed successfully'
        });
    }

    catch (error) {
        console.log('Error while changing passowrd');
        console.log(error)
        res.status(500).json({
            success: false,
            error: error.message,
            messgae: 'Error while changing passowrd'
        })
    }
}