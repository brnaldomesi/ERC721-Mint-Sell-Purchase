// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IAggregator.sol";

contract Stormx is ERC721 {

  uint256 public constant ALLOWED_SUPPLY_BALANCE = 50; // Should be 500 but 50 to avoid long time unit testing
  uint256 private _tokenId = 0;
  IERC20 private _stmx;
  IAggregator public ethVsUsd;
  IAggregator public stmxVsUsd;
  
  /// @notice Event emitted only on construction.
  event StormxDeployed();

  /**
  * @dev Constructor function.
  * @param stmx_ STMX contract interface
  * @param ethVsUsd_ ETH/USD interface 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419 in Ethereum mainnet
  * @param stmxVsUsd_ STMX/USD interface 0x00a773bD2cE922F866BB43ab876009fb959d7C29 in Ethereum mainnet
  */
  constructor(IERC20 stmx_, IAggregator ethVsUsd_, IAggregator stmxVsUsd_)
    ERC721("STORMX", "STORMX")
  {
    _stmx = stmx_;
    ethVsUsd = ethVsUsd_;
    stmxVsUsd = stmxVsUsd_;

    emit StormxDeployed();
  }

  modifier onlyExist() {
    require(_tokenId < ALLOWED_SUPPLY_BALANCE, "No balance");
    _;
  }

  function purchaseViaEther() payable external onlyExist {
    require(msg.value == tokenPriceWithEth(), "Incorrect ETH price");
    _mintToken();
  }

  function purchaseViaSTMX() external onlyExist {
    _stmx.transferFrom(msg.sender, address(this), tokenPriceWithSTMX());
    _mintToken();
  }

  function tokenPriceWithEth() public view returns(uint) {
    
    return tokenPriceWithSTMX() * getRatio();
  }

  function tokenPriceWithSTMX() public view returns(uint) {
    uint initialPrice =  500;
    return initialPrice * ALLOWED_SUPPLY_BALANCE * 101 / (ALLOWED_SUPPLY_BALANCE * 101 - _tokenId * 101);
  }

  function getRatio() internal view returns(uint) {
    int256 ethPrice;
    int256 stmxPrice;
    ethPrice = 1;
    stmxPrice = 1; // Should be replaced with below two lines to get real-time pricing of STMX and ETH
    // (, ethPrice, , , ) = ethVsUsd.latestRoundData();
    // (, stmxPrice, , , ) = stmxVsUsd.latestRoundData();
    return uint256(ethPrice) / uint256(stmxPrice);
  }

  function _mintToken() private {
    _tokenId += 1;
    _safeMint(msg.sender, _tokenId);
  }

  receive () external payable { }
}
