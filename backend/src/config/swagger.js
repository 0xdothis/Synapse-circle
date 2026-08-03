import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SafeWalk Campus API",
      version: "2.0.0",
      description: [
        "SafeWalk Campus - One-tap Panic Button Application API.",
        "A platform that lets students and campus residents alert their trusted contacts and campus security with their live location the moment they feel unsafe.",
        "",
        "Authentication Strategy",
        "- **Web Clients**: Uses httpOnly cookies + CSRF tokens",
        "- **Mobile Clients**: Uses Bearer tokens (send `X-Client-Type: mobile` header)",
        "- **OTP Flow**: Email-based OTP verification for signup and password reset",
      ].join(" "),
      license: {
        name: "MIT",
      },
      contact: {
        name: "SafeWalk Campus Support",
        email: "support@safewalk-campus.com",
      },
    },
    tags: [
      {
        name: "Authentication",
        description:
          "User authentication, OTP verification, and session management",
      },
      {
        name: "Contacts",
        description: "Trusted contacts management (max 3 contacts)",
      },
      {
        name: "SOS Alerts",
        description: "SOS alert triggering, cancellation, and history",
      },
      {
        name: "Emergency Directory",
        description: "Emergency contacts and campus security directory",
      },
      {
        name: "Profile",
        description: "User profile management including profile pictures",
      },
      {
        name: "Health",
        description: "API health check and status",
      },
    ],
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
      {
        url: "https://synap-circle.onrender.com",
        description: "Production Server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description:
            "HTTP-only cookie containing the access token (web clients)",
        },
        csrfAuth: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
          description:
            "CSRF token header (required for web clients on mutating requests)",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Bearer token for mobile clients (send `X-Client-Type: mobile` header)",
        },
        mobileHeader: {
          type: "apiKey",
          in: "header",
          name: "X-Client-Type",
          description:
            "Set to 'mobile' for native app clients to receive tokens in response body",
        },
      },
      schemas: {
        // AUTH SCHEMAS
        SignupRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "student@campus.edu",
              description: "Valid email address for OTP verification",
            },
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
              description: "User's full name (optional)",
            },
            password: {
              type: "string",
              minLength: 8,
              pattern: String.raw`^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$`,
              example: "SecurePass123",
              description:
                "At least 8 characters with one letter and one number",
            },
          },
        },
        SignupResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: {
              type: "string",
              example: "OTP sent successfully to your email",
            },
            development_otp: {
              type: "string",
              example: "123456",
              description: "⚠️ Only in development/test environments",
            },
          },
        },
        VerifyOTPRequest: {
          type: "object",
          required: ["email", "otpCode"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "student@campus.edu",
            },
            otpCode: {
              type: "string",
              minLength: 6,
              maxLength: 6,
              pattern: String.raw`^\d{6}$`,
              example: "123456",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "OTP verified successfully" },
            user: { $ref: "#/components/schemas/User" },
            csrfToken: {
              type: "string",
              description: "CSRF token for web clients (set in cookie)",
            },
            accessToken: {
              type: "string",
              description:
                "Access token for mobile clients (when X-Client-Type: mobile)",
            },
            refreshToken: {
              type: "string",
              description:
                "Refresh token for mobile clients (when X-Client-Type: mobile)",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "student@campus.edu",
            },
            password: { type: "string", example: "SecurePass123" },
          },
        },
        RefreshTokenRequest: {
          type: "object",
          properties: {
            refreshToken: {
              type: "string",
              description: "Refresh token (required for mobile clients)",
            },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "student@campus.edu",
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          required: ["resetToken", "newPassword", "confirmPassword"],
          properties: {
            resetToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            newPassword: {
              type: "string",
              minLength: 8,
              example: "NewSecurePass123",
            },
            confirmPassword: { type: "string", example: "NewSecurePass123" },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword", "confirmPassword"],
          properties: {
            currentPassword: { type: "string", example: "OldPass123" },
            newPassword: {
              type: "string",
              minLength: 8,
              example: "NewPass456",
            },
            confirmPassword: { type: "string", example: "NewPass456" },
          },
        },

        // USER SCHEMAS
        User: {
          type: "object",
          properties: {
            id: { type: "string", example: "507f1f77bcf86cd799439011" },
            email: {
              type: "string",
              format: "email",
              example: "student@campus.edu",
            },
            name: { type: "string", example: "John Doe" },
            isVerified: { type: "boolean", example: true },
            isActive: { type: "boolean", example: true },
            profilePicture: {
              type: "string",
              nullable: true,
              example: "https://res.cloudinary.com/.../profile_123.jpg",
            },
            university: { type: "string", example: "Stanford University" },
            universityId: { type: "string", nullable: true },
            onboardingStep: {
              type: "string",
              enum: [
                "welcome",
                "location",
                "university",
                "contacts",
                "complete",
              ],
              example: "complete",
            },
            authProvider: {
              type: "string",
              enum: ["local", "google"],
              example: "local",
            },
            trustedContactsCount: { type: "integer", example: 3 },
            maxContacts: { type: "integer", example: 3 },
            preferences: {
              type: "object",
              properties: {
                autoShareLocation: { type: "boolean", example: true },
                alertSound: { type: "boolean", example: true },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            lastLogin: { type: "string", format: "date-time" },
          },
        },

        // PROFILE SCHEMAS
        Profile: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            profilePicture: { type: "string", nullable: true },
            university: { type: "string" },
            universityId: { type: "string", nullable: true },
            isVerified: { type: "boolean" },
            isActive: { type: "boolean" },
            preferences: {
              type: "object",
              properties: {
                autoShareLocation: { type: "boolean" },
                alertSound: { type: "boolean" },
              },
            },
            onboardingStep: {
              type: "string",
              enum: [
                "welcome",
                "location",
                "university",
                "contacts",
                "complete",
              ],
            },
            safetySetup: {
              type: "object",
              properties: {
                institutionSelected: { type: "boolean" },
                trustedContactsAdded: { type: "boolean" },
                locationPermissionEnabled: { type: "boolean" },
                isComplete: { type: "boolean" },
              },
            },
            trustedContacts: {
              type: "array",
              items: { $ref: "#/components/schemas/TrustedContact" },
            },
            stats: {
              type: "object",
              properties: {
                total: { type: "integer" },
                active: { type: "integer" },
                cancelled: { type: "integer" },
                resolved: { type: "integer" },
              },
            },
            maxContacts: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            lastLogin: { type: "string", format: "date-time" },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            university: { type: "string" },
            universityId: { type: "string" },
            preferences: {
              type: "object",
              properties: {
                autoShareLocation: { type: "boolean" },
                alertSound: { type: "boolean" },
              },
            },
          },
        },

        // CONTACT SCHEMAS
        TrustedContact: {
          type: "object",
          properties: {
            id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "Jane Smith" },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            relationship: {
              type: "string",
              enum: [
                "parent",
                "sibling",
                "friend",
                "roommate",
                "partner",
                "other",
              ],
              example: "friend",
            },
            isPrimary: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
          },
        },
        CreateContactRequest: {
          type: "object",
          required: ["name", "email", "relationship"],
          properties: {
            name: { type: "string", example: "Jane Smith" },
            email: {
              type: "string",
              format: "email",
              example: "jane@example.com",
            },
            relationship: {
              type: "string",
              enum: [
                "parent",
                "sibling",
                "friend",
                "roommate",
                "partner",
                "other",
              ],
              example: "friend",
            },
          },
        },
        UpdateContactRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 100 },
            email: { type: "string", format: "email" },
            relationship: {
              type: "string",
              enum: [
                "parent",
                "sibling",
                "friend",
                "roommate",
                "partner",
                "other",
              ],
            },
            isPrimary: { type: "boolean" },
          },
        },
        ContactsResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            contacts: {
              type: "array",
              items: { $ref: "#/components/schemas/TrustedContact" },
            },
            count: { type: "integer", example: 2 },
            maxContacts: { type: "integer", example: 3 },
            canAddMore: { type: "boolean", example: true },
          },
        },

        // SOS ALERT SCHEMAS
        TriggerSOSRequest: {
          type: "object",
          required: ["latitude", "longitude"],
          properties: {
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
              example: 37.7749,
              description: "Current latitude of the user",
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
              example: -122.4194,
              description: "Current longitude of the user",
            },
            locationAvailable: {
              type: "boolean",
              example: true,
              description: "Whether location was successfully captured",
            },
          },
        },
        SOSAlert: {
          type: "object",
          properties: {
            id: { type: "string" },
            status: {
              type: "string",
              enum: ["sent", "cancelled", "failed", "resolved"],
            },
            message: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
            location: {
              type: "object",
              properties: {
                latitude: { type: "number" },
                longitude: { type: "number" },
                available: { type: "boolean" },
              },
            },
            locationLink: { type: "string" },
            contactsNotified: {
              type: "array",
              description:
                "Recipients notified for this alert. Backed by the AlertRecipient collection (email delivery only).",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string" },
                  delivered: { type: "boolean" },
                },
              },
            },
            canCancel: { type: "boolean" },
            cancellationTimeRemaining: {
              type: "number",
              description: "Minutes remaining to cancel",
            },
            cancelledAt: { type: "string", format: "date-time" },
            cancellationReason: {
              type: "string",
              enum: ["false_alarm", "resolved", "user_error"],
            },
          },
        },
        SOSResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            alertId: { type: "string" },
            status: { type: "string", example: "sent" },
            contactsNotified: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: {
                    type: "string",
                    enum: [
                      "trusted_contact",
                      "campus_security",
                      "emergency_directory",
                    ],
                  },
                  name: { type: "string" },
                  email: { type: "string" },
                  delivered: { type: "boolean" },
                },
              },
            },
            deliveredCount: { type: "integer" },
            totalCount: { type: "integer" },
            message: { type: "string" },
          },
        },
        CancelSOSRequest: {
          type: "object",
          properties: {
            reason: {
              type: "string",
              enum: ["false_alarm", "resolved", "user_error"],
              default: "false_alarm",
            },
          },
        },
        SOSStatusResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            status: {
              type: "string",
              enum: ["sent", "cancelled", "failed", "resolved"],
            },
            canCancel: { type: "boolean" },
            cancellationTimeRemaining: { type: "number" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AlertHistoryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            alerts: {
              type: "array",
              items: { $ref: "#/components/schemas/SOSAlert" },
            },
            total: { type: "integer" },
            offset: { type: "integer" },
            limit: { type: "integer" },
            statusCounts: {
              type: "object",
              properties: {
                all: { type: "integer" },
                sent: { type: "integer" },
                cancelled: { type: "integer" },
                resolved: { type: "integer" },
                failed: { type: "integer" },
              },
            },
            pagination: {
              type: "object",
              properties: {
                total: { type: "integer" },
                page: { type: "integer" },
                limit: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },

        // EMERGENCY DIRECTORY SCHEMAS
        EmergencyContact: {
          type: "object",
          properties: {
            id: { type: "string" },
            type: {
              type: "string",
              enum: ["security", "hospital", "police", "ambulance", "fire"],
            },
            name: { type: "string" },
            phoneNumber: { type: "string" },
            email: { type: "string", format: "email" },
            address: { type: "string" },
            isVerified: { type: "boolean" },
            isActive: { type: "boolean" },
            description: { type: "string" },
            operatingHours: { type: "string" },
            distance: {
              type: "number",
              description: "Distance in meters (for nearby queries)",
            },
          },
        },
        EmergencyDirectoryResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            total: { type: "integer" },
            contacts: {
              type: "array",
              items: { $ref: "#/components/schemas/EmergencyContact" },
            },
            grouped: {
              type: "object",
              additionalProperties: {
                type: "array",
                items: { $ref: "#/components/schemas/EmergencyContact" },
              },
            },
          },
        },

        // CAMPUS SECURITY SCHEMAS
        CampusSecurity: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            phoneNumber: { type: "string" },
            email: { type: "string", format: "email" },
            location: { type: "string" },
            isPrimary: { type: "boolean" },
            isActive: { type: "boolean" },
            operatingHours: { type: "string" },
            description: { type: "string" },
          },
        },

        //ONBOARDING SCHEMAS
        OnboardingStatusResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            currentStep: {
              type: "string",
              enum: [
                "welcome",
                "location",
                "university",
                "contacts",
                "complete",
              ],
            },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            isComplete: { type: "boolean" },
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  label: { type: "string" },
                  isCompleted: { type: "boolean" },
                  isActive: { type: "boolean" },
                  isLocked: { type: "boolean" },
                },
              },
            },
            canGoForward: { type: "boolean" },
            canGoBack: { type: "boolean" },
            nextStep: { type: "string", nullable: true },
            previousStep: { type: "string", nullable: true },
            contactsCount: { type: "integer" },
            maxContacts: { type: "integer" },
            user: { $ref: "#/components/schemas/User" },
          },
        },
        OnboardingStepRequest: {
          type: "object",
          required: ["step"],
          properties: {
            step: {
              type: "string",
              enum: [
                "welcome",
                "location",
                "university",
                "contacts",
                "complete",
              ],
            },
            data: {
              type: "object",
              properties: {
                location: {
                  type: "object",
                  properties: {
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                  },
                },
                universityId: { type: "string" },
                selectedUniversity: { type: "string" },
                contacts: {
                  type: "array",
                  description:
                    "Array of contacts to add (only for 'contacts' step)",
                  items: {
                    type: "object",
                    required: ["name", "email", "relationship"],
                    properties: {
                      name: { type: "string", maxLength: 100 },
                      email: { type: "string", format: "email" },
                      relationship: {
                        type: "string",
                        enum: [
                          "parent",
                          "sibling",
                          "friend",
                          "roommate",
                          "partner",
                          "other",
                        ],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        OnboardingStepResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            step: { type: "string" },
            isComplete: { type: "boolean" },
            progress: { type: "integer" },
            canGoForward: { type: "boolean" },
            canGoBack: { type: "boolean" },
            nextStep: { type: "string", nullable: true },
            previousStep: { type: "string", nullable: true },
            contacts: {
              type: "object",
              properties: {
                count: { type: "integer" },
                maxContacts: { type: "integer" },
              },
            },
            user: { $ref: "#/components/schemas/User" },
          },
        },

        // ERROR SCHEMAS
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            code: {
              type: "string",
              enum: [
                "INVALID_TOKEN",
                "TOKEN_EXPIRED",
                "USER_NOT_FOUND",
                "ACCOUNT_DEACTIVATED",
                "MISSING_TOKEN",
                "AUTH_ERROR",
                "SESSION_REUSE_DETECTED",
              ],
            },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },
        ValidationError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  field: { type: "string" },
                  message: { type: "string" },
                },
              },
            },
          },
        },

        //HEALTH SCHEMAS
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            timestamp: { type: "string", format: "date-time" },
            uptime: { type: "number" },
            environment: { type: "string" },
            mongodb: { type: "string", enum: ["connected", "disconnected"] },
          },
        },
      },
      security: [
        {
          cookieAuth: [],
          csrfAuth: [],
        },
      ],
    },
    security: [
      {
        cookieAuth: [],
        csrfAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);
export { swaggerSpec };
