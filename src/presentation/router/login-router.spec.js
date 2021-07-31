
class LoginRouter {
    route(httpRequest) {
        if (!httpRequest.body.email || !httpRequest.body.password) {
            return {
                statusCode: 400
            }
        }
    }
}

describe('Login Router', () => {
    it('Should return 400 if no email is provided', () => {
        const sut = new LoginRouter()
        const httpRequest = {
            body: {
                password: 'any_password'
            }
        }
        const httpResponse = sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
    })
})

describe('Login Router', () => {
    it('Should return 400 if no passord is provided', () => {
        const sut = new LoginRouter()
        const httpRequest = {
            body: {
                email: 'any_mail@mail.com'
            }
        }
        const httpResponse = sut.route(httpRequest)
        expect(httpResponse.statusCode).toBe(400)
    })
})

