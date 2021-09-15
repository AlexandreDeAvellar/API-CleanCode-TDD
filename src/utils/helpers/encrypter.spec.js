const makeEncrypterSpy = () => {
    class Encrypter {
        compare() {
            return true
        }
    }
    return new Encrypter()
}

describe('Encrypter', () => {
    it('Should return true if bcrypt returns true', async () => {
        const sut = makeEncrypterSpy()
        const isValid = await sut.compare('any_password', 'hashed_password')
        expect(isValid).toBe(true)
    })
})