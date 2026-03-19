import { AuthService } from '~/core/services/auth.service'
import { registerSchema } from '~/schemas/auth'

export default defineApiHandler(async (event) => {
  const body = await validateBody(event, registerSchema)

  const user = await AuthService.register({
    email: body.email,
    name: body.name,
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
