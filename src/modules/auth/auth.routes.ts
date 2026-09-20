import {Router, Request, Response} from "express";
import {register, login} from "./auth.controller.js"
import { authenticate, authorize } from "./auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, (req : Request, res: Response) => {
    return res.json({id: req.user?.id, role: req.user?.role})
});
router.get("/doctor-data", authenticate, authorize(["DOCTOR", "ADMIN"]), (req: Request, res: Response) => {
    return res.json({
        message: "doctor data",
        user: req.user
    })
})

export default  router;