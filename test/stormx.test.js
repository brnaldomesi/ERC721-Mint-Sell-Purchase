const { expect } = require('chai')
const { BN, expectRevert } = require('@openzeppelin/test-helpers')
const Stormx = artifacts.require('Stormx')
const STMXMock = artifacts.require('STMXMock')

contract('Stormx', async accounts => {
  before(async () => {
    this.stmx = await STMXMock.new()
    this.stormx = await Stormx.new(this.stmx.address, "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", "0x00a773bD2cE922F866BB43ab876009fb959d7C29")

    await Promise.all(accounts.map(
      acc => this.stmx.mint(10000000, { from: acc })
    ))
    await Promise.all(accounts.map(
      acc => this.stmx.approve(this.stormx.address, 10000000, { from: acc })
    ))
  })
  
  describe('Buy via ETH', () => {
    let priceWithEth
    let contractBalanceBefore
    let tokenBalanceBefore

    before(async () => {
      priceWithEth = await this.stormx.tokenPriceWithEth()
      contractBalanceBefore = new BN(await web3.eth.getBalance(this.stormx.address))
      tokenBalanceBefore = await this.stormx.balanceOf(accounts[0])
    })

    it('buy fails with lower price', async () => {   
      await expectRevert(
        this.stormx.purchaseViaEther({ from: accounts[0], value: priceWithEth.toNumber() - 1 }),
        "Incorrect ETH price"
      )
    })

    it('check ETH has been transfered', async () => {
      await this.stormx.purchaseViaEther({ from: accounts[0], value: priceWithEth })

      expect(new BN(await web3.eth.getBalance(this.stormx.address)).toNumber())
        .to.equal(contractBalanceBefore.add(new BN(priceWithEth)).toNumber())
    })

    it('check ownership', async () => {
      expect((await this.stormx.balanceOf(accounts[0])).toNumber())
        .to.equal(tokenBalanceBefore.add(new BN(1)).toNumber())
    })

    it('check price becomes more expensive', async () => {
      expect((await this.stormx.tokenPriceWithEth()).toNumber())
        .to.greaterThan(priceWithEth.toNumber())
    })
  })

  describe('Buy via STMX', () => {
    let priceWithStmx
    let userBalanceBefore, contractBalanceBefore
    let tokenBalanceBefore

    before(async () => {
      priceWithStmx = await this.stormx.tokenPriceWithSTMX()
      userBalanceBefore = await this.stmx.balanceOf(accounts[0])
      contractBalanceBefore = await this.stmx.balanceOf(this.stormx.address)
      tokenBalanceBefore = await this.stormx.balanceOf(accounts[0])
      await this.stormx.purchaseViaSTMX({ from: accounts[0] })
    })

    it('check stmx has been transfered correctly', async () => {
      expect((await this.stmx.balanceOf(accounts[0])).toNumber())
        .to.equal(userBalanceBefore.sub(priceWithStmx).toNumber())
      expect((await this.stmx.balanceOf(this.stormx.address)).toNumber())
        .to.equal(contractBalanceBefore.add(priceWithStmx).toNumber())
    })

    it('check ownership', async () => {
      expect((await this.stormx.balanceOf(accounts[0])).toNumber())
        .to.equal(tokenBalanceBefore.add(new BN(1)).toNumber())
    })

    it('check price becomes more expensive', async () => {
      expect((await this.stormx.tokenPriceWithSTMX()).toNumber())
        .to.greaterThan(priceWithStmx.toNumber())
    })
  })

  describe('Balance', () => {
    let allowedSupplyBalance

    before(async () => {
      allowedSupplyBalance = (await this.stormx.ALLOWED_SUPPLY_BALANCE()).toNumber()
      await Promise.all(
        new Array(allowedSupplyBalance - 3).fill(0).map(() =>
          this.stormx.purchaseViaSTMX({ from: accounts[0] })
        )
      )
    })

    it('Last token price check', async () => {
      const price = (x, init) => Math.floor(init * allowedSupplyBalance * 101 / (allowedSupplyBalance * 101 - x * 101))
      expect((await this.stormx.tokenPriceWithSTMX()).toNumber())
        .to.equal(new BN(price(allowedSupplyBalance - 1, 500)).toNumber())
    })

    it(`Exceed allowed sale balance fail`, async () => {
      await this.stormx.purchaseViaSTMX({ from: accounts[0] })
      await expectRevert(
        this.stormx.purchaseViaSTMX({ from: accounts[0] }),
        "No balance"
      )
    })
  })
})
