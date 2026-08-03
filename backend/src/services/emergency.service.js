import EmergencyDirectory from "../models/EmergencyDirectory.js";

/**
 * List emergency directory entries, optionally filtered by type and a
 * name/address/description search term. Also returns a grouped-by-type view.
 */
const getDirectory = async ({ type, search }) => {
  const query = { isActive: true };
  if (type) query.type = type;

  let contacts = await EmergencyDirectory.find(query)
    .select("-__v")
    .sort({ type: 1, name: 1 });

  if (search) {
    const searchRegex = new RegExp(search, "i");
    contacts = contacts.filter(
      (contact) =>
        searchRegex.test(contact.name) ||
        searchRegex.test(contact.address) ||
        searchRegex.test(contact.description),
    );
  }

  const grouped = contacts.reduce((acc, contact) => {
    const contactType = contact.type;
    if (!acc[contactType]) acc[contactType] = [];
    acc[contactType].push(contact);
    return acc;
  }, {});

  return { total: contacts.length, contacts, grouped };
};

/**
 * Fetch a single emergency directory entry by ID.
 * Returns null if not found or inactive.
 */
const getDirectoryEntry = async (id) => {
  return EmergencyDirectory.findOne({
    _id: id,
    isActive: true,
  });
};

/**
 * Find emergency contacts near a given point.
 * Returns { error: "INVALID_COORDS" } if lat/lng don't parse.
 */
const getNearbyContacts = async ({ latitude, longitude, radius, type }) => {
  const lat = Number.parseFloat(latitude);
  const lng = Number.parseFloat(longitude);
  const maxDistance = Number.parseInt(radius, 10);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "INVALID_COORDS" };
  }

  const contacts = await EmergencyDirectory.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [lng, lat] },
        distanceField: "distance",
        maxDistance: Math.max(0, maxDistance),
        spherical: true,
        query: {
          isActive: true,
          ...(type && { type }),
        },
      },
    },
    { $limit: 20 },
    {
      $project: {
        name: 1,
        type: 1,
        phoneNumber: 1,
        email: 1,
        address: 1,
        distance: 1,
        operatingHours: 1,
        isVerified: 1,
      },
    },
  ]);

  return { total: contacts.length, contacts };
};

export default { getDirectory, getDirectoryEntry, getNearbyContacts };
