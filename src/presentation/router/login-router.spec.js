const LoginRouter = require("./login-router")
const { InvalidParamError, MissingParamError} = require("../../utils/errors/")
const {ServerError, UnauthorizedError } = require("../errors/")


const makeSut = () => {
    const authUseCaseSpy = makeAuthUseCase()
    const emailValidatorSpy = makeEmailValidator()
    authUseCaseSpy.accessToken = 'valid_token'
    const sut = new LoginRouter(authUseCaseSpy, emailValidatorSpy)
    return { authUseCaseSpy, sut, emailValidatorSpy }
}

const makeAuthUseCase = () => {
    class AuthUseCaseSpy {
        async auth(email, password) {
            this.email = email
            this.password = password
            return this.accessToken
        }
    }
    return new AuthUseCaseSpy()
}

const makeAuthUseCaseWithError = () => {
    class AuthUseCaseSpy {
        async auth() { throw new Error() }
    }
    return new AuthUseCaseSpy()
}

const makeEmailValidator = () => {
    class EmailValidator {
        isValid(email) {
            this.email = email
            return this.isEmailValid
        }
    }
    const emailValidatorSpy = new EmailValidator()
    emailValidatorSpy.isEmailValid = true
    return emailValidatorSpy
}

const makeEmailValidatorWithError = () => {
    class EmailValidatorSpy {
        isValid() { throw new Error() }
    }
    return new EmailValidatorSpy()
}

describe('Login Router', () => {
    it('Should return 400 if no email is provided', async () => {
        const { sut } = makeSut()
        const httpRequest = {
            body: {
                password: 'any_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
        expect(httpResponse.body).toEqual(new MissingParamError('email'))
    })

    it('Should return 400 if no passord is provided', async () => {
        const { sut } = makeSut()
        const httpRequest = {
            body: {
                email: 'any_mail@mail.com'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
        expect(httpResponse.body).toEqual(new MissingParamError('password'))
    })

    it('Should return 500 if no httpRequest is provided', async () => {
        const { sut } = makeSut()
        const httpResponse = await sut.route()
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should return 500 if httpRequest has no body', async () => {
        const { sut } = makeSut()
        const httpResponse = await sut.route({})
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should call AuthUsecase with correct params', async () => {
        const { sut, authUseCaseSpy } = makeSut()
        const httpRequest = {
            body: {
                email: 'any_email@mail.com',
                password: 'any_password'
            }
        }
        sut.route(httpRequest)
        expect(authUseCaseSpy.email).toBe(httpRequest.body.email)
        expect(authUseCaseSpy.password).toBe(httpRequest.body.password)
    })

    it('Should return 401 when invalid credentials are provided', async () => {
        const { sut, authUseCaseSpy } = makeSut()
        authUseCaseSpy.accessToken = null
        const httpRequest = {
            body: {
                email: 'invalid_email@mail.com',
                password: 'invalid_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(401)
        expect(httpResponse.body).toEqual(new UnauthorizedError)
    })


    it('Should return 200 when valid credentials are provided', async () => {
        const { sut, authUseCaseSpy } = makeSut()
        const httpRequest = {
            body: {
                email: 'any_mail@mail.com',
                password: 'any_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(200)
        expect(httpResponse.body.accessToken).toEqual(authUseCaseSpy.accessToken)
    })

    it('Should return 500 if no AuthUseCase is provided', async () => {
        const sut = new LoginRouter()
        const httpRequest = {
            body: {
                email: 'invalid_email@mail.com',
                password: 'invalid_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should return 500 if AuthUseCase has no auth method', async () => {
        const sut = new LoginRouter({})
        const httpRequest = {
            body: {
                email: 'invalid_email@mail.com',
                password: 'invalid_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should return 500 if AuthUseCase throws', async () => {
        const sut = new LoginRouter(makeAuthUseCaseWithError())
        const httpRequest = {
            body: {
                email: 'invalid_email@mail.com',
                password: 'invalid_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
    })

    it('Should return 400 if an invalid email is provided', async () => {
        const { sut, emailValidatorSpy } = makeSut()
        emailValidatorSpy.isEmailValid = false
        const httpRequest = {
            body: {
                email: 'invalid_email@mail.com',
                password: 'valid_password',
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
        expect(httpResponse.body).toEqual(new InvalidParamError('email'))
    })

    it('Should return 500 if no EmailValidator is provided', async () => {
        const authUseCase = makeAuthUseCase()
        const sut = new LoginRouter(authUseCase)
        const httpRequest = {
            body: {
                email: 'any_email@mail.com',
                password: 'any_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should return 500 if EmailValidator has no isValid method', async () => {
        const authUseCase = makeAuthUseCase()
        const sut = new LoginRouter(authUseCase, {})
        const httpRequest = {
            body: {
                email: 'any_email@mail.com',
                password: 'any_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
        expect(httpResponse.body).toEqual(new ServerError)
    })

    it('Should return 500 if EmailValidator throws', async () => {
        const authUseCase = makeAuthUseCase()
        const emailValidatorWithErrorSpy = makeEmailValidatorWithError()
        const sut = new LoginRouter(authUseCase, emailValidatorWithErrorSpy)
        const httpRequest = {
            body: {
                email: 'any_email@mail.com',
                password: 'any_password'
            }
        }
        const httpResponse = await sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(500)
    })

    it('Should call EmailValidator with correct email', async () => {
        const { sut, emailValidatorSpy } = makeSut()
        const httpRequest = {
            body: {
                email: 'any_email@mail.com',
                password: 'any_password'
            }
        }
        sut.route(httpRequest)
        expect(emailValidatorSpy.email).toBe(httpRequest.body.email)
    })
})

