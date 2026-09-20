import { Router } from "express";

import { createBooking } from "./booking.controller.js";

import {
  authenticate,
  authorize
} from "../auth/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(["PATIENT"]),
  createBooking
);

export default router;