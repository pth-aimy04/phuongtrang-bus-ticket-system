import express from "express";
import { getAllTickets ,getTicketsByUser, bookTicket, cancelTicket, getTicketDetailById, getTicketDetailByBookingCode, getTicketHistory , cancelTicketByBookingCode} from "../controllers/ticketController.js";

const router = express.Router();

router.get("/all", getAllTickets);
router.get("/user/:user_id", getTicketsByUser);
router.post("/book", bookTicket);
router.delete("/:id", cancelTicket);
router.get("/history/:userId", getTicketHistory);
// routes/ticketRoutes.js
router.get("/detail", getTicketDetailByBookingCode); // /api/tickets/detail?booking_code=...

router.get("/detail/:ticket_id", getTicketDetailById);
router.put("/cancel/:booking_code", cancelTicketByBookingCode);

export default router;
