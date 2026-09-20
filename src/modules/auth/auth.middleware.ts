import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthUser {
    id: string;
    role: string;
}

declare global{
    namespace Express{
        interface Request{
            user? : AuthUser;
        }
    }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    // console.log("AUTH HEADER:", req.headers.authorization);

    const headers = req.headers.authorization;
    if (!headers) {
        return res.status(401).json({
            status: "error",
            message: "authoriation is required"

        })

    }

    if (!headers.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Invalid authorization format"
        });
    }

    const token = headers.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            status: "error",
            message: "token is missing"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser;

        // console.log(decoded);
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            status: "error",
            message: "invalid or Expired token"
        })
    }
}

export const authorize = ( roles: string[]) => {

    return (req: Request, res: Response, next: NextFunction) => {
        if(!req.user?.role){
            return res.status(403).json({
                status: "error",
                message: "user role is required"
            })
        }
        if(!roles.includes(req.user.role)){
            return res.status(403).json({
                status: "error",
                message: "Authorization is denied",

            })
        }
        next();
    }

}
