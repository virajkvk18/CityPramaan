const USERS_KEY = "citypramaan_users";
const CURRENT_USER_KEY = "citypramaan_current_user";
const OTP_KEY = "citypramaan_pending_otp";

export function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function savePendingOtp(email, otp, userData) {
  localStorage.setItem(
    OTP_KEY,
    JSON.stringify({
      email,
      otp,
      userData,
      expiresAt: Date.now() + 10 * 60 * 1000,
    })
  );
}

export function verifyOtp(email, enteredOtp) {
  const pending = JSON.parse(localStorage.getItem(OTP_KEY) || "null");

  if (!pending) {
    throw new Error("No OTP request found.");
  }

  if (pending.email !== email) {
    throw new Error("Email does not match OTP request.");
  }

  if (Date.now() > pending.expiresAt) {
    localStorage.removeItem(OTP_KEY);
    throw new Error("OTP expired.");
  }

  if (pending.otp !== enteredOtp) {
    throw new Error("Invalid OTP.");
  }

  const users = getUsers();

  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    throw new Error("User already exists.");
  }

  const verifiedUser = {
    ...pending.userData,
    verified: true,
    createdAt: new Date().toISOString(),
  };

  users.push(verifiedUser);
  saveUsers(users);

  localStorage.removeItem(OTP_KEY);
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(verifiedUser));

  return verifiedUser;
}

export function loginUser(email, password) {
  const users = getUsers();

  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  if (!user.verified) {
    throw new Error("Please verify your email first.");
  }

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  return user;
}

export function getCurrentUser() {
  return JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || "null");
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
