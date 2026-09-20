import { Router } from "express";

import {
  createPrescriptionController
} from "./prescription.controller.js";

import {
  authenticate,
  authorize
} from "../auth/auth.middleware.js";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(["DOCTOR"]),
  createPrescriptionController
);

export default router;