import express from "express";
import emergencyController from "../controllers/emergency.controller.js";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = express.Router();

/**
 * @swagger
 * /api/emergency/directory:
 *   get:
 *     summary: Get emergency directory
 *     description: Returns all verified emergency contacts (security, hospital, police, etc.)
 *     tags: [Emergency Directory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [security, hospital, police, ambulance, fire]
 *         description: Filter by emergency type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or address
 *     responses:
 *       200:
 *         description: Emergency directory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *                 grouped:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/EmergencyContact'
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/directory",
  authenticate,
  asyncHandler(emergencyController.getDirectory),
);

/**
 * @swagger
 * /api/emergency/directory/{id}:
 *   get:
 *     summary: Get a specific emergency contact
 *     description: Returns details of a specific emergency contact
 *     tags: [Emergency Directory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Emergency contact ID
 *     responses:
 *       200:
 *         description: Emergency contact retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 contact:
 *                   $ref: '#/components/schemas/EmergencyContact'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Emergency contact not found
 */
router.get(
  "/directory/:id",
  authenticate,
  asyncHandler(emergencyController.getDirectoryEntry),
);

/**
 * @swagger
 * /api/emergency/nearby:
 *   get:
 *     summary: Get nearby emergency contacts
 *     description: Returns emergency contacts within a radius of the user's location
 *     tags: [Emergency Directory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Current latitude
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Current longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 5000
 *         description: "Search radius in meters (default 5000m = 5km)"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [security, hospital, police, ambulance, fire]
 *         description: Filter by emergency type
 *     responses:
 *       200:
 *         description: Nearby emergency contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 contacts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmergencyContact'
 *       400:
 *         description: Latitude and longitude are required
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/nearby",
  authenticate,
  asyncHandler(emergencyController.getNearbyContacts),
);

export default router;
