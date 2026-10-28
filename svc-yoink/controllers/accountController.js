import mongoose from 'mongoose';

const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
const optionalFields = ['addressLine2', 'label'];

function readAddress(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  for (const field of requiredFields) {
    if (typeof body[field] !== 'string' || !body[field].trim() || body[field].trim().length > 200)
      return null;
  }
  for (const field of optionalFields) {
    if (body[field] !== undefined && (typeof body[field] !== 'string' || body[field].length > 200))
      return null;
  }
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim() : 'Home';
  if (label.length > 40) return null;
  return {
    label,
    fullName: body.fullName.trim(),
    addressLine1: body.addressLine1.trim(),
    addressLine2: (body.addressLine2 || '').trim(),
    city: body.city.trim(),
    state: body.state.trim(),
    postalCode: body.postalCode.trim(),
    country: body.country.trim(),
  };
}

export async function addSavedAddress(req, res, next) {
  try {
    const address = readAddress(req.body);
    if (!address)
      return res.status(400).json({ message: 'Enter a valid address with all required fields.' });
    if (req.user.savedAddresses.length >= 20)
      return res.status(400).json({ message: 'You can save up to 20 addresses.' });
    const saved = req.user.savedAddresses.create(address);
    req.user.savedAddresses.push(saved);
    req.user.defaultAddressId = saved._id;
    await req.user.save();
    return res.status(201).json({
      savedAddresses: req.user.savedAddresses,
      defaultAddressId: req.user.defaultAddressId,
      address: saved,
    });
  } catch (error) {
    return next(error);
  }
}

export async function makeDefaultAddress(req, res, next) {
  try {
    const { addressId } = req.params;
    if (!mongoose.isObjectIdOrHexString(addressId))
      return res.status(400).json({ message: 'Address ID is invalid.' });
    if (!req.user.savedAddresses.id(addressId))
      return res.status(404).json({ message: 'Saved address not found.' });
    req.user.defaultAddressId = addressId;
    await req.user.save();
    return res.json({
      savedAddresses: req.user.savedAddresses,
      defaultAddressId: req.user.defaultAddressId,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteSavedAddress(req, res, next) {
  try {
    const { addressId } = req.params;
    if (!mongoose.isObjectIdOrHexString(addressId))
      return res.status(400).json({ message: 'Address ID is invalid.' });
    if (!req.user.savedAddresses.id(addressId))
      return res.status(404).json({ message: 'Saved address not found.' });
    req.user.savedAddresses.pull({ _id: addressId });
    if (String(req.user.defaultAddressId) === addressId) {
      req.user.defaultAddressId = req.user.savedAddresses[0]?._id || null;
    }
    await req.user.save();
    return res.json({
      savedAddresses: req.user.savedAddresses,
      defaultAddressId: req.user.defaultAddressId,
    });
  } catch (error) {
    return next(error);
  }
}
