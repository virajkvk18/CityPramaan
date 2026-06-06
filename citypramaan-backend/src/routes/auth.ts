import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  createWalletChallenge,
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
  updateUserProfile,
  verifyEmailCode,
  verifyWalletLogin,
} from '../services/auth.service';
import { resendEmailVerification } from '../services/email-verification.service';
import { toHttpError } from '../utils/http-error';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const action = req.body?.action;

  if (action === 'signup' || action === 'register') {
    return sendRegistrationResponse(res, () => registerUser(req.body));
  }

  if (action === 'login') {
    return sendAuthResponse(res, () => loginUser(req.body, metaFromRequest(req)));
  }

  res.status(400).json({
    success: false,
    error: 'Unsupported auth action. Use signup, register, or login.',
  });
});

router.post(['/signup', '/register'], (req: Request, res: Response) => {
  sendRegistrationResponse(res, () => registerUser(req.body));
});

router.post('/login', (req: Request, res: Response) => {
  sendAuthResponse(res, () => loginUser(req.body, metaFromRequest(req)));
});

router.post('/verify-email', (req: Request, res: Response) => {
  sendAuthResponse(res, () => verifyEmailCode(req.body, metaFromRequest(req)));
});

router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const result = await resendEmailVerification(req.body?.email);
    res.json({
      success: true,
      message: result.alreadyVerified
        ? 'Email is already verified.'
        : 'Verification code sent.',
      ...result,
    });
  } catch (error) {
    const httpError = toHttpError(error);
    res.status(httpError.status).json({
      success: false,
      error: httpError.message,
      code: httpError.code,
    });
  }
});

router.post('/refresh', (req: Request, res: Response) => {
  sendAuthResponse(res, () => refreshSession(req.body?.refreshToken, metaFromRequest(req)));
});

router.post('/logout', (req: Request, res: Response) => {
  logoutSession(req.body?.refreshToken);
  res.json({ success: true, message: 'Logged out.' });
});

router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  res.json({ success: true, user: req.user });
});

router.patch('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const user = updateUserProfile(req.user!.id, req.body || {});
    res.json({ success: true, user });
  } catch (error) {
    const httpError = toHttpError(error);
    res.status(httpError.status).json({
      success: false,
      error: httpError.message,
      code: httpError.code,
    });
  }
});

router.post('/wallet/challenge', (req: Request, res: Response) => {
  try {
    const challenge = createWalletChallenge(req.body?.walletAddress, req.body?.role);
    res.status(201).json({
      success: true,
      walletAddress: challenge.walletAddress,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    const httpError = toHttpError(error);
    res.status(httpError.status).json({
      success: false,
      error: httpError.message,
      code: httpError.code,
    });
  }
});

router.post(['/wallet/verify', '/verify'], (req: Request, res: Response) => {
  sendAuthResponse(res, () => verifyWalletLogin(req.body, metaFromRequest(req)));
});

async function sendRegistrationResponse(
  res: Response,
  action: () => ReturnType<typeof registerUser>
): Promise<void> {
  try {
    const result = await action();
    res.status(201).json({
      success: true,
      message: 'Account created. Verify your email before logging in.',
      ...result,
    });
  } catch (error) {
    const httpError = toHttpError(error);
    res.status(httpError.status).json({
      success: false,
      error: httpError.message,
      code: httpError.code,
    });
  }
}

async function sendAuthResponse(
  res: Response,
  action: () => ReturnType<typeof loginUser> | Promise<ReturnType<typeof loginUser>>
): Promise<void> {
  try {
    const result = await action();
    res.json({
      success: true,
      ...result,
      token: result.accessToken,
    });
  } catch (error) {
    const httpError = toHttpError(error);
    res.status(httpError.status).json({
      success: false,
      error: httpError.message,
      code: httpError.code,
    });
  }
}

function metaFromRequest(req: Request) {
  return {
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  };
}

export default router;
