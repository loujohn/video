import { AuthService } from '~/core/services/auth.service'
import { loginSchema } from '~/schemas/auth'

export default defineApiHandler(async (event) => {
  const body = await validateBody(event, loginSchema)

  const user = await AuthService.login({
    email: body.email,
    password: body.password,
  })
  const token = await signToken({ userId: user.id })

  setCookie(event, 'token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return ok({ user, token })
})
