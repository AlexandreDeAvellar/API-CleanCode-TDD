const { MissingParamError, InvalidParamError } = require('../../utils/errors/')
module.exports = class AuthUseCase {
    constructor(LoadUserByEmailRepository, encrypter) {
        this.LoadUserByEmailRepository = LoadUserByEmailRepository
        this.encrypter = encrypter
    }
    async auth(email, password) {
        if (!email) throw new MissingParamError('email')
        if (!password) throw new MissingParamError('password')
        if (!this.LoadUserByEmailRepository) throw new MissingParamError('loadUserByEmailRepository')
        if (!this.LoadUserByEmailRepository.load) throw new InvalidParamError('loadUserByEmailRepository')
        const user = await this.LoadUserByEmailRepository.load(email)
        if (!user) return null
        const isValid = await this.encrypter.compare(password, user.password)
        if(!isValid){
            return null
        }
    }
}