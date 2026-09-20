import { Router } from "express";

import {
    registerDoctor,
    getAvailability,
    getDoctor,
    createAvailability,
    searchDoctorsController
} from "./doctor.controller.js";

import {
    authenticate,
    authorize
} from "../auth/auth.middleware.js";

const router = Router();

router.post(
    "/register-doctor",
    authenticate,
    authorize(["ADMIN"]),
    registerDoctor
);

router.get(
    "/search",
    searchDoctorsController
);

router.post(
    "/availability",
    authenticate,
    authorize(["DOCTOR"]),
    createAvailability
);

router.get(
    "/:doctorId/availability",
    getAvailability
);

router.get(
    "/:doctorId",
    getDoctor
);

export default router;