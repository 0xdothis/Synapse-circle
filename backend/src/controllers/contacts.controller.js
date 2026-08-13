import contactsService from "../services/contacts.service.js";

/**
 * GET /api/contacts
 */
const getContacts = async (req, res, next) => {
  try {
    const result = await contactsService.listContacts(req.userId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/contacts
 */
const createContact = async (req, res, next) => {
  try {
    const { name, email, relationship, phoneNumber } = req.body;

    const result = await contactsService.addContact(req.userId, {
      name,
      email,
      relationship,
      phoneNumber,
    });

    if (result.conflict) {
      return res.status(409).json({
        success: false,
        message: "Contact already exists",
        contact: result.contact,
      });
    }

    if (result.maxReached) {
      return res.status(400).json({
        success: false,
        message: `You can only have up to ${result.maxContacts} trusted contacts`,
        maxContacts: result.maxContacts,
      });
    }

    res.status(201).json({
      success: true,
      message: "Contact added successfully",
      contact: result.contact,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/contacts/:contactId
 */
const updateContact = async (req, res) => {
  const { contactId } = req.params;
  const { name, email, relationship, phoneNumber, isPrimary } = req.body;

  const result = await contactsService.editContact(req.userId, contactId, {
    name,
    email,
    relationship,
    phoneNumber,
    isPrimary,
  });

  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  if (result.emailConflict) {
    return res.status(409).json({
      success: false,
      message: "Another contact with this email already exists",
    });
  }

  res.status(200).json({
    success: true,
    message: "Contact updated successfully",
    contact: result.contact,
  });
};

/**
 * DELETE /api/contacts/:contactId
 */
const deleteContact = async (req, res) => {
  const { contactId } = req.params;

  const result = await contactsService.removeContact(req.userId, contactId);

  if (result.notFound) {
    return res.status(404).json({
      success: false,
      message: "Contact not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Contact deleted successfully",
  });
};

/**
 * GET /api/contacts/campus-security
 */
const getCampusSecurityContacts = async (req, res) => {
  const result = await contactsService.listCampusSecurityContacts();

  res.status(200).json({
    success: true,
    ...result,
  });
};

export default {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  getCampusSecurityContacts,
};
