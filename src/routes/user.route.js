import { Router } from "express";
import { loginUser, logoutUser, registerUser,refreshAccessToken, demoApi } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/demo").get(demoApi)

router.route("/register").post(
    upload.fields([
        {name:"avatar",
            maxCount: 1
        },
    ]),
    registerUser
)

router.route("/login").post(loginUser)


// secured routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(verifyJWT,refreshAccessToken)



export default router