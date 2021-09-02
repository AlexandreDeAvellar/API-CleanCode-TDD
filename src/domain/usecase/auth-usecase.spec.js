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
const makeEncrypterWithError = () => {
    class EncrypterSpy {
        async compare() {
            throw new Error()
        }
    }
    return new EncrypterSpy()
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
const makeTokenGeneratorWithError = () => {
    class TokenGenerator {
        async generate() {
            throw new Error()
        }
    }
    return new TokenGenerator()
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
const makeLoadUserByEmailRepositoryWithError = () => {
    class LoadUserByEmailRepositorySpy {
        async load(email) {
            throw new Error()
        }
    }
    return new LoadUserByEmailRepositorySpy()
}

const makeUpdateAccessTokenRepositorySpy = () => {
    class UpdateAccessTokenRepositorySpy {
        update(user, accessToken) {
            this.user = user
            this.accessToken = accessToken
        }
    }
    const updateAccessTokenRepositorySpy = new UpdateAccessTokenRepositorySpy()
    return updateAccessTokenRepositorySpy
}

const makeSut = () => {
    const loadUserByEmailRepositorySpy = makeLoadUserByEmailRepositorySpy()
    const encrypterSpy = makeEncrypterSpy()
    const tokenGeneratorSpy = makeTokenGeneratorSpy()
    const updateAccessTokenRepositorySpy = makeUpdateAccessTokenRepositorySpy()
    const sut = new AuthUseCase({
        LoadUserByEmailRepository: loadUserByEmailRepositorySpy,
        updateAccessTokenRepository: updateAccessTokenRepositorySpy,
        encrypter: encrypterSpy,
        tokenGenerator: tokenGeneratorSpy,
    })
    return {
        sut,
        loadUserByEmailRepositorySpy,
        updateAccessTokenRepositorySpy,
        encrypterSpy,
        tokenGeneratorSpy
    }
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

    it('Should throw if invalid dependecies are provided', async () => {
        const invalid = {}
        const loadUserByEmailRepository = makeLoadUserByEmailRepositorySpy()
        const encrypter = makeEncrypterSpy()
        const tokenGenerator = makeTokenGeneratorSpy()
        const suts = [].concat(
            new AuthUseCase(),
            new AuthUseCase(invalid),
            new AuthUseCase({ loadUserByEmailRepository: invalid }),
            new AuthUseCase({ loadUserByEmailRepository }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter: invalid }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter, tokenGenerator: invalid }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter, tokenGenerator }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter, tokenGenerator, updateAccessTokenRepository: invalid }),
        )
        suts.map(sut => {
            const promise = sut.auth('any_email@mail.com', 'any_password')
            expect(promise).rejects.toThrow()
        })
    })

    it('Should throw if any dependency throws', async () => {
        const invalid = {}
        const loadUserByEmailRepository = makeLoadUserByEmailRepositorySpy()
        const encrypter = makeEncrypterSpy()
        const suts = [].concat(
            new AuthUseCase({ loadUserByEmailRepository: makeLoadUserByEmailRepositoryWithError() }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter: makeEncrypterWithError() }),
            new AuthUseCase({ loadUserByEmailRepository, encrypter, tokenGenerator: makeTokenGeneratorWithError() }),
        )
        suts.map(sut => {
            const promise = sut.auth('any_email@mail.com', 'any_password')
            expect(promise).rejects.toThrow()
        })
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

    it('Should call UpdateAccessTokenRepository with correct values', async () => {
        const { sut, updateAccessTokenRepositorySpy, loadUserByEmailRepositorySpy, tokenGeneratorSpy } = makeSut()
        await sut.auth('valid_email@mail.com', 'valid_password')
        expect(updateAccessTokenRepositorySpy.userId).toBe(loadUserByEmailRepositorySpy.userId)
        expect(updateAccessTokenRepositorySpy.accessToken).toBe(tokenGeneratorSpy.accessToken)
    })
})