// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract STMXMock is ERC20 {
  constructor() ERC20("STMX", "STMX") { }

  function mint(uint256 amount) external {
    _mint(msg.sender, amount);
  }
}
