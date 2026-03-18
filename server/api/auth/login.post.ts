import { AuthService } from '~/core/services/auth.service'
import { signToken } from '~/server/utils/auth'
import { ok, badRequest } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.email || !body.password) {
    badRequest('email, password 必填')
  }

  try {
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
  } catch (e: any) {
    badRequest(e.message)
  }
})
