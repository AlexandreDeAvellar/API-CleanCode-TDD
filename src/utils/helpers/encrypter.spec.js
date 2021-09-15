const bcrypt = require('bcrypt')

const makeEncrypterSpy = () => {
    class Encrypter {
       async compare(value, hash) {
            const isValid = await bcrypt.compare(value, hash)
            return isValid
        }
    }
    return new Encrypter()
}

describe('Encrypter', () => {
    it('Should return true if bcrypt returns true', async () => {
        const sut = makeEncrypterSpy()
        const isValid = await sut.compare('any_value', 'hash')
        expect(isValid).toBe(true)
    })

    it('Should return false if bcrypt returns false', async () => {
        const sut = makeEncrypterSpy()
        bcrypt.isValid = false
        const isValid = await sut.compare('any_value', 'hash')
        expect(isValid).toBe(false)
    })
})