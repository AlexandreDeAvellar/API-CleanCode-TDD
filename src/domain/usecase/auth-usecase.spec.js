const { MissingParamError, InvalidParamError } = require('../../utils/errors/')

class AuthUseCase {
    constructor(LoadUserByEmailRepository) {
        this.LoadUserByEmailRepository = LoadUserByEmailRepository
    }
    async auth(email, password) {
        if (!email) throw new MissingParamError('email')
        if (!password) throw new MissingParamError('password')
        if (!this.LoadUserByEmailRepository) throw new MissingParamError('loadUserByEmailRepository')
        if (!this.LoadUserByEmailRepository.load) throw new InvalidParamError('loadUserByEmailRepository')
        const user = await this.LoadUserByEmailRepository.load(email)
        if (!user) return null
    }
}

const makeSut = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            this.email = email
        }
    }
    const loadUserByEmailRepositorySpy = new LoadUserByEmailRepositorySpy()
    const sut = new AuthUseCase(loadUserByEmailRepositorySpy)
    return { sut, loadUserByEmailRepositorySpy }
}

describe('Auth UseCase', () => {
    it('Should throw if no email is provided', async () => {
        const { sut } = makeSut()
        const promise = sut.auth()
        expect(promise).rejects.toThrow(new MissingParamError('email'))
    })

    it('Should throw if no password is provided', async () => {
        const { sut } = makeSut()
        const promise = sut.auth('any_email@mail.com')
        expect(promise).rejects.toThrow(new MissingParamError('password'))
    })

    it('Should call LoadUserByEmailRepository with correct email', async () => {
        const { sut, loadUserByEmailRepositorySpy } = makeSut()
        await sut.auth('any_email@mail.com', 'any_password')
        expect(loadUserByEmailRepositorySpy.email).toBe('any_email@mail.com')
    })

    it('Should throw if no LoadUserByEmailRepository is provided', async () => {
        const sut = new AuthUseCase()
        const promise = sut.auth('any_email@mail.com', 'any_password')
        expect(promise).rejects.toThrow(new MissingParamError('loadUserByEmailRepository'))
    })

    it('Should throw if no LoadUserByEmailRepository has no load method', async () => {
        const sut = new AuthUseCase({})
        const promise = sut.auth('any_email@mail.com', 'any_password')
        expect(promise).rejects.toThrow(new InvalidParamError('loadUserByEmailRepository'))
    })

    it('Should return null if LoadUserByEmailRepository returs null', async () => {
        const { sut, loadUserByEmailRepositorySpy } = makeSut()
        const accessToken = await sut.auth('invalid_email@mail.com', 'any_password')
        expect(accessToken).toBeNull()
    })
})