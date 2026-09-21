import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-tagit');

export interface AuthPayload {
  id: string;
  name: string;
  role: 'barista' | 'owner';
}

export async function signToken(payload: AuthPayload, expiresIn = '30d') {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret());
}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      role: payload.role as 'barista' | 'owner',
    };
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<AuthPayload | null> {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  return verifyToken(token);
}

export function unauthorized(msg = 'Не авторизован') {
  return NextResponse.json({ error: msg }, { status: 401 });
}
export function forbidden(msg = 'Недостаточно прав') {
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function requireRole(
  req: NextRequest,
  ...allowed: AuthPayload['role'][]
): Promise<{ user: AuthPayload } | NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return unauthorized();
  if (allowed.length > 0 && !allowed.includes(user.role)) return forbidden();
  return { user };
}
