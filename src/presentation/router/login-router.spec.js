const LoginRouter = require("./login-router")
const MissingParamError = require('../helpers/missing-param-error')

const makeSut = () => {
    return new LoginRouter()
}

describe('Login Router', () => {
    it('Should return 400 if no email is provided', () => {
        const sut = makeSut()
        const httpRequest = {
            body: {
                password: 'any_password'
            }
        }
        const httpResponse = sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
        expect(httpResponse.body).toEqual(new MissingParamError('email'))
    })

    it('Should return 400 if no passord is provided', () => {
        const sut = makeSut()
        const httpRequest = {
            body: {
                email: 'any_mail@mail.com'
            }
        }
        const httpResponse = sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
        expect(httpResponse.body).toEqual(new MissingParamError('password'))
    })

    it('Should return 500 if no httpRequest is provided', () => {
        const sut = makeSut()
        const httpResponse = sut.route()
        expect(httpResponse.statusCode).toBe(500)
    })

    it('Should return 500 if httpRequest has no body', () => {
        const sut = makeSut()
        const httpResponse = sut.route({})
        expect(httpResponse.statusCode).toBe(500)
    })


})

