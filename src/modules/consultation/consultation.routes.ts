import { Router } from "express";

import {
  getConsultation,
  updateStatus
} from "./consultation.controller.js";

import {
  authenticate,
  authorize
} from "../auth/auth.middleware.js";

const router = Router();

router.get(
  "/:consultationId",
  authenticate,
  authorize(["PATIENT", "DOCTOR", "ADMIN"]),
  getConsultation
);

router.patch(
  "/:consultationId/status",
  authenticate,
  authorize(["DOCTOR"]),
  updateStatus
);

export default router;