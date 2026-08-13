import express from "express";
import { authenticate } from "../middlewares/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validator.js";
import { body, query } from "express-validator";
import universityController from "../controllers/university.controller.js";

const router = express.Router();

/**
 * @swagger
 * /api/university:
 *   post:
 *     summary: Save or update user's university
 *     description: Saves the user's university information during onboarding. The acronym serves as the unique identifier for the university within the app.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - acronym
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "University of Lagos"
 *                 description: Full name of the university
 *               acronym:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *                 pattern: "^[A-Za-z0-9]+$"
 *                 example: "UNILAG"
 *                 description: "University acronym (2-10 alphanumeric characters)"
 *               location:
 *                 type: string
 *                 example: "Akoka, Yaba, Lagos, Nigeria"
 *                 description: Location of the university (optional)
 *     responses:
 *       200:
 *         description: University saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "University saved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     university:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         acronym:
 *                           type: string
 *                         location:
 *                           type: string
 *                     onboardingStep:
 *                       type: string
 *                       example: "contacts"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: University already set for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "University already set for this user. Use PUT to update."
 *                 data:
 *                   type: object
 *                   properties:
 *                     university:
 *                       type: object
 */
router.post(
  "/",
  authenticate,
  validate([
    body("name")
      .notEmpty()
      // FIXED: Match the controller's message
      .withMessage("University name and acronym are required")
      .isLength({ max: 100 })
      .withMessage("University name cannot exceed 100 characters")
      .trim(),
    body("acronym")
      .notEmpty()
      // FIXED: Match the controller's message
      .withMessage("University name and acronym are required")
      .isLength({ min: 2, max: 10 })
      .withMessage("Acronym must be between 2 and 10 characters")
      .matches(/^[A-Za-z0-9]+$/)
      .withMessage("Acronym can only contain letters and numbers")
      .trim()
      .toUpperCase(),
    body("location")
      .optional()
      .isString()
      .withMessage("Location must be a string")
      .trim(),
  ]),
  asyncHandler(universityController.saveUniversity),
);

/**
 * @swagger
 * /api/university:
 *   get:
 *     summary: Get user's university
 *     description: Returns the authenticated user's university information
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: University retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     university:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         name:
 *                           type: string
 *                         acronym:
 *                           type: string
 *                         location:
 *                           type: string
 *                     onboardingStep:
 *                       type: string
 *                       enum: [welcome, location, university, contacts, complete]
 *                       example: "welcome"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", authenticate, asyncHandler(universityController.getUniversity));

/**
 * @swagger
 * /api/university:
 *   put:
 *     summary: Update user's university
 *     description: Updates the authenticated user's university information. At least one field must be provided.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "University of Lagos (Updated)"
 *               acronym:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 10
 *                 pattern: "^[A-Za-z0-9]+$"
 *                 example: "UNILAG"
 *               location:
 *                 type: string
 *                 example: "Akoka, Yaba, Lagos, Nigeria"
 *     responses:
 *       200:
 *         description: University updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "University updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     university:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         acronym:
 *                           type: string
 *                         location:
 *                           type: string
 *                     onboardingStep:
 *                       type: string
 *       400:
 *         description: No fields provided or validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "At least one field (name, acronym, or location) is required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/",
  authenticate,
  validate([
    body("name")
      .optional()
      .isLength({ max: 100 })
      .withMessage("University name cannot exceed 100 characters")
      .trim(),
    body("acronym")
      .optional()
      .isLength({ min: 2, max: 10 })
      .withMessage("Acronym must be between 2 and 10 characters")
      .matches(/^[A-Za-z0-9]+$/)
      .withMessage("Acronym can only contain letters and numbers")
      .trim()
      .toUpperCase(),
    body("location")
      .optional()
      .isString()
      .withMessage("Location must be a string")
      .trim(),
  ]),
  asyncHandler(universityController.updateUniversity),
);

/**
 * @swagger
 * /api/university:
 *   delete:
 *     summary: Remove user's university
 *     description: Removes the authenticated user's university information
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: University removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "University removed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     university:
 *                       type: null
 *                     onboardingStep:
 *                       type: string
 *       400:
 *         description: No university set to remove
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No university set to remove"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/",
  authenticate,
  asyncHandler(universityController.deleteUniversity),
);

/**
 * @swagger
 * /api/university/security:
 *   get:
 *     summary: Get campus security contacts for user's university
 *     description: Returns all active campus security contacts associated with the user's university. If no university is set, returns all active security contacts.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security contacts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CampusSecurity'
 *                 university:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     name:
 *                       type: string
 *                     acronym:
 *                       type: string
 *                     location:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: "No university set. Showing all security contacts."
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/security",
  authenticate,
  asyncHandler(universityController.getSecurityContacts),
);

/**
 * @swagger
 * /api/university/list:
 *   get:
 *     summary: Get list of all unique universities
 *     description: Returns a list of all unique universities from both user profiles and campus security contacts. Useful for autocomplete dropdowns.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: University list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       acronym:
 *                         type: string
 *                       location:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/list",
  authenticate,
  asyncHandler(universityController.getUniversityList),
);

/**
 * @swagger
 * /api/university/search:
 *   get:
 *     summary: Search universities by name or acronym
 *     description: Searches for universities by name, acronym, or location. Returns matching results for autocomplete functionality.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *         example: "Lagos"
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       acronym:
 *                         type: string
 *                       location:
 *                         type: string
 *                 searchTerm:
 *                   type: string
 *                   example: "Lagos"
 *       400:
 *         description: Search query is required or too short
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Search query must be at least 2 characters"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/search",
  authenticate,
  validate([
    query("q")
      .notEmpty()
      .withMessage("Search query is required")
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters"),
  ]),
  asyncHandler(universityController.searchUniversities),
);

/**
 * @swagger
 * /api/university/{acronym}:
 *   get:
 *     summary: Get university details by acronym
 *     description: Returns detailed information about a university including its users and security contacts. The acronym is case-insensitive.
 *     tags: [University]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: acronym
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 10
 *         description: University acronym (case-insensitive)
 *         example: "UNILAG"
 *     responses:
 *       200:
 *         description: University details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     acronym:
 *                       type: string
 *                       example: "UNILAG"
 *                     name:
 *                       type: string
 *                       example: "University of Lagos"
 *                     location:
 *                       type: string
 *                       nullable: true
 *                       example: "Akoka, Yaba, Lagos, Nigeria"
 *                     securityContacts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CampusSecurity'
 *                     totalUsers:
 *                       type: integer
 *                       example: 5
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           profilePicture:
 *                             type: string
 *                             nullable: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: University not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 'University with acronym "UNILAG" not found'
 */
router.get(
  "/:acronym",
  authenticate,
  asyncHandler(universityController.getUniversityByAcronym),
);

export default router;
