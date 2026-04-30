const Rajorpay = require('razorpay');
require('dotenv').config();

let instance = null;
if (process.env.RAZORPAY_KEY && process.env.RAZORPAY_SECRET) {
    instance = new Rajorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET
    });
}

exports.instance = instance;