import { Request, Response, Router } from 'express';
import { UserRole } from '../models/user';
import { getUsers } from '../store/users';
import { getConsultations, addConsultation, updateConsultation, findConsultationById, ConsultationStatus } from '../store/consultations';
import { authenticateToken } from '../middleware/auth';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Create consultation
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  const { therapistId, dateTime, notes } = req.body;
  const user = req.user!;

  if (user.role !== UserRole.Client) {
    return res.status(403).json({ message: 'Only clients can schedule consultations' });
  }

  // Validate required fields
  if (!therapistId || !dateTime) {
    return res.status(400).json({ message: 'Therapist ID and date/time are required' });
  }

  // Validate date format and ensure it's in the future
  const appointmentDate = new Date(dateTime);
  const now = new Date();
  
  if (isNaN(appointmentDate.getTime())) {
    return res.status(400).json({ message: 'Invalid date format' });
  }

  // Allow appointments at least 5 minutes in the future
  const minimumTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
  if (appointmentDate < minimumTime) {
    return res.status(400).json({ message: 'Appointments must be scheduled at least 5 minutes in advance' });
  }

  // Validate appointment is not more than 6 months in the future
  const maxFutureTime = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000); // 6 months
  if (appointmentDate > maxFutureTime) {
    return res.status(400).json({ message: 'Appointments cannot be scheduled more than 6 months in advance' });
  }

  const therapist = getUsers().find((u) => u.id === therapistId && u.role === UserRole.Therapist);
  if (!therapist) {
    return res.status(404).json({ message: 'Therapist not found' });
  }

  // Check for conflicting appointments with the same therapist
  const consultations = getConsultations();
  const conflictingAppointment = consultations.find(
    (consultation) =>
      consultation.therapistId === therapistId &&
      consultation.status !== ConsultationStatus.Cancelled &&
      Math.abs(new Date(consultation.dateTime).getTime() - appointmentDate.getTime()) < 60 * 60 * 1000 // 1 hour buffer
  );

  if (conflictingAppointment) {
    return res.status(409).json({ message: 'Therapist has a conflicting appointment at this time' });
  }

  const consultation = {
    id: Math.random().toString(36).substr(2, 9),
    clientId: user.id,
    therapistId,
    dateTime,
    status: ConsultationStatus.Pending,
    notes,
  };

  const createdConsultation = addConsultation(consultation);
  return res.json(createdConsultation);
});

// Get consultations
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  const user = req.user!;

  const consultations = getConsultations();
  const userConsultations = consultations.filter((consultation) =>
    user.role === UserRole.Client
      ? consultation.clientId === user.id
      : consultation.therapistId === user.id
  );

  const allUsers = getUsers();
  const consultationsWithClientInfo = userConsultations.map((consultation) => {
    const client = allUsers.find((u) => u.id === consultation.clientId);
    return {
      ...consultation,
      clientEmail: client?.email,
    };
  });

  return res.json(consultationsWithClientInfo);
});

// Update consultation status
router.patch('/:id', authenticateToken, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user!;

  const consultation = findConsultationById(id);
  if (!consultation) {
    return res.status(404).json({ message: 'Consultation not found' });
  }

  if (user.role !== UserRole.Therapist || consultation.therapistId !== user.id) {
    return res
      .status(403)
      .json({ message: 'Only the assigned therapist can update consultation status' });
  }

  if (!Object.values(ConsultationStatus).includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  const updatedConsultation = updateConsultation(id, { status });
  return res.json(updatedConsultation);
});

export default router;
