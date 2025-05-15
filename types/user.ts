import { z } from 'zod'

export const UserSchema = z.object({
  instance_id: z.string().uuid(),
  id: z.string().uuid(),
  aud: z.string(),
  role: z.string(),
  email: z.string().email(),
  encrypted_password: z.string(),
  email_confirmed_at: z.string().nullable(),
  invited_at: z.string().nullable(),
  confirmation_token: z.string(),
  confirmation_sent_at: z.string().nullable(),
  recovery_token: z.string(),
  recovery_sent_at: z.string().nullable(),
  email_change_token_new: z.string(),
  email_change: z.string(),
  email_change_sent_at: z.string().nullable(),
  last_sign_in_at: z.string().nullable(),
  raw_app_meta_data: z.object({
    provider: z.string(),
    providers: z.array(z.string())
  }),
  raw_user_meta_data: z.object({
    email_verified: z.boolean()
  }),
  is_super_admin: z.boolean().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  phone: z.string().nullable(),
  phone_confirmed_at: z.string().nullable(),
  phone_change: z.string(),
  phone_change_token: z.string(),
  phone_change_sent_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  email_change_token_current: z.string(),
  email_change_confirm_status: z.number(),
  banned_until: z.string().nullable(),
  reauthentication_token: z.string(),
  reauthentication_sent_at: z.string().nullable(),
  is_sso_user: z.boolean(),
  deleted_at: z.string().nullable(),
  is_anonymous: z.boolean(),
  providers: z.array(z.string())
})

export type User = z.infer<typeof UserSchema> 