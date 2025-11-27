// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Simple Smart Wallet for Flare (Coston2 Testnet)
/// @notice Holds native FLR and lets only the owner withdraw it.
contract SimpleFlareWallet {
    address public owner;

    event Deposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);
    event OwnerChanged(address indexed oldOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice Change the owner of this wallet.
    /// @param _newOwner The new owner address.
    function changeOwner(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Zero address");
        emit OwnerChanged(owner, _newOwner);
        owner = _newOwner;
    }

    /// @notice Deposit native FLR into this contract.
    /// Anyone can deposit.
    function deposit() external payable {
        require(msg.value > 0, "No FLR sent");
        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Withdraw a specific amount of FLR to a given address.
    /// @param _to Recipient address.
    /// @param _amount Amount in wei to send.
    function withdraw(address payable _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Zero address");
        require(address(this).balance >= _amount, "Insufficient balance");

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(_to, _amount);
    }

    /// @notice Withdraw all FLR from the contract to a given address.
    /// @param _to Recipient address.
    function withdrawAll(address payable _to) external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        require(_to != address(0), "Zero address");

        (bool success, ) = _to.call{value: balance}("");
        require(success, "Transfer failed");

        emit Withdrawn(_to, balance);
    }

    /// @notice View the current FLR balance of this wallet.
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Fallback function to accept plain FLR transfers.
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}
