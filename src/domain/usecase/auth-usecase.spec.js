const { MissingParamError } = require('../../utils/errors/')

class AuthUsecase {
    constructor(LoadUserByEmailRepository) {
        this.LoadUserByEmailRepository = LoadUserByEmailRepository
    }
    async auth(email, password) {
        if (!email) throw new MissingParamError('email')
        if (!password) throw new MissingParamError('password')
        await this.LoadUserByEmailRepository.load(email)
    }
}

const makeSut = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            this.email = email
        }
    }
    const loadUserByEmailRepositorySpy = new LoadUserByEmailRepositorySpy()
    const sut = new AuthUsecase(loadUserByEmailRepositorySpy)
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
})