const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: config.jwt.issuer,
  });
  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
    issuer: config.jwt.issuer,
  });
  return { accessToken, refreshToken };
}

const normalizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    suspend: !!user.suspend,
    assignedClassId: user.assignedClassId || null,
    date_created: user.date_created,
  };
};

function validateEmail(email) {
  if (!email || typeof email !== 'string') return 'Email is required';
  const cleaned = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleaned)) return 'Invalid email format';
  return null;
}

function validatePassword(password) {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

function validateName(name, field) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return `${field} is required`;
  }
  return null;
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ error: emailErr });
    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });

    const cleanEmail = email.trim().toLowerCase();
    const result = await getItems('users', { 
      filter: { email: { _eq: cleanEmail } }
    });

    if (!result.data || result.data.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.data[0];

    if (user.suspend) {
      if (user.role === 'pending') {
        return res.status(403).json({ error: 'Your account is pending approval. Please contact your administrator.' });
      }
      return res.status(403).json({ error: 'Account is suspended. Contact support.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = generateTokens(user);

    res.json({ ...tokens, user: normalizeUser(user) });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Authentication failed. Please try again.' });
  }
};

const register = async (req, res) => {
  try {
    const errors = [];
    const fnErr = validateName(req.body.firstName, 'First name');
    if (fnErr) errors.push(fnErr);
    const lnErr = validateName(req.body.lastName, 'Last name');
    if (lnErr) errors.push(lnErr);
    const emailErr = validateEmail(req.body.email);
    if (emailErr) errors.push(emailErr);
    const passErr = validatePassword(req.body.password);
    if (passErr) errors.push(passErr);

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join('; ') });
    }

    const cleanEmail = req.body.email.trim().toLowerCase();

    const existing = await getItems('users', { 
      filter: { email: { _eq: cleanEmail } }
    });
    if (existing.data && existing.data.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, config.bcrypt.saltRounds);

    const newUser = await createItem('users', {
      firstName: req.body.firstName.trim(),
      lastName: req.body.lastName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: 'pending',
      suspend: true,
    });

    res.status(201).json({ message: 'Registration successful. Your account is pending approval. Please contact your administrator.' });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    const result = await getItems('users', { 
      filter: { id: { _eq: decoded.id } }
    });

    if (!result.data || result.data.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.data[0];
    if (user.suspend) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const tokens = generateTokens(user);
    res.json({ ...tokens, user: normalizeUser(user) });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    console.error('Refresh error:', error.message);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

const me = async (req, res) => {
  try {
    const result = await getItems('users', { 
      filter: { id: { _eq: req.user.id } }
    });
    if (!result.data || result.data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: normalizeUser(result.data[0]) });
  } catch (error) {
    console.error('Profile fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateMe = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const payload = {};
    if (firstName !== undefined) payload.firstName = firstName;
    if (lastName !== undefined) payload.lastName = lastName;

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updated = await updateItem('users', req.user.id, payload);
    res.json({ user: normalizeUser(updated.data) });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

const deleteMe = async (req, res) => {
  try {
    await updateItem('users', req.user.id, { suspend: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Account deletion error:', error.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

const listUsers = async (req, res) => {
  try {
    console.log('Fetching users list...');
    // Using fields: '*' to avoid errors if some fields like assignedClassId are missing from the schema
    const result = await getItems('users', {
      fields: '*',
      sort: 'role,lastName',
    });
    console.log('GetItems result count:', result.data ? result.data.length : 0);
    const users = (result.data || []).map(normalizeUser);
    console.log('Sending users list to client');
    res.json(users);
  } catch (error) {
    console.error('List users error:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, assignedClassId } = req.body;

    const validRoles = ['admin', 'teacher', 'staff', 'pending'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const payload = {};
    if (role) payload.role = role;
    if (role === 'teacher' && assignedClassId) {
      payload.assignedClassId = assignedClassId;
    }
    if (role && role !== 'teacher') {
      payload.assignedClassId = null;
    }
    if (assignedClassId !== undefined && role === 'teacher') {
      payload.assignedClassId = assignedClassId;
    }

    if (role === 'admin' || role === 'staff') {
      payload.assignedClassId = null;
    }

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    if (role && role !== 'pending') {
      payload.suspend = false;
    }

    const updated = await updateItem('users', id, payload);
    const updatedUser = await getItem('users', id, { fields: '*' });

    res.json(normalizeUser(updatedUser.data));
  } catch (error) {
    console.error('Update user role error:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const toggleSuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot suspend your own account' });
    }

    const result = await getItem('users', id);
    if (!result.data) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newSuspend = !result.data.suspend;
    await updateItem('users', id, { suspend: newSuspend });

    res.json({ id, suspend: newSuspend });
  } catch (error) {
    console.error('Toggle suspend error:', error.message);
    res.status(500).json({ error: 'Failed to toggle user suspend status' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await deleteItem('users', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

module.exports = {
  login, register, refresh, me, updateMe, deleteMe,
  listUsers, updateUserRole, toggleSuspendUser, deleteUser,
  generateTokens, normalizeUser,
};
