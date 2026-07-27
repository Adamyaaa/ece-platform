import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import User, { IUser } from '../models/User';

// Public info, not a secret — matches client/src/firebaseConfig.ts
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'vericode-86f89';
const ISSUER = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;

// Verifying Firebase ID tokens directly against Google's public JWKS avoids
// needing a service-account key (what firebase-admin would require) just to
// check a token's signature/issuer/audience/expiry.
const client = jwksClient({
  jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  cache: true,
  cacheMaxAge: 6 * 60 * 60 * 1000, // Google rotates these keys infrequently
});

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err || new Error('Signing key not found'));
      resolve(key.getPublicKey());
    });
  });
}

export interface FirebaseUser {
  uid: string;
  email?: string;
  name?: string;
}

export async function verifyFirebaseToken(idToken: string): Promise<FirebaseUser> {
  const decodedHeader = jwt.decode(idToken, { complete: true });
  if (!decodedHeader || typeof decodedHeader === 'string' || !decodedHeader.header.kid) {
    throw new Error('Malformed token');
  }

  const publicKey = await getSigningKey(decodedHeader.header.kid);

  const payload = jwt.verify(idToken, publicKey, {
    algorithms: ['RS256'],
    audience: FIREBASE_PROJECT_ID,
    issuer: ISSUER,
  }) as jwt.JwtPayload;

  if (!payload.sub) throw new Error('Token missing subject');

  return { uid: payload.sub, email: payload.email as string | undefined, name: payload.name as string | undefined };
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

// Rejects the request if there is no valid Firebase ID token.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: 'Missing Authorization token' });

  try {
    req.firebaseUser = await verifyFirebaseToken(token);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Verifies the token if present, but never rejects the request — used on
// routes that must keep working via the admin secret for logged-out callers.
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    req.firebaseUser = await verifyFirebaseToken(token);
  } catch (err) {
    // Ignore — caller falls back to the admin-secret path, if any.
  }
  next();
}

// Must run after requireAuth/optionalAuth. Resolves the Mongo user linked to
// the verified Firebase identity, backfilling firebaseUid onto legacy
// email-matched accounts created before this field existed.
export async function requireMongoUser(req: Request, res: Response, next: NextFunction) {
  if (!req.firebaseUser) return res.status(401).json({ error: 'Not authenticated' });

  try {
    let user: IUser | null = await User.findOne({ firebaseUid: req.firebaseUser.uid });

    if (!user && req.firebaseUser.email) {
      user = await User.findOne({ email: req.firebaseUser.email });
      if (user && !user.firebaseUid) {
        user.firebaseUid = req.firebaseUser.uid;
        await user.save();
      }
    }

    if (!user) return res.status(404).json({ error: 'No account linked to this login' });

    req.mongoUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
}
