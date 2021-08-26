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
        if (!this.LoadUserByEmailRepository) throw new MissingParamError('loadUserByEmailRepository')
        if (!this.LoadUserByEmailRepository.load) throw new InvalidParamError('loadUserByEmailRepository')
        if (!this.encrypter) throw new MissingParamError('encrypter')
        if (!this.encrypter.compare) throw new InvalidParamError('encrypter')
        const user = await this.LoadUserByEmailRepository.load(email)
        if (!user) return null
        const isValid = await this.encrypter.compare(password, user.password)
        if (!isValid) {
            return null
        }
        const accessToken = await this.tokenGenerator.generate(user.id)
        return accessToken
    }
}