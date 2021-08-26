const { MissingParamError, InvalidParamError } = require('../../utils/errors/')
const AuthUseCase = require('./auth-usecase')

const makeEncrypterSpy = () => {
    class EncrypterSpy {
        async compare(password, hashedpassword) {
            this.password = password
            this.hashedpassword = hashedpassword
            return this.isValid
        }
    }
    const encrypterSpy = new EncrypterSpy()
    encrypterSpy.isValid = true
    return encrypterSpy
}

const makeTokenGeneratorSpy = () => {
    class TokenGenerator {
        async generate(userId) {
            this.userId = userId
            return this.accessToken
        }
    }
    const tokenGeneratorSpy = new TokenGenerator()
    tokenGeneratorSpy.accessToken = 'any_token'
    return tokenGeneratorSpy
}

const makeLoadUserByEmailRepositorySpy = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            this.email = email
            return this.user
        }
    }
    const loadUserByEmailRepositorySpy = new LoadUserByEmailRepositorySpy()
    loadUserByEmailRepositorySpy.user = {
        id: 'any_id',
        password: "hashed_password"
    }
    return loadUserByEmailRepositorySpy
}

const makeSut = () => {
    const loadUserByEmailRepositorySpy = makeLoadUserByEmailRepositorySpy()
    const encrypterSpy = makeEncrypterSpy()
    const tokenGeneratorSpy = makeTokenGeneratorSpy()
    const sut = new AuthUseCase({
        LoadUserByEmailRepository: loadUserByEmailRepositorySpy,
        encrypter: encrypterSpy,
        tokenGenerator: tokenGeneratorSpy,
    })
    return { sut, loadUserByEmailRepositorySpy, encrypterSpy, tokenGeneratorSpy }
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

    it('Should throw if no dependecy is provided', async () => {
        const sut = new AuthUseCase()
        const promise = sut.auth('any_email@mail.com', 'any_password')
        expect(promise).rejects.toThrow()
    })

    it('Should throw if no LoadUserByEmailRepository is provided', async () => {
        const sut = new AuthUseCase({})
        const promise = sut.auth('any_email@mail.com', 'any_password')
        expect(promise).rejects.toThrow(new MissingParamError('loadUserByEmailRepository'))
    })

    it('Should throw if no LoadUserByEmailRepository has no load method', async () => {
        const sut = new AuthUseCase({ LoadUserByEmailRepository: {} })
        const promise = sut.auth('any_email@mail.com', 'any_password')
        expect(promise).rejects.toThrow(new InvalidParamError('loadUserByEmailRepository'))
    })

    it('Should return null if an invalid email is provided', async () => {
        const { sut, loadUserByEmailRepositorySpy } = makeSut()
        loadUserByEmailRepositorySpy.user = null
        const accessToken = await sut.auth('invalid_email@mail.com', 'any_password')
        expect(accessToken).toBeNull()
    })

    it('Should return null if an invalid password is provided', async () => {
        const { sut, encrypterSpy } = makeSut()
        encrypterSpy.isValid = false
        const accessToken = await sut.auth('valid_email@mail.com', 'invalid_password')
        expect(accessToken).toBeNull()
    })

    it('Should call Encrypter with correct values', async () => {
        const { sut, loadUserByEmailRepositorySpy, encrypterSpy } = makeSut()
        await sut.auth('valid_email@mail.com', 'any_password')
        expect(encrypterSpy.password).toBe('any_password')
        expect(encrypterSpy.hashedpassword).toBe(loadUserByEmailRepositorySpy.user.password)
    })

    it('Should call TokenGenerator with correct userId', async () => {
        const { sut, loadUserByEmailRepositorySpy, tokenGeneratorSpy } = makeSut()
        await sut.auth('valid_email@mail.com', 'valid_password')
        expect(tokenGeneratorSpy.userId).toBe(loadUserByEmailRepositorySpy.user.id)
    })

    it('Should return an accessToken if correct credentials are provided ', async () => {
        const { sut, tokenGeneratorSpy } = makeSut()
        const accessToken = await sut.auth('valid_email@mail.com', 'valid_password')
        expect(accessToken).toBe(tokenGeneratorSpy.accessToken)
        expect(accessToken).toBeTruthy()
    })
})