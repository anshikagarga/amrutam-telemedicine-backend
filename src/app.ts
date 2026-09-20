import swaggerUi from "swagger-ui-express";
import { openapi } from "./docs/openapi.js";
import { prisma } from "./lib/prisma.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { metricsMiddleware } from "./middleware/metrics.middleware.js";
import authRouter from "./modules/auth/auth.routes.js";
import doctorRouter from "./modules/doctor/doctor.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import bookingRouter from "./modules/booking/booking.routes.js";
import consultationRouter from "./modules/consultation/consultation.routes.js";
import prescriptionRouter from "./modules/prescription/prescription.routes.js";
import paymentRouter from "./modules/payment/payment.routes.js";
import { apiRateLimiter } from "./middleware/rateLimit.middleware.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { metricsRegistry } from "./observability/metrics.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(metricsMiddleware);
app.use(apiRateLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/consultations", consultationRouter);
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/doctors", doctorRouter);
app.use("/api/payments", paymentRouter);



app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "amrutam-telemedicine-backend"
    });
});

app.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.status(200).json({
      status: "ready",
      service: "amrutam-telemedicine-backend",
      database: "connected",
    });
  } catch (error) {
    return res.status(503).json({
      status: "not_ready",
      service: "amrutam-telemedicine-backend",
      database: "disconnected",
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", metricsRegistry.contentType);

  return res.send(await metricsRegistry.metrics());
});

app.use(errorHandler);

export default app;

