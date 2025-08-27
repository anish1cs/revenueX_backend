import express from 'express';
import cors from 'cors';
import cookieParser from "cookie-parser";

const app=express();


app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true,

}))

app.use(express.json({
    limit:"16kb"
}))
app.use(express.urlencoded({
    extended:true,
    limit:"16kb"
}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import

import userRouter from "./routes/user.route.js";
import customerRouter from "./routes/customer.route.js";
import cronJob from "./controllers/cronjob.controller.js";
import billRouter from "./routes/bill.route.js";
import paymentRouter from "./routes/payment.route.js";

cronJob.keepServerAlive();

//routes declearation
app.use("/api/v1/users",userRouter)
app.use("/api/v1/customers",customerRouter)
app.use("/api/v1/bills",billRouter)
app.use("/api/v1/payments",paymentRouter)



export default  app 