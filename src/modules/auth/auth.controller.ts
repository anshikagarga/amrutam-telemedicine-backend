import {Request, Response} from "express";
import {registerUser, loginUser} from "./auth.service.js";

export const register = async (req: Request, res: Response) => {
    const user = await registerUser(req.body);
    res.status(201).json({
        status: "success",
        message: "register successfully",
        data: user
    })

}

export const login = async(req: Request, res: Response) => {
    const user = await loginUser(req.body);
    res.status(200).json({
        status: "success",
        message: "login successfully l",
        data: user
    })

}