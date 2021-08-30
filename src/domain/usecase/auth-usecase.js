const { MissingParamError, InvalidParamError } = require('../../utils/errors/')
module.exports = class AuthUseCase {
    constructor({ LoadUserByEmailRepository, encrypter, tokenGenerator } = {}) {
        this.LoadUserByEmailRepository = LoadUserByEmailRepository
        this.encrypter = encrypter
        this.tokenGenerator = tokenGenerator
    }
    async auth(email, password) {
        if (!email) throw new MissingParamError('email')
        if (!password) throw new MissingParamError('password')
        const user = await this.LoadUserByEmailRepository.load(email)
        const isValid = user && await this.encrypter.compare(password, user.password)
        if (isValid) {
            const accessToken = await this.tokenGenerator.generate(user.id)
            return accessToken
        }
        return null
    }
}