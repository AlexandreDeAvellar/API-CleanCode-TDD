class AuthUsecase {
    async auth(email) {
        if (!email) throw new Error()
    }
}

describe('Auth UseCase', () => {
    it('Should throw if no email is provided', async () => {
        const sut = new AuthUsecase()
        const promise = sut.auth()
        expect(promise).rejects.toThrow()
    })
}) 